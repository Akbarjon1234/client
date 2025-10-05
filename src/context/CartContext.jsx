// src/context/CartContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

// 1. Context yaratish
const CartContext = createContext();

// 2. Custom Hook yaratish
export const useCart = () => {
  return useContext(CartContext);
};

// 3. Provider komponenti
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Savatga mahsulot qo'shish funksiyasi
  const addToCart = useCallback((product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // Miqdorini oshirish
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Yangi mahsulotni qo'shish
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  }, []);

  // Miqdorni o'zgartirish funksiyasi (+1 yoki -1)
  const updateQuantity = useCallback((id, change) => {
    setCartItems(
      (prevItems) =>
        prevItems
          .map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, item.quantity + change) }
              : item
          )
          .filter((item) => item.quantity > 0) // Agar miqdor 0 bo'lsa, o'chirish
    );
  }, []);

  // Mahsulotni o'chirish funksiyasi
  const removeItem = useCallback((id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  // Savatdagi jami mahsulotlar soni
  const cartItemCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Context Value'sini tayyorlash
  const contextValue = useMemo(
    () => ({
      cartItems,
      cartItemCount,
      clearCart,
      addToCart,
      updateQuantity,
      removeItem,
    }),
    [cartItems, cartItemCount, addToCart, updateQuantity, removeItem]
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};
