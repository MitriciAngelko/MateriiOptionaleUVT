import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const MateriiContext = createContext();

export const MateriiProvider = ({ children }) => {
  const [allMaterii, setAllMaterii] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

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
        setLastFetch(Date.now());
      } catch (error) {
        console.error('Error fetching materii:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [lastFetch]);

  useEffect(() => {
    fetchAllMaterii();
  }, [fetchAllMaterii]);

  return (
    <MateriiContext.Provider value={{ 
      allMaterii, 
      loading, 
      refreshMaterii: () => fetchAllMaterii(true) 
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