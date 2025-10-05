// src/components/ui/RecipeSteps.jsx

import React, { useState } from "react";
// motion importi olib tashlandi
import { Volume2, CheckCircle } from "lucide-react";

const RecipeSteps = ({ steps, isPremium }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const speakStep = (text) => {
    // Brauzer SpeechSynthesis API dan foydalanish
    if (!isPremium) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    // Til sozlamalari (o'zbekcha)
    utter.lang = "uz-UZ";
    utter.rate = 1;
    synth.speak(utter);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Keyingi qadamga o'tish
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Agar Premium bo'lsa, keyingi qadamni ovozli o'qish
      if (isPremium) {
        speakStep(steps[nextStep]);
      }
    }
  };

  return (
    <div>
      {/* motion.div o'rniga oddiy <div> ishlatildi */}
      <div
        // key prop'i o'zgarishsiz qoldi, bu keyingi qadamga o'tishda yangilanishni majburlaydi
        key={currentStep}
        className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 transition duration-300"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {`Qadam ${currentStep + 1} / ${steps.length}`}
        </h3>
        <p className="text-gray-700">{steps[currentStep]}</p>

        {isPremium && (
          <button
            onClick={() => speakStep(steps[currentStep])}
            className="mt-3 flex items-center text-blue-600 hover:text-blue-800 transition duration-200 active:scale-[0.98]"
          >
            <Volume2 className="w-5 h-5 mr-1" /> Ovozni eshitish
          </button>
        )}
      </div>

      {currentStep < steps.length - 1 ? (
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 active:scale-[0.98]"
        >
          Keyingi qadam
        </button>
      ) : (
        <div className="flex items-center text-green-700 font-semibold mt-4">
          <CheckCircle className="w-6 h-6 mr-2" /> Taom tayyor! Yoqimli ishtaha!
          🍽️
        </div>
      )}
    </div>
  );
};

export default RecipeSteps;
