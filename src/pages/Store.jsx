import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Filter, Loader, AlertTriangle } from "lucide-react";
import ProductCard from "../components/ui/ProductCard";
// 🔥 Cart Context import qilindi
import { useCart } from "../context/CartContext";

// 🔥 FIREBASE IMPORTS
import { db } from "../firebase"; // Yo'l to'g'ri ekanligiga ishonch hosil qiling
import { collection, getDocs } from "firebase/firestore";

const Store = () => {
  const { addToCart } = useCart();

  // Mahsulot holatlari
  const [products, setProducts] = useState([]); // Barcha yuklangan mahsulotlar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

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

  // Mahsulotlarni filtrlash mantiqi
  const filteredProducts = products.filter((product) => {
    if (filterCategory === "all") return true;
    return product.category === filterCategory;
  });

  // Noyob kategoriyalar ro'yxati (Filtrlar uchun)
  const categories = ["all", ...new Set(products.map((p) => p.category))];

  // --- Render Mantiqi ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="ml-3 text-lg text-gray-600">Mahsulotlar yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-center justify-center p-8 bg-red-100 border border-red-400 rounded-lg text-red-700">
            <AlertTriangle className="mr-3 text-2xl" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center">
          <ShoppingCart className="w-7 h-7 text-blue-600 mr-2" />
          SmartShef E-Do'kon
        </h1>

        {/* Filtrlar Paneli */}
        <div className="bg-white p-4 rounded-xl shadow-lg mb-8 flex flex-wrap gap-3 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700 mr-2">Kategoriya:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 active:scale-[0.98]
                        ${
                          filterCategory === cat
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
            >
              {cat === "all" ? "Barchasi" : cat}
            </button>
          ))}
        </div>

        {/* Mahsulotlar Ro'yxati */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))
          ) : (
            <p className="col-span-full text-center py-10 text-gray-500 text-lg">
              Hozircha bu kategoriyada mahsulotlar mavjud emas.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Store;
