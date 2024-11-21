import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Aici vei pune configurația ta de la Firebase
  apiKey: "AIzaSyBLse2jB-R66-OaksKlKopAH12zR5iRwyA",
  authDomain: "materii-optionale-uvt.firebaseapp.com",
  projectId: "materii-optionale-uvt",
  storageBucket: "materii-optionale-uvt.firebasestorage.app",
  messagingSenderId: "559546220901",
  appId: "1:559546220901:web:504373065e53601d8ba18c",
  measurementId: "G-YX8N99B3LE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);