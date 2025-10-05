import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, List, AlertTriangle } from 'lucide-react';

const chipVariants = {
    initial: { opacity: 0, scale: 0.5, x: 20 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.5, x: -20, transition: { duration: 0.2 } },
};

/**
 * Foydalanuvchi mahsulotlarni kiritadigan va ularni boshqaradigan komponent.
 * * @param {object} props
 * @param {string[]} props.ingredients - Mahsulotlar ro'yxati (state)
 * @param {Function} props.setIngredients - Mahsulotlar ro'yxatini yangilash funksiyasi
 */
const IngredientInput = ({ ingredients, setIngredients }) => {
    const [inputValue, setInputValue] = useState('');
    const MAX_INGREDIENTS = 8; // Maksimal mahsulot soni

    // Mahsulot qo'shish funksiyasi
    const handleAddIngredient = () => {
        const cleanValue = inputValue.trim();
        if (cleanValue && ingredients.length < MAX_INGREDIENTS && !ingredients.includes(cleanValue)) {
            setIngredients([...ingredients, cleanValue]);
            setInputValue('');
        }
    };

    // Mahsulotni Enter bosilganda qo'shish
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Formani yuborishni oldini olish
            handleAddIngredient();
        }
    };

    // Mahsulotni ro'yxatdan o'chirish
    const handleRemoveIngredient = (ingredientToRemove) => {
        setIngredients(ingredients.filter(i => i !== ingredientToRemove));
    };

    return (
        <div className="space-y-4">
            {/* 1. Kiritish Maydoni */}
            <div className="relative flex items-center">
                <List className="absolute left-3 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Masalan: Tovuq, Kartoshka, Piyoz..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={ingredients.length >= MAX_INGREDIENTS}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <motion.button
                    onClick={handleAddIngredient}
                    disabled={!inputValue.trim() || ingredients.length >= MAX_INGREDIENTS}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.9 }}
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            {/* 2. Mahsulotlar Ro'yxati (Chips) */}
            {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <AnimatePresence>
                        {ingredients.map((ingredient) => (
                            <motion.div
                                key={ingredient}
                                className="flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full cursor-default shadow-sm"
                                variants={chipVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {ingredient}
                                <motion.button
                                    onClick={() => handleRemoveIngredient(ingredient)}
                                    className="ml-2 text-green-700 hover:text-red-600 transition"
                                    whileTap={{ scale: 0.8 }}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 3. Ogohlantirish */}
            {ingredients.length >= MAX_INGREDIENTS && (
                <motion.p 
                    className="flex items-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Siz maksimal {MAX_INGREDIENTS} ta mahsulot kiritdingiz.
                </motion.p>
            )}
        </div>
    );
};

export default IngredientInput;