import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingBag, // ShoppingCart o'rniga ShoppingBag ishlatildi
  Filter,
  Loader,
  AlertTriangle,
  Search,
  ArrowDownWideNarrow,
} from "lucide-react";
import ProductCard from "../components/ui/ProductCard";
// 🔥 Cart Context import qilindi
import { useCart } from "../context/CartContext";

// 🔥 FIREBASE IMPORTS
import { db } from "../firebase"; // Yo'l to'g'ri ekanligiga ishonch hosil qiling
import { collection, getDocs } from "firebase/firestore";

// Kategoriya nomlarini chiroyli formatlash
const formatCategoryName = (cat) => {
  if (cat === "all") return "Barchasi";
  // Har bir so'zning bosh harfini kattalashtirish
  return cat
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const Store = () => {
  const { addToCart } = useCart();

  // Mahsulot holatlari
  const [products, setProducts] = useState([]); // Barcha yuklangan mahsulotlar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtr va Saralash holatlari
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // 🔥 Mahsulotlarni Firebasedan Yuklash Funksiyasi (READ)
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const productsCollectionRef = collection(db, "products");
      const snapshot = await getDocs(productsCollectionRef);
      const productsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Narx va qoldiq raqam ekanligiga ishonch hosil qilish
        price: parseFloat(doc.data().price) || 0,
        stock: parseInt(doc.data().stock) || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setProducts(productsList);
    } catch (err) {
      console.error("Mahsulotlarni yuklashda xato:", err);
      setError("Mahsulotlarni yuklashda xato yuz berdi. Konsolni tekshiring.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Savatga mahsulot qo'shish funksiyasi
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  // FILTRLASH VA SARALASH MANTIQI
  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // 1. Kategoriya bo'yicha filtrlash
    if (filterCategory !== "all") {
      result = result.filter((product) => product.category === filterCategory);
    }

    // 2. Qidiruv bo'yicha filtrlash
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
      );
    }

    // 3. Saralash
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "price_asc": // Arzonidan qimmatiga
          return a.price - b.price;
        case "price_desc": // Qimmatidan arzoniga
          return b.price - a.price;
        case "newest": // Yangi mahsulotlar
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "stock": // Qoldiq soni bo'yicha
          return b.stock - a.stock;
        case "default":
        default:
          return 0;
      }
    });

    return result;
  }, [products, filterCategory, searchTerm, sortBy]);

  // Noyob kategoriyalar ro'yxati (Filtrlar uchun)
  const categories = useMemo(() => {
    return ["all", ...new Set(products.map((p) => p.category))];
  }, [products]);

  // --- Render Mantiqi ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-green-50">
        <Loader className="w-8 h-8 text-green-600 animate-spin" />
        <p className="ml-3 text-lg text-gray-600">Mahsulotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center p-8 bg-red-100 border border-red-400 rounded-lg text-red-700">
            <AlertTriangle className="mr-3 w-6 h-6" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 💡 Yangi: BG gradient qo'shildi */}
      <div className="min-h-screen bg-gradient-to-b from-white to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Sarlavha: Rang va Ikonka o'zgartirildi */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-10 flex items-center justify-center md:justify-start">
            <ShoppingBag className="w-8 h-8 text-green-600 mr-3" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-700">
              SmartChef Bozor
            </span>
          </h1>

          {/* ======================================================= */}
          {/* FILTR, QIDIRUV VA SARALASH PANELI (Dizayn yangilandi) */}
          {/* ======================================================= */}
          <div className="bg-white p-6 rounded-2xl shadow-2xl mb-8 border border-green-200">
            {/* Qidiruv va Saralash qatori */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-5">
              {/* Qidiruv Qismi: Fokus ranglari yashilga o'zgardi */}
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Mahsulot nomini qidiring..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all shadow-sm"
                />
              </div>

              {/* Saralash Qismi: Fokus ranglari yashilga o'zgardi */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <ArrowDownWideNarrow className="w-5 h-5 text-green-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all w-full md:w-auto text-gray-700 font-medium bg-white shadow-sm appearance-none cursor-pointer"
                >
                  <option value="default">Saralash: Eng dolzarb</option>
                  <option value="newest">Yangi qo'shilganlar</option>
                  <option value="price_asc">Narxi: Arzonidan</option>
                  <option value="price_desc">Narxi: Qimmatidan</option>
                  <option value="stock">Qoldiq bo'yicha</option>
                </select>
              </div>
            </div>

            {/* Kategoriya Filtr Tugmalari: Ranglar yashilga o'zgardi */}
            <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2 items-center">
              <Filter className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-semibold text-gray-800 flex-shrink-0 mr-1">
                Kategoriyalar:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 shadow-md
                              ${
                                filterCategory === cat
                                  ? "bg-green-600 text-white shadow-green-300 hover:bg-green-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800"
                              }`}
                >
                  {formatCategoryName(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Mahsulotlar Ro'yxati */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isOutOfStock={product.stock <= 0}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-gray-900 mb-2">
                  Mahsulotlar topilmadi
                </p>
                <p className="text-gray-600">
                  Belgilangan filtrlarga mos mahsulotlar mavjud emas. Filtrlarni
                  o'zgartirib ko'ring.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Store;
