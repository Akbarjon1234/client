import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, ArrowLeft, Crown } from "lucide-react";

// Premium holatini LocalStorage'dan olish
const getPremiumStatus = () => {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("smartchef_premium");
  return saved ? JSON.parse(saved) : false;
};

// Ovozli sintez uchun global instansiya
const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const RecipeDetails = () => {
  const location = useLocation();
  const navigate = useNavigate(); // 1. Dinamik ma'lumotni qabul qilish // Home componentidan state orqali yuborilgan 'recipe' ni olamiz
  const dynamicRecipe = location.state?.recipe; // Agar dinamik ma'lumot bo'lmasa, sahifani to'g'ridan-to'g'ri ochganda ishlatish uchun default yoki bo'sh obyekt
  const emptyRecipe = {
    id: "404",
    name: "Retsept topilmadi",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
    dishType: "Ma'lumot mavjud emas",
    description:
      "Bu sahifa to'g'ridan-to'g'ri ochilgan bo'lishi mumkin. Iltimos, bosh sahifadan retsept tanlang.",
    ingredients: ["Bosh sahifaga qayting"],
    steps: [
      "Ma'lumot yuklanmadi. Bosh sahifaga qayting va qayta urinib ko'ring.",
    ],
  };

  const recipe = dynamicRecipe || emptyRecipe; // Holatni boshqarish

  const [isPremium, setIsPremium] = useState(getPremiumStatus());
  const [speaking, setSpeaking] = useState(false);
  const [ttsSupport, setTtsSupport] = useState(!!synth); // Ovoz o'qish jarayonini boshqarish uchun ref

  const speakingTimeoutRef = useRef([]); // Ovozli o'qish funksiyasi

  const speakStep = useCallback(
    (step, onEndCallback = () => {}) => {
      if (!isPremium || !ttsSupport || !synth) {
        console.warn("TTS mavjud emas yoki Premium emas.");
        return;
      } // Avvalgi gapirish jarayonini to'xtatish (agar bir vaqtda boshqa gapiruvchi bo'lsa)

      synth.cancel();
      const utter = new SpeechSynthesisUtterance(step);
      utter.lang = "uz-UZ"; // O'zbek tiliga yaqin ovozni topish uchun
      utter.rate = 0.95;
      utter.pitch = 1;

      utter.onend = onEndCallback;
      utter.onerror = (e) => console.error("TTS Error:", e);

      synth.speak(utter);
    },
    [isPremium, ttsSupport]
  ); // Barcha taymerlarni to'xtatish va TTSni o'chirish
  const stopSpeaking = useCallback(() => {
    if (synth) {
      synth.cancel();
    }
    speakingTimeoutRef.current.forEach(clearTimeout);
    speakingTimeoutRef.current = [];
    setSpeaking(false);
  }, []); // TTS ni yoqish/o'chirish
  const handleToggleVoice = () => {
    if (!isPremium) {
      alert("Ovozli yordam faqat Premium obunachilar uchun mavjud!");
      return;
    }
    if (!ttsSupport) {
      alert("Brauzeringiz ovozli sintezni (TTS) qo'llab-quvvatlamaydi.");
      return;
    }

    if (speaking) {
      stopSpeaking();
    } else {
      setSpeaking(true);
      let delay = 0;
      const stepDelay = 8000; // Har bir bosqich orasidagi taxminiy pauza (millisekundlarda) // Barcha qadamlar bo'ylab tsikl

      recipe.steps.forEach((step, index) => {
        const isLastStep = index === recipe.steps.length - 1;
        const timeoutId = setTimeout(() => {
          // Gapiruvchiga oxirgi bosqich tugashini xabar qilish uchun callback berish
          speakStep(`Bosqich ${index + 1}: ${step}`, () => {
            if (isLastStep) {
              setTimeout(() => {
                setSpeaking(false);
              }, 1000); // Oxirgi bosqich o'qib bo'lingach 1 sekund kutib tugatish
            }
          });
        }, delay);

        speakingTimeoutRef.current.push(timeoutId); // Keyingi bosqichga kechikishni qo'shish. // Real hayotda bu qadamning uzunligiga qarab hisoblanishi kerak, ammo biz taxminiy qiymatdan foydalanamiz
        delay += stepDelay;
      });
    }
  }; // Component yopilganda yoki tark etilganda ovozni o'chirish
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]); // Retsept topilmasa, bosh sahifaga yo'naltirish

  if (!dynamicRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
               {" "}
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Retsept ma'lumotlari topilmadi!
        </h1>
               {" "}
        <p className="text-gray-600 mb-6">
          Iltimos, retseptni bosh sahifadagi ro'yxatdan tanlang.
        </p>
               {" "}
        <button
          onClick={() => navigate("/")}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Bosh Sahifaga Qaytish
                 {" "}
        </button>
             {" "}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
           {" "}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-700 hover:text-green-600 mb-6 transition duration-200 font-medium"
      >
                <ArrowLeft className="w-5 h-5 mr-2" /> Orqaga      {" "}
      </button>
           {" "}
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-green-100">
               {" "}
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-64 object-cover"
        />
               {" "}
        <div className="p-6 md:p-8">
                   {" "}
          <div className="flex items-center justify-between mb-2">
                       {" "}
            <h1 className="text-3xl font-extrabold text-gray-900">
                            {recipe.name}           {" "}
            </h1>
                       {" "}
            <span className="text-sm font-semibold bg-green-500 text-white px-3 py-1 rounded-full">
                            {recipe.dishType || "Taom turi"}           {" "}
            </span>
                     {" "}
          </div>
                             {" "}
          <p className="text-gray-600 italic mb-6 border-b pb-4">
                        {recipe.description}         {" "}
          </p>
                   {" "}
          <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
                       {" "}
            <Crown className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" /> 
                      Kerakli mahsulotlar:          {" "}
          </h3>
                   {" "}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
                       {" "}
            <div className="prose max-w-none text-gray-700">
                           {" "}
              {
                // Ingredientlarni yangi qatorga bo'lib chiqarish
                recipe.ingredients
                  .split("\n")
                  .map((line, i) =>
                    line.trim() ? <div key={i}>• {line.trim()}</div> : null
                  )
              }
                       {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          <h3 className="text-xl font-bold text-green-700 mb-3">
                        Tayyorlanish bosqichlari:          {" "}
          </h3>
                   {" "}
          <ol className="list-decimal list-inside pl-2 space-y-3 text-gray-700">
                       {" "}
            {
              // Bosqichlarni yangi qatorga bo'lib chiqarish
              recipe.steps.split("\n").map((step, i) =>
                step.trim() ? (
                  <li key={i} className="font-medium text-base">
                    {step.trim()}
                  </li>
                ) : null
              )
            }
                     {" "}
          </ol>
                    {/* Ovozli yordam tugmasi */}         {" "}
          <button
            onClick={handleToggleVoice}
            disabled={!isPremium || !ttsSupport}
            className={`mt-8 flex items-center px-6 py-3 rounded-xl text-white font-bold transition duration-200 active:scale-[0.98] shadow-lg ${
              !isPremium || !ttsSupport
                ? "bg-gray-400 cursor-not-allowed"
                : speaking
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title={!isPremium ? "Premium kerak" : !ttsSupport ? "TTS yo'q" : ""}
          >
                       {" "}
            {speaking ? (
              <VolumeX className="w-5 h-5 mr-2 animate-pulse" />
            ) : (
              <Volume2 className="w-5 h-5 mr-2" />
            )}
                       {" "}
            {speaking
              ? "Ovozli yordamni to‘xtatish"
              : "Ovozli yordamni yoqish (Premium)"}
                     {" "}
          </button>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default RecipeDetails;
