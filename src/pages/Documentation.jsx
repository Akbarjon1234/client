// src/pages/Documentation.jsx (Yangilangan)

import React from "react";
import { Lightbulb, Code, Zap } from "lucide-react";
import CommentForm from "../components/ui/CommentForm";
import CommentsList from "../components/ui/CommentsList";

const Documentation = () => {
  return (
    <>
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white shadow-xl rounded-lg my-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
          <Code className="w-8 h-8 text-green-600 mr-3" />
          Izohlar
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Bu bo'lim loyihaning asosiy texnik yechimlari va kelajakdagi
          rivojlantirish uchun qilingan modernizatsiyalar haqida ma'lumot
          beradi.
        </p>

        <CommentForm />
        <CommentsList pageId="/docs" />
      </div>
    </>
  );
};

export default Documentation;
