import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  getDoc,
  doc
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

/**
 * Cache utility functions
 */
const getCacheKey = (collectionName, queryParams = {}) => {
  return `${collectionName}_${JSON.stringify(queryParams)}`;
};

const getCachedData = (cacheKey) => {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (cacheKey, data) => {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

/**
 * Optimized query builder with automatic indexing suggestions
 */
class OptimizedQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.constraints = [];
    this.orderConstraints = [];
    this.limitConstraint = null;
    this.startAfterConstraint = null;
  }

  where(field, operator, value) {
    this.constraints.push({ field, operator, value });
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.orderConstraints.push({ field, direction });
    return this;
  }

  limit(limitValue) {
    this.limitConstraint = limitValue;
    return this;
  }

  startAfter(lastDoc) {
    this.startAfterConstraint = lastDoc;
    return this;
  }

  async execute() {
    // Generate cache key
    const queryParams = {
      constraints: this.constraints,
      order: this.orderConstraints,
      limit: this.limitConstraint
    };
    const cacheKey = getCacheKey(this.collectionName, queryParams);

    // Check cache first (skip for pagination queries)
    if (!this.startAfterConstraint) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for ${this.collectionName}`);
        return cachedData;
      }
    }

    try {
      let queryRef = collection(db, this.collectionName);

      // Apply where constraints
      const constraints = [];
      this.constraints.forEach(({ field, operator, value }) => {
        constraints.push(where(field, operator, value));
      });

      // Apply order constraints
      this.orderConstraints.forEach(({ field, direction }) => {
        constraints.push(orderBy(field, direction));
      });

      // Apply limit
      if (this.limitConstraint) {
        constraints.push(limit(this.limitConstraint));
      }

      // Apply pagination
      if (this.startAfterConstraint) {
        constraints.push(startAfter(this.startAfterConstraint));
      }

      if (constraints.length > 0) {
        queryRef = query(queryRef, ...constraints);
      }

      const snapshot = await getDocs(queryRef);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _lastDoc: doc // For pagination
      }));

      // Cache results (skip for pagination queries)
      if (!this.startAfterConstraint) {
        setCachedData(cacheKey, docs);
      }

      console.log(`Fetched ${docs.length} documents from ${this.collectionName}`);
      return docs;

    } catch (error) {
      // Check if it's an index error and provide helpful message
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.error(`⚠️  INDEX NEEDED for ${this.collectionName}:`, {
          constraints: this.constraints,
          orderBy: this.orderConstraints,
          suggestion: 'Create a composite index in Firebase Console'
        });
      }
      throw error;
    }
  }
}

/**
 * Optimized service functions
 */
export const optimizedFirebaseService = {
  /**
   * Get paginated collection with caching
   */
  async getPaginatedCollection(collectionName, options = {}) {
    const {
      pageSize = 20,
      lastDoc = null,
      filters = [],
      orderBy: orderByField = null,
      orderDirection = 'asc'
    } = options;

    const builder = new OptimizedQueryBuilder(collectionName);

    // Apply filters
    filters.forEach(({ field, operator, value }) => {
      builder.where(field, operator, value);
    });

    // Apply ordering
    if (orderByField) {
      builder.orderBy(orderByField, orderDirection);
    }

    // Apply pagination
    builder.limit(pageSize);
    if (lastDoc) {
      builder.startAfter(lastDoc);
    }

    return await builder.execute();
  },

  /**
   * Get filtered users with optimized queries
   */
  async getFilteredUsers(filters = {}) {
    const {
      role = null,
      facultate = null,
      specializare = null,
      an = null,
      search = null,
      pageSize = 50
    } = filters;

    const builder = new OptimizedQueryBuilder('users');

    // Apply role filter
    if (role && role !== 'all') {
      builder.where('tip', '==', role);
    }

    // Apply facultate filter
    if (facultate) {
      builder.where('facultate', '==', facultate);
    }

    // Apply specializare filter (requires facultate to be set for optimal indexing)
    if (specializare && facultate) {
      builder.where('specializare', '==', specializare);
    }

    // Apply an filter (requires previous filters for optimal indexing)
    if (an && facultate && specializare) {
      builder.where('an', '==', an);
    }

    // Order by name for consistent results
    builder.orderBy('nume').limit(pageSize);

    let users = await builder.execute();

    // Apply client-side search filter if needed (for flexibility)
    if (search) {
      const searchTerm = search.toLowerCase();
      users = users.filter(user => 
        user.nume?.toLowerCase().includes(searchTerm) ||
        user.prenume?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    return users;
  },

  /**
   * Get user's courses with caching
   */
  async getUserCourses(userId, userType) {
    const cacheKey = getCacheKey('userCourses', { userId, userType });
    const cachedData = getCachedData(cacheKey);
    if (cachedData) return cachedData;

    let courses = [];

    if (userType === 'student') {
      // Get user's enrolled courses
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const enrolledCourseIds = userData.materiiInscrise || [];
        
        if (enrolledCourseIds.length > 0) {
          // Batch fetch courses
          courses = await this.getBatchDocuments('materii', enrolledCourseIds);
        }
      }
    } else if (userType === 'profesor') {
      // Get courses taught by professor
      courses = await new OptimizedQueryBuilder('materii')
        .where('profesori', 'array-contains', { id: userId })
        .orderBy('nume')
        .execute();
    }

    setCachedData(cacheKey, courses);
    return courses;
  },

  /**
   * Batch fetch documents by IDs (max 10 at a time due to Firestore limits)
   */
  async getBatchDocuments(collectionName, docIds) {
    if (!docIds || docIds.length === 0) return [];

    const batchSize = 10; // Firestore limit for 'in' queries
    const batches = [];

    for (let i = 0; i < docIds.length; i += batchSize) {
      const batch = docIds.slice(i, i + batchSize);
      batches.push(batch);
    }

    const results = await Promise.all(
      batches.map(batch => 
        new OptimizedQueryBuilder(collectionName)
          .where('__name__', 'in', batch.map(id => doc(db, collectionName, id)))
          .execute()
      )
    );

    return results.flat();
  },

  /**
   * Clear cache for specific collection or all
   */
  clearCache(collectionName = null) {
    if (collectionName) {
      for (const [key] of cache) {
        if (key.startsWith(collectionName)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      totalEntries: cache.size,
      entries: []
    };

    for (const [key, value] of cache) {
      stats.entries.push({
        key,
        age: Date.now() - value.timestamp,
        dataSize: JSON.stringify(value.data).length
      });
    }

    return stats;
  }
};

/**
 * React Hook for optimized data fetching
 */
export const useOptimizedFirebaseQuery = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setData([]);
        setLoading(true);
      }

      const results = await optimizedFirebaseService.getPaginatedCollection(
        collectionName,
        options
      );

      if (reset) {
        setData(results);
      } else {
        setData(prev => [...prev, ...results]);
      }

      setHasMore(results.length === (options.pageSize || 20));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(options)]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && data.length > 0) {
      const lastDoc = data[data.length - 1]._lastDoc;
      fetchData(false, lastDoc);
    }
  }, [fetchData, loading, hasMore, data]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchData(true)
  };
}; 