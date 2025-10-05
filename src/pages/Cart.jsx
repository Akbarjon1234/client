// src/pages/Cart.jsx

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
// 🔥 useCart hook'ini import qilish shart
import { useCart } from "../context/CartContext";

const Cart = () => {
  // 🔥 Ma'lumot va funksiyalar global Context'dan olinadi
  // DUMMY_CART endi kerak emas, chunki holat global saqlanmoqda
  const { cartItems, updateQuantity, removeItem, cartItemCount } = useCart();
  const navigate = useNavigate();

  // Narxni so'm formatida ko'rsatish
  const formatPrice = (price) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Umumiy Narxni Hisoblash
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Miqdorni o'zgartirish funksiyasi (Context funksiyasini chaqiradi)
  const handleQuantityChange = useCallback(
    (id, change) => {
      updateQuantity(id, change);
    },
    [updateQuantity]
  );

  // Mahsulotni o'chirish funksiyasi (Context funksiyasini chaqiradi)
  const handleRemoveItem = useCallback(
    (id) => {
      removeItem(id);
    },
    [removeItem]
  );

  // Buyurtma berish tugmasini bosish funksiyasi
  const handleCheckout = useCallback(() => {
    if (cartItems.length > 0) {
      navigate("/checkout");
    }
  }, [cartItems.length, navigate]);

  return (
    // 🔥 Header komponenti endi to'g'ri ishlashi uchun cartItemCount propini qabul qilmaydi,
    // lekin agar uni App.jsx da prop orqali uzatayotgan bo'lsangiz, bu erda uni qaytarib yuborishingiz kerak.
    // Biz Header.jsx ni to'g'irlaganimiz uchun bu yerda prop uzatish shart emas.
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
          <ShoppingCart className="w-7 h-7 text-blue-600 mr-2" />
          Savat ({cartItemCount})
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Savatdagi Mahsulotlar Ro'yxati (Chap Qism) */}
          <div className="lg:w-2/3">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 mb-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between transition-all duration-300 ease-in-out"
                >
                  <div className="flex items-center space-x-4">
                    {/* Rasm joyi */}
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-blue-400" />
                    </div>

                    {/* Nomi */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatPrice(item.price)} / dona
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Miqdorni boshqarish */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition duration-150 active:scale-90"
                        disabled={item.quantity <= 1} // 1 dan pastga tushmaslik uchun
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-lg font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition duration-150 active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Umumiy narx */}
                    <p className="text-xl font-bold text-green-700 w-24 text-right hidden md:block">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    {/* O'chirish tugmasi */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition duration-150 active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Mahsulot bo'lmaganda ko'rinadigan qism
              <div className="bg-white p-10 rounded-xl shadow-lg text-center transition duration-300">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-medium">
                  Savatda mahsulot yo'q.
                </p>
                <p className="text-gray-500 mt-2">
                  E-Do'konga qaytib, mahsulotlarni tanlang.
                </p>
              </div>
            )}
          </div>

          {/* Umumiy Hisob-Kitob Paneli (O'ng Qism) */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-xl shadow-2xl sticky top-20 border-t-4 border-green-500 transition duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Buyurtma Xulosasi
              </h2>

              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Mahsulotlar narxi:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Yetkazib berish:</span>
                  <span>
                    {cartItems.length > 0 ? formatPrice(20000) : formatPrice(0)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 text-2xl font-extrabold text-gray-900">
                <span>Jami To'lov:</span>
                <span className="text-green-600">
                  {formatPrice(
                    totalAmount + (cartItems.length > 0 ? 20000 : 0)
                  )}
                </span>
              </div>

              {/* Buyurtma Berish Tugmasi */}
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className={`w-full mt-6 py-3 text-lg font-semibold rounded-lg flex items-center justify-center transition duration-300 shadow-lg 
                  ${
                    cartItems.length > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] active:shadow-none"
                      : "bg-gray-400 text-gray-700 cursor-not-allowed"
                  }`}
              >
                Buyurtma Berish
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
