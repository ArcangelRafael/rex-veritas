import { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Sparkles, Tag, Gift, Plus, ShoppingCart, Clock, CalendarClock } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const PromoBanner = ({ offer, products = [], onOpenModal, onFilterBundle }) => {
  const [copied, setCopied] = useState(false);
  const [addedBoth, setAddedBoth] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  
  const { addItem } = useCart();

  const isFutureOffer = new Date(offer.startDate).getTime() > new Date().getTime();

  useEffect(() => {
    if (!offer.endDate || isFutureOffer) return; 

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(offer.endDate).getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(timer);
        setIsExpired(true); 
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [offer.endDate, isFutureOffer]);

  if (isExpired) return null; 

  const handleCopy = (e) => {
    e.stopPropagation();
    if (offer.promoCode) {
      navigator.clipboard.writeText(offer.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const getOfferText = () => {
    if (offer.type === 'PROMO_CODE') return `¡Usa el código al finalizar tu compra y obtén ${offer.discount.value}% de descuento!`;
    if (offer.type === 'THRESHOLD') return `¡En compras mayores a $${offer.conditions.minSubtotal}, te descontamos el ${offer.discount.value}% automáticamente!`;
    if (offer.type === 'BUNDLE') return `¡Lleva ${offer.conditions.minQuantity} artículos de ${offer.conditions.targetCategory === 'ALL' ? 'cualquier categoría' : offer.conditions.targetCategory} por solo $${offer.discount.value} cada uno!`;
    if (offer.type === 'COMBO') return `¡Añade la oferta exacta al carrito y paga el precio especial!`;
    return offer.description || '¡Aprovecha esta promoción exclusiva!';
  };

  const getComboProducts = () => {
    if (offer.type !== 'COMBO' || !offer.conditions?.productIds) return null;
    const prods = offer.conditions.productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    if (prods.length === 0) return null;
    const originalPrice = prods.reduce((sum, p) => sum + p.price, 0);
    return { products: prods, originalPrice };
  };

  const comboDetails = getComboProducts();
  const isComboOutOfStock = comboDetails?.products?.some(p => p.stock <= 0) || false;

  const handleAddComboToCart = (e) => {
    e.stopPropagation();
    if (!comboDetails?.products || comboDetails.products.length === 0) return;
    if (isComboOutOfStock) {
      alert("Lo sentimos, uno de los productos de esta oferta está agotado.");
      return;
    }
    comboDetails.products.forEach(p => addItem(p, 1));
    setAddedBoth(true);
    setTimeout(() => setAddedBoth(false), 2500); 
  };

  const handleBundleClick = (e) => {
    e.stopPropagation();
    if (offer.type === 'BUNDLE' && onFilterBundle) {
      // Pasamos también la Calidad al catálogo
      onFilterBundle(offer.conditions.targetCategory, offer.conditions.targetBrand, offer.conditions.targetQuality);
    }
  };

  const renderCountdown = () => {
    if (!timeLeft) return null;
    return (
      <div className="flex items-center space-x-2 mt-4 justify-center xl:justify-start">
        <Clock className="h-5 w-5 text-blue-400 mr-1 md:mr-2 animate-pulse flex-shrink-0" />
        <div className="flex space-x-1 md:space-x-2">
          <div className="flex flex-col items-center bg-slate-950/50 rounded-lg p-1.5 md:p-2 min-w-[45px] md:min-w-[55px] border border-white/10 shadow-inner">
            <span className="text-lg md:text-xl font-black text-white leading-none">{timeLeft.days}</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-blue-200 mt-1">Días</span>
          </div>
          <span className="text-white/30 font-bold self-start mt-1">:</span>
          <div className="flex flex-col items-center bg-slate-950/50 rounded-lg p-1.5 md:p-2 min-w-[45px] md:min-w-[55px] border border-white/10 shadow-inner">
            <span className="text-lg md:text-xl font-black text-white leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-blue-200 mt-1">Hrs</span>
          </div>
          <span className="text-white/30 font-bold self-start mt-1">:</span>
          <div className="flex flex-col items-center bg-slate-950/50 rounded-lg p-1.5 md:p-2 min-w-[45px] md:min-w-[55px] border border-white/10 shadow-inner">
            <span className="text-lg md:text-xl font-black text-white leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-blue-200 mt-1">Min</span>
          </div>
          <span className="text-white/30 font-bold self-start mt-1">:</span>
          <div className="flex flex-col items-center bg-slate-950/50 rounded-lg p-1.5 md:p-2 min-w-[45px] md:min-w-[55px] border border-red-500/30 bg-red-500/10 shadow-inner">
            <span className="text-lg md:text-xl font-black text-red-400 leading-none">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-red-300 mt-1">Seg</span>
          </div>
        </div>
      </div>
    );
  };

  if (isFutureOffer) {
    return (
      <div className="relative bg-slate-900 rounded-2xl p-8 border border-yellow-500/30 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center group">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 animate-pulse"></div>
        <CalendarClock className="h-12 w-12 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h3 className="text-yellow-400 font-black tracking-widest text-xs sm:text-sm uppercase mb-3 bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20">
          Prepárate para la siguiente oferta
        </h3>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-wide drop-shadow-md">{offer.title}</h2>
        <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 shadow-inner">
          <p className="text-gray-300 font-medium text-sm md:text-lg">
            Se activará automáticamente el: <br className="md:hidden" />
            <span className="font-bold text-yellow-400 text-lg md:text-xl mt-1 block md:inline-block md:mt-0 md:ml-2">
              {new Date(offer.startDate).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-1 overflow-hidden shadow-xl group transition-all">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity animate-pulse"></div>

      <div className="relative bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between border border-white/10 overflow-hidden z-10 gap-8">

        <Gift className="absolute -right-8 -bottom-10 h-64 w-64 text-white/5 transform -rotate-12 pointer-events-none" />

        <div className="flex-1 text-center xl:text-left z-10 w-full">
          <div className="flex items-center justify-center xl:justify-start space-x-2 mb-3">
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 font-black tracking-widest text-xs uppercase bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
              Oferta Especial Activa
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight tracking-wide">{offer.title}</h3>
          <p className="text-blue-100 font-medium text-sm md:text-lg max-w-2xl mx-auto xl:mx-0">{getOfferText()}</p>
          
          {renderCountdown()}
        </div>

        <div className="flex-shrink-0 z-10 w-full xl:w-auto flex justify-center">
          
          {offer.type === 'COMBO' && comboDetails?.products?.length > 0 ? (
            
            <div className="flex flex-col bg-slate-950/60 p-4 md:p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl hover:scale-[1.02] transition-transform w-full md:w-auto">
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-5 md:mb-6">
                {comboDetails.products.map((prod, index) => (
                  <div key={prod.id} className="flex items-center gap-2 md:gap-4">
                    <div onClick={(e) => { e.stopPropagation(); onOpenModal && onOpenModal(prod); }} className="flex flex-col items-center cursor-pointer group/item w-20 md:w-28" title="Ver detalles del producto">
                      <img src={prod.imageUrl || prod.imageUrls[0]} alt={prod.name} className="h-20 w-20 md:h-28 md:w-28 object-cover rounded-xl border-2 border-transparent group-hover/item:border-blue-400 transition-all shadow-lg" />
                      <span className="text-[10px] md:text-xs text-white/80 mt-2 w-full text-center group-hover/item:text-blue-400 font-medium leading-tight line-clamp-2">{prod.name}</span>
                    </div>
                    {index < comboDetails.products.length - 1 && <Plus className="h-5 w-5 md:h-6 md:w-6 text-blue-400/50 flex-shrink-0" />}
                  </div>
                ))}

                <div className="pl-4 md:pl-6 border-l border-white/10 flex flex-col justify-center ml-2">
                  <span className="text-[10px] md:text-xs text-blue-300 font-bold uppercase tracking-wider mb-1">{comboDetails.products.length === 1 ? 'Llévalo por' : 'Lleva el combo por'}</span>
                  <span className="text-4xl md:text-5xl font-black text-white leading-none mb-1 md:mb-2">${Number(offer.discount.value).toLocaleString('es-MX')}</span>
                  <span className="text-[10px] md:text-xs text-gray-400 font-bold line-through decoration-red-500 decoration-2">Precio original: ${comboDetails.originalPrice.toLocaleString('es-MX')}</span>
                </div>
              </div>

              <button onClick={handleAddComboToCart} disabled={isComboOutOfStock || addedBoth} className={`w-full py-3 md:py-3.5 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-md ${isComboOutOfStock ? 'bg-white/10 text-white/40 cursor-not-allowed' : addedBoth ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}>
                {isComboOutOfStock ? <span>Oferta Agotada temporalmente</span> : addedBoth ? <><CheckCircle2 className="h-5 w-5" /><span>¡Añadidos al carrito!</span></> : <><ShoppingCart className="h-5 w-5" /><span>{comboDetails.products.length === 1 ? 'Añadir al carrito' : 'Añadir combo al carrito'}</span></>}
              </button>
            </div>

          ) : offer.type === 'PROMO_CODE' ? (
            
            <div className="flex flex-col items-center xl:items-end w-full md:w-auto">
              <div onClick={handleCopy} className="group/btn cursor-pointer bg-white/10 hover:bg-white/20 border border-white/20 p-5 rounded-2xl flex items-center justify-between space-x-6 transition-all shadow-inner w-full md:w-auto" title="Haz clic para copiar el código">
                <div>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 text-left">Código Promocional</p>
                  <p className="text-3xl md:text-4xl font-black text-white tracking-widest">{offer.promoCode}</p>
                </div>
                <div className="bg-blue-600 p-4 rounded-xl group-hover/btn:bg-blue-500 transition-colors shadow-md flex-shrink-0">
                  {copied ? <CheckCircle2 className="h-8 w-8 text-white" /> : <Copy className="h-8 w-8 text-white" />}
                </div>
              </div>
              
              {offer.maxUses !== null && (
                <div className="mt-3 w-full text-center xl:text-right">
                  <span className="inline-block bg-red-500/20 text-red-200 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full border border-red-500/30 shadow-sm animate-pulse">
                    🔥 ¡Solo quedan {offer.maxUses - offer.currentUses} usos disponibles! ({offer.currentUses}/{offer.maxUses})
                  </span>
                </div>
              )}
            </div>
            
          ) : offer.type === 'BUNDLE' ? (
            
            <div onClick={handleBundleClick} className="group/btn cursor-pointer bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 p-5 md:p-6 rounded-2xl flex items-center space-x-4 backdrop-blur-md w-full md:w-auto justify-center transition-all shadow-md active:scale-95" title="Filtrar el catálogo para ver productos participantes">
              <Tag className="h-12 w-12 text-blue-400 flex-shrink-0 group-hover/btn:scale-110 transition-transform" />
              <div className="text-left">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Paquete Mayorista</p>
                <p className="text-white font-black text-lg md:text-xl">Ver modelos participantes</p>
              </div>
            </div>

          ) : (
            
            <div className="bg-blue-600/20 border border-blue-500/30 p-5 md:p-6 rounded-2xl flex items-center space-x-4 backdrop-blur-md w-full md:w-auto justify-center">
              <Tag className="h-12 w-12 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Descuento Automático</p>
                <p className="text-white font-black text-lg md:text-xl">Al cumplir requisitos en carrito</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};