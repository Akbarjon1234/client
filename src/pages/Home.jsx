import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Loader2,
  AlertTriangle,
  Sparkles,
  ChefHat,
  Trash2,
  Zap,
  Plus,
  List,
  Search,
  X,
  BookOpen,
  Volume2,
} from "lucide-react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

// 🛑 MUHIM: Bu yerga o'zingizning TO'G'RI OpenRouter API kalitingizni kiriting!
const OPENROUTER_API_KEY =
  "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";

// Rasmlar uchun Google Search API chaqiruvi simulyatsiyasi:
const searchForImage = async (query) => {
  // 💡 DIQQAT: Bu haqiqiy rasm qidirish emas, faqat demo uchun rasm URL'larini qaytaradi.
  const defaultImage =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  const q = query.toLowerCase();

  if (q.includes("kartoshka") || q.includes("qovurma")) {
    return "https://images.unsplash.com/photo-1518977676601-d76b768197cb?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  }
  if (q.includes("tovuq") || q.includes("gosht") || q.includes("kabob")) {
    return "https://images.unsplash.com/photo-1594220790209-b68420958742?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  }
  if (q.includes("somsa") || q.includes("xamir") || q.includes("pirogi")) {
    return "https://images.unsplash.com/photo-1558234850-d47714856b7c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  }
  if (q.includes("palov") || q.includes("guruch") || q.includes("osh")) {
    return "https://images.unsplash.com/photo-1626082895697-b1a73221b250?q=80&w=1924&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  }

  return defaultImage;
};

export default function Home() {
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [limit, setLimit] = useState(0);
  const [error, setError] = useState("");

  const LIMIT_COUNT = 5; // 🔄 Premium holatini va limitni boshqarish

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    const savedLimit = localStorage.getItem("aiLimit");
    const lastReset = localStorage.getItem("lastResetDate");
    const today = new Date().toLocaleDateString();

    if (lastReset !== today) {
      setLimit(0);
      localStorage.setItem("aiLimit", "0");
      localStorage.setItem("lastResetDate", today);
    } else if (savedLimit) {
      setLimit(Number(savedLimit));
    }

    if (user) {
      const checkPremium = async () => {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            const premium = data.isPremium || false;
            setIsPremium(premium);

            if (premium) {
              setLimit(0);
              localStorage.setItem("aiLimit", "0");
            }
          }
        } catch (err) {
          console.error("Premium tekshirishda xato:", err);
        } finally {
          setIsAuthLoading(false);
        }
      };
      checkPremium();
    } else {
      setIsAuthLoading(false);
      setIsPremium(false);
    }
  }, []);

  // ➕ Ingredient qo'shish funksiyasi
  const addIngredient = () => {
    const item = currentInput.trim();
    if (item && !ingredients.includes(item)) {
      setIngredients([...ingredients, item]);
      setCurrentInput("");
    }
  };

  // ❌ Ingredient o'chirish funksiyasi
  const removeIngredient = (itemToRemove) => {
    setIngredients(ingredients.filter((item) => item !== itemToRemove));
  };

  // 🎤 Ovozli kirish
  const handleVoiceInput = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Brauzeringiz ovoz tanishni qo'llab-quvvatlamaydi.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "uz-UZ";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setCurrentInput(transcript);
    };

    recognition.start();
  }, []);

  // 🚨 YANGILANGAN FUNKSIYA: AI javobini tahlil qilish
  const parseAndFormatRecipes = async (rawText) => {
    const lines = rawText.split("\n").filter((line) => line.trim() !== "");
    const parsedRecipes = [];
    let currentRecipe = {};
    let recipeCount = 0;

    for (const line of lines) {
      if (line.match(/^\d+\.\s*Taom nomi:\s*(.*)/i)) {
        if (currentRecipe.name) {
          parsedRecipes.push({ ...currentRecipe, id: `recipe-${recipeCount}` });
        }
        recipeCount++;
        currentRecipe = {
          id: `recipe-${recipeCount}`,
          name: line.match(/^\d+\.\s*Taom nomi:\s*(.*)/i)[1].trim(),
          description: "",
          details: "",
          imageQuery: "",
        };
      } else if (line.match(/Qisqacha ta'rif:\s*(.*)/i) && currentRecipe.name) {
        currentRecipe.description = line
          .match(/Qisqacha ta'rif:\s*(.*)/i)[1]
          .trim();
      } else if (line.match(/Usuli:\s*(.*)/i) && currentRecipe.name) {
        currentRecipe.details = line.match(/Usuli:\s*(.*)/i)[1].trim();
        currentRecipe.imageQuery = currentRecipe.name;
      }
    }

    if (
      currentRecipe.name &&
      !parsedRecipes.some((r) => r.name === currentRecipe.name)
    ) {
      parsedRecipes.push(currentRecipe);
    }

    if (parsedRecipes.length === 0 && rawText.length > 50) {
      parsedRecipes.push({
        id: "recipe-fallback",
        name: "AI javobi (Tahlil qilinmadi)",
        description:
          "Tahlil formatiga mos kelmadi. Batafsil ma'lumotni ko'rish uchun bosing.",
        details: rawText,
        imageQuery: ingredients.join(" ") || "ovqat",
      });
    }

    const recipesWithImages = await Promise.all(
      parsedRecipes.map(async (recipe, index) => ({
        ...recipe,
        id: recipe.id || `recipe-${index + 1}`,
        imageUrl: await searchForImage(recipe.imageQuery || recipe.name),
      }))
    );

    return recipesWithImages;
  };

  // 💡 AI javob olish
  const handleSubmit = async () => {
    const combinedInput = ingredients.join(", ");

    if (ingredients.length === 0) {
      setError("Iltimos, ingredient kiriting!");
      return;
    }

    if (!isPremium && limit >= LIMIT_COUNT) {
      setError(`Kunlik limit (${LIMIT_COUNT}) tugagan. Premium oling!`);
      return;
    }

    setError("");
    setLoading(true);
    setRecipes([]);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "SmartChef AI",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "Siz professional oshxona yordamchisiz. Har doim o'zbek tilida, so'rovga javoban faqatgina kiritilgan mahsulotlarga mos keladigan, aniq 5 xil retseptni (Taom nomi, Qisqacha ta'rif, Usuli) quyidagi formatda ro'yxat shaklida qaytaring: {Raqam}. Taom nomi: [Nomi] Qisqacha ta'rif: [Qisqa ta'rif] Usuli: [To'liq tayyorlash usuli].",
              },
              { role: "user", content: combinedInput },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg =
          errJson?.error?.message ||
          `${response.status} ${response.statusText}`;
        if (response.status === 401) {
          throw new Error(
            "API kaliti xato yoki eskirgan. OpenRouter kalitini va billingni tekshiring."
          );
        }
        throw new Error(`AI xato: ${msg}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";

      const parsedRecipes = await parseAndFormatRecipes(rawText);
      setRecipes(parsedRecipes);

      if (!isPremium) {
        const newLimit = limit + 1;
        setLimit(newLimit);
        localStorage.setItem("aiLimit", newLimit);
      }
    } catch (err) {
      console.error("AI xato:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🗣️ Text-to-Speech funksiyasi
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "uz-UZ";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Brauzeringiz ovozli o'qishni qo'llab-quvvatlamaydi.");
    }
  };

  // ➡️ Detail sahifasiga o'tish funksiyasi
  const goToDetails = (recipe) => {
    navigate(`/recipe/${recipe.id}`, { state: { recipe } });
  };

  // 🔁 Limitni test uchun tiklash
  const resetLimit = useCallback(() => {
    localStorage.removeItem("aiLimit");
    localStorage.removeItem("lastResetDate");
    setLimit(0);
    setError("");
    alert("Limit qayta tiklandi!");
  }, []);

  // 🗑️ Inputlarni tozalash
  const clearInputs = () => {
    setIngredients([]);
    setCurrentInput("");
    setRecipes([]);
    setError("");
  };

  const isSubmitDisabled =
    loading ||
    isAuthLoading ||
    (!isPremium && limit >= LIMIT_COUNT) ||
    ingredients.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
      {/* HEADER SECTION */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="bg-white/90 backdrop-blur-md rounded-3xl py-8 shadow-2xl border border-green-100">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 flex justify-center items-center gap-3 mb-4">
              <Sparkles className="w-10 h-10 text-green-500 animate-bounce" />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                SmartChef
              </span>
              <span className="text-green-400">AI</span>
            </h1>
            <p className="text-xl text-gray-700 mt-3 max-w-3xl mx-auto font-light">
              Muzlatgichdagi bor narsalaringizni kiriting — biz siz uchun **5 ta
              noyob retseptni** yaratib beramiz! 💡
            </p>
          </div>
        </div>
      </motion.header>

      {/* LIMIT & PREMIUM STATUS */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-green-200">
          {isAuthLoading ? (
            <div className="text-gray-500 flex items-center gap-2">
              <Loader2 className="animate-spin w-4 h-4" />
              Yuklanmoqda...
            </div>
          ) : isPremium ? (
            <div className="flex items-center gap-2 text-amber-600 font-bold">
              <Zap className="w-5 h-5" />
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                PREMIUM OBUNA - CHEKSIZ QIDIRUV
              </span>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-green-700 font-medium text-lg">
                Bepul qidiruv limiti:{" "}
                <span className="font-bold text-green-600">
                  {limit} / {LIMIT_COUNT}
                </span>
              </div>
              {limit >= LIMIT_COUNT && (
                <div className="text-red-500 text-sm font-medium mt-1">
                  • LIMIT TUGADI
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN INPUT SECTION */}
      <div className="bg-white max-w-3xl mx-auto p-8 rounded-3xl shadow-2xl border-2 border-green-300 mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-green-500" />
          Ingredientlaringizni kiriting:
        </h2>

        {/* Ingredient kiritish maydoni */}
        <div className="flex items-center border-2 border-green-200 rounded-xl p-3 mb-4 shadow-sm bg-green-50/50">
          <List className="w-6 h-6 text-green-600 mr-3" />
          <input
            type="text"
            className="flex-1 text-lg outline-none bg-transparent placeholder-green-700/60"
            placeholder="Masalan: Tovuq, Kartoshka, Piyoz..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIngredient()}
          />
          <button
            onClick={addIngredient}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={!currentInput.trim()}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Tanlangan ingredientlar */}
        <div className="flex flex-wrap gap-2 mb-6 min-h-[50px] border-2 border-dashed border-green-200 rounded-xl p-3 bg-green-50/30">
          {ingredients.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center bg-green-500 text-white font-semibold py-2 px-4 rounded-full shadow-md"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                className="ml-2 text-white hover:text-green-100 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
          {ingredients.length === 0 && (
            <div className="text-green-600/60 text-sm italic">
              Ingredientlar shu yerda ko'rinadi...
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" />
                <span className="text-lg">Retsept yaratilmoqda...</span>
              </>
            ) : (
              <>
                <ChefHat className="w-6 h-6" />
                <span className="text-lg">
                  {ingredients.length > 0
                    ? `${ingredients.length} ta ingredient asosida retsept yaratish`
                    : "Retsept yaratish"}
                </span>
              </>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleVoiceInput}
              disabled={loading}
              className={`w-14 h-14 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-4 ring-red-300"
                  : "bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700"
              }`}
              title="Ovozli kiritish"
            >
              <Mic size={20} />
            </button>

            <button
              onClick={clearInputs}
              disabled={loading || ingredients.length === 0}
              className="w-14 h-14 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-all duration-300 flex items-center justify-center shadow-lg disabled:opacity-50"
              title="Barcha ingredientlarni tozalash"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-lg flex items-center gap-3 shadow-md"
          >
            <AlertTriangle size={24} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </div>

      {/* RECIPES OUTPUT SECTION */}
      {recipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto mt-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center border-b-2 border-green-300 pb-4">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ✨ Topilgan Retseptlar
            </span>
            <span className="text-green-500 ml-3">({recipes.length} ta)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-xl border border-green-100 transition-all duration-300 hover:shadow-2xl hover:border-green-400 group cursor-pointer"
                onClick={() => goToDetails(recipe)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.name}
                    className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                    }}
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {recipe.dishType || "Taom"}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {recipe.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {recipe.description}
                  </p>

                  <div className="flex justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(recipe.name + ". " + recipe.description);
                      }}
                      className="flex-1 flex items-center justify-center bg-emerald-50 text-emerald-600 font-medium py-2 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
                    >
                      <Volume2 size={16} className="mr-2" />
                      Eshitish
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToDetails(recipe);
                      }}
                      className="flex-1 flex items-center justify-center bg-green-500 text-white font-medium py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <BookOpen size={16} className="mr-2" />
                      Batafsil
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TEST RESET BUTTON */}
      {!isPremium && process.env.NODE_ENV === "development" && (
        <div className="flex justify-center mt-8">
          <button
            onClick={resetLimit}
            className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
          >
            Limitni qayta tiklash (test)
          </button>
        </div>
      )}
    </div>
  );
}
