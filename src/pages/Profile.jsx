// src/pages/Profile.jsx (Yakuniy va to'g'rilangan versiya)

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Target,
  TrendingUp,
  LogOut,
  Check,
  Edit2,
  Loader2,
  Zap,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { signOut, updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// 🔥 1. TO'G'RILANGAN: Faollik darajalari. Endi 'value' maydoni Settings.jsx dagi RAQAM koeffitsientlarini aks ettiradi.
const activityLevels = [
  { label: "Minimal Faol (Kam jismoniy harakat)", value: 1.2 },
  { label: "Past Faol (Haftada 1-3 marta mashq)", value: 1.375 },
  { label: "O'rtacha Faol (Haftada 3-5 marta mashq)", value: 1.55 }, // <--- Default
  { label: "Yuqori Faol (Har kuni qattiq mashq)", value: 1.725 },
  { label: "O'ta Yuqori Faol (Kunda 2 marta mashq)", value: 1.9 },
];

const goals = [
  { label: "Vazn Yo'qotish (Defitsit)", value: "vazn yo'qotish" },
  { label: "Vazn Saqlash (Muvozanat)", value: "vazn saqlash" }, // <--- Default
  { label: "Vazn Orttirish (Profitsit)", value: "vazn orttirish" },
];

// 🔥 2. TO'G'RILANGAN: Qiymatni to'liq labelga o'girish (Raqam va Stringlar uchun ishlaydi)
const getLabelByValue = (value, list) => {
  // String (maqsad) yoki Raqam (faollik darajasi) bo'lishi mumkinligini hisobga olamiz
  const item = list.find(
    (i) => i.value === value || i.value.toString() === value.toString()
  );
  return item ? item.label : value;
};

const Profile = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState("");

  // --- Ma'lumotlarni yuklash (Auth va Firestore) ---
  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      let firestoreData = {};

      if (docSnap.exists()) {
        firestoreData = docSnap.data();
      }

      // 🔥 3. TO'G'RILANGAN: Agar ma'lumotlar yo'q bo'lsa, default qiymatlarni o'rnatish
      setUserData({
        // BMI/BMR ma'lumotlari mavjud bo'lmasa, null qoldiramiz.
        // goal va activityLevel default qiymatlarni oladi
        ...firestoreData,
        goal: firestoreData.goal || goals[1].value,
        // activityLevel raqam bo'lsa, uni ishlatamiz, aks holda default raqamni
        activityLevel: firestoreData.activityLevel || activityLevels[2].value,
        isPremium: firestoreData.isPremium || false,
        subscriptionEndDate: firestoreData.subscriptionEndDate || null,
      });

      setUpdatedName(user.displayName || "");
      setIsLoading(false);
    } catch (error) {
      console.error("Profil ma'lumotlarini yuklashda xato:", error);
      setIsLoading(false);
    }
  }, []);

  // Auth holati o'zgarishini kuzatish
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchUserData, navigate]);

  // --- Saqlash/Yangilash Funktsiyalari ---

  const handleUpdateProfile = async () => {
    if (!currentUser || !userData) return;

    setIsLoading(true);

    try {
      // 1. Auth dagi ismni yangilash
      if (currentUser.displayName !== updatedName) {
        await updateProfile(currentUser, { displayName: updatedName });
        setCurrentUser((prev) => ({ ...prev, displayName: updatedName }));
      }

      // 2. Firestore dagi diet sozlamalarini yangilash
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        goal: userData.goal,
        activityLevel: userData.activityLevel,
      });

      setIsEditing(false);
      alert("Ma'lumotlar muvaffaqiyatli yangilandi!");
    } catch (error) {
      console.error("Profilni yangilashda xato:", error);
      alert("Xato: Ma'lumotlarni yangilab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Tizimdan chiqishda xato:", error);
      alert("Tizimdan chiqishda xato yuz berdi.");
    }
  };

  const handleDietSettingChange = (field, value) => {
    // Faollik darajasi raqamga o'tkaziladi
    const finalValue = field === "activityLevel" ? Number(value) : value;
    setUserData((prev) => ({ ...prev, [field]: finalValue }));
  };

  // --- UI Komponentlari ---
  // (InfoCard va boshqa UI qismlari o'zgarishsiz qoldirildi, chunki ular to'g'ri)

  const InfoCard = ({ title, value, icon: Icon, isEditable = false }) => (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 h-full"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3 mb-2">
        <Icon className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      {isEditable && isEditing ? (
        <input
          type="text"
          value={updatedName}
          onChange={(e) => setUpdatedName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
          disabled={isLoading}
        />
      ) : (
        <p className="text-xl font-bold text-gray-900 break-words">{value}</p>
      )}
    </motion.div>
  );

  // Yuklanish holati
  if (isLoading || !currentUser || !userData) {
    return (
      <>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-2" />
          <p className="text-xl text-gray-600">Profil yuklanmoqda...</p>
        </div>
      </>
    );
  }

  // Ma'lumotlarni formatlash
  const memberSinceDate = currentUser.metadata.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString("uz-UZ")
    : "Noma'lum";

  const isPremium = userData.isPremium || false;

  let endDateText = "N/A";
  if (
    isPremium &&
    userData.subscriptionEndDate &&
    userData.subscriptionEndDate.toDate
  ) {
    const endDate = userData.subscriptionEndDate.toDate();
    endDateText = endDate.toLocaleDateString("uz-UZ");
  } else if (isPremium) {
    endDateText = "Ma'lumot topilmadi";
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <motion.h1
          className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <User className="w-7 h-7 text-green-600 mr-2" />
          Mening Profilim
        </motion.h1>

        {/* 1. Asosiy Ma'lumotlar Paneli */}
        <div className="mb-10 bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Asosiy Ma'lumotlar
            </h2>

            {/* Premium holatini ko'rsatish */}
            <span
              className={`px-3 py-1 text-sm font-bold rounded-full flex items-center ${
                isPremium
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Zap className="w-4 h-4 mr-1 fill-current" />
              {isPremium ? "Premium A'zo" : "Oddiy A'zo"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InfoCard
              title="To'liq Ism"
              value={currentUser.displayName || "Ismsiz Foydalanuvchi"}
              icon={User}
              isEditable={true}
            />
            <InfoCard
              title="Email Manzil"
              value={currentUser.email}
              icon={Mail}
            />
            <InfoCard
              title="A'zolik Sanasi"
              value={memberSinceDate}
              icon={Check}
            />

            {/* Obuna Tugash Sanasi */}
            {isPremium && (
              <InfoCard
                title="Obuna Tugash Sanasi"
                value={endDateText}
                icon={Clock}
              />
            )}

            <motion.button
              onClick={() => {
                isEditing ? handleUpdateProfile() : setIsEditing(true);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition duration-200 w-full col-span-1 md:col-span-2 lg:col-span-4 mt-4
                                ${
                                  isEditing
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                }`}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading}
            >
              {isEditing ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Saqlash (Ism va Sozlamalar)
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-1" /> Profilni Tahrirlash
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* 2. Parhez va AI Sozlamalari (Tuzatilgan Qism) */}
        <motion.div
          className="mb-10 bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Parhez Sozlamalari (AI Menyu uchun)
          </h2>
          <p className="text-gray-500 mb-6">
            Bu sozlamalar sizning shaxsiy haftalik AI menyuingizni aniqlaydi va
            sizning umumiy maqsadingizni belgilaydi.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maqsadni Tanlash */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-700 font-medium flex items-center">
                <Target className="w-4 h-4 mr-2 text-red-500" /> Asosiy Maqsad
              </label>

              {isEditing ? (
                // Tahrirlash Rejimida: Select qutisi
                <select
                  value={userData.goal}
                  onChange={(e) =>
                    handleDietSettingChange("goal", e.target.value)
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                >
                  {goals.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              ) : (
                // Ko'rsatish Rejimida: Tanlangan qiymatning labeli ko'rinadi
                <p className="text-lg font-bold text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {getLabelByValue(userData.goal, goals)}
                </p>
              )}
            </div>

            {/* Faollik Darajasini Tanlash */}
            <div className="flex flex-col space-y-2">
              <label className="text-gray-700 font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-red-500" /> Faollik
                Darajasi
              </label>

              {isEditing ? (
                // Tahrirlash Rejimida: Select qutisi
                <select
                  // Qiymatni raqam sifatida saqlasak ham, select qutisi string qabul qiladi.
                  // Shuning uchun toString() ishlatamiz.
                  value={userData.activityLevel.toString()}
                  onChange={(e) =>
                    handleDietSettingChange("activityLevel", e.target.value)
                  }
                  className="p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                >
                  {activityLevels.map((a) => (
                    <option key={a.value} value={a.value.toString()}>
                      {a.label}
                    </option>
                  ))}
                </select>
              ) : (
                // Ko'rsatish Rejimida: Tanlangan qiymatning labeli ko'rinadi
                <p className="text-lg font-bold text-gray-900 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {getLabelByValue(userData.activityLevel, activityLevels)}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* 3. Harakatlar (Logout) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-3 bg-red-600 text-white font-semibold rounded-lg flex items-center justify-center hover:bg-red-700 transition duration-200 shadow-lg"
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Tizimdan Chiqish
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};

export default Profile;
