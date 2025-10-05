// src/pages/PaymentPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Zap, Check, X, Loader2, CreditCard } from "lucide-react";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

// 🔹 Obuna muddati hisoblovchi yordamchi funksiya
const calculateEndDate = (startDate, planId) => {
  const date = startDate && startDate.toDate ? startDate.toDate() : new Date();
  const newDate = new Date(date);
  if (planId.includes("monthly")) newDate.setMonth(newDate.getMonth() + 1);
  else if (planId.includes("annual"))
    newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate;
};

const subscriptionPlans = [
  {
    name: "Oddiy (Tekin)",
    price: 0.0,
    billing: "umrbod",
    planId: "free",
    features: [
      { text: "Cheklangan Retseptlar", available: true },
      { text: "Reklamali interfeys", available: true },
      { text: "Kuniga 3 ta AI Savol", available: true },
      { text: "Bepul oylik ovqat rejasi", available: false },
    ],
    color: "bg-gray-400",
    isFree: true,
  },
  {
    name: "Oylik Premium",
    price: 4.99,
    billing: "oyiga",
    planId: "monthly_premium_499",
    features: [
      { text: "Barcha Premium Retseptlar", available: true },
      { text: "Cheklanmagan AI Savollar", available: true },
      { text: "Reklamasiz interfeys", available: true },
      { text: "Bepul oylik ovqat rejasi", available: false },
    ],
    color: "bg-blue-600",
  },
  {
    name: "Yillik Premium (Tavsiya)",
    price: 49.99,
    billing: "yiliga (2 oy tekin)",
    planId: "annual_premium_4999",
    features: [
      { text: "Barcha Premium Retseptlar", available: true },
      { text: "Cheklanmagan AI Savollar", available: true },
      { text: "Reklamasiz interfeys", available: true },
      { text: "Bepul oylik ovqat rejasi", available: true },
    ],
    color: "bg-green-600",
  },
];

const PaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [premiumEndDate, setPremiumEndDate] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const navigate = useNavigate();

  // 🔹 Foydalanuvchi ma'lumotlarini Firestore’dan olish
  const fetchUserData = useCallback(async (user) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.isPremium && data.subscriptionEndDate) {
          const endDate = data.subscriptionEndDate.toDate();
          if (endDate > new Date()) {
            setIsPremiumActive(true);
            setPremiumEndDate(endDate);
            const activePlan = subscriptionPlans.find(
              (p) => p.planId === data.subscriptionPlanId
            );
            if (activePlan) setSelectedPlan(activePlan);
          } else {
            setIsPremiumActive(false);
          }
        }
      }
    } catch (error) {
      console.error("Foydalanuvchi ma'lumotini olishda xato:", error);
    }
  }, []);

  // 🔹 Auth kuzatuv
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
      fetchUserData(user);
    });
    return () => unsubscribe();
  }, [fetchUserData]);

  // 🔹 To‘lovni tasdiqlash (simulyatsiya)
  const handlePaymentConfirmation = async () => {
    if (!currentUser || selectedPlan.isFree || isPremiumActive) return;
    setLoading(true);
    setMessage("To'lov tasdiqlanmoqda...");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const newEndDate = calculateEndDate(null, selectedPlan.planId);

      // 1️⃣ To‘lov yozuvi
      await addDoc(collection(db, "payments"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        planName: selectedPlan.name,
        planId: selectedPlan.planId,
        amount: selectedPlan.price,
        status: "completed",
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Foydalanuvchini yangilash
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        isPremium: true,
        subscriptionPlan: selectedPlan.name,
        subscriptionPlanId: selectedPlan.planId,
        subscriptionStartDate: serverTimestamp(),
        subscriptionEndDate: Timestamp.fromDate(newEndDate), // 🔥 TUZATISH SHU YERDA
      });

      // 3️⃣ LocalStorage orqali Premium holatini eslab qolish
      localStorage.setItem("smartchef_premium", JSON.stringify(true));

      setMessage(
        `✅ ${
          selectedPlan.name
        } obunasi faollashtirildi! Tugash sanasi: ${newEndDate.toLocaleDateString()}`
      );
      setIsPremiumActive(true);
      setPremiumEndDate(newEndDate);
      setShowCardForm(false);

      setTimeout(() => navigate("/profile"), 5000);
    } catch (error) {
      console.error("To‘lovda xato:", error);
      setMessage("❌ To‘lov muvaffaqiyatsiz. Qayta urinib ko‘ring.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Asosiy to‘lov bosilganda
  const handleSubscription = () => {
    if (!currentUser) {
      setMessage("Obunani faollashtirish uchun tizimga kiring.");
      return;
    }
    if (isPremiumActive) {
      setMessage(
        `Sizning obunangiz tugamagan. Tugash: ${premiumEndDate.toLocaleDateString()}`
      );
      return;
    }
    if (!selectedPlan.isFree) setShowCardForm(true);
  };

  if (isLoadingAuth) {
    return (
      <>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-2" />
          <p className="text-xl text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-8 my-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
          <Zap className="w-8 h-8 text-green-600 mr-3 fill-green-100" />
          Obuna Rejalari
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Siz uchun eng mos rejani tanlang va cheklovlarsiz foydalaning.
        </p>

        {/* Rejalar ro‘yxati */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.name}
              onClick={() =>
                (!isPremiumActive || plan.isFree) && setSelectedPlan(plan)
              }
              className={`p-6 rounded-xl shadow-2xl transition-all duration-300 transform ${
                selectedPlan.name === plan.name
                  ? "ring-4 ring-green-500 scale-[1.03]"
                  : "bg-white hover:shadow-xl"
              } ${
                isPremiumActive && !plan.isFree
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <div
                className={`p-3 rounded-t-xl ${plan.color} text-white text-center`}
              >
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>
              <div className="py-8 text-center border-b border-gray-100">
                <span className="text-5xl font-extrabold text-gray-900">
                  {plan.isFree ? "Tekin" : `$${plan.price.toFixed(2)}`}
                </span>
                <span className="text-lg font-medium text-gray-500 ml-2">
                  /{plan.billing}
                </span>
              </div>
              <ul className="mt-6 space-y-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start">
                    {f.available ? (
                      <Check className="w-5 h-5 text-green-500 mt-1 mr-2" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 mt-1 mr-2" />
                    )}
                    <span
                      className={`${
                        f.available
                          ? "text-gray-800"
                          : "text-gray-500 line-through"
                      } font-medium`}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedPlan(plan)}
                className={`mt-8 w-full py-3 rounded-lg font-bold transition duration-300 ${
                  selectedPlan.name === plan.name
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {selectedPlan.name === plan.name ? "Tanlangan" : "Tanlash"}
              </button>
            </div>
          ))}
        </div>

        {/* To‘lov qismi */}
        <div className="mt-12 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-green-500">
          {showCardForm ? (
            <CardInputForm
              selectedPlan={selectedPlan}
              loading={loading}
              onConfirm={handlePaymentConfirmation}
              onCancel={() => setShowCardForm(false)}
            />
          ) : (
            <button
              onClick={handleSubscription}
              disabled={loading || isPremiumActive || !currentUser}
              className={`w-full md:w-1/3 py-4 rounded-lg text-lg font-bold flex justify-center items-center ${
                loading || isPremiumActive
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {loading
                ? "Yuklanmoqda..."
                : selectedPlan.isFree
                ? "Joriy Reja"
                : "Hozir To‘lash"}
              {!selectedPlan.isFree && <DollarSign className="ml-2 w-5 h-5" />}
            </button>
          )}
          {message && (
            <p
              className={`mt-4 font-medium ${
                message.includes("❌") ? "text-red-500" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

// 🔹 Karta kiritish formasi
const CardInputForm = ({ selectedPlan, loading, onConfirm, onCancel }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const formatCard = (val) =>
    val
      .replace(/\W/gi, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center bg-gray-100 p-3 rounded-lg border">
        <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
        <p className="font-semibold text-gray-700">
          Jami to‘lov:
          <span className="text-green-600 ml-2 font-bold">
            ${selectedPlan.price.toFixed(2)}
          </span>
        </p>
      </div>
      <input
        type="text"
        placeholder="Karta raqami"
        value={formatCard(cardNumber)}
        onChange={(e) =>
          setCardNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))
        }
        className="w-full p-3 border rounded-lg focus:ring-green-500"
      />
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="MM/YY"
          value={expiry
            .replace(/[^0-9]/g, "")
            .replace(/(.{2})/, "$1/")
            .slice(0, 5)}
          onChange={(e) => setExpiry(e.target.value)}
          className="flex-1 p-3 border rounded-lg focus:ring-green-500"
        />
        <input
          type="text"
          placeholder="CVC"
          value={cvc}
          onChange={(e) =>
            setCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
          }
          className="flex-1 p-3 border rounded-lg focus:ring-green-500"
        />
      </div>
      <div className="flex space-x-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-200 rounded-lg font-bold hover:bg-gray-300"
        >
          Bekor Qilish
        </button>
        <button
          onClick={onConfirm}
          disabled={loading || cardNumber.length < 16 || cvc.length < 3}
          className={`flex-1 py-3 rounded-lg font-bold text-white ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "To‘lov..." : "To‘lovni Tasdiqlash"}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
