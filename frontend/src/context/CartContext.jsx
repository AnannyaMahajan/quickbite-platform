import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);

  const addToCart = (item, restId) => {
    if (restaurantId && restaurantId !== restId) {
      if (!window.confirm('Your cart contains items from another restaurant. Reset cart and add items from this restaurant?')) {
        return;
      }
      setCartItems([{ menuItemId: item._id, name: item.name, price: item.price, quantity: 1, image: item.image }]);
      setRestaurantId(restId);
      return;
    }

    setRestaurantId(restId);
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.menuItemId === item._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1, image: item.image }];
      }
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.menuItemId === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = cartItems.length > 0 ? 40 : 0;
  const tax = cartItems.length > 0 ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = subtotal + deliveryFee + tax;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurantId,
        addToCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        tax,
        grandTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
