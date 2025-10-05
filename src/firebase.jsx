// src/firebase.jsx

// Firebase SDK importlari
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";   // Firestore qo‘shildi
import { getAuth } from "firebase/auth";             // Auth qo‘shildi (agar kerak bo‘lsa)
import { getStorage } from "firebase/storage";       // Storage qo‘shildi (rasmlar uchun)

// Firebase konfiguratsiyasi
const firebaseConfig = {
  apiKey: "AIzaSyCeOdwYjxTVFJIJM0Q6Oby_zlXXH_dTYKc",
  authDomain: "smartchef-46f73.firebaseapp.com",
  projectId: "smartchef-46f73",
  storageBucket: "smartchef-46f73.firebasestorage.app",
  messagingSenderId: "895414834177",
  appId: "1:895414834177:web:b2c879f8d5dbfa0a641c00",
  measurementId: "G-XPW01CPG8B"
};

// Firebase init
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 🔥 Asosiy servislar
const db = getFirestore(app);     // Firestore DB
const auth = getAuth(app);        // Authentication
const storage = getStorage(app);  // File Storage (masalan rasmlar)

// Export
export { app, analytics, db, auth, storage };
