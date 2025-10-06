// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./context/AuthContext"; // 🔥 AuthProvider ni App ni o'rab turishi kerak
import PrivateRoute from "./components/layout/PrivateRoute";
import { CartProvider } from "./context/CartContext";

// === Sahifalar ===
import Home from "./pages/Home";
import RecipeDetail from "./pages/RecipeDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Recipes from "./pages/Recipes";
import HealthDashboard from "./pages/HealthDashboard";
import Documentation from "./pages/Documentation";
import PaymentPage from "./pages/PaymentPage";
import Layout from "./components/layout/Layout";
import Settings from "./pages/Settings";

// === Fallback sahifa ===
const NotFound = () => (
  <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-red-600">404</h1>   {" "}
    <p className="text-lg text-gray-700">Uzr, sahifa topilmadi!</p> {" "}
  </div>
);

const App = () => {
  return (
    // 🔥 AuthProvider butun ilovani o'rab turishi kerak
    <AuthProvider>
           {" "}
      <Router>
               {" "}
        <AnimatePresence mode="wait">
                   {" "}
          <CartProvider>
                       {" "}
            <Routes>
                           {/* 1. AUTH MARSHRUTLARI (Layoutsiz ko'rinadi) */}
                              <Route path="/login" element={<Login />} />
                              <Route path="/register" element={<Register />} /> 
                           {" "}
              {/* 2. PRIVATE ROUTES (Faollashganda Layout ichida ko'rinadi) */}
              {/* PrivateRoute hamma ichki route'larni avtomatik /login ga yo'naltiradi, 
                   agar kirilmagan bo'lsa. */}
                             {" "}
              <Route path="/" element={<PrivateRoute />}>
                {/* Layout navigatsiya (Header/Footer) ni qo'shadi */}
                <Route element={<Layout />}>
                                        <Route index element={<Home />} />{" "}
                  {/* Asosiy sahifa "/" */}                     {" "}
                  <Route path="/recipe/:id" element={<RecipeDetail />} />     
                                 {" "}
                  <Route path="/recipes" element={<Recipes />} />               
                       {" "}
                  <Route path="/documentation" element={<Documentation />} />   
                                    <Route path="/store" element={<Store />} /> 
                                      <Route path="/cart" element={<Cart />} /> 
                                     {" "}
                  <Route path="/checkout" element={<Checkout />} />             
                          <Route path="/health" element={<HealthDashboard />} />
                                       {" "}
                  <Route path="/profile" element={<Profile />} />               
                        <Route path="/pay" element={<PaymentPage />} />         
                              <Route path="settings" element={<Settings />} />
                </Route>
                               {" "}
              </Route>
                              {/* 3. 404 (Layoutsiz) */}
                              <Route path="*" element={<NotFound />} />         
               {" "}
            </Routes>
                     {" "}
          </CartProvider>
                 {" "}
        </AnimatePresence>
             {" "}
      </Router>
    </AuthProvider>
  );
};

export default App;
