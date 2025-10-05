// src/pages/HealthDashboard.jsx (To'liq va Yakuniy Versiya)

import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  TrendingUp,
  Zap,
  Clock,
  Calendar,
  Lock,
  Brain,
  User,
  Soup,
  Coffee,
  Sunset,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const auth = getAuth(app);
const functions = getFunctions(app);

// Tayyor kategoriyalar
const categories = [
  { id: 1, name: "Vazn yo‘qotish", color: "bg-green-100 text-green-700" },
  { id: 2, name: "Vazn yig‘ish", color: "bg-orange-100 text-orange-700" },
  { id: 3, name: "Energiya oshirish", color: "bg-yellow-100 text-yellow-700" },
  { id: 4, name: "Sog‘lom yurak", color: "bg-red-100 text-red-700" },
];

const HealthDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [isGeneratingMenu, setIsGeneratingMenu] = useState(false);
  const [aiMenuResult, setAiMenuResult] = useState(null);

  const [user, loadingAuth] = useAuthState(auth);
  const currentUserId = user ? user.uid : null;
  const navigate = useNavigate();

  // === BMR va TDEE hisoblash ===
  const calculateBMRAndTDEE = useCallback(() => {
    if (!userData || !userData.weight || !userData.height || !userData.age)
      return { bmr: 0, tdee: 0, goalTDEE: 0 };

    const { weight, height, age, gender, activityLevel, goal } = userData;
    // Miffil-Sent-Jeor formulasi
    let bmr =
      gender === "erkak"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = bmr * (activityLevel || 1.2);
    let goalTDEE = tdee;

    // Kaloriya farqi
    if (goal === "vazn yo‘qotish") goalTDEE = tdee - 500;
    else if (goal === "vazn yig‘ish") goalTDEE = tdee + 300;

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      goalTDEE: Math.round(goalTDEE),
    };
  }, [userData]);
  const { bmr, tdee, goalTDEE } = calculateBMRAndTDEE();

  // === Foydalanuvchi ma'lumotlarini yuklash (OLDIN TA'RIFLANMAGAN QISM) ===
  const fetchUserData = useCallback(async () => {
    if (loadingAuth) return;

    if (!currentUserId) {
      setUserData({ isPremium: false, goal: "vazn yo‘qotish" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", currentUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);
        setSelectedGoal(data.goal || "");
      } else {
        setUserData({
          age: null,
          gender: null,
          height: null,
          weight: null,
          activityLevel: 1.55,
          goal: "vazn yo‘qotish",
          isPremium: false,
        });
        setSelectedGoal("vazn yo‘qotish");
      }
    } catch (error) {
      console.error("Foydalanuvchini olishda xatolik:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadingAuth]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // === Maqsadni o‘zgartirish (OLDIN TA'RIFLANMAGAN QISM) ===
  const handleGoalSelect = async (goal) => {
    if (!currentUserId) {
      alert("Iltimos, tizimga kiring. Maqsadni saqlash uchun profil kerak.");
      return;
    }

    setSelectedGoal(goal);

    try {
      const userRef = doc(db, "users", currentUserId);
      await updateDoc(userRef, { goal });
      setUserData({ ...userData, goal });
    } catch (err) {
      console.error("Maqsadni yangilashda xatolik:", err);
      alert("Maqsadni yangilashda xatolik yuz berdi. Qayta urinib ko'ring.");
    }
  };

  // === 🔥 AI menyusini yaratish funksiyasi (Simulyatsiya) 🔥 ===
  const handleGenerateAIMenu = async () => {
    if (!userData?.isPremium || !currentUserId) return;

    if (!userData.weight || !userData.height || !userData.age) {
      alert("Iltimos, avval Vazn, Bo'y va Yosh ma'lumotlarini to'ldiring.");
      navigate("/settings");
      return;
    }

    setIsGeneratingMenu(true);
    setAiMenuResult(null);

    // Simulyatsiya (2 soniya)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const target = (userData.goal || "umumiy sog‘lomlik").toUpperCase();
    const calories = goalTDEE;

    // 🔥 Natija to'g'ridan-to'g'ri (Hardcoded)
    const dummyMenu = {
      title: `${target} uchun 7 kunlik reja (${calories} Kkal)`,
      week: [
        {
          day: "Dushanba",
          breakfast: "Suli yormasi + rezavorlar (350 Kkal)",
          lunch: "Grill qilingan tovuq ko'kragi va sabzavotlar (450 Kkal)",
          dinner: "Kam yog'li baliq (losos) va yashil salat (400 Kkal)",
        },
        {
          day: "Seshanba",
          breakfast: "Tuxumli omlet va avokado (300 Kkal)",
          lunch: "Yasmiq sho'rva va butun donli non (420 Kkal)",
          dinner: "Mol go'shtidan dimlama va jigarrang guruch (480 Kkal)",
        },
        {
          day: "Chorshanba",
          breakfast: "Yogurtsiz yogurt va asal (320 Kkal)",
          lunch: "Tovuqli Caesar salati (390 Kkal)",
          dinner: "Qovoqli pyure va tovuq go'shtli kotlet (410 Kkal)",
        },
      ],
      summary: `Sizning joriy maqsadingiz: ${target}. Kunlik kaloriya cheklovi: ${calories} Kkal. Bu menyu faqat namuna hisoblanadi.`,
    };

    setAiMenuResult(dummyMenu);
    setIsGeneratingMenu(false);
  };

  // --- Render Mantiqiy Bloklari ---

  if (loading || loadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-600">
        <Loader2 className="w-6 h-6 mr-3 animate-spin text-blue-500" />
        Ma’lumotlar yuklanmoqda...
      </div>
    );
  }

  // 🛑 1. Tizimga kirish talab qilinadi
  if (!currentUserId) {
    return (
      <div className="max-w-md mx-auto p-8 text-center mt-20 bg-white shadow-lg rounded-xl">
        <User className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-xl font-semibold text-gray-800">
          Parhez rejasini ko'rish uchun iltimos, tizimga kiring.
        </p>
      </div>
    );
  }

  // 🛑 2. Ma'lumotlar to'liq emas (Asosiy muammoni hal qiluvchi blok)
  if (
    currentUserId &&
    (!userData?.weight || !userData?.height || !userData?.age)
  ) {
    return (
      <div className="max-w-md mx-auto p-8 text-center mt-20 bg-red-50 shadow-lg rounded-xl border border-red-200">
        <p className="text-xl font-semibold text-red-800">
          Ma’lumotlar to'liq emas! 💔
        </p>
        <p className="text-gray-600 mt-2">
          BMR va TDEE ni hisoblash hamda AI menyusini yaratish uchun **Vazn,
          Bo'y va Yosh** ma'lumotlarini to'ldiring.
        </p>
        <button
          onClick={() => navigate("/settings")}
          className="mt-6 w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          Profil ma’lumotlarini kiritish
        </button>
      </div>
    );
  }

  // 🟢 3. Asosiy Dashboard
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
        <Target className="w-7 h-7 text-red-600 mr-2" />
        Mening Parhez Rejam (AI Nazorati)
      </h1>

      {/* === Kaloriya hisobi === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-500 hover:shadow-xl transition duration-300">
          <Zap className="w-8 h-8 text-red-500 mb-3" />
          <p className="text-sm text-gray-500 font-medium">BMR</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{bmr} Kkal</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500 hover:shadow-xl transition duration-300">
          <Clock className="w-8 h-8 text-orange-500 mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            Kunlik Ehtiyoj (TDEE)
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{tdee} Kkal</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 hover:shadow-xl transition duration-300">
          <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            AI Maqsad Kaloriyasi
          </p>
          <h3 className="text-3xl font-bold text-green-700 mt-1">
            {goalTDEE} Kkal
          </h3>
        </div>
      </div>

      {/* === Maqsad Tanlash Kategoriyalari === */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-10">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
          <Calendar className="w-6 h-6 mr-2 text-green-600" />
          Ovqat Maqsad Kategoriyalari
        </h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleGoalSelect(cat.name.toLowerCase())}
              disabled={!currentUserId || isGeneratingMenu}
              className={`px-5 py-2 rounded-full border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedGoal === cat.name.toLowerCase()
                  ? `${cat.color} border-green-600 font-bold`
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* === Premium menyu (AI ni chaqirish) === */}
      {userData?.isPremium ? (
        <div className="bg-white p-6 rounded-xl shadow-2xl border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            AI Haftalik Menyu Generatsiyasi
          </h2>
          <p className="text-gray-600 mb-4">
            AI sizning maqsadingiz ({userData.goal}) va kaloriyangiz ({goalTDEE}{" "}
            Kkal)ga mos keladigan 7 kunlik individual menyu yaratadi.
          </p>

          <button
            onClick={handleGenerateAIMenu}
            disabled={isGeneratingMenu || !currentUserId}
            className="w-full mt-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingMenu ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Menyu yaratilmoqda...
              </>
            ) : (
              "AI Menyuni Yangilash / Yaratish"
            )}
          </button>

          {/* 🔥🔥 Simulyatsiya natijasini ko'rsatish 🔥🔥 */}
          {aiMenuResult && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {aiMenuResult.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 border-b pb-2">
                {aiMenuResult.summary}
              </p>

              <div className="space-y-4">
                {aiMenuResult.week.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg shadow-sm border-l-4 border-blue-500"
                  >
                    <h4 className="font-bold text-blue-700 mb-2">{item.day}</h4>
                    <ul className="text-gray-700 space-y-2 text-sm">
                      <li className="flex items-start">
                        <Coffee className="w-4 h-4 mr-2 mt-1 text-orange-500 flex-shrink-0" />{" "}
                        **Nonushta:** {item.breakfast}
                      </li>
                      <li className="flex items-start">
                        <Soup className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" />{" "}
                        **Tushlik:** {item.lunch}
                      </li>
                      <li className="flex items-start">
                        <Sunset className="w-4 h-4 mr-2 mt-1 text-red-500 flex-shrink-0" />{" "}
                        **Kechki ovqat:** {item.dinner}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">
          <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700">
            Bu funksiya faqat <span className="text-yellow-600">Premium</span>{" "}
            foydalanuvchilar uchun! 🔒
          </p>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
