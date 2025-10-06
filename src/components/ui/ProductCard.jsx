// src/components/ui/ProductCard.jsx

import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Zap,
  Tag,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast"; // Xabarnoma uchun (npm install react-hot-toast)

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ProductCard = ({ product, onAddToCart, isOutOfStock = false }) => {
  // Narxni so'm formatida ko'rsatish
  const formatPrice = (price) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isAvailable = !isOutOfStock && product.stock > 0;

  // Mahsulotni savatga qo'shish va xabarnoma chiqarish
  const handleAddToCart = () => {
    onAddToCart(product);

    // 🔥 Xabarnoma stillarini kattaroq qilish uchun o'zgartirishlar kiritildi
    toast.success(`${product.name} savatga qo'shildi!`, {
      duration: 2000, // Xabarnoma ko'proq turishi uchun oshirildi
      position: "top-center",
      style: {
        fontSize: "18px", // 🔥 Matn kattaligi oshirildi
        fontWeight: "bold",
        border: "2px solid #10B981", // 🔥 Qalinroq chegara
        padding: "16px 25px", // 🔥 Kengroq padding
        minWidth: "300px", // 🔥 Minimal kenglik qo'shildi
        color: "#10B981", // Matn rangi yashil qilindi
        background: "#E6FFFA", // Orqa fon och yashil
        borderRadius: "12px",
      },
      iconTheme: {
        primary: "#10B981", // Icon rangini belgilash
        secondary: "#fff",
      },
    });
  };

  // O'lchov birligini aniqlash va qoldiqni formatlash
  const unit = product.unit || "dona"; // Default: dona
  const stockValue =
    unit === "dona" || unit === "pack" // Dona yoki boshqa butun sonli birliklar
      ? Math.floor(product.stock)
      : parseFloat(product.stock).toFixed(2); // kg/l kabi birliklar uchun 2 ta aniqlik

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-gray-100 flex flex-col transition-opacity duration-300 ${
        isOutOfStock ? "opacity-60 grayscale" : "hover:border-green-300"
      }`}
      variants={itemVariants}
      whileHover={
        isAvailable
          ? { y: -5, boxShadow: "0 15px 25px rgba(0, 150, 0, 0.15)" }
          : {}
      }
    >
      {/* ======================= Rasm va Promokod ======================= */}
      <div className="h-44 bg-white relative flex items-center justify-center p-4 group">
        {/* Rasm URL mavjud bo'lsa, uni ko'rsatish */}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain transition duration-300 transform group-hover:scale-105"
          />
        ) : (
          // Rasm URL bo'lmasa, joy tutuvchi rasm
          <div className="p-4 bg-green-100 rounded-full shadow-lg">
            <ImageIcon className="w-10 h-10 text-green-600" />
          </div>
        )}

        {/* AKSIYA/CHEGIRMA belgilari */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center shadow-lg border border-white">
            <Zap className="w-3 h-3 mr-1" />
            TAVSIYA
          </div>
        )}

        {/* Tugaganlik belgisi */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <p className="text-white text-2xl font-black rotate-[-10deg] p-2 border-4 border-white rounded-lg">
              TUGAGAN!
            </p>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* Nomi va Kategoriyasi */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-extrabold text-gray-900 flex-grow leading-tight mr-2">
            {product.name}
          </h3>
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap flex items-center">
            <Tag className="w-3 h-3 mr-1" />
            {product.category}
          </span>
        </div>

        {/* Tavsif (Description) */}
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">
            {product.description}
          </p>
        )}

        {/* Narx va Qolgan Soni */}
        <div className="flex justify-between items-end mt-auto pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-500">Narx:</p>
            <p className="text-2xl font-extrabold text-green-600">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Qoldiq:</p>
            <p
              className={`font-bold text-base ${
                isOutOfStock ? "text-red-500" : "text-gray-800"
              }`}
            >
              {/* O'lchov birligi bilan ko'rsatish */}
              {stockValue} {unit}
            </p>
          </div>
        </div>

        {/* ================= Savatga Qo'shish Tugmasi ================= */}
        <motion.button
          onClick={handleAddToCart}
          className={`w-full py-3 rounded-xl text-base font-semibold mt-4 transition duration-300 flex items-center justify-center shadow-lg
            ${
              isAvailable
                ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-400/50"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          whileTap={isAvailable ? { scale: 0.97 } : {}}
          disabled={!isAvailable}
        >
          {isAvailable ? (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Savatga qo'shish
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 mr-2" />
              Tugagan
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
