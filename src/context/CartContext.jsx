import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { productService } from '../services/productService'; 

const CartContext = createContext();

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART'
};

// CAMBIO 1: Reducimos el tiempo de caducidad a 12 horas exactas
const TWELVE_HOURS = 12 * 60 * 60 * 1000; 
const MAX_ITEMS_PER_ORDER = 5; 

const cartReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };
        return { ...state, items: updatedItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case ACTIONS.REMOVE_ITEM:
      return { ...state, items: state.items.filter(item => item.productId !== action.payload) };
    case ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item => 
          item.productId === action.payload.productId ? { ...item, quantity: action.payload.quantity } : item
        )
      };
    case ACTIONS.CLEAR_CART:
      return { items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, (initial) => {
    const savedCart = localStorage.getItem('cart_rex');
    const savedTime = localStorage.getItem('cart_time_rex');
    
    if (savedCart && savedTime) {
      const now = new Date().getTime();
      const expirationTime = parseInt(savedTime) + TWELVE_HOURS; // Actualizado a 12 hrs
      
      if (now < expirationTime) {
        return { items: JSON.parse(savedCart) };
      } else {
        localStorage.removeItem('cart_rex');
        localStorage.removeItem('cart_time_rex');
      }
    }
    return initial;
  });

  const [timeLeftStr, setTimeLeftStr] = useState('');

  // EFECTO 1: GUARDA EL CARRITO EN LOCALSTORAGE
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('cart_rex', JSON.stringify(state.items));
      
      // BONUS FIX: Solo guardamos la hora inicial si NO existía. 
      // Así evitamos que el reloj se reinicie a 12hrs si agregan un segundo producto.
      const existingTime = localStorage.getItem('cart_time_rex');
      if (!existingTime) {
        localStorage.setItem('cart_time_rex', new Date().getTime().toString());
      }
    } else {
      localStorage.removeItem('cart_rex');
      localStorage.removeItem('cart_time_rex');
      setTimeLeftStr('');
    }
  }, [state.items]);

  // EFECTO 2: MOTOR DEL TEMPORIZADOR
  useEffect(() => {
    if (state.items.length === 0) {
      setTimeLeftStr('');
      return;
    }

    const updateTimer = () => {
      let savedTime = localStorage.getItem('cart_time_rex');
      
      // FIX RACE CONDITION: Si el localStorage no ha terminado de guardar (el microsegundo del bug 0h 0m),
      // tomamos la hora de este preciso instante como plan de respaldo automático.
      if (!savedTime) {
        savedTime = new Date().getTime().toString();
      }

      const now = new Date().getTime();
      const expirationTime = parseInt(savedTime) + TWELVE_HOURS;
      const difference = expirationTime - now;

      if (difference <= 0) {
        clearCart(); 
      } else {
        // Cálculo matemático corregido para 12 horas
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeftStr(`${hours}h ${minutes}m`);
      }
    };

    updateTimer(); // Arranca inmediatamente sin esperar el primer minuto
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items]);

  const total = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

  const addItem = (product, quantity = 1) => {
    if (totalItems + quantity > MAX_ITEMS_PER_ORDER) {
      alert("Límite de seguridad: Solo puedes comprar hasta 5 artículos por orden web. Para mayoreo, contáctanos directamente.");
      return;
    }
    productService.updateCartCount(product.id, quantity); 
    dispatch({ 
      type: ACTIONS.ADD_ITEM, 
      payload: { 
        productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl,
        stockLimits: product.stock, category: product.category, quality: product.quality,
        size: product.size, brands: product.brands, quantity 
      } 
    });
  };

  const removeItem = (productId) => {
    const item = state.items.find(i => i.productId === productId);
    if (item) {
      productService.updateCartCount(productId, -item.quantity); 
    }
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) { 
      removeItem(productId); 
      return; 
    }
    const item = state.items.find(i => i.productId === productId);
    if (item) {
      const difference = quantity - item.quantity;
      if (totalItems + difference > MAX_ITEMS_PER_ORDER) {
        alert("Límite de seguridad: Solo puedes comprar hasta 5 artículos por orden web. Para mayoreo, contáctanos directamente.");
        return;
      }
      if (difference !== 0) {
        productService.updateCartCount(productId, difference); 
      }
    }
    dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  };

  const clearCart = () => {
    state.items.forEach(item => {
      productService.updateCartCount(item.productId, -item.quantity);
    });
    dispatch({ type: ACTIONS.CLEAR_CART });
  };

  return (
    <CartContext.Provider value={{ 
      cart: state.items, total, totalItems, addItem, removeItem, updateQuantity, clearCart,
      cartTimeLeft: timeLeftStr 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};