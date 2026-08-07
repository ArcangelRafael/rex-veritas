import { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';
import { productService } from '../services/productService'; 
import { offerService } from '../services/offerService';

const CartContext = createContext();

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART'
};

const TWELVE_HOURS = 12 * 60 * 60 * 1000; 
const MAX_ITEMS_PER_ORDER = 15; 

const cartReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      // NUEVO: Identificamos el producto por su ID Y SU TALLA exacta
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId && item.size === action.payload.size);
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
      // Eliminamos verificando ID y Talla
      return { ...state, items: state.items.filter(item => !(item.productId === action.payload.productId && item.size === action.payload.size)) };
    case ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item => 
          (item.productId === action.payload.productId && item.size === action.payload.size) 
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
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, (initial) => {
    const savedCart = localStorage.getItem('cart_rex');
    const savedTime = localStorage.getItem('cart_time_rex');
    
    if (savedCart && savedTime) {
      const now = new Date().getTime();
      const expirationTime = parseInt(savedTime) + TWELVE_HOURS;
      if (now < expirationTime) return { items: JSON.parse(savedCart) };
      else {
        localStorage.removeItem('cart_rex');
        localStorage.removeItem('cart_time_rex');
      }
    }
    return initial;
  });

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [activeOffers, setActiveOffers] = useState([]);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offers = await offerService.getActiveOffers();
        setActiveOffers(offers);
      } catch (error) {
        console.error("Error cargando motor de ofertas", error);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem('cart_rex', JSON.stringify(state.items));
      const existingTime = localStorage.getItem('cart_time_rex');
      if (!existingTime) localStorage.setItem('cart_time_rex', new Date().getTime().toString());
    } else {
      localStorage.removeItem('cart_rex');
      localStorage.removeItem('cart_time_rex');
      setTimeLeftStr('');
      setAppliedPromoCode(''); 
    }
  }, [state.items]);

  useEffect(() => {
    if (state.items.length === 0) { setTimeLeftStr(''); return; }
    const updateTimer = () => {
      let savedTime = localStorage.getItem('cart_time_rex');
      if (!savedTime) savedTime = new Date().getTime().toString();
      const difference = (parseInt(savedTime) + TWELVE_HOURS) - new Date().getTime();

      if (difference <= 0) clearCart(); 
      else {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeftStr(`${hours}h ${minutes}m`);
      }
    };
    updateTimer(); 
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items]);

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const subTotal = state.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const { discountAmount, finalTotal, activePromosText } = useMemo(() => {
    let currentDiscount = 0;
    let promoTexts = [];

    activeOffers.forEach(offer => {
      if (offer.type === 'THRESHOLD') {
        if (subTotal >= offer.conditions.minSubtotal) {
          const discount = offer.discount.type === 'PERCENTAGE' 
            ? subTotal * (offer.discount.value / 100) 
            : offer.discount.value;
          currentDiscount += discount;
          promoTexts.push(offer.title);
        }
      }

      if (offer.type === 'BUNDLE') {
        const eligibleItems = state.items.filter(item => {
          const matchCat = offer.conditions.targetCategory === 'ALL' || item.category === offer.conditions.targetCategory;
          const matchBrand = offer.conditions.targetBrand === 'ALL' || (item.brands || []).includes(offer.conditions.targetBrand) || item.brand === offer.conditions.targetBrand;
          const matchQuality = offer.conditions.targetQuality === 'ALL' || item.quality === offer.conditions.targetQuality;
          
          return matchCat && matchBrand && matchQuality;
        });

        const eligibleQty = eligibleItems.reduce((acc, item) => acc + item.quantity, 0);
        
        if (eligibleQty >= offer.conditions.minQuantity) {
          const normalPrice = eligibleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          const promoPrice = eligibleQty * offer.discount.value;
          const savings = normalPrice - promoPrice;
          
          if (savings > 0) {
            currentDiscount += savings;
            promoTexts.push(offer.title);
          }
        }
      }

      if (offer.type === 'COMBO') {
        const comboIds = offer.conditions.productIds || [];
        if (comboIds.length > 0) {
          const comboItemsInCart = comboIds.map(id => state.items.find(i => i.productId === id));
          
          if (comboItemsInCart.every(item => item !== undefined)) {
            const combosPossible = Math.min(...comboItemsInCart.map(item => item.quantity));
            
            const normalComboPrice = combosPossible * comboItemsInCart.reduce((sum, item) => sum + item.price, 0);
            const promoComboPrice = combosPossible * offer.discount.value;
            const savings = normalComboPrice - promoComboPrice;

            if (savings > 0) {
              currentDiscount += savings;
              promoTexts.push(offer.title);
            }
          }
        }
      }
    });

    if (appliedPromoCode) {
      const promoOffer = activeOffers.find(o => o.type === 'PROMO_CODE' && o.promoCode === appliedPromoCode);
      if (promoOffer) {
        const remainingSubtotal = Math.max(0, subTotal - currentDiscount);
        let manualDiscount = 0;
        
        if (promoOffer.discount.type === 'PERCENTAGE') {
          manualDiscount = remainingSubtotal * (promoOffer.discount.value / 100);
        } else if (promoOffer.discount.type === 'FIXED_AMOUNT') {
          manualDiscount = promoOffer.discount.value;
        }
        
        currentDiscount += manualDiscount;
        promoTexts.push(`Cupón ${appliedPromoCode} aplicado`);
      }
    }

    if (currentDiscount > subTotal) {
      currentDiscount = subTotal; 
    }

    return {
      discountAmount: currentDiscount,
      finalTotal: subTotal - currentDiscount,
      activePromosText: promoTexts
    };
  }, [state.items, subTotal, activeOffers, appliedPromoCode]);

  const applyPromoCode = (code) => {
    const formattedCode = code.trim().toUpperCase();
    const offer = activeOffers.find(o => o.type === 'PROMO_CODE' && o.promoCode === formattedCode);
    if (!offer) {
      setPromoError('Cupón inválido o expirado.');
      return false;
    }
    setAppliedPromoCode(formattedCode);
    setPromoError('');
    return true;
  };

  const removePromoCode = () => {
    setAppliedPromoCode('');
    setPromoError('');
  };

  const addItem = (product, quantity = 1) => {
    if (totalItems + quantity > MAX_ITEMS_PER_ORDER) {
      alert(`Límite de seguridad: Solo puedes pedir ${MAX_ITEMS_PER_ORDER} artículos web. Contacta a soporte para mayoristas.`);
      return;
    }

    // Leemos el stock límite de la talla exacta
    const stockLimit = product.stockSizes ? product.stockSizes[product.size] : (product.stock !== undefined ? product.stock : product.stockLimits);
    const existingItem = state.items.find(i => i.productId === product.id && i.size === product.size);
    const currentQty = existingItem ? existingItem.quantity : 0;
    
    if (currentQty + quantity > stockLimit) return; 

    productService.updateCartCount(product.id, quantity); 
    dispatch({ 
      type: ACTIONS.ADD_ITEM, 
      payload: { 
        productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl,
        stockLimits: stockLimit, category: product.category, quality: product.quality,
        size: product.size, brands: product.brands, quantity 
      } 
    });
  };

  const removeItem = (productId, size) => {
    const item = state.items.find(i => i.productId === productId && i.size === size);
    if (item) productService.updateCartCount(productId, -item.quantity); 
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: { productId, size } });
  };

  const updateQuantity = (productId, size, quantity) => {
    if (quantity <= 0) { removeItem(productId, size); return; }
    const item = state.items.find(i => i.productId === productId && i.size === size);
    if (item) {
      const difference = quantity - item.quantity;
      if (totalItems + difference > MAX_ITEMS_PER_ORDER) return;
      if (difference !== 0) productService.updateCartCount(productId, difference); 
    }
    dispatch({ type: ACTIONS.UPDATE_QUANTITY, payload: { productId, size, quantity } });
  };

  const clearCart = () => {
    state.items.forEach(item => productService.updateCartCount(item.productId, -item.quantity));
    dispatch({ type: ACTIONS.CLEAR_CART });
  };

  return (
    <CartContext.Provider value={{ 
      cart: state.items, total: finalTotal, subTotal, totalItems, addItem, removeItem, updateQuantity, clearCart, cartTimeLeft: timeLeftStr, discountAmount, activePromosText, appliedPromoCode, promoError, applyPromoCode, removePromoCode 
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