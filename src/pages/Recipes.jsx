// src/pages/Recipes.jsx (Retseptlar Ro'yxati Komponentasi)

import React, { useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { db, app } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import RecipeCard from "../components/ui/RecipeCard";
import { Filter, Search, ChefHat, Crown, Sparkles } from "lucide-react";

// Firebase Auth obyektini yaratish
const auth = getAuth(app);

const Recipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, premium, free
  const [sortBy, setSortBy] = useState("newest"); // newest, popular, rating

  // 🔥 Autentifikatsiya holatini yuklash
  const [user, loadingAuth] = useAuthState(auth);
  const currentUserId = user ? user.uid : null;

  // 🔥 Retseptlarni Firestoredan yuklash funksiyasi
  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    setError(null);
    try {
      const recipesCollectionRef = collection(db, "recipes");
      const snapshot = await getDocs(recipesCollectionRef);

      const recipesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        likesCount: doc.data().likesCount || 0,
        averageRating: doc.data().averageRating || 0,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      // Faqat tasdiqlangan (approved) retseptlarni ko'rsatish
      const approvedRecipes = recipesList.filter((r) => r.isApproved !== false);
      setRecipes(approvedRecipes);
      setFilteredRecipes(approvedRecipes);
    } catch (err) {
      console.error("Retseptlarni yuklashda xato:", err);
      setError("Retseptlarni yuklashda xato yuz berdi. Konsolni tekshiring.");
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  // Filtr va qidiruvni qo'llash
  useEffect(() => {
    let result = recipes;

    // Filtr turi bo'yicha
    if (filterType === "premium") {
      result = result.filter((recipe) => recipe.isPremium === true);
    } else if (filterType === "free") {
      result = result.filter((recipe) => !recipe.isPremium);
    }

    // Qidiruv bo'yicha
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(term) ||
          recipe.description?.toLowerCase().includes(term) ||
          recipe.ingredients?.some((ing) => ing.toLowerCase().includes(term))
      );
    }

    // Saralash bo'yicha
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.likesCount || 0) - (a.likesCount || 0);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredRecipes(result);
  }, [recipes, searchTerm, filterType, sortBy]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Batafsil ko'rish funksiyasi
  const handleViewDetails = (recipe) => {
    console.log("Batafsil ko'rish:", recipe.name, "ID:", recipe.id);
    // navigate(`/recipe/${recipe.id}`);
  };

  // Statistika hisoblash
  const stats = {
    total: recipes.length,
    premium: recipes.filter((r) => r.isPremium).length,
    free: recipes.filter((r) => !r.isPremium).length,
  };

  // Autentifikatsiya yoki retseptlar yuklanayotganini ko'rsatish
  if (loadingAuth || loadingRecipes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-semibold">
            Retseptlar yuklanmoqda...
          </p>
          <p className="text-gray-500 mt-2">Iltimos kuting</p>
        </div>
      </div>
    );
  }

  // Xato bo'lsa xabarni ko'rsatish
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Xato yuz berdi
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecipes}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4">
        {/* Sarlavha va Statistika */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Barcha Retseptlar
            </h1>
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turli xil taomlar retseptlari - oddiy va premium kontentlar
          </p>
        </div>

        {/* Statistika Kartalari */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600 font-medium">Jami Retseptlar</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats.premium}
            </h3>
            <p className="text-gray-600 font-medium">Premium Retseptlar</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ChefHat className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.free}</h3>
            <p className="text-gray-600 font-medium">Bepul Retseptlar</p>
          </div>
        </div>

        {/* Filtr va Qidiruv Paneli */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Qidiruv */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Retsept nomi, ingredientlar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Filtrlar */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Retsept Turi Filtr */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                >
                  <option value="all">Barcha Retseptlar</option>
                  <option value="premium">Premium</option>
                  <option value="free">Bepul</option>
                </select>
              </div>

              {/* Saralash */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="newest">Yangi</option>
                <option value="popular">Mashhur</option>
                <option value="rating">Reyting</option>
              </select>
            </div>
          </div>

          {/* Aktiv Filtrlar Ko'rsatkichlari */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                Qidiruv: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            )}
            {filterType !== "all" && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                {filterType === "premium" ? "Premium" : "Bepul"}
                <button
                  onClick={() => setFilterType("all")}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Retseptlar Ro'yxati */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Retseptlar topilmadi
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== "all"
                ? "Qidiruv shartlariga mos retseptlar topilmadi. Filtrlarni o'zgartirib ko'ring."
                : "Hozircha tasdiqlangan retseptlar mavjud emas."}
            </p>
            {(searchTerm || filterType !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Barcha Retseptlarni Ko'rish
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Natijalar Soni */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600 font-medium">
                Topildi:{" "}
                <span className="text-green-600 font-bold">
                  {filteredRecipes.length}
                </span>{" "}
                ta retsept
              </p>
              <p className="text-sm text-gray-500">
                {filterType === "all"
                  ? "Barcha retseptlar"
                  : filterType === "premium"
                  ? "Premium retseptlar"
                  : "Bepul retseptlar"}
              </p>
            </div>

            {/* Retseptlar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onViewDetails={handleViewDetails}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Recipes;
