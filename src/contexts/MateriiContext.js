import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const MateriiContext = createContext();

export const MateriiProvider = ({ children }) => {
  const [allMaterii, setAllMaterii] = useState(() => {
    // Initialize with cached data if available
    const cached = localStorage.getItem('materii_cache');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        // Use cached data if less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return data;
        }
      } catch (error) {
        console.warn('Failed to parse cached materii data:', error);
      }
    }
    return {};
  });
  
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(() => {
    const cached = localStorage.getItem('materii_cache');
    if (cached) {
      try {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      } catch (error) {
        return null;
      }
    }
    return null;
  });

  const fetchAllMaterii = useCallback(async (force = false) => {
    // Only fetch if we haven't fetched in the last hour or if forced
    if (force || !lastFetch || Date.now() - lastFetch > 60 * 60 * 1000) {
      try {
        setLoading(true);
        const materiiCollection = collection(db, 'materii');
        const materiiSnapshot = await getDocs(materiiCollection);
        const materiiMap = {};
        
        materiiSnapshot.forEach(doc => {
          materiiMap[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        setAllMaterii(materiiMap);
        const now = Date.now();
        setLastFetch(now);
        
        // Cache the data
        try {
          localStorage.setItem('materii_cache', JSON.stringify({
            data: materiiMap,
            timestamp: now
          }));
        } catch (error) {
          console.warn('Failed to cache materii data:', error);
        }
      } catch (error) {
        console.error('Error fetching materii:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [lastFetch]);

  useEffect(() => {
    fetchAllMaterii();
  }, [fetchAllMaterii]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem('materii_cache');
      setLastFetch(null);
      console.log('Materii cache cleared');
    } catch (error) {
      console.warn('Failed to clear materii cache:', error);
    }
  }, []);

  return (
    <MateriiContext.Provider value={{ 
      allMaterii, 
      loading, 
      refreshMaterii: () => fetchAllMaterii(true),
      clearCache 
    }}>
      {children}
    </MateriiContext.Provider>
  );
};

export const useMaterii = () => {
  const context = useContext(MateriiContext);
  if (!context) {
    throw new Error('useMaterii must be used within a MateriiProvider');
  }
  return context;
};

export default MateriiProvider; 