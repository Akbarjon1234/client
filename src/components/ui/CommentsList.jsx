// src/components/ui/CommentsList.jsx (Yangi komponent)

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";

// Firebase importlari
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase"; // firebase.js ichidagi db

// Eslatma: Ushbu komponent o'zi qaysi sahifa/mahsulot uchun ekanligini bilishi kerak.
// props orqali 'pageId' yoki 'productId' yuboring.
const CommentsList = ({ pageId = "/docs" }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const commentsRef = collection(db, "comments");

      // 🔥 ASOSIY MANTIQ: Faqat TASDIQLANGAN (isModerated: true) va
      // ushbu sahifaga tegishli izohlarni yuklash.
      const q = query(
        commentsRef,
        where("page", "==", pageId),
        where("isModerated", "==", true), // FAQAT TASDIQLANGANLAR
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const commentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Firestore Timestamp'ni JS Date ga o'tkazish
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setComments(commentsList);
    } catch (err) {
      console.error("Izohlarni yuklashda xato:", err);
      setError("Izohlarni yuklashda xato yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
        Barcha Tasdiqlangan Izohlar
      </h3>

      {loading && (
        <p className="text-center text-gray-500 py-4">Izohlar yuklanmoqda...</p>
      )}
      {error && <p className="text-center text-red-500 py-4">{error}</p>}

      {!loading && comments.length === 0 && (
        <p className="text-gray-500 italic bg-white p-4 rounded-lg shadow-sm">
          Hozircha tasdiqlangan izohlar yo'q. Birinchi bo'lib o'z fikringizni
          yozing!
        </p>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-800">{comment.userName}</p>
              <p className="text-xs text-gray-500">
                {comment.createdAt.toLocaleDateString("uz-UZ")}
              </p>
            </div>
            <p className="mt-2 text-gray-700">{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsList;
