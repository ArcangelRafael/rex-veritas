import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Rocket, Flame } from 'lucide-react'; 

export const ProductCard = ({ product, onOpenModal }) => {
  const { addItem, cart } = useCart();
  
  const [isHovered, setIsHovered] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImgIndex(prev => (prev + 1) % images.length);
      }, 2000);
    } else {
      setCurrentImgIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const cartItem = cart.find(item => item.productId === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const availableStock = product.stock - quantityInCart;
  const isOutOfStock = availableStock <= 0;

  const displayBrand = product.brands && product.brands.length > 1 
    ? product.brands.join(' X ') 
    : (product.brand || 'Sin Marca');

  // LA LÓGICA INTELIGENTE: Solo muestra el FOMO si las personas que lo tienen en el carrito 
  // igualan o superan el stock en la base de datos.
  const isHighlyRequested = product.inCartsCount >= product.stock;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenModal(product)}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group"
    >
      <div className="relative h-64 bg-gray-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden transition-colors">
        {images.length > 0 ? (
          <img 
            src={images[currentImgIndex]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            Sin imagen
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded">
            {displayBrand}
          </span>
          <span className="bg-gray-200 dark:bg-slate-800 text-slate-800 dark:text-gray-200 text-xs font-bold px-2 py-1 rounded w-max">
            Talla: {product.size}
          </span>
        </div>

        {product.isBoosted && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md animate-pulse">
            <Rocket className="h-4 w-4" />
          </div>
        )}
      </div>

      {isHighlyRequested && product.stock > 0 && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-[11px] sm:text-xs font-black px-3 py-2 flex items-center gap-2 border-b border-yellow-200 dark:border-yellow-800/50 animate-pulse tracking-wide">
          <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />
          <span>¡{product.inCartsCount} {product.inCartsCount === 1 ? 'persona lo tiene' : 'personas lo tienen'} en su carrito! Gánalo.</span>
        </div>
      )}

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1" title={product.name}>
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
          {product.description || 'Sin descripción detallada.'}
        </p>
        
        <div className="flex items-center justify-between mb-4 mt-auto">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            ${product.price.toLocaleString('es-MX')}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Stock: {availableStock}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); addItem(product); }}
          disabled={isOutOfStock}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-bold transition-colors ${
            isOutOfStock 
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:transform active:scale-95'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}</span>
        </button>
      </div>
    </div>
  );
};