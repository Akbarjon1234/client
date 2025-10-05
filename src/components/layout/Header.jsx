// src/components/layout/Header.jsx

import React from "react";
import {
  Sparkles,
  BookOpen,
  ShoppingCart,
  User,
  Menu,
  LogIn,
  UserPlus,
  TrendingUp,
  BookMarked,
  Zap,
} from "lucide-react";
// 🔥 Link ni import qilish
import { Link } from "react-router-dom";
// Cart Context import qilindi
import { useCart } from "../../context/CartContext";

// VAQTINCHALIK AUTH MANTIQI:
const isAuthenticated = true;

const navItems = [
  { name: "AI Yordamchi", icon: Sparkles, path: "/" },
  { name: "Retseptlar", icon: BookOpen, path: "/recipes" },
  { name: "E-Doʻkon", icon: ShoppingCart, path: "/store" },
  { name: "Sogʻlom Reja", icon: TrendingUp, path: "/health" },
  { name: "Premium", icon: Zap, path: "/pay" },
  {
    name: "Izohlar",
    icon: BookMarked,
    path: "/documentation",
  },
];

const Header = () => {
  const { cartItemCount } = useCart();

  const [activePath, setActivePath] = React.useState("/");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setActivePath(window.location.pathname);
  }, []);

  const showCartBadge = cartItemCount > 0;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md transition duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo va Brend Nomi - <a> ni <Link> ga almashtirdik */}
          <Link
            to="/" // 🔥 href o'rniga to ishlatildi
            className="flex items-center transition duration-200 hover:scale-[1.03]"
            onClick={() => setActivePath("/")}
          >
            <span className="text-2xl font-black text-green-600">Smart</span>
            <span className="text-2xl font-light text-gray-900">Shef</span>
          </Link>

          {/* Desktop Navigatsiya Elementlari */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item, index) => (
              // 🔥 <a> ni <Link> ga almashtirdik
              <Link
                key={index}
                to={item.path} // 🔥 href o'rniga to ishlatildi
                onClick={() => setActivePath(item.path)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 
                  ${
                    activePath === item.path
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "text-gray-600 hover:bg-green-50 hover:text-green-800"
                  }`}
              >
                <item.icon className="w-5 h-5 mr-1" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Tugmalari / Profil Ikonkasi */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Savat Ikonkasi - <a> ni <Link> ga almashtirdik */}
                <Link
                  to="/cart" // 🔥 href o'rniga to ishlatildi
                  className="p-2 rounded-full text-gray-500 hover:text-green-600 hover:bg-gray-50 relative transition duration-200"
                  aria-label="Savat"
                >
                  <ShoppingCart className="w-6 h-6" />

                  {showCartBadge && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full ring-2 ring-white">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Profil Ikonkasi - <a> ni <Link> ga almashtirdik */}
                <Link
                  to="/profile" // 🔥 href o'rniga to ishlatildi
                  className="p-2 rounded-full text-white bg-green-600 hover:bg-green-700 transition duration-200 shadow-md"
                >
                  <User className="w-6 h-6" />
                </Link>
              </>
            ) : (
              <div className="flex space-x-2">
                {/* Kirish Tugmasi - <a> ni <Link> ga almashtirdik */}
                <Link
                  to="/login" // 🔥 href o'rniga to ishlatildi
                  className="px-3 py-2 flex items-center text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                >
                  <LogIn className="w-5 h-5 mr-1 hidden md:block" />
                  Kirish
                </Link>

                {/* Ro'yxatdan O'tish Tugmasi - <a> ni <Link> ga almashtirdik */}
                <Link
                  to="/register" // 🔥 href o'rniga to ishlatildi
                  className="px-3 py-2 flex items-center text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md transition duration-200"
                >
                  <UserPlus className="w-5 h-5 mr-1 hidden md:block" />
                  Ro'yxatdan O'tish
                </Link>
              </div>
            )}

            {/* Mobil Menyuni ochish tugmasi */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-900"
              aria-label="Menyu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Menyu (Pastga ochiluvchi qism) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-100 py-2">
          {navItems.map((item, index) => (
            // 🔥 <a> ni <Link> ga almashtirdik
            <Link
              key={index}
              to={item.path} // 🔥 href o'rniga to ishlatildi
              onClick={() => {
                setActivePath(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center px-4 py-3 text-base font-medium transition-colors duration-200 
                ${
                  activePath === item.path
                    ? "bg-green-100 text-green-700 font-semibold border-l-4 border-green-500"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <item.icon className="w-6 h-6 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
