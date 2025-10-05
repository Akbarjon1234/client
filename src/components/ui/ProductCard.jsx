import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Package } from 'lucide-react';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const ProductCard = ({ product, onAddToCart }) => {
  
  // Narxni so'm formatida ko'rsatish uchun funksiya
  const formatPrice = (price) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(price);
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col"
      variants={itemVariants}
      whileHover={{ y: -3, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" }}
    >
      {/* Rasm va Promokod */}
      <div className="h-40 bg-gray-100 relative flex items-center justify-center">
        <Package className="w-12 h-12 text-gray-400" /> {/* Vaqtinchalik Mahsulot Ikonkasi */}
        {product.isPromo && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-md">
            <Zap className="w-3 h-3 mr-1" />
            AKSIYA
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Nomi va Kategoriyasi */}
        <span className="text-sm font-medium text-blue-600 mb-1">{product.category}</span>
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex-grow">
          {product.name}
        </h3>
        
        {/* Narx va Qolgan Soni */}
        <div className="flex justify-between items-center mb-4 mt-auto">
          <p className="text-2xl font-extrabold text-green-700">
            {formatPrice(product.price)}
          </p>
          <p className="text-sm text-gray-500">
            Omborda: <span className="font-semibold text-gray-700">{product.stock}</span>
          </p>
        </div>

        {/* Savatga Qo'shish Tugmasi */}
        <motion.button
          onClick={() => onAddToCart(product)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
          whileTap={{ scale: 0.95 }}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {product.stock > 0 ? "Savatga qo'shish" : "Tugagan"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;