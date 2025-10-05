// src/pages/Settings.jsx (To'liq va to'g'rilangan versiya)

import React, { useState, useEffect } from "react";
import { User, Save, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { db, app } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const auth = getAuth(app);

const Settings = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const currentUserId = user ? user.uid : null;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "erkak",
    activityLevel: "o'rtacha",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Saqlash holatini boshqarish
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const activityMap = {
    minimal: 1.2,
    past: 1.375,
    "o'rtacha": 1.55,
    yuqori: 1.725,
    "o'ta yuqori": 1.9,
  };

  // Ma'lumotlarni yuklash (agar mavjud bo'lsa)
  useEffect(() => {
    if (loadingAuth || !currentUserId) return;

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            weight: data.weight || "",
            height: data.height || "",
            age: data.age || "",
            gender: data.gender || "erkak",
            activityLevel: data.activityLevelName || "o'rtacha",
          });
        }
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [currentUserId, loadingAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔥 Formani yuborish va Firestorga saqlash
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId || isSaving) return;

    // ✅ TO'G'RILANGAN TEKSHIRUV
    if (!formData.weight || !formData.height || !formData.age) {
      setError("Iltimos, Vazn, Bo'y va Yoshni to'ldiring!");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const userRef = doc(db, "users", currentUserId);

      const dataToSave = {
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        gender: formData.gender,
        activityLevel: activityMap[formData.activityLevel],
        activityLevelName: formData.activityLevel,
      };

      await setDoc(userRef, dataToSave, { merge: true });

      setMessage("Ma'lumotlar muvaffaqiyatli saqlandi!");

      // Dashboardga qaytarish (1.5 soniyadan keyin)
      setTimeout(() => {
        navigate("/health");
      }, 1500);
    } catch (err) {
      console.error("Ma'lumotni saqlashda xatolik:", err);
      setError("Ma'lumotni saqlashda kutilmagan xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || loadingAuth) {
    return <div className="text-center py-20">Ma’lumotlar yuklanmoqda...</div>;
  }

  // Asosiy Render
  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 mt-10 bg-white rounded-xl shadow-2xl">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center border-b pb-2">
        <User className="w-7 h-7 text-green-600 mr-3" />
        Profil Ma'lumotlarini Kiritish
      </h1>

      {error && (
        <div className="flex items-center p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          <Save className="w-5 h-5 mr-2" />
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Vazn, Bo'y va Yosh Inputlari */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vazn (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
              min="10"
              max="300"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bo'y (sm)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              required
              min="50"
              max="250"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Yosh
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="10"
              max="100"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
        </div>

        {/* Jinsni tanlash */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Jins
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="erkak">Erkak</option>
            <option value="ayol">Ayol</option>
          </select>
        </div>

        {/* Faollik darajasi */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Jismoniy Faollik Darajasi
          </label>
          <select
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="minimal">Minimal (O'tirib ishlash)</option>
            <option value="past">Past (Haftada 1-3 marta mashq)</option>
            <option value="o'rtacha">O'rtacha (Haftada 3-5 marta mashq)</option>
            <option value="yuqori">Yuqori (Har kuni mashq)</option>
            <option value="o'ta yuqori">
              O'ta Yuqori (Kunda 2 marta mashq)
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!currentUserId || isSaving}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Ma'lumotlarni Saqlash
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Settings;
