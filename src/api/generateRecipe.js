import { OPENROUTER_API_KEY } from "dotenv"; // Vercel avtomatik load qiladi

export default async function handler(req, res) {
  // Faqat POST so'rovlarni qabul qilish
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { combinedInput } = req.body;

  if (!combinedInput) {
    return res.status(400).json({ message: "combinedInput kiritilmagan" });
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 🔥 API kalitini ENVIRONMENT o'zgaruvchisidan olish
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://your-app-domain.vercel.app",
          "X-Title": "SmartChef AI",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: "Siz professional oshxona yordamchisiz...", // Qolgan prompt matni
            },
            { role: "user", content: combinedInput },
          ],
        }),
      }
    );

    // OpenRouter javobini to'g'ridan-to'g'ri mijozga qaytarish
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Serverless xato:", error);
    res.status(500).json({ message: "Server ichki xatosi." });
  }
}
