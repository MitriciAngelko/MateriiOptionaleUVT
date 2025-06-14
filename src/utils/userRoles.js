import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ====== BULLETPROOF USER DATA FETCHING ======
// This fixes the core issue: missing user documents in Firestore
// and provides graceful fallbacks

// Get user data from Firestore with bulletproof error handling
const getUserData = async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ getUserData: No userId provided');
      return null;
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.warn(`⚠️ getUserData: User document not found for ID: ${userId}`);
      console.warn('This user exists in Firebase Auth but not in Firestore users collection');
      console.warn('This may be a data sync issue that needs to be resolved');
      
      // Return a default user object to prevent crashes
      return {
        uid: userId,
        tip: 'unknown',
        role: 'unknown',
        email: null,
        __missing_from_firestore: true
      };
    }
    
    const userData = userDoc.data();
    console.log(`✅ getUserData: Successfully fetched data for user ${userId}`);
    return userData;
  } catch (error) {
    console.error(`💥 getUserData: Error fetching user data for ${userId}:`, error);
    
    // Return a safe fallback to prevent system crashes
    return {
      uid: userId,
      tip: 'unknown',
      role: 'unknown',
      email: null,
      __error_occurred: true
    };
  }
};

// Special admin check with enhanced email validation
const isSpecialAdmin = (email) => {
  if (!email) return false;
  
  // Main admin account
  if (email === 'admin@admin.com') return true;
  
  // Admin domain check
  if (email.endsWith('@admin.com')) return true;
  
  // Additional admin email patterns (add more as needed)
  const adminPatterns = [
    /^admin@/i,
    /^administrator@/i,
    /^root@/i
  ];
  
  return adminPatterns.some(pattern => pattern.test(email));
};

// Main admin check - works with both Redux user object and userId string
export const isAdmin = async (userOrUserId) => {
  try {
    // Special case for admin@admin.com - always returns true
    if (typeof userOrUserId === 'object' && userOrUserId?.email) {
      if (isSpecialAdmin(userOrUserId.email)) {
        console.log('🔑 Admin access granted: Special admin email detected');
        return true;
      }
    }
    
    // If we have a user object from Redux, check it first
    if (typeof userOrUserId === 'object' && userOrUserId?.email) {
      const user = userOrUserId;
      
      // Check role field from Redux (set by AuthProvider)
      if (user.role === 'admin') {
        console.log('🔑 Admin access granted: Redux role=admin');
        return true;
      }
      
      // Check tip field from Redux
      if (user.tip === 'admin') {
        console.log('🔑 Admin access granted: Redux tip=admin');
        return true;
      }
      
      // If we have uid, double-check with Firestore (with graceful handling)
      if (user.uid) {
        const userData = await getUserData(user.uid);
        if (userData && !userData.__missing_from_firestore && !userData.__error_occurred) {
          // Check both 'tip' and 'role' fields for maximum compatibility
          const isAdminByType = userData.tip === 'admin';
          const isAdminByRole = userData.role === 'admin';
          const isAdminByEmail = isSpecialAdmin(userData.email);
          
          if (isAdminByType || isAdminByRole || isAdminByEmail) {
            console.log('🔑 Admin access granted: Firestore verification successful', {
              tip: userData.tip,
              role: userData.role,
              email: userData.email
            });
            return true;
          }
        }
      }
      
      console.log('❌ Admin access denied: No admin credentials found for user object');
      return false;
    }
    
    // If we have just a userId string, check Firestore directly
    if (typeof userOrUserId === 'string') {
      const userData = await getUserData(userOrUserId);
      
      // Handle missing or error cases gracefully
      if (!userData || userData.__missing_from_firestore || userData.__error_occurred) {
        console.log('❌ Admin access denied: User data not available or corrupted');
        return false;
      }
      
      // Check all possible admin indicators
      const isAdminByType = userData.tip === 'admin';
      const isAdminByRole = userData.role === 'admin';
      const isAdminByEmail = isSpecialAdmin(userData.email);
      
      const isAdmin = isAdminByType || isAdminByRole || isAdminByEmail;
      
      console.log(`${isAdmin ? '🔑 Admin access granted' : '❌ Admin access denied'}: Firestore check for ${userOrUserId}`, {
        tip: userData.tip,
        role: userData.role,
        email: userData.email,
        result: isAdmin
      });
      
      return isAdmin;
    }
    
    console.log('❌ Admin access denied: Invalid input type');
    return false;
  } catch (error) {
    console.error('❌ Admin check failed with error:', error);
    return false;
  }
};

// Secretar check - bulletproof approach
export const isSecretar = async (userOrUserId) => {
  try {
    let userData = null;
    
    // Get user data based on input type
    if (typeof userOrUserId === 'object' && userOrUserId?.uid) {
      // Check Redux data first
      if (userOrUserId.tip === 'secretar' || userOrUserId.role === 'secretar') {
        console.log('🔑 Secretar access granted: Redux data confirmed');
        return true;
      }
      userData = await getUserData(userOrUserId.uid);
    } else if (typeof userOrUserId === 'string') {
      userData = await getUserData(userOrUserId);
    }
    
    // Handle missing or error cases gracefully
    if (!userData || userData.__missing_from_firestore || userData.__error_occurred) {
      console.log('❌ Secretar access denied: User data not available');
      return false;
    }
    
    // Check both 'tip' and 'role' fields for maximum compatibility
    const isSecretarByType = userData.tip === 'secretar';
    const isSecretarByRole = userData.role === 'secretar';
    
    const isSecretar = isSecretarByType || isSecretarByRole;
    
    console.log(`${isSecretar ? '🔑 Secretar access granted' : '❌ Secretar access denied'}:`, {
      tip: userData.tip,
      role: userData.role,
      result: isSecretar
    });
    
    return isSecretar;
  } catch (error) {
    console.error('❌ Secretar check failed with error:', error);
    return false;
  }
};

// Professor check - bulletproof approach
export const isProfesor = async (userOrUserId) => {
  try {
    let userData = null;
    
    if (typeof userOrUserId === 'object' && userOrUserId?.uid) {
      // Check Redux data first
      if (userOrUserId.tip === 'profesor' || userOrUserId.role === 'profesor') {
        return true;
      }
      userData = await getUserData(userOrUserId.uid);
    } else if (typeof userOrUserId === 'string') {
      userData = await getUserData(userOrUserId);
    }
    
    if (!userData || userData.__missing_from_firestore || userData.__error_occurred) {
      return false;
    }
    
    return userData.tip === 'profesor' || userData.role === 'profesor';
  } catch (error) {
    console.error('Eroare la verificarea rolului de profesor:', error);
    return false;
  }
};

// Student check - bulletproof approach
export const isStudent = async (userOrUserId) => {
  try {
    let userData = null;
    
    if (typeof userOrUserId === 'object' && userOrUserId?.uid) {
      // Check Redux data first
      if (userOrUserId.tip === 'student' || userOrUserId.role === 'student') {
        return true;
      }
      userData = await getUserData(userOrUserId.uid);
    } else if (typeof userOrUserId === 'string') {
      userData = await getUserData(userOrUserId);
    }
    
    if (!userData || userData.__missing_from_firestore || userData.__error_occurred) {
      return false;
    }
    
    return userData.tip === 'student' || userData.role === 'student';
  } catch (error) {
    console.error('Eroare la verificarea rolului de student:', error);
    return false;
  }
};

// ====== COMBINED ACCESS CHECK FUNCTIONS ======
// These are bulletproof functions to simplify access control

// Check if user has admin OR secretar access
export const hasAdminAccess = async (userOrUserId) => {
  try {
    // Special case for admin@admin.com - immediate access
    if (typeof userOrUserId === 'object' && userOrUserId?.email) {
      if (isSpecialAdmin(userOrUserId.email)) {
        console.log('🔐 Combined admin access check: GRANTED (special admin email)');
        return true;
      }
    }
    
    const [adminStatus, secretarStatus] = await Promise.all([
      isAdmin(userOrUserId),
      isSecretar(userOrUserId)
    ]);
    
    const hasAccess = adminStatus || secretarStatus;
    console.log(`🔐 Combined admin access check: ${hasAccess ? 'GRANTED' : 'DENIED'}`, {
      adminStatus,
      secretarStatus,
      finalResult: hasAccess
    });
    
    return hasAccess;
  } catch (error) {
    console.error('Error in combined admin access check:', error);
    return false;
  }
};

// Debug function to log all user permissions
export const debugUserPermissions = async (userOrUserId) => {
  try {
    const [admin, secretar, profesor, student] = await Promise.all([
      isAdmin(userOrUserId),
      isSecretar(userOrUserId),
      isProfesor(userOrUserId),
      isStudent(userOrUserId)
    ]);
    
    console.log('🐛 DEBUG: User permissions breakdown:', {
      input: userOrUserId,
      permissions: {
        admin,
        secretar,
        profesor,
        student
      }
    });
    
    return { admin, secretar, profesor, student };
  } catch (error) {
    console.error('Error in debug permissions check:', error);
    return { admin: false, secretar: false, profesor: false, student: false };
  }
}; 