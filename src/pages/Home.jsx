import React, { useState, useEffect, useRef } from "react";
import IngredientInput from "../components/ai/IngredientInput";
import {
  Sparkles,
  ChefHat,
  Loader2,
  Mic,
  StopCircle,
  Volume2,
  Crown,
  Shield,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_KEY;

// SpeechRecognition va Synthesis funksiyalari o'zgarishsiz qoldi
const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  try {
    const instance = new SpeechRecognition();
    instance.continuous = false;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.lang = "uz-UZ";
    return instance;
  } catch (err) {
    console.warn("SpeechRecognition create error:", err);
    return null;
  }
};

const getSpeechSynthesis = () => {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
};

// Premium holatini localStorage'dan olish funksiyasi
const getPremiumStatus = () => {
  if (typeof window === "undefined") return false;
  // Boshlanishda False qilib qo'yishni istasangiz, quyidagi qatorni faqat bir marta ishga tushiring:
  // localStorage.removeItem("smartchef_premium");
  const saved = localStorage.getItem("smartchef_premium");
  // Agar 'smartchef_premium' yo'q bo'lsa, yoki noto'g'ri qiymat bo'lsa, 'false' qaytarish.
  return saved ? JSON.parse(saved) : false;
};

// Kunlik limitlar uchun funksiyalar (o'zgarishsiz, lekin ishlashi uchun to'g'ri)
const getDailyLimits = () => {
  if (typeof window === "undefined")
    return { search: 0, voiceInput: 0, date: "" };

  const saved = localStorage.getItem("smartchef_daily_limits");
  const today = new Date().toDateString();

  if (saved) {
    const limits = JSON.parse(saved);
    // Agar bugun saqlangan sana bo'lsa, eski ma'lumotlarni qaytar
    if (limits.date === today) {
      return limits;
    }
  }

  // Yangi kun bo'lsa, limitlarni yangilash (0 ga)
  return { search: 0, voiceInput: 0, date: today };
};

const getSearchCount = () => {
  const limits = getDailyLimits();
  return limits.search;
};

const getVoiceInputCount = () => {
  const limits = getDailyLimits();
  return limits.voiceInput;
};

const FOOD_IMAGES = {
  // ... rasm ma'lumotlari o'zgarishsiz ...
  palov:
    "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&h=600&fit=crop",
  "sho'rva":
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop",
  mastava:
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop",
  "lag'mon":
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop",
  somsa:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop",
  shashlik:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
  chuchvara:
    "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop",
  manti:
    "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&h=600&fit=crop",
  norin:
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop",
  dimlama:
    "https://images.unsplash.com/photo-1552611052-33b04e97068e?w=800&h=600&fit=crop",
  qovurma:
    "https://images.unsplash.com/photo-1552611052-33b04e97068e?w=800&h=600&fit=crop",
  kabob:
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
  salat:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
  shirinlik:
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop",
  tort: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop",
  pishiriq:
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop",
  nonushta:
    "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop",
  osh: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=800&h=600&fit=crop",
  default:
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=600&fit=crop",
};

const Home = () => {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  // MUHIM: isPremium qiymati to'g'ri olinadi
  const [isPremium, setIsPremium] = useState(getPremiumStatus());
  const [searchCount, setSearchCount] = useState(getSearchCount());
  const [voiceInputCount, setVoiceInputCount] = useState(getVoiceInputCount());
  const [isListening, setIsListening] = useState(false);
  const [speechSupport, setSpeechSupport] = useState({
    recognition: false,
    synthesis: false,
  });
  const navigate = useNavigate();

  const isRequestingPermission = useRef(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // ⭐️⭐️ YORDAMCHI FUNKSIYA: PREMIUM HOLATINI O'ZGARTIRISH ⭐️⭐️
  const togglePremiumStatus = () => {
    const newStatus = !isPremium;
    setIsPremium(newStatus);
    // localStorage'da ham yangilash
    localStorage.setItem("smartchef_premium", JSON.stringify(newStatus));

    // Agar premium holatga o'tkazilsa, limitlarni nolga tushiramiz
    if (newStatus) {
      setSearchCount(0);
      setVoiceInputCount(0);
      // localStorage'dagi limitlarni ham tozalash
      const limits = getDailyLimits();
      limits.search = 0;
      limits.voiceInput = 0;
      localStorage.setItem("smartchef_daily_limits", JSON.stringify(limits));
    }

    alert(
      `Premium holati: ${
        newStatus ? "FAOL" : "OʻCHIRILDI"
      }. Limitlar qayta tiklandi.`
    );
    console.log("👑 Premium holati yangilandi:", newStatus);
  };

  // Kunlik limitlarni yangilash - FAKAT PREMIUM BO'LMAGANLAR UCHUN
  const updateDailyLimits = (type) => {
    // Agar premium bo'lsa, limitlarni hisoblamaymiz
    if (isPremium) {
      console.log("👑 Premium foydalanuvchi - limit hisoblanmaydi");
      return;
    }

    const limits = getDailyLimits();
    const today = new Date().toDateString();

    // Yangi kun bo'lsa, limitlarni yangilash
    if (limits.date !== today) {
      limits.search = 0;
      limits.voiceInput = 0;
      limits.date = today;
      setSearchCount(0);
      setVoiceInputCount(0);
    }

    // Limitlarni oshirish
    if (type === "search") {
      limits.search += 1;
      setSearchCount(limits.search);
    } else if (type === "voiceInput") {
      limits.voiceInput += 1;
      setVoiceInputCount(limits.voiceInput);
    }

    localStorage.setItem("smartchef_daily_limits", JSON.stringify(limits));
    console.log(`📊 Limit yangilandi: ${type} - ${limits[type]}`);
  };

  // isPremium o'zgarganda limitlarni sinxronlash
  useEffect(() => {
    // Premium bo'lsa, limitlarni nolga tushirish (agar oldin premium bo'lmagan bo'lsa)
    if (isPremium) {
      setSearchCount(0);
      setVoiceInputCount(0);
    } else {
      // Premium bo'lmasa, limitlarni localStorage'dan qayta yuklash
      const limits = getDailyLimits();
      setSearchCount(limits.search);
      setVoiceInputCount(limits.voiceInput);
    }
  }, [isPremium]);

  // Kunlik limitlarni sahifa yuklanganda tekshirish
  useEffect(() => {
    if (!isPremium) {
      const limits = getDailyLimits();
      setSearchCount(limits.search);
      setVoiceInputCount(limits.voiceInput);
    }
  }, []); // Boshlanishda bir marta ishlaydi

  // Init speech instances on client mount (o'zgarishsiz)
  useEffect(() => {
    recognitionRef.current = getSpeechRecognition();
    synthRef.current = getSpeechSynthesis();

    setSpeechSupport({
      recognition: !!recognitionRef.current,
      synthesis: !!synthRef.current,
    });

    // ... cleanup logikasi ...
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          try {
            recognitionRef.current.stop();
          } catch (e) {}
          recognitionRef.current = null;
        }
      } catch (e) {
        console.warn("Speech cleanup error:", e);
      }

      try {
        if (
          synthRef.current &&
          typeof window !== "undefined" &&
          window.speechSynthesis
        ) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn("Synthesis cleanup error:", e);
      }
    };
  }, []);

  // Ovozli o'qish funksiyalari (o'zgarishsiz)
  const stopSpeaking = () => {
    const synth =
      synthRef.current ||
      (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (synth) {
      synth.cancel();
    }
  };

  const speak = (text) => {
    const synth =
      synthRef.current ||
      (typeof window !== "undefined" ? window.speechSynthesis : null);
    if (!synth || synth.speaking) {
      return;
    }

    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "uz-UZ";
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.text = text;
    try {
      synth.speak(utter);
    } catch (e) {
      console.warn("Synthesis speak error:", e);
    }
  };

  const checkMicrophonePermission = async () => {
    if (isRequestingPermission.current) return true;
    isRequestingPermission.current = true;
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        isRequestingPermission.current = false;
        alert("Brauzer mikrafonni qo'llab-quvvatlamaydi.");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      isRequestingPermission.current = false;
      return true;
    } catch (error) {
      isRequestingPermission.current = false;
      console.error("❌ Mikrafon ruxsati rad etildi:", error);
      if (error.name === "NotAllowedError" || error.name === "SecurityError") {
        alert(
          "Mikrafon ruxsati kerak! Iltimos, brauzer sozlamalaridan mikrafon ruxsatini yoqing va sahifani yangilang."
        );
      } else {
        alert(
          "Mikrafon bilan muammo yuz berdi. Iltimos, qurilmangizni tekshiring."
        );
      }
      return false;
    }
  };

  const startListening = async () => {
    console.log("🎤 Start listening chaqirildi, Premium:", isPremium);

    // Premium bo'lmagan foydalanuvchi uchun OVOZLI KIRITISH LIMITI TEKSHIRUVI
    if (!isPremium && voiceInputCount >= 3) {
      alert(
        "❌ Sizning kunlik ovozli kiritish limitingiz tugadi! Ertangi kunga qaytadan 3 marta foydalana olasiz yoki Premium obuna sotib oling."
      );
      return;
    }

    // Oddiy foydalanuvchilar uchun ovozli kiritish sonini hisoblash VA LIMITNI OSHIRISH
    if (!isPremium) {
      updateDailyLimits("voiceInput");
    }

    // ... Qolgan listening logikasi o'zgarishsiz ...
    if (!recognitionRef.current) {
      recognitionRef.current = getSpeechRecognition();
      setSpeechSupport((s) => ({
        ...s,
        recognition: !!recognitionRef.current,
      }));
    }

    if (!recognitionRef.current) {
      alert(
        "Afsuski, brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Chrome yoki Edge brauzerlaridan foydalaning."
      );
      return;
    }

    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;

    try {
      recognitionRef.current.stop();
    } catch (e) {}

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      console.log("🎤 Speech recognition boshlandi");
    };

    recognitionRef.current.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        const newIngredients = transcript
          .split(/,\s*|\s+va\s+/)
          .filter(Boolean);
        setIngredients((prev) => [...new Set([...prev, ...newIngredients])]);
        setIsListening(false);

        // Muvaffaqiyatli ovozli kiritish haqida xabar (faqat premium uchun ovozli)
        if (isPremium) {
          speak(`Qabul qilindi: ${newIngredients.join(", ")}`);
        } else {
          // Oddiy foydalanuvchilar uchun oddiy xabar
          alert(`Qabul qilindi: ${newIngredients.join(", ")}`);
        }
      } catch (e) {
        console.error("onresult parse error:", e);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("❌ Speech recognition xatosi:", event.error || event);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      console.log("🛑 Speech recognition tugadi");
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("❌ Recognition start xatosi:", error);
      setIsListening(false);
      alert("Ovozli kiritishni boshlashda xato. Qayta urinib ko'ring.");
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } catch (e) {
      console.warn("Stop listening error:", e);
      setIsListening(false);
    }
  };

  const getFoodImage = (recipeName) => {
    const name = recipeName.toLowerCase();
    if (name.includes("palov") || name.includes("osh"))
      return FOOD_IMAGES.palov;
    if (name.includes("sho'rva") || name.includes("shurva"))
      return FOOD_IMAGES["sho'rva"];
    if (name.includes("mastava")) return FOOD_IMAGES.mastava;
    if (name.includes("lag'mon") || name.includes("lagmon"))
      return FOOD_IMAGES["lag'mon"];
    if (name.includes("somsa")) return FOOD_IMAGES.somsa;
    if (name.includes("shashlik") || name.includes("kabob"))
      return FOOD_IMAGES.shashlik;
    if (name.includes("chuchvara") || name.includes("manti"))
      return FOOD_IMAGES.chuchvara;
    if (name.includes("norin")) return FOOD_IMAGES.norin;
    if (name.includes("dimlama") || name.includes("qovurma"))
      return FOOD_IMAGES.dimlama;
    if (name.includes("salat")) return FOOD_IMAGES.salat;
    if (name.includes("shirinlik") || name.includes("tort"))
      return FOOD_IMAGES.shirinlik;
    if (name.includes("nonushta")) return FOOD_IMAGES.nonushta;
    return FOOD_IMAGES.default;
  };

  const generateRecipe = async () => {
    console.log("🔍 Generate recipe chaqirildi, Premium:", isPremium);

    // Premium bo'lmagan foydalanuvchi uchun QIDIRUV LIMITI TEKSHIRUVI
    if (!isPremium && searchCount >= 3) {
      alert(
        "❌ Sizning kunlik qidiruvlar soningiz tugadi! Ertangi kunga qaytadan 3 marta foydalana olasiz yoki Premium obuna sotib oling."
      );
      navigate("/pay"); // Obuna sahifasiga yo'naltirish
      return;
    }

    if (ingredients.length === 0) {
      alert("Avval ingredientlarni kiriting!");
      return;
    }
    if (!OPENROUTER_API_KEY) {
      alert("❌ Xato: OpenRouter API kaliti topilmadi.");
      return;
    }

    setLoading(true);
    setRecipes([]);
    stopSpeaking();

    // Qidiruvlar sonini hisoblash VA LIMITNI OSHIRISH - FAKAT PREMIUM BO'LMAGANLAR UCHUN
    if (!isPremium) {
      updateDailyLimits("search");
    }

    const prompt = `Siz professional oshpaz va oziq-ovqat blogerisiz.
Quyidagi ingredientlar asosida BESH (5) xil kreativ va amaliy retsept yarating:
[${ingredients.join(", ")}].

Natijani JSON formatida emas, balki oddiy matn formatida bering, lekin har bir retseptni alohida ajratuvchi bilan (masalan, "---YANGI-RETSEPT---" belgisi bilan) ajrating.
Har bir retsept uchun quyidagi ma'lumotlarni o'zbek tilida, tartib raqib bilan bering:
1) Retsept nomi (Qisqa va jozibador nom)
2) Taom turi (masalan: asosiy taom, sho'rva, nonushta, shirinlik)
3) Qisqa tavsif (1-2 gap)
4) To'liq Ingredientlar ro'yxati (Kerakli miqdorlar bilan)
5) Bosqichma-bosqich tayyorlash (Kamida 5ta oddiy qadam)`;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `AI bilan aloqa o'rnatilmadi: ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      const rawRecipes = text.split("---YANGI-RETSEPT---").filter(Boolean);

      const parsedRecipes = rawRecipes.map((rawRecipe, index) => {
        const parts = rawRecipe
          .split(/\d\)/)
          .map((t) => t.trim())
          .filter(Boolean);

        const name = parts[0] || `Retsept #${index + 1}`;
        const dishType = parts[1] || "Taom turi aniqlanmadi";
        const description = parts[2] || "Qisqa tavsif topilmadi.";
        const recipeIngredients = parts[3] || "Ingredientlar ro'yxati yo'q.";
        const steps = parts[4] || "Tayyorlash bosqichlari yo'q.";

        return {
          id: Date.now() + index,
          name,
          dishType,
          description,
          ingredients: recipeIngredients,
          steps,
          image: getFoodImage(name),
        };
      });

      setRecipes(parsedRecipes);

      // Premium obunachilar uchun ovozli xabar
      if (isPremium && speechSupport.synthesis && parsedRecipes.length > 0) {
        speak(`AI siz uchun ${parsedRecipes.length} ta yangi retsept yaratdi.`);
      }
    } catch (err) {
      console.error("AI xatolik:", err);
      alert(
        `❌ AI bilan aloqa o'rnatishda muammo yuz berdi: ${err.message}. Qayta urinib ko'ring.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    navigate(`/recipes/${recipe.id}`, { state: { recipe } });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto mb-6">
          {/* ⭐️⭐️ TEST UCHUN TUGMA (Premium holatini o'zgartirish) ⭐️⭐️ */}
          <button
            onClick={togglePremiumStatus}
            className={`absolute top-2 right-4 text-xs font-semibold px-3 py-1 rounded-full ${
              isPremium
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            title="TEST: Premium holatini o'zgartirish"
          >
            TEST: {isPremium ? "Premium (O'chirish)" : "Oddiy (Yoqish)"}
          </button>

          {!isPremium && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold">Premium Obuna</h3>
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Kunlik limitlar: {Math.max(
                        0,
                        3 - searchCount
                      )} qidiruv, {Math.max(0, 3 - voiceInputCount)} ovozli
                      kiritish
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/pay")}
                  className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Obuna sotib olish
                </button>
              </div>
            </div>
          )}

          {/* Premium foydalanuvchi uchun xabar (o'zgarishsiz) */}
          {isPremium && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-300" />
                  <div>
                    <h3 className="font-bold">Premium Obuna Faol</h3>
                    <p className="text-sm opacity-90">
                      Sizda cheksiz qidiruv va ovozli funksiyalar mavjud!
                    </p>
                  </div>
                </div>
                <div className="text-xs bg-white/20 px-3 py-1 rounded-full">
                  Cheksiz
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mb-12 bg-white/80 backdrop-blur-sm rounded-2xl py-8 shadow-lg border border-green-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-2 mb-4">
              {isPremium && (
                <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              )}
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 flex justify-center items-center gap-3">
                <Sparkles className="w-10 h-10 text-green-500 animate-pulse" />
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  SmartChef
                </span>
                <span className="text-green-400">AI</span>
              </h1>
            </div>
            <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto font-medium">
              Ingredientlarni kiriting — biz siz uchun noyob retseptlarni
              yaratamiz! 🍳
            </p>

            {/* Limitlar haqida ma'lumot - faqat premium bo'lmaganlar uchun */}
            {!isPremium && (
              <div className="mt-4 bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Kunlik bepul limitlar:</span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <div>• 3 ta AI qidiruv</div>
                  <div>• 3 ta ovozli kiritish (mikrafon orqali)</div>
                  <div>• Limitlar har kuni yangilanadi</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm max-w-3xl mx-auto p-8 rounded-3xl shadow-2xl border border-green-200 mb-10">
          <IngredientInput
            ingredients={ingredients}
            setIngredients={setIngredients}
          />

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Retsept yaratish tugmasi */}
            <button
              onClick={generateRecipe}
              disabled={
                loading ||
                ingredients.length === 0 ||
                (!isPremium && searchCount >= 3) // LIMIT TEKSHIRUVI
              }
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              {!isPremium && searchCount >= 3 ? (
                "Kunlik qidiruv limiti tugadi"
              ) : loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Retsept yaratilmoqda...
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  {isPremium
                    ? "5 ta Retsept yaratish"
                    : `Qidirish (${Math.max(0, 3 - searchCount)} qoldi)`}
                </>
              )}
            </button>

            {/* Ovozli kiritish tugmasi */}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={
                loading ||
                !speechSupport.recognition ||
                (!isPremium && voiceInputCount >= 3) // LIMIT TEKSHIRUVI
              }
              className={`w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center 
                ${
                  !speechSupport.recognition ||
                  (!isPremium && voiceInputCount >= 3)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isListening
                    ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              title={
                !speechSupport.recognition
                  ? "Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi"
                  : !isPremium && voiceInputCount >= 3
                  ? "Kunlik ovozli kiritish limiti tugadi"
                  : isListening
                  ? "Ovozli kiritishni to'xtatish"
                  : "Ovozli kiritishni boshlash"
              }
            >
              {isListening ? (
                <StopCircle className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            {/* Ovozni to'xtatish tugmasi - Faqat premium uchun */}
            <button
              onClick={stopSpeaking}
              disabled={!isPremium || !speechSupport.synthesis}
              className={`w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center 
                ${
                  !isPremium || !speechSupport.synthesis
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-100 text-amber-600 hover:bg-amber-200 hover:text-amber-700"
                }`}
              title={
                !isPremium
                  ? "Ovozni to'xtatish faqat Premium uchun"
                  : "Ovozni to'xtatish"
              }
            >
              <StopCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Limitlar statistikasi - faqat premium bo'lmaganlar uchun */}
          {!isPremium && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-xs text-gray-600">
                <div>Qidiruvlar: {searchCount}/3</div>
                <div>Ovozli kiritish: {voiceInputCount}/3</div>
              </div>
            </div>
          )}
        </div>

        {/* ... Retseptlar UI qismi o'zgarishsiz ... */}
        {!loading && recipes.length > 0 && (
          <div className="max-w-7xl mx-auto mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ✨ Topilgan Retseptlar
              </span>
              <span className="text-green-500 ml-2">({recipes.length} ta)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg border border-green-100 transition-all duration-300 hover:shadow-2xl hover:border-green-300 group flex flex-col hover:transform hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {recipe.dishType}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                      {recipe.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                      {recipe.description}
                    </p>

                    <div className="mt-auto flex justify-between gap-2">
                      <button
                        onClick={() => handleRecipeClick(recipe)}
                        className="flex-1 flex items-center justify-center bg-green-50 text-green-600 font-medium py-2 rounded-lg hover:bg-green-100 transition text-sm"
                      >
                        <ChefHat className="w-4 h-4 mr-1" />
                        Batafsil
                      </button>

                      {/* Ovozli o'qish tugmasi - Faqat premium uchun */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPremium && speechSupport.synthesis) {
                            speak(
                              `Retsept nomi: ${recipe.name}. Taom turi: ${recipe.dishType}. ${recipe.description}`
                            );
                          } else if (!isPremium) {
                            alert(
                              "Ovozli o'qish faqat Premium obunachilar uchun mavjud!"
                            );
                          } else {
                            alert(
                              "Brauzeringiz ovozli o'qishni qo'llab-quvvatlamaydi!"
                            );
                          }
                        }}
                        disabled={!isPremium || !speechSupport.synthesis}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition
                          ${
                            !isPremium || !speechSupport.synthesis
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        title={
                          !isPremium
                            ? "Ovozli o'qish faqat Premium uchun"
                            : "Retseptni o'qib berish"
                        }
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="max-w-3xl mx-auto mt-12 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-green-200">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                AI retseptlarni yaratmoqda...
              </h3>
              <p className="text-gray-600">
                Ingredientlaringiz asosida 5 ta noyob retsept tayyorlanmoqda
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
