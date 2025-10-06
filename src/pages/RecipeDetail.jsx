import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, ArrowLeft, Crown } from "lucide-react";

// Premium holatini LocalStorage'dan olish
const getPremiumStatus = () => {
  if (typeof window === "undefined") return false; // Home componentidagi 'isPremium' state'i bilan sinxronlash uchun // Biz bu yerda faqat 'true' yoki 'false' ni qaytarishimiz kerak. // Haqiqiy Firebase/DB tekshiruvi 'Home' componentida qilinadi. // Shuning uchun bu demo uchun statik holatni ishlatamiz.
  return true; // TODO: Haqiqiy ilovada 'Home' componentidagi isPremium holatini bu yerga uzating
};

/**
 * AI'dan kelgan xom matnni (recipe.details) ingredientlar va bosqichlarga ajratadi.
 * AI formatiga asoslanadi: "Usuli: [To'liq tayyorlash usuli]."
 * Tayyorlash usuli o'z ichiga ingredientlarni ham olishi mumkin,
 * ammo 'Home.jsx' dagi prompt faqat 3 qismni so'ragan.
 * Biz bu yerda to'liq 'details'ni tayyorlanish usuli deb hisoblaymiz.
 * * NOTE: 'Home.jsx' dagi parseAndFormatRecipes funksiyasida ingredientlar alohida ajratilmagan,
 * faqat 'name', 'description' va 'details' (Usuli) ajratilgan.
 * Eng yaxshi yechim 'Home.jsx' dagi AI promptini ingredientlarni alohida qaytarishga majburlash.
 * Hozircha, ingredientlarni alohida qism deb hisoblab formatlaymiz.
 */
const useFormattedRecipe = (rawRecipe) => {
  return useMemo(() => {
    if (!rawRecipe || rawRecipe.id === "404") {
      return null;
    } // 1. Image URL nomini to'g'irlash: imageUrl -> image

    const baseRecipe = {
      ...rawRecipe,
      image: rawRecipe.imageUrl || rawRecipe.image, // imageUrl ni image ga o'zgartirish
      ingredients: [],
      steps: [],
    }; // 2. Details (Usuli) matnini tahlil qilish

    const rawDetails = rawRecipe.details || rawRecipe.description || ""; // Bu erda eng yaxshi yechim AI'dan kelgan matnni to'g'ri ajratishdir. // Hozirgi AI prompti faqat "Usuli" ni qaytaradi. // Ingredientlar Home.jsx da to'plangan `combinedInput` dan taxmin qilinadi // yoki AI dan to'liq matnni olib, uni ajratish kerak. // A) Ingredientlarni Home.jsx dan olib kelish (eng aniq yo'l) - Hozir bu ma'lumot state orqali kelmayapti. // B) Oddiy yechim: Ingredientlarni AI javobidan alohida ajratib olishga urinish. // Darslikda AI prompti ingredientlarni qaytarishni so'ramaydi. // Biz 'Home' componentida AI ga kiritilgan ingredientlarni (ingredients state) // bu yerga ham uzatishimiz kerak edi. // Agar uzatilmagan bo'lsa, 'details' dan taxminiy ajratamiz.
    let ingredientsList = [];
    let stepsList = []; // Ehtiyot yechimi: Agar details/description bo'lsa, uni bosqichlarga ajratish. // Yangi qator bo'yicha bo'lamiz (har bir qatorni alohida bosqich deb qabul qilamiz).

    if (rawDetails.length > 0) {
      stepsList = rawDetails
        .split(/[.!?\n]/) // Nuqta, so'roq, undov yoki yangi qator bo'yicha bo'lish
        .map((s) => s.trim())
        .filter((s) => s.length > 5); // Bo'sh qatorlarni yoki juda qisqa gaplarni tashlab yuborish // Ingredientlar uchun joy placeholder qoldiramiz. // Agar 'Home.jsx' dan alohida ingredientlar ro'yxati kelmagan bo'lsa.
      ingredientsList = [
        "Eslatma: AI faqat tayyorlash usulini berdi.",
        "Ingredientlar ro'yxati kiritilmagan.",
      ];
    } else {
      ingredientsList = ["Ma'lumot mavjud emas."];
      stepsList = ["Tayyorlanish bosqichlari mavjud emas."];
    }

    return {
      ...baseRecipe,
      ingredients: ingredientsList.join("\n"), // Oldingi kod tahlil qilish uchun string kutadi
      steps: stepsList.join("\n"), // Oldingi kod tahlil qilish uchun string kutadi
      dishType: rawRecipe.dishType || "Taom Turi",
    };
  }, [rawRecipe]);
};

// Ovozli sintez uchun global instansiya
const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const RecipeDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dynamicRecipe = location.state?.recipe; // useFormattedRecipe hookidan foydalanish

  const formattedRecipe = useFormattedRecipe(dynamicRecipe);

  const emptyRecipe = {
    id: "404",
    name: "Retsept topilmadi",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
    dishType: "Ma'lumot mavjud emas",
    description:
      "Bu sahifa to'g'ridan-to'g'ri ochilgan bo'lishi mumkin. Iltimos, bosh sahifadan retsept tanlang.",
    ingredients: "Bosh sahifaga qayting",
    steps:
      "Ma'lumot yuklanmadi. Bosh sahifaga qayting va qayta urinib ko'ring.",
  };

  const recipe = formattedRecipe || emptyRecipe;

  const [isPremium] = useState(getPremiumStatus()); // Premium holatini ishlatish
  const [speaking, setSpeaking] = useState(false);
  const [ttsSupport] = useState(!!synth);
  const speakingTimeoutRef = useRef([]); // Ovozli o'qish funksiyasi

  const speakStep = useCallback(
    (step, onEndCallback = () => {}) => {
      if (!isPremium || !ttsSupport || !synth) {
        console.warn("TTS mavjud emas yoki Premium emas.");
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(step);
      utter.lang = "uz-UZ";
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

    const stepsArray = recipe.steps
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
    if (speaking) {
      stopSpeaking();
    } else {
      setSpeaking(true);
      let delay = 0;
      const stepDelay = 8000; // Taxminiy pauza (millisekundlarda)

      stepsArray.forEach((step, index) => {
        const isLastStep = index === stepsArray.length - 1;
        const timeoutId = setTimeout(() => {
          speakStep(`Bosqich ${index + 1}: ${step}`, () => {
            if (isLastStep) {
              setTimeout(() => {
                setSpeaking(false);
              }, 1000);
            }
          });
        }, delay);

        speakingTimeoutRef.current.push(timeoutId);
        delay += stepDelay;
      });
    }
  }; // Component yopilganda yoki tark etilganda ovozni o'chirish

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]); // Retsept topilmasa (faqat URL orqali kirilganda), bosh sahifaga yo'naltirish

  if (!dynamicRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
               {" "}
        <h1 className="text-2xl font-bold text-red-600 mb-4">
                    Retsept ma'lumotlari topilmadi!        {" "}
        </h1>
               {" "}
        <p className="text-gray-600 mb-6">
                    Iltimos, retseptni bosh sahifadagi ro'yxatdan tanlang.      
           {" "}
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
                <ArrowLeft className="w-5 h-5 mr-2" /> Orqaga            {" "}
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
                            {recipe.name}                     {" "}
            </h1>
                       {" "}
            <span className="text-sm font-semibold bg-green-500 text-white px-3 py-1 rounded-full">
                            {recipe.dishType || "Taom turi"}                   
               {" "}
            </span>
                     {" "}
          </div>
                                                 {" "}
          <p className="text-gray-600 italic mb-6 border-b pb-4">
                        {recipe.description}                 {" "}
          </p>
                                       {" "}
          <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
                       {" "}
            <Crown className="w-5 h-5 mr-2 text-yellow-500 fill-yellow-500" /> 
                      Kerakli mahsulotlar:                  {" "}
          </h3>
                                       {" "}
          <div className="bg-green-50 p-4 rounded-lg mb-6">
                       {" "}
            <div className="prose max-w-none text-gray-700">
                           {" "}
              {recipe.ingredients
                .split("\n")
                .map((line, i) =>
                  line.trim() ? <div key={i}>• {line.trim()}</div> : null
                )}
                         {" "}
            </div>
                     {" "}
          </div>
                                       {" "}
          <h3 className="text-xl font-bold text-green-700 mb-3">
                        Tayyorlanish bosqichlari:                  {" "}
          </h3>
                                       {" "}
          <ol className="list-decimal list-inside pl-2 space-y-3 text-gray-700">
                       {" "}
            {
              // Bosqichlarni yangi qatorga bo'lib chiqarish
              recipe.steps.split("\n").map((step, i) =>
                step.trim() ? (
                  <li key={i} className="font-medium text-base">
                                        {step.trim()}                 {" "}
                  </li>
                ) : null
              )
            }
                     {" "}
          </ol>
                    {/* Ovozli yordam tugmasi */}                 {" "}
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
