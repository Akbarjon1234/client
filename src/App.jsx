import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PrivateRoute from "./components/layout/PrivateRoute";
import { CartProvider } from "./context/CartContext";

// === Sahifalar ===
import Home from "./pages/Home";
import RecipeDetail from "./pages/RecipeDetail"; // 🔥 Step-by-step retsept
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
// import AddRecipe from "./pages/AddRecipe"; // 🔥 Retsept qo‘shish sahifasi

// === Fallback sahifa ===
const NotFound = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold text-red-600">404</h1>
    <p className="text-lg text-gray-700">Uzr, sahifa topilmadi!</p>
  </div>
);

const App = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* === Public Routes === */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* === Private Routes === */}
              <Route path="/" element={<PrivateRoute />}>
                <Route index element={<Home />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/store" element={<Store />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/health" element={<HealthDashboard />} />
                {/* <Route path="/add-recipe" element={<AddRecipe />} /> */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/pay" element={<PaymentPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* === 404 === */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </AnimatePresence>
    </Router>
  );
};

export default App;
