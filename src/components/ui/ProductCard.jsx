import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, Package, Tag, AlertCircle } from "lucide-react";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// isOutOfStock prop'i Store.jsx'dan to'g'ri qabul qilinadi
const ProductCard = ({ product, onAddToCart, isOutOfStock = false }) => {
  // Narxni so'm formatida ko'rsatish uchun funksiya
  const formatPrice = (price) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isAvailable = !isOutOfStock && product.stock > 0;

  return (
    <motion.div
      // isOutOfStock bo'lsa dizaynni biroz xiralashtiramiz (opacity-50)
      className={`bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-gray-100 flex flex-col transition-opacity duration-300 ${
        isOutOfStock ? "opacity-60 grayscale" : "hover:border-green-300"
      }`}
      variants={itemVariants}
      whileHover={
        isAvailable
          ? { y: -5, boxShadow: "0 15px 25px rgba(0, 150, 0, 0.15)" }
          : {}
      } // Faqat mavjud bo'lsa hover effekti
    >
      {/* ======================= Rasm va Promokod ======================= */}
      <div className="h-44 bg-green-50 relative flex items-center justify-center p-4">
        {/* 🔥 Mahsulot rasmi o'rnida joy tutuvchi */}
        <div className="p-4 bg-white rounded-full shadow-lg">
          <Package className="w-10 h-10 text-green-600" />
        </div>

        {/* AKSIYA/CHEGIRMA belgilari */}
        {product.isPromo && (
          <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center shadow-lg border border-white">
            <Zap className="w-3 h-3 mr-1" />
            CHEGIRMA
          </div>
        )}

        {/* 🔥 Tugaganlik belgisi */}
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
              {product.stock} dona
            </p>
          </div>
        </div>

        {/* ================= Savatga Qo'shish Tugmasi ================= */}
        <motion.button
          onClick={() => onAddToCart(product)}
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
