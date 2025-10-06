// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase"; // Firebase auth instansiyangizni import qiling
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

const AuthContext = createContext();

// useAuth funksiyasini nomlangan eksport (named export) qilib berish
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 Boshida true bo'lishi shart

  useEffect(() => {
    // onAuthStateChanged: Kirish holati o'zgarganida bir marta ishlaydi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // 🔥 Holat Firebase'dan kelgach, yuklanishni tugatish
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 🔥 Agar LOADING holati true bo'lsa, yuklanish ekranini ko'rsatish */}
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="ml-3 text-lg text-gray-700">Holat tekshirilmoqda...</p>
        </div>
      ) : (
        // Holat aniqlangan bo'lsa, kontentni yuklash
        children
      )}
    </AuthContext.Provider>
  );
};
