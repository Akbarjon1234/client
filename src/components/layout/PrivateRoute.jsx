import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// VAQTINCHALIK AUTH MANTIQI: Haqiqiy loyihada buni Firebase bilan almashtirasiz
const useAuth = () => {
    // Bu funksiya Firebase Auth dan foydalanib foydalanuvchi kirganmi yo'qmi tekshiradi
    const [user, setUser] = React.useState(true); // Hozircha doim TRUE qilib qo'ydik
    return user; 
};

const PrivateRoute = () => {
    const isAuthenticated = useAuth();

    // Agar foydalanuvchi tizimga kirgan bo'lsa, sahifani ko'rsatadi (Outlet)
    // Aks holda, uni /login ga yo'naltiradi
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;