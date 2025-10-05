// src/components/ui/CommentForm.jsx (Tuzatilgan)

import React, { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";

// Firebase importlari
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// auth ni import qilish muhim!
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const CommentForm = () => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // 🔥 1. user o'rniga currentUser state'ini yarating
  const [currentUser, setCurrentUser] = useState(null);
  // 🔥 2. Auth holatini yuklash holatini kuzatish
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // 🔥 3. Auth holatini tekshirish uchun useEffect
  useEffect(() => {
    // onAuthStateChanged obunasi auth holati o'zgarganda ishlaydi.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false); // Holat aniqlandi
    });

    // Komponent yo'qolganda obunani bekor qilish
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Endi currentUser state'idan foydalanamiz
    if (!currentUser) {
      setMessage("Izoh qoldirish uchun avval tizimga kirishingiz shart!");
      return;
    }

    if (commentText.trim().length < 5) {
      setMessage("Iltimos, kamida 5 ta belgidan iborat izoh kiriting.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await addDoc(collection(db, "comments"), {
        userId: currentUser.uid,
        userName:
          currentUser.displayName ||
          currentUser.email.split("@")[0] ||
          "Anonim foydalanuvchi",
        text: commentText.trim(),
        createdAt: serverTimestamp(),
        page: "/docs",
        isModerated: false,
      });

      setCommentText("");
      setMessage(
        "✅ Izoh muvaffaqiyatli yuborildi. Moderatorlar tez orada tekshirishadi."
      );

      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("FIREBASE COMMENT Yozishda Xato:", error.message);
      let userMessage = "Xato: Izoh yozish amalga oshmadi.";

      if (error.code === "permission-denied") {
        userMessage +=
          " Ruxsat yo'q. Tizimga kirganingizga ishonch hosil qiling.";
      } else {
        userMessage += " Qayta urinib ko‘ring.";
      }

      setMessage(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // isButtonDisabled uchun currentUser'ni ishlating
  const isButtonDisabled =
    isSubmitting || !currentUser || commentText.trim().length < 5;

  return (
    <div className="mt-10 bg-gray-50 p-6 rounded-xl shadow-inner">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
        Fikr qoldirish
      </h3>

      {/* 🔥 Auth yuklanayotgan bo'lsa, xabarni ko'rsatish */}
      {isLoadingAuth && (
        <div className="text-center p-3 text-gray-500">
          Yuklanmoqda... (Tizimga kirish holati tekshirilmoqda)
        </div>
      )}

      {!isLoadingAuth && (
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition resize-none"
            rows="4"
            placeholder={
              currentUser
                ? "Loyiha haqida o'z fikringizni yozing..."
                : "Izoh qoldirish uchun tizimga kirish talab etiladi."
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting || !currentUser}
          />

          <div className="flex justify-between items-center mt-3">
            {message && (
              <p
                className={`text-sm font-medium ${
                  message.includes("Xato:") ||
                  message.includes("tizimga kiring")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              className={`ml-auto px-6 py-2 rounded-lg font-semibold text-white transition duration-300 flex items-center ${
                isButtonDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={isButtonDisabled}
            >
              {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
              <Send className="w-4 h-4 ml-2" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CommentForm;
