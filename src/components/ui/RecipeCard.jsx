// src/components/ui/RecipeCard.jsx

import React, { useState, useEffect } from "react";
import {
  Star,
  Lock,
  Heart,
  Clock,
  Eye,
  ChefHat,
  X,
  Clock4,
  Users,
  Flame,
  ChefHat as ChefIcon,
} from "lucide-react";
import { db } from "../../firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  runTransaction,
} from "firebase/firestore";

/**
 * Retsept kartochkasi komponenti.
 * Premium cheklovini isPremium va isPremiumUser prop-lari orqali boshqaradi.
 */
const RecipeCard = ({
  recipe,
  onViewDetails,
  currentUserId,
  isPremiumUser = false, // Bu prop MUHIM! Foydalanuvchi obunachi bo'lsa, uni TRUE yuboring.
}) => {
  // Retsept nomini to'g'ri aniqlash
  const recipeName = recipe.name || recipe.title || "Noma'lum Retsept";
  const {
    id,
    imageUrl,
    totalTime,
    isPremium, // Retsept premium ekanligini bildiradi (true/false)
    averageRating,
    likesCount,
    description,
    fullContent,
    ingredients,
    difficulty,
    servings,
    calories,
  } = recipe;

  // Local state
  const [localIsLiked, setLocalIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount || 0);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState(null);

  // AI tomonidan ma'lumotlarni generatsiya qilish (O'zgartirishsiz qoldi)
  const generateAIData = (recipeData) => {
    const recipeName = recipeData.name || recipeData.title || "";
    const ingredients = recipeData.ingredients || "";
    const description = recipeData.description || "";

    // Ingredientlar asosida kaloriyani hisoblash
    const calculateCalories = () => {
      const ingStr = ingredients.toLowerCase();
      let baseCalories = 250;

      if (
        ingStr.includes("go'sht") ||
        ingStr.includes("mol") ||
        ingStr.includes("qo'y")
      )
        baseCalories += 150;
      if (ingStr.includes("tovuq") || ingStr.includes("kurka"))
        baseCalories += 100;
      if (ingStr.includes("baliq") || ingStr.includes("losos"))
        baseCalories += 80;
      if (
        ingStr.includes("sabzi") ||
        ingStr.includes("kartoshka") ||
        ingStr.includes("piyoz")
      )
        baseCalories += 50;
      if (
        ingStr.includes("yog'") ||
        ingStr.includes("saryog'") ||
        ingStr.includes("mayonez")
      )
        baseCalories += 120;
      if (
        ingStr.includes("shakar") ||
        ingStr.includes("asal") ||
        ingStr.includes("qand")
      )
        baseCalories += 100;
      if (ingStr.includes("pishloq") || ingStr.includes("sir"))
        baseCalories += 90;
      if (ingStr.includes("sut") || ingStr.includes("yogurt"))
        baseCalories += 60;
      if (
        ingStr.includes("yangi") ||
        ingStr.includes("salat") ||
        ingStr.includes("sabzavot")
      )
        baseCalories -= 30;

      return Math.max(150, baseCalories);
    };

    // Retsept nomi va tavsifiga qarab murakkablikni aniqlash
    const calculateDifficulty = () => {
      const text = (recipeName + " " + description).toLowerCase();
      if (
        text.includes("oddiy") ||
        text.includes("oson") ||
        text.includes("tez") ||
        text.includes("5 daqiqa") ||
        text.includes("10 daqiqa")
      ) {
        return "Oson";
      } else if (
        text.includes("murakkab") ||
        text.includes("qiyin") ||
        text.includes("maxsus") ||
        text.includes("chef")
      ) {
        return "Qiyin";
      } else {
        return "O'rta";
      }
    };

    // Tayyorlash vaqti
    const calculatePrepTime = () => {
      if (totalTime) return totalTime;

      const text = (recipeName + " " + description).toLowerCase();
      if (
        text.includes("tez") ||
        text.includes("5 daqiqa") ||
        text.includes("10 daqiqa")
      )
        return 15;
      if (text.includes("30 daqiqa") || text.includes("yarim soat")) return 30;
      if (text.includes("soat") || text.includes("1 soat")) return 60;
      if (text.includes("2 soat")) return 120;

      return 45; // default
    };

    // Portsiya
    const calculateServings = () => {
      if (servings) return servings;
      return 4; // default
    };

    // Qo'shimcha nutrition ma'lumotlari
    const calculateNutrition = () => {
      const ingStr = ingredients.toLowerCase();
      let protein = 8,
        carbs = 25,
        fat = 12;

      if (
        ingStr.includes("go'sht") ||
        ingStr.includes("tovuq") ||
        ingStr.includes("baliq")
      )
        protein += 15;
      if (
        ingStr.includes("kartoshka") ||
        ingStr.includes("guruch") ||
        ingStr.includes("makaron")
      )
        carbs += 20;
      if (
        ingStr.includes("yog'") ||
        ingStr.includes("saryog'") ||
        ingStr.includes("yog'li")
      )
        fat += 8;
      if (ingStr.includes("sabzavot") || ingStr.includes("salat")) {
        carbs -= 5;
        protein += 2;
      }

      return { protein, carbs, fat };
    };

    // Retsept turi
    const determineCategory = () => {
      const text = (recipeName + " " + description).toLowerCase();
      if (text.includes("sho'rva") || text.includes("supa")) return "Sho'rva";
      if (text.includes("salat") || text.includes("salad")) return "Salat";
      if (
        text.includes("desert") ||
        text.includes("shirinlik") ||
        text.includes("tort")
      )
        return "Desert";
      if (
        text.includes("ichimlik") ||
        text.includes("sok") ||
        text.includes("kokteyl")
      )
        return "Ichimlik";
      if (
        text.includes("non") ||
        text.includes("bulochka") ||
        text.includes("pirog")
      )
        return "Non mahsuloti";
      return "Asosiy taom";
    };

    return {
      calories: calculateCalories(),
      difficulty: calculateDifficulty(),
      prepTime: calculatePrepTime(),
      servings: calculateServings(),
      nutrition: calculateNutrition(),
      category: determineCategory(),
      isHealthy:
        calculateCalories() < 400 &&
        (description.toLowerCase().includes("sog'lom") ||
          ingredients.toLowerCase().includes("sabzavot")),
    };
  };

  // Foydalanuvchi interaktsiyalarini va AI ma'lumotlarini yuklash
  useEffect(() => {
    const loadUserInteractions = async () => {
      if (!currentUserId) return;

      try {
        const recipeDoc = await getDoc(doc(db, "recipes", id));
        if (recipeDoc.exists()) {
          const recipeData = recipeDoc.data();
          const likedBy = recipeData.likedBy || [];
          setLocalIsLiked(likedBy.includes(currentUserId));
          setLocalLikesCount(recipeData.likesCount || 0);
        }
      } catch (error) {
        console.error(
          "Foydalanuvchi interaktsiyalarini yuklashda xato:",
          error
        );
      }
    };

    const aiData = generateAIData(recipe);
    setAiGeneratedData(aiData);

    loadUserInteractions();
  }, [id, currentUserId, recipe]); // Like/Unlike qilish

  // Like/Unlike qilish
  // src/components/ui/RecipeCard.jsx (handleLikeClick funksiyasi joylashgan qism)

  const handleLikeClick = async () => {
    if (!currentUserId) {
      alert("Iltimos, avval tizimga kiring!");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const recipeRef = doc(db, "recipes", id);
      const analyticsRef = doc(db, "recipeAnalytics", id); // Analytics hujjatiga havola

      const isLiking = !localIsLiked;
      const likeChange = isLiking ? 1 : -1;

      // 🔥 Tranzaksiya: Ikkala hujjatni bir vaqtda yangilash 🔥
      await runTransaction(db, async (transaction) => {
        // 1. Recipe hujjatini o'zgartirish
        transaction.update(recipeRef, {
          likedBy: isLiking
            ? arrayUnion(currentUserId)
            : arrayRemove(currentUserId),
          likesCount: increment(likeChange),
        }); // 2. Analytics hujjatini o'zgartirish.

        // Agar analytics hujjati mavjud bo'lmasa, uni yaratish uchun transaction.set(..., { merge: true }) ishlatamiz.
        transaction.set(
          analyticsRef,
          {
            recipeName: recipeName,
            likesCount: increment(likeChange),
            lastUpdated: new Date(),
          },
          { merge: true }
        );
      }); // UI ni yangilash faqat tranzaksiya muvaffaqiyatli o'tgandan so'ng

      setLocalIsLiked(isLiking);
      setLocalLikesCount((prev) => prev + likeChange);
    } catch (error) {
      console.error(
        "Like qilishda xato yuz berdi (Transaction Failed):",
        error
      );
      alert(
        "Like qilishda xato yuz berdi. Iltimos, qayta urinib ko'ring yoki Adminlarga xabar bering."
      );
    } finally {
      setLoading(false);
    }
  };

  // Retsept detallarini ko'rish (PREMIUM CHEKLOV ASOSIY JOYI)
  const handleViewDetails = (e) => {
    e.stopPropagation();

    // Premium retseptni tekshirish
    if (isPremium && !isPremiumUser) {
      alert(
        "Bu retsept PREMIUM hisoblanadi. Uni ko'rish uchun obuna bo'lishingiz kerak!"
      );
      // Agar 'onViewDetails' prop-i berilgan bo'lsa, u yerda obuna sahifasiga yo'naltirish mumkin
      if (onViewDetails) {
        onViewDetails(recipe, true); // True - obuna kerakligini bildiradi
      }
      return;
    }

    // Agar obunachi bo'lsa yoki retsept premium bo'lmasa, modal ochiladi
    setIsModalOpen(true);
    if (onViewDetails) {
      onViewDetails(recipe, false);
    }
  };

  // Modalni yopish
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Ingredientlar satrini massivga formatlash
  const formatIngredients = (ingredientsString) => {
    if (!ingredientsString) return [];
    return ingredientsString
      .split(",")
      .map((ing) => ing.trim())
      .filter((ing) => ing);
  };

  // Tayyorlash bosqichlarini formatlash
  const formatCookingSteps = (content) => {
    if (!content) return [];
    // Yangi qatorlar bo'yicha ajratish
    return content
      .split("\n")
      .filter((step) => step.trim())
      .map((step) => step.trim());
  };

  const ingredientsList = formatIngredients(ingredients);
  const cookingSteps = formatCookingSteps(fullContent);

  // Retseptni ko'rish tugmasi holati va matnini aniqlash
  const isViewButtonDisabled = isPremium && !isPremiumUser;
  const viewButtonText = isViewButtonDisabled
    ? "Premium Obuna Kerak"
    : "Retseptni Ko'rish";

  return (
    <>
      <div className="group relative bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer border border-gray-100/50 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] hover:border-green-200/50">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent"></div>
          </div>
        )}

        {/* Rasm qismi */}
        <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          {/* Skeleton loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"></div>
          )}

          <img
            src={
              imageUrl ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=256&fit=crop"
            }
            alt={recipeName}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=256&fit=crop";
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

          {/* Premium Badge - QULF FAQAT PREMIUM VA OBUNA YO'Q BO'LGANDA KO'RINSIN */}
          {isPremium && !isPremiumUser && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center shadow-2xl z-10 transform group-hover:scale-105 transition-transform duration-300">
              <Lock className="w-3 h-3 mr-2" />
              PREMIUM
            </div>
          )}

          {/* AI Generated Badges */}
          {aiGeneratedData && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {aiGeneratedData.isHealthy && (
                <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                  SOG'LOM
                </div>
              )}
              <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-lg">
                {aiGeneratedData.category}
              </div>
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute top-16 left-4 flex gap-2 z-10">
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLikeClick();
              }}
              disabled={loading}
              className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 transform ${
                localIsLiked
                  ? "bg-red-500/90 text-white scale-110 shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-110"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  localIsLiked ? "fill-white" : ""
                }`}
              />
            </button>
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
            {/* Time */}
            <div className="flex items-center text-white font-semibold bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {aiGeneratedData?.prepTime || totalTime || "N/A"} min
              </span>
            </div>

            {/* Likes Count */}
            <div className="flex items-center text-white font-semibold bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
              <Heart
                className={`w-4 h-4 mr-2 ${localIsLiked ? "fill-white" : ""}`}
              />
              <span className="text-sm">{localLikesCount}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4 bg-gradient-to-b from-white to-gray-50/50">
          {/* Title and Description */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-green-700 transition-colors duration-300">
              {recipeName}
            </h3>

            {description && (
              <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* AI Generated Info */}
          {aiGeneratedData && (
            <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
              <div className="flex items-center">
                <Flame className="w-3 h-3 mr-1 text-orange-500" />
                {aiGeneratedData.calories} kal
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-1 text-blue-500" />
                {aiGeneratedData.servings} kishi
              </div>
              <div className="flex items-center">
                <ChefHat className="w-3 h-3 mr-1 text-purple-500" />
                {aiGeneratedData.difficulty}
              </div>
            </div>
          )}

          {/* Main Action Button - SHARTLI MATN VA O'CHIRISH HOLATI */}
          <button
            onClick={handleViewDetails}
            disabled={isViewButtonDisabled}
            className={`w-full py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-lg active:scale-[0.98] active:shadow-none group/btn relative overflow-hidden
							${
                isViewButtonDisabled
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed shadow-gray-200/50" // Premium bo'lmaganlar uchun
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-200/50 hover:shadow-xl hover:shadow-green-300/50" // Oddiy
              }`}
          >
            <span className="relative flex items-center justify-center gap-2 text-white">
              {isPremium && !isPremiumUser ? (
                <>
                  <Lock className="w-4 h-4" />
                  {viewButtonText}
                </>
              ) : (
                <>
                  {viewButtonText}
                  <Eye className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110" />
                </>
              )}
            </span>
          </button>

          {/* Premium Features Hint - FAQAT OBUNA YO'Q BO'LGANLAR UCHUN KO'RINSIN */}
          {isPremium && !isPremiumUser && (
            <div className="text-xs text-amber-700 text-center bg-amber-50/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-200/50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Premium retsept - Maxsus kontent
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-green-200/30 transition-all duration-500 pointer-events-none" />
      </div>

      {/* Recipe Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="relative p-6 pb-0 flex items-start gap-4 flex-shrink-0">
              {/* Kichik rasm */}
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                <img
                  src={
                    imageUrl ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop"
                  }
                  alt={recipeName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop";
                  }}
                />

                {/* Premium Badge - Modal kichik rasm ustida */}
                {isPremium && (
                  <div className="absolute top-1 right-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                    {/* Qulf faqat obunachi bo'lmaganlarga ko'rinadi */}
                    {!isPremiumUser && <Lock className="w-2 h-2 mr-1" />}
                    PREMIUM
                  </div>
                )}
              </div>

              {/* Title va asosiy ma'lumotlar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 truncate pr-8">
                    {recipeName}
                  </h1>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseModal}
                    className="flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg -mt-2 -mr-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Generated Badges */}
                {aiGeneratedData && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {aiGeneratedData.isHealthy && (
                      <div className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                        🥗 Sog'lom tanlov
                      </div>
                    )}
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">
                      {aiGeneratedData.category}
                    </div>
                  </div>
                )}

                {/* Stats Grid - AI ma'lumotlari bilan */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg">
                    <Clock4 className="w-4 h-4 text-green-600 mb-1" />
                    <div className="font-semibold text-xs">
                      {aiGeneratedData?.prepTime || totalTime || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">min</div>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="font-semibold text-xs">
                      {aiGeneratedData?.servings || servings || "4"}
                    </div>
                    <div className="text-xs text-gray-500">kishi</div>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg">
                    <Flame className="w-4 h-4 text-red-600 mb-1" />
                    <div className="font-semibold text-xs">
                      {aiGeneratedData?.calories || calories || "250"}
                    </div>
                    <div className="text-xs text-gray-500">kal</div>
                  </div>

                  <div className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-lg">
                    <ChefIcon className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="font-semibold text-xs text-center leading-tight">
                      {aiGeneratedData?.difficulty || difficulty || "O'rta"}
                    </div>
                    <div className="text-xs text-gray-500">daraja</div>
                  </div>
                </div>

                {/* Nutrition Info */}
                {aiGeneratedData?.nutrition && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg mb-3 border border-green-200">
                    <div className="flex justify-between text-xs">
                      <div className="text-center">
                        <div className="font-bold text-green-700">
                          {aiGeneratedData.nutrition.protein}g
                        </div>
                        <div className="text-gray-600">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-700">
                          {aiGeneratedData.nutrition.carbs}g
                        </div>
                        <div className="text-gray-600">Karbohidrat</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-700">
                          {aiGeneratedData.nutrition.fat}g
                        </div>
                        <div className="text-gray-600">Yog'</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Content - PREMIUM CHEKLOVI */}
            {/* Obunachi bo'lmasa qulflangan sahifani ko'rsatish */}
            {isPremium && !isPremiumUser ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50/50">
                <Lock className="w-16 h-16 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Premium Kirish Kerak
                </h2>
                <p className="text-center text-gray-600 mb-6 max-w-sm">
                  Ushbu maxsus retseptning to'liq ma'lumotlari faqat premium
                  obunachilar uchun mavjud. Iltimos, obuna bo'lish sahifasiga
                  o'ting.
                </p>
                <button
                  onClick={handleCloseModal} // Bu faqat modalni yopadi, obuna sahifasiga o'tishni o'zingiz qo'shing
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-lg"
                >
                  Obuna Bo'lish Sahifasiga O'tish
                </button>
              </div>
            ) : (
              // ASOSIY KONTENT: Obunachilar va oddiy retseptlar uchun
              <div className="p-6 overflow-y-auto flex-1">
                {/* Ingredients Section */}
                {ingredientsList.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <ChefHat className="w-5 h-5 mr-2 text-green-600" />
                      Ingredientlar
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ingredientsList.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          <span className="text-gray-700 text-sm">
                            {ingredient}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cooking Steps Section */}
                {cookingSteps.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-green-600" />
                      Tayyorlash Bosqichlari
                    </h2>
                    <div className="space-y-3">
                      {cookingSteps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start p-3 bg-white border border-gray-200 rounded-xl hover:border-green-300 transition-colors"
                        >
                          <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs mr-3 mt-1">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {ingredientsList.length === 0 && cookingSteps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ChefHat className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base">
                      Bu retsept uchun hali ma'lumotlar kiritilmagan
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <button
                    onClick={handleLikeClick}
                    disabled={loading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      localIsLiked
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        localIsLiked ? "fill-red-600" : ""
                      }`}
                    />
                    <span className="text-sm">{localLikesCount}</span>
                  </button>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecipeCard;
