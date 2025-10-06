// src/components/layout/PrivateRoute.jsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = () => {
  const { currentUser, loading } = useAuth();

  // 🔥 Loadingni bu yerda tekshirish shart emas, chunki AuthProvider uni butunlay bloklaydi.
  // Agar bu yerga kelinsa, loading allaqachon false bo'ladi.

  // Agar currentUser mavjud bo'lsa (tizimga kirgan)
  if (currentUser) {
    return <Outlet />;
  }

  // Agar currentUser mavjud bo'lmasa (tizimga kirmagan)
  // "/login" sahifasiga yo'naltirish
  // Bu navigatsiya faqatgina AuthProvider holatni NULL deb aniqlagandan keyin yuz beradi.
  return <Navigate to="/login" replace />;
};

export default PrivateRoute;
