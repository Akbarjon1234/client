// src/pages/Checkout.jsx

import React, { useState, useMemo, memo } from "react";
import { MapPin, Truck, CreditCard, CheckCircle, Loader } from "lucide-react";
import { useCart } from "../context/CartContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Sabit narxlar
const SHIPPING_FEE = 20000;

const steps = [
  { id: 1, name: "Manzil", icon: MapPin },
  { id: 2, name: "Yetkazish", icon: Truck },
  { id: 3, name: "Toʻlov", icon: CreditCard },
];

// Narxni formatlash funksiyasini asosiy komponentdan tashqariga chiqaramiz
const formatPrice = (price) => {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(price);
};

// =======================================================
// 🔥 1. MEMOIZATSIYA QILINGAN QADAM KOMPONENTLARI
// =======================================================

// --- 1. Manzil Kiritish Komponenti (Memoized) ---
const StepAddress = memo(({ formData, setFormData, handleNext }) => (
  <div className="transition-opacity duration-300">
    <h2 className="text-xl font-bold mb-4">
      Yetkazib berish ma'lumotlarini kiriting
    </h2>

    <div className="space-y-4">
      <input
        key="input-name" // 🔥 Har bir inputga KEY qo'shildi (Barqarorlik uchun)
        type="text"
        placeholder="To'liq ism-familiya (Majburiy)"
        value={formData.customerName}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, customerName: e.target.value }))
        }
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
      />
      <input
        key="input-phone" // 🔥 Har bir inputga KEY qo'shildi
        type="tel"
        placeholder="Telefon raqami (Majburiy, masalan, 99 123 45 67)"
        value={formData.phoneNumber}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
        }
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
      />
      <textarea
        key="input-address" // 🔥 Har bir inputga KEY qo'shildi
        placeholder="Shahar, ko'cha, uy raqami, kvartira, qo'shimcha ma'lumotlar..."
        value={formData.address}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, address: e.target.value }))
        }
        rows="3"
        required
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
      />
    </div>

    <p className="mt-2 text-sm text-gray-500">
      Iltimos, manzilni va aloqa ma'lumotlarini aniq kiriting.
    </p>

    <button
      onClick={handleNext}
      disabled={
        !formData.address || !formData.phoneNumber || !formData.customerName
      }
      className={`w-full py-3 mt-6 font-semibold rounded-lg text-white transition duration-200 shadow-md ${
        formData.address && formData.phoneNumber && formData.customerName
          ? "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
          : "bg-gray-400 cursor-not-allowed"
      }`}
    >
      Keyingi qadam (Yetkazish)
    </button>
  </div>
));

// --- 2. Yetkazib Berish Komponenti (Memoized) ---
const StepDelivery = memo(
  ({
    formData,
    setFormData,
    handleNext,
    handleBack,
    totalAmount,
    formatPrice,
  }) => {
    const SHIPPING_FEE = 20000;
    const expressFee = SHIPPING_FEE + 5000;

    return (
      <div className="transition-opacity duration-300">
        <h2 className="text-xl font-bold mb-4">
          Yetkazib berish usulini tanlang
        </h2>

        {/* Standart Yetkazish */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition duration-150 mb-3 hover:scale-[1.01] ${
            formData.deliveryMethod === "standard"
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, deliveryMethod: "standard" }))
          }
        >
          <p className="font-semibold">Standart Yetkazish (24 soat ichida)</p>
          <p className="text-sm text-gray-500">{formatPrice(SHIPPING_FEE)}</p>
        </div>

        {/* Express Yetkazish (Qo'shimcha Taklif) */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition duration-150 hover:scale-[1.01] ${
            formData.deliveryMethod === "express"
              ? "border-green-500 bg-green-50 shadow-md"
              : "border-gray-200 hover:bg-gray-50"
          }`}
          onClick={() =>
            setFormData((prev) => ({ ...prev, deliveryMethod: "express" }))
          }
        >
          <p className="font-semibold">
            Ekspress Yetkazish (3 soat ichida){" "}
            <span className="text-red-500 ml-2 text-xs">(+5,000 UZS)</span>
          </p>
          <p className="text-sm text-gray-500">{formatPrice(expressFee)}</p>
        </div>

        <div className="flex justify-between space-x-4 mt-6">
          <button
            onClick={handleBack}
            className="flex-1 py-3 font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-200 active:scale-[0.98]"
          >
            Orqaga
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-200 active:scale-[0.98]"
          >
            Keyingi qadam (Toʻlov)
          </button>
        </div>
      </div>
    );
  }
);

// --- 3. To'lov Usuli Komponenti (Memoized) ---
const StepPayment = memo(
  ({
    formData,
    setFormData,
    handlePlaceOrder,
    handleBack,
    calculateGrandTotal,
    isProcessing,
    formatPrice,
  }) => (
    <div className="transition-opacity duration-300">
      <h2 className="text-xl font-bold mb-4">Toʻlov usulini tanlang</h2>

      {/* Naqd pul */}
      <div
        className={`p-4 border-2 rounded-lg cursor-pointer transition duration-150 mb-3 hover:scale-[1.01] ${
          formData.paymentMethod === "cash"
            ? "border-green-500 bg-green-50 shadow-md"
            : "border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() =>
          setFormData((prev) => ({ ...prev, paymentMethod: "cash" }))
        }
      >
        <p className="font-semibold">Naqd pul</p>
        <p className="text-sm text-gray-500">
          Kurerga buyurtmani olganingizda to'laysiz.
        </p>
      </div>

      {/* Onlayn To'lov */}
      <div
        className={`p-4 border-2 rounded-lg cursor-pointer transition duration-150 mb-3 hover:scale-[1.01] ${
          formData.paymentMethod === "card"
            ? "border-green-500 bg-green-50 shadow-md"
            : "border-gray-200 hover:bg-gray-50"
        }`}
        onClick={() =>
          setFormData((prev) => ({ ...prev, paymentMethod: "card" }))
        }
      >
        <p className="font-semibold">Onlayn toʻlov (Karta, Payme, Click)</p>
        <p className="text-sm text-gray-500">Hozir to'lovni amalga oshirish.</p>
      </div>

      <div className="flex justify-between space-x-4 mt-6">
        <button
          onClick={handleBack}
          className="flex-1 py-3 font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition duration-200 active:scale-[0.98]"
        >
          Orqaga
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className={`flex-1 py-3 font-semibold rounded-lg text-white transition duration-200 active:scale-[0.98] flex items-center justify-center ${
            isProcessing
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Yuborilmoqda...
            </>
          ) : (
            `Buyurtmani Tasdiqlash (${formatPrice(calculateGrandTotal)})`
          )}
        </button>
      </div>
    </div>
  )
);

// =======================================================
// ASOSIY CHECKOUT KOMPONENTI
// =======================================================
const Checkout = () => {
  const { cartItems, clearCart } = useCart();

  const [currentStep, setCurrentStep] = useState(1);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    phoneNumber: "",
    customerName: "",
    deliveryMethod: "standard",
    paymentMethod: "cash",
  });

  // --- Narxlarni Hisoblash ---
  const totalAmount = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0
    );
  }, [cartItems]);

  const calculateGrandTotal = useMemo(() => {
    let total = totalAmount + SHIPPING_FEE;
    if (formData.deliveryMethod === "express") {
      total += 5000;
    }
    return total;
  }, [totalAmount, formData.deliveryMethod]);

  // --- Boshqaruv Funksiyalari ---
  const handleNext = () => {
    if (
      currentStep === 1 &&
      (!formData.address || !formData.phoneNumber || !formData.customerName)
    )
      return;
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Savat bo'sh, buyurtma bera olmaysiz!");
      return;
    }
    if (!formData.address || !formData.phoneNumber || !formData.customerName) {
      alert("Iltimos, manzil va aloqa ma'lumotlarini to'liq kiriting!");
      setCurrentStep(1);
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        userId: "anonymous_" + Date.now(),
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: calculateGrandTotal,
        shippingFee:
          formData.deliveryMethod === "express"
            ? SHIPPING_FEE + 5000
            : SHIPPING_FEE,
        address: formData.address,
        deliveryMethod: formData.deliveryMethod,
        paymentMethod: formData.paymentMethod,
        status: "PENDING",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      setOrderId(docRef.id);
      clearCart();
      setIsOrderPlaced(true);
    } catch (error) {
      console.error("Buyurtma berishda xato: ", error);
      alert(
        "Buyurtmani yakunlashda xato yuz berdi. Iltimos, qayta urinib ko'ring."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // --- KOMPONENT: Buyurtma Tasdiqlangan ---
  if (isOrderPlaced) {
    return (
      <div className="text-center bg-white p-10 rounded-xl shadow-2xl max-w-md mx-auto my-20 transition duration-500">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Buyurtma qabul qilindi!
        </h1>
        <p className="text-lg text-gray-600">Buyurtma raqami: **#{orderId}**</p>
        <p className="mt-4 text-gray-700">
          Tez orada kurer siz bilan bog'lanadi. SmartShefni tanlaganingiz uchun
          rahmat!
        </p>
      </div>
    );
  }

  // --- Asosiy Checkout Sahifasi Renderi ---
  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Buyurtmani Yakunlash
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center p-10 bg-yellow-50 rounded-lg border border-yellow-200">
            <h2 className="text-2xl font-semibold text-yellow-800">
              Savat bo'sh!
            </h2>
            <p className="text-gray-600 mt-2">
              Buyurtma berish uchun savatga mahsulot qo'shing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Chap Qism: Bosqichlar va Forma */}
            <div className="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg">
              {/* Bosqich Navigatsiyasi (Progress Bar) */}
              <div className="flex justify-between items-center mb-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 mx-6" />
                {steps.map((step) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-colors duration-300 ${
                        currentStep >= step.id ? "bg-green-600" : "bg-gray-400"
                      }`}
                    >
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        currentStep >= step.id
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bosqich Kontenti */}
              <div className="p-4 border border-gray-100 rounded-lg">
                {/* 🔥 currentStep o'zgarishi input muammosini keltirib chiqarmasligi uchun 
                                    Step komponentlariga React.memo ishlatdik */}
                {currentStep === 1 && (
                  <StepAddress {...{ formData, setFormData, handleNext }} />
                )}
                {currentStep === 2 && (
                  <StepDelivery
                    {...{
                      formData,
                      setFormData,
                      handleNext,
                      handleBack,
                      totalAmount,
                      formatPrice,
                    }}
                  />
                )}
                {currentStep === 3 && (
                  <StepPayment
                    {...{
                      formData,
                      setFormData,
                      handlePlaceOrder,
                      handleBack,
                      calculateGrandTotal,
                      isProcessing,
                      formatPrice,
                    }}
                  />
                )}
              </div>
            </div>

            {/* O'ng Qism: Xulosa Paneli */}
            <div className="lg:w-1/3">
              <div className="bg-white p-6 rounded-xl shadow-2xl sticky top-20 border-t-4 border-blue-500 transition duration-300">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">
                  Buyurtma Xulosasi
                </h2>

                <p className="text-gray-500 mb-4">
                  Savatdagi **{cartItems.length}** ta mahsulot (
                  {formatPrice(totalAmount)})
                </p>

                <div className="space-y-3 border-y py-4">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Yetkazib berish narxi (
                      {formData.deliveryMethod === "express"
                        ? "Ekspress"
                        : "Standart"}
                      ):
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatPrice(calculateGrandTotal - totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Toʻlov usuli:</span>
                    <span className="font-semibold text-gray-800">
                      {formData.paymentMethod === "cash"
                        ? "Naqd"
                        : "Onlayn Karta"}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Manzil:</span>
                    <span className="font-semibold text-gray-800 max-w-[150px] truncate">
                      {formData.address || "Kiritilmagan"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 text-2xl font-extrabold text-gray-900">
                  <span>Jami To'lov:</span>
                  <span className="text-green-600">
                    {formatPrice(calculateGrandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Checkout;
