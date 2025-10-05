// src/pages/Login.jsx

import React, { useState } from "react";
// motion olib tashlandi
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Firebase Auth importi
import { signInWithEmailAndPassword } from "firebase/auth";

// formVariants olib tashlandi

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    setLoading(true);
    try {
      // 1. Firebase orqali tizimga kirish
      await signInWithEmailAndPassword(auth, email, password);

      console.log("Foydalanuvchi muvaffaqiyatli tizimga kirdi.");

      // 2. Muvaffaqiyatli kirishdan so'ng, Home sahifasiga yo'naltirish
      navigate("/", { replace: true });
    } catch (firebaseError) {
      let errorMessage =
        "Kirishda xatolik yuz berdi. Email yoki parol noto'g'ri.";
      // Qo'shimcha xatolar: auth/wrong-password, auth/user-not-found
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* motion.div o'rniga oddiy <div> ishlatildi */}
      <div
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-600 transition duration-300"
        // Animatsiya prop'lari olib tashlandi
      >
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          SmartShef'ga Kirish
        </h1>
        <p className="text-center text-gray-500 mb-8">
          AI yordamchi va retseptlardan foydalaning.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email kiritish */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Manzilingiz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
            />
          </div>

          {/* Parol kiritish */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
            />
          </div>

          {/* Xato Xabari */}
          {error && (
            /* motion.p o'rniga oddiy <p> ishlatildi */
            <p
              className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200 transition duration-300 opacity-100"
              // Animatsiya prop'lari olib tashlandi
            >
              {error}
            </p>
          )}

          {/* Kirish Tugmasi */}
          {/* motion.button o'rniga oddiy <button ishlatildi */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg font-semibold rounded-lg transition duration-200 flex items-center justify-center shadow-md ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white active:scale-[0.98]"
            }`}
            // whileTap prop'i olib tashlandi
          >
            {loading ? (
              "Kirilmoqda..."
            ) : (
              <>
                Tizimga Kirish
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Hisobingiz yo'qmi?
          <Link
            to="/register"
            className="text-green-600 font-semibold hover:underline ml-1"
          >
            Ro'yxatdan O'tish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
