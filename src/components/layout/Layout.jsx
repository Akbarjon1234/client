// src/components/layout/Layout.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header"; // Header joylashgan yo'lni tekshiring

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 🔥 Header har doim mavjud */}
      <Header />

      {/* Sahifa kontenti (Recipes, Home va h.k.) shu yerda chiqariladi */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer (agar mavjud bo'lsa, bu yerda bo'ladi) */}
    </div>
  );
};

export default Layout;
