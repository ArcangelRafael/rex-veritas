import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService'; 
import { ShoppingCart, Rocket, Flame } from 'lucide-react'; 

export const ProductCard = ({ product, onOpenModal }) => {
  const { addItem, cart } = useCart();
  
  const [isHovered, setIsHovered] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  const defaultSize = useMemoSize(product);
  const [selectedSize, setSelectedSize] = useState(defaultSize);

  function useMemoSize(prod) {
    const sizesObj = prod.stockSizes || { UNITALLA: prod.stock || 0 };
    const available = Object.entries(sizesObj).find(([_, qty]) => Number(qty) > 0);
    return available ? available[0] : Object.keys(sizesObj)[0] || 'UNITALLA';
  }

  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : (product.imageUrl ? [product.imageUrl] : []);

  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setIsImgLoaded(false); 
        setCurrentImgIndex(prev => (prev + 1) % images.length);
      }, 2000);
    } else {
      if (currentImgIndex !== 0) {
        setIsImgLoaded(false);
        setCurrentImgIndex(0);
      }
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length, currentImgIndex]);

  const cartItem = cart.find(item => item.productId === product.id && item.size === selectedSize);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  
  const stockSizesMap = product.stockSizes || { UNITALLA: product.stock || 0 };
  const stockForSelectedSize = Number(stockSizesMap[selectedSize]) || 0;
  const availableStockForSize = stockForSelectedSize - quantityInCart;
  
  const totalStockAllSizes = Object.values(stockSizesMap).reduce((acc, curr) => acc + Number(curr), 0);
  const isTotallyOutOfStock = totalStockAllSizes <= 0;

  // Filtramos las tallas que tienen al menos 1 de stock para las mini-etiquetas de la imagen
  const availableSizesPills = Object.entries(stockSizesMap)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([size]) => size);

  const displayBrand = product.brands && product.brands.length > 1 
    ? product.brands.join(' X ') 
    : (product.brand || 'Sin Marca');

  const handleAddToCart = async (e) => {
    e.stopPropagation(); 
    if (availableStockForSize <= 0) return;

    addItem({ ...product, size: selectedSize }, 1);
    
    if (availableStockForSize - 1 === 0) {
      await productService.updateCartCount(product.id, 1);
    }
  };

  const isHighlyRequested = product.inCartsCount >= totalStockAllSizes;
  const rStatus = product.restockStatus || 'SOON';

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenModal(product)}
      className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group h-full ${isTotallyOutOfStock ? 'opacity-90' : ''}`}
    >
      <div className={`relative h-64 bg-gray-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden transition-colors ${isTotallyOutOfStock ? 'grayscale' : ''}`}>
        
        {isTotallyOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="bg-red-600/90 text-white font-black text-xl md:text-2xl tracking-[0.3em] py-2 w-[150%] text-center transform -rotate-45 shadow-2xl border-y-4 border-red-700/80">
              AGOTADO
            </div>
          </div>
        )}

        {isTotallyOutOfStock && rStatus !== 'NONE' && (
          <div className="absolute top-1/2 left-0 w-full flex justify-center z-20 pointer-events-none translate-y-8">
            <span className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-slate-700 uppercase tracking-widest">
              {rStatus === 'DATE' && product.restockDate
                ? `Restock: ${new Date(product.restockDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`
                : 'PRÓXIMAMENTE'}
            </span>
          </div>
        )}

        {!isImgLoaded && images.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-slate-700 animate-pulse">
            <img 
              src="/rexveritatislogo.webp" 
              alt="Cargando..." 
              className="h-16 w-auto opacity-20 dark:opacity-30 object-contain grayscale"
            />
          </div>
        )}

        {images.length > 0 ? (
          <img 
            src={images[currentImgIndex]} 
            alt={product.name} 
            onLoad={() => setIsImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            Sin imagen
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          <span className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded w-max shadow-sm backdrop-blur-sm">
            {displayBrand}
          </span>
          
          {/* NUEVO: Mini-etiquetas de tallas disponibles */}
          {availableSizesPills.length > 0 && !isTotallyOutOfStock && (
            <div className="flex flex-wrap gap-1 max-w-[130px] sm:max-w-[160px]">
              {availableSizesPills.map(size => (
                <span key={size} className="bg-white/95 dark:bg-slate-700/95 text-slate-800 dark:text-gray-200 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm border border-gray-200/50 dark:border-slate-600/50">
                  {size}
                </span>
              ))}
            </div>
          )}

          {product.quality && product.quality !== 'N/A' && (
            <span className="bg-blue-900/95 dark:bg-blue-800/95 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded w-max shadow-sm backdrop-blur-sm tracking-wide">
              {product.quality}
            </span>
          )}
        </div>

        {product.isBoosted && !isTotallyOutOfStock && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-md animate-pulse z-10">
            <Rocket className="h-4 w-4" />
          </div>
        )}

        {isHighlyRequested && totalStockAllSizes > 0 && !isTotallyOutOfStock && (
          <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 dark:bg-black/70 backdrop-blur-sm text-yellow-400 text-[10px] sm:text-[11px] font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 border-t border-slate-700/50 z-20">
            <Flame className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 animate-pulse" />
            <span className="truncate">¡{product.inCartsCount} {product.inCartsCount === 1 ? 'persona lo tiene' : 'personas lo tienen'} en su carrito! Gánalo.</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow relative z-10">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1" title={product.name}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
          {product.description || 'Sin descripción detallada.'}
        </p>

        {!isTotallyOutOfStock && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Selecciona Talla:</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(stockSizesMap).map(([sizeKey, qty]) => {
                const isOutOfThisSize = Number(qty) <= 0;
                const isSelected = selectedSize === sizeKey;
                return (
                  <button
                    key={sizeKey}
                    disabled={isOutOfThisSize}
                    onClick={() => setSelectedSize(sizeKey)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      isOutOfThisSize 
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 line-through cursor-not-allowed'
                        : isSelected
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sizeKey}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 mt-auto">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            ${product.price.toLocaleString('es-MX')}
          </span>
          <span className={`text-xs font-bold ${availableStockForSize <= 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            Stock ({selectedSize}): {availableStockForSize}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={availableStockForSize <= 0 || isTotallyOutOfStock}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-bold transition-colors relative z-20 mt-auto ${
            availableStockForSize <= 0 || isTotallyOutOfStock
              ? 'bg-gray-100 dark:bg-slate-800 text-red-500 dark:text-red-400 cursor-not-allowed border border-red-200 dark:border-red-900/50'
              : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:transform active:scale-95'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{availableStockForSize <= 0 ? 'Sin stock en esta talla' : 'Agregar al Carrito'}</span>
        </button>
      </div>
    </div>
  );
};