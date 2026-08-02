import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

// Definimos un diccionario de acciones constantes para evitar errores de tipeo
const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART'
};

// El Reducer: Una función pura que dicta cómo cambia el estado según la acción
const cartReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      // Verificamos si el producto ya está en el carrito
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId);
      
      if (existingItemIndex >= 0) {
        // Si ya existe, clonamos el array y le sumamos la cantidad
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: updatedItems };
      }
      // Si no existe, lo agregamos como nuevo elemento
      return { ...state, items: [...state.items, action.payload] };
    }
    
    case ACTIONS.REMOVE_ITEM:
      // Filtramos el array para excluir el producto eliminado
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
  // Inicializamos el estado del carrito vacío
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Derivamos los totales matemáticamente en cada renderizado (Es más seguro que guardarlos en el estado)
  const total = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

  // Controladores que las vistas usarán para interactuar con el carrito
  const addItem = (product, quantity = 1) => {
    dispatch({ 
      type: ACTIONS.ADD_ITEM, 
      payload: { 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        imageUrl: product.imageUrl,
        stockLimits: product.stock, // Guardamos el límite para no dejar al usuario pedir de más
        quantity 
      } 
    });
  };

  const removeItem = (productId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId); // Si la cantidad baja a 0, mejor lo eliminamos
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

// Custom hook para consumir el contexto fácilmente en cualquier componente
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
};