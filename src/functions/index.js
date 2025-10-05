// functions/index.js (AI chaqiruvlari uchun xavfsiz baza)

const functions = require("firebase-functions");
// const admin = require('firebase-admin'); // Agar Firestorega saqlash kerak bo'lsa
// admin.initializeApp();

exports.generateAIMenu = functions.https.onCall(async (data, context) => {
  // 1. Foydalanuvchi Autentifikatsiyasini Tekshirish
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bu amal uchun tizimga kirish talab qilinadi."
    );
  }

  // 2. Kiruvchi Ma'lumotlarni Qattiq Tekshirish (Yoshingiz yo'qligi sababli)
  const { goal, targetCalories, userProfile } = data;

  if (
    !goal ||
    typeof targetCalories !== "number" ||
    !userProfile ||
    !userProfile.weight ||
    !userProfile.age
  ) {
    console.error("Kiruvchi ma'lumotlar to'liq emas:", data);
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Vazn, bo'y yoki yoshi kabi asosiy ma'lumotlar to'liq emas. Iltimos, profilni to'ldiring."
    );
  }

  try {
    // ... (Bu yerga kelajakda Gemini yoki boshqa AI chaqiruvi kodi qo'yiladi) ...

    // 🔥 Hozircha AI chaqiruvi o'rniga oddiy natijani qaytarish:
    const dummyResponse = {
      message:
        "Menyu server tomonida muvaffaqiyatli simulyatsiya qilindi (real AI yo'q).",
      menu: "Dummy Menu Data",
    };

    return dummyResponse;
  } catch (error) {
    console.error("AI Mantiqida Kutilmagan Xatolik:", error);
    throw new functions.https.HttpsError(
      "internal",
      "AI menyu yaratishda ichki xatolik yuz berdi."
    );
  }
});
