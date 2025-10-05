// src/components/ui/RecipeDetailModal.jsx

import React from "react";
// motion endi kerak emas
// import { motion } from "framer-motion";
import { X, Clock, Zap, Info, ListChecks } from "lucide-react";

const RecipeDetailModal = ({ recipe, onClose }) => {
  const { name, imageUrl, totalTime, fullContent, ingredients, isPremium } =
    recipe;

  return (
    // <motion.div o'rniga oddiy <div> ishlatildi
    <div
      // Framer Motion initial, animate, exit o'rniga oddiy CSS transition
      className="fixed inset-0 z-[1000] flex justify-center items-center p-4 backdrop-blur-sm transition-opacity duration-300"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose} // Fonni bosganda modal yopiladi
    >
      {/* <motion.div o'rniga oddiy <div> ishlatildi */}
      <div
        // Modalning ichki qismi. Transofrm o'zgarishlari endi kerak emas, lekin chiroyli yopilish uchun ba'zi klasslar saqlandi.
        onClick={(e) => e.stopPropagation()} // Modal ichini bosganda yopilmasligi uchun
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto 
                   transform transition-transform duration-300 relative 
                   scale-100 opacity-100" // Agar o'zgarishlar kerak bo'lsa, bu yerda o'zgartiriladi
      >
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 z-10 bg-white rounded-full p-2 shadow-md transition"
        >
          <X size={24} />
        </button>

        {/* Rasm va Sarlavha */}
        <div className="relative h-64 overflow-hidden rounded-t-3xl">
          <img
            src={
              imageUrl ||
              "https://via.placeholder.com/800x400?text=Retsept+Rasmi"
            }
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <h2 className="absolute bottom-0 left-0 p-6 text-3xl font-extrabold text-white">
            {name}
          </h2>
        </div>

        {/* Kontent */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Metrikalar */}
          <div className="flex justify-around items-center border-b pb-4">
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold text-gray-800">
                {totalTime || "N/A"} min
              </p>
              <p className="text-sm text-gray-500">Umumiy Vaqt</p>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
              <p className="text-lg font-bold text-gray-800">
                {isPremium ? "Premium" : "Oddiy"}
              </p>
              <p className="text-sm text-gray-500">Holat</p>
            </div>
          </div>

          {/* Tarkiblar (Ingredients) */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
              <ListChecks className="w-5 h-5 mr-2 text-red-500" /> Kerakli
              Masalliqlar
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-line">
              {ingredients || "Masalliqlar ro'yxati kiritilmagan."}
            </div>
          </div>

          {/* Batafsil Kontent */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-red-500" /> Tayyorlash Usuli
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {fullContent ||
                "Bu retsept uchun batafsil tayyorlash usuli kiritilmagan."}
            </p>
          </div>

          {/* Yopish tugmasi */}
          <button
            onClick={onClose}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
