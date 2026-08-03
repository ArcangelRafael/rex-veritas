import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART'
};

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
      return { 
        ...state, 
        items: state.items.filter(item => item.productId !== action.payload) 
      };
      
    case ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item => 
          item.productId === action.payload.productId 
            ? { ...item, quantity: action.payload.quantity } 
            : item
        )
      };
      
    case ACTIONS.CLEAR_CART:
      return { items: [] };
      
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  // 1. INICIALIZAMOS LEYENDO EL CARRITO GUARDADO EN EL NAVEGADOR
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, (initial) => {
    const savedCart = localStorage.getItem('cart_rex');
    return savedCart ? { items: JSON.parse(savedCart) } : initial;
  });

  // 2. EFECTO PARA GUARDAR AUTOMÁTICAMENTE CADA VEZ QUE EL CARRITO CAMBIA
  useEffect(() => {
    localStorage.setItem('cart_rex', JSON.stringify(state.items));
  }, [state.items]);

  const total = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

  const addItem = (product, quantity = 1) => {
    dispatch({ 
      type: ACTIONS.ADD_ITEM, 
      payload: { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        imageUrl: product.imageUrl,
        stockLimits: product.stock,
        // NUEVOS CAMPOS PARA EL FORMATO DEL TICKET:
        category: product.category,
        quality: product.quality,
        size: product.size,
        brands: product.brands,
        quantity 
      } 
    });
  };

  const removeItem = (productId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  };

  return (
    <CartContext.Provider value={{ 
      cart: state.items, 
      total, 
      totalItems, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
};