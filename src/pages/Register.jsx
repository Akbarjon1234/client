// src/pages/Register.jsx

import React, { useState } from "react";
// motion importi olib tashlandi
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// Firestore uchun kerakli importlarni qo'shish
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// formVariants olib tashlandi

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase Auth orqali yangi foydalanuvchi yaratish
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Foydalanuvchining ismini (display name) o'rnatish
      await updateProfile(user, {
        displayName: name,
      });

      // 💥 MUHIM QADAM: Foydalanuvchi ma'lumotlarini Firestore/users kolleksiyasiga yozish
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name, // Ismni ham saqlab qo'yish
        isPremium: false, // Default holat
        createdAt: new Date(),
        role: "user", // Barcha yangi foydalanuvchilarga 'user' roli beriladi
      });

      console.log(
        "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi va Firestore ga yozildi!"
      );

      // 3. Muammo yo'qligiga ishonch hosil qilib, foydalanuvchini Home sahifasiga yo'naltirish
      navigate("/", { replace: true });
    } catch (firebaseError) {
      let errorMessage = "Ro'yxatdan o'tishda xatolik yuz berdi.";
      if (firebaseError.code === "auth/email-already-in-use") {
        errorMessage = "Bu email allaqachon ro'yxatdan o'tgan.";
      } else if (firebaseError.code === "auth/invalid-email") {
        errorMessage = "Noto'g'ri email formati.";
      } else if (
        firebaseError.code === "permission-denied" ||
        firebaseError.code === "unavailable"
      ) {
        errorMessage =
          "Ma'lumotlar bazasiga yozishga ruxsat berilmadi. Admin qoidalarini tekshiring.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* motion.div o'rniga oddiy div ishlatildi */}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border-t-4 border-green-600 transition duration-300">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          SmartShef'ga a'zo bo'lish
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Retseptlar va AI yordamchisidan foydalanishni boshlang.
        </p>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Ism kiritish */}
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="To'liq Ismingiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
            />
          </div>

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
              placeholder="Parol (min 6 belgi)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
            />
          </div>

          {/* Xato Xabari */}
          {error && (
            // motion.p o'rniga oddiy p ishlatildi
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          {/* Ro'yxatdan O'tish Tugmasi */}
          {/* motion.button o'rniga oddiy button ishlatildi */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg font-semibold rounded-lg transition duration-200 flex items-center justify-center shadow-md active:scale-[0.99]
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
          >
            {loading ? (
              "Yaratilmoqda..."
            ) : (
              <>
                Ro'yxatdan O'tish
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Allaqaqon hisobingiz bormi?
          <Link
            to="/login"
            className="text-green-600 font-semibold hover:underline ml-1"
          >
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
