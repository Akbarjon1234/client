// 🔥 MUHIM TUZATISH: Endi 'dotenv' importini talab qilmaydi, Vercel avtomatik load qiladi.

export default async function handler(req, res) {
  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // Environment Variable ni tekshirish
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error(
      "OPENROUTER_API_KEY Vercel Environment Variables'da topilmadi."
    );
    // 503 statusni qaytarish orqali xato aniqroq ko'rsatiladi
    return res
      .status(503)
      .json({
        message: "Server konfiguratsiyasi xato. API kaliti o'rnatilmagan.",
      });
  }

  const { combinedInput } = req.body;

  if (!combinedInput) {
    return res
      .status(400)
      .json({ message: "combinedInput (ingredientlar) kiritilmagan." });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔥 API kalitini Environment O'zgaruvchisidan olish
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://smartcheff-user.vercel.app", // O'z domeningizga o'zgartiring!
          "X-Title": "SmartChef AI",
        },
        body: JSON.stringify({
          // Takomillashtirilgan model
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              // Qattiq formatni talab qiluvchi prompt
              content:
                "Siz professional oshxona yordamchisiz. Har doim o'zbek tilida, so'rovga javoban faqatgina kiritilgan mahsulotlarga mos keladigan, aniq 5 xil retseptni (Taom nomi, Qisqacha ta'rif, Usuli) quyidagi formatda, har birini yangi qatordan boshlab ro'yxat shaklida qaytaring. Qattiq formatga rioya qiling. Boshqa hech qanday kirish matnini yozmang:\n\n1. Taom nomi: [Nomi]\nQisqacha ta'rif: [Qisqa ta'rif]\nUsuli: [To'liq tayyorlash usuli]\n\n2. Taom nomi: [Nomi]\nQisqacha ta'rif: [Qisqa ta'rif]\nUsuli: [To'liq tayyorlash usuli]\n\n3. Taom nomi: [Nomi]\nQisqacha ta'rif: [Qisqa ta'rif]\nUsuli: [To'liq tayyorlash usuli]\n\n4. Taom nomi: [Nomi]\nQisqacha ta'rif: [Qisqa ta'rif]\nUsuli: [To'liq tayyorlash usuli]\n\n5. Taom nomi: [Nomi]\nQisqacha ta'rif: [Qisqa ta'rif]\nUsuli: [To'liq tayyorlash usuli]",
            },
            { role: "user", content: combinedInput },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // OpenRouterdan kelgan xatolarni oldinga uzatish
      console.error("OpenRouter API xatosi:", data);
      return res.status(response.status).json({
        message:
          data.error?.message ||
          `OpenRouter xatosi: ${response.status} ${response.statusText}`,
      });
    }

    // Muvaffaqiyatli javobni qaytarish
    res.status(200).json(data);
  } catch (error) {
    console.error("Serverless Function'ning ichki xatosi (Catch):", error);
    // Kutilmagan server xatosi
    res
      .status(500)
      .json({
        message: "Kutilmagan server xatosi yuz berdi. Konsolni tekshiring.",
      });
  }
}
