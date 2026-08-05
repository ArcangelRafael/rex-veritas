import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { messageService } from '../services/messageService'; 
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { Loader2, SearchX, X, ChevronLeft, ChevronRight, ShoppingCart, ZoomIn, ZoomOut, Minus, Plus, Search, MessageCircle, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addItem, updateQuantity, cart } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImgIndex, setModalImgIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  
  const [isModalImgLoaded, setIsModalImgLoaded] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({ phone: '', subject: '', text: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState(''); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        const inStockProducts = data.filter(p => p.stock > 0);
        setProducts(inStockProducts);
      } catch (err) {
        setError('No pudimos cargar el catálogo. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const dynamicCategories = useMemo(() => {
    const validProducts = products.filter(p => 
      (selectedBrand === 'ALL' || (p.brands?.length ? p.brands : [p.brand]).includes(selectedBrand)) &&
      (selectedSize === 'ALL' || p.size === selectedSize) &&
      (selectedQuality === 'ALL' || p.quality === selectedQuality)
    );
    return ['ALL', ...new Set(validProducts.map(p => p.category).filter(Boolean))];
  }, [products, selectedBrand, selectedSize, selectedQuality]);

  const dynamicQualities = useMemo(() => {
    const validProducts = products.filter(p => 
      (selectedCategory === 'ALL' || p.category === selectedCategory) &&
      (selectedBrand === 'ALL' || (p.brands?.length ? p.brands : [p.brand]).includes(selectedBrand)) &&
      (selectedSize === 'ALL' || p.size === selectedSize)
    );
    return ['ALL', ...new Set(validProducts.map(p => p.quality).filter(Boolean))];
  }, [products, selectedCategory, selectedBrand, selectedSize]);

  const dynamicBrands = useMemo(() => {
    const validProducts = products.filter(p => 
      (selectedCategory === 'ALL' || p.category === selectedCategory) &&
      (selectedSize === 'ALL' || p.size === selectedSize) &&
      (selectedQuality === 'ALL' || p.quality === selectedQuality)
    );
    const allBrands = validProducts.flatMap(p => p.brands?.length ? p.brands : [p.brand]);
    return ['ALL', ...new Set(allBrands.filter(Boolean))];
  }, [products, selectedCategory, selectedSize, selectedQuality]);

  const dynamicSizes = useMemo(() => {
    const validProducts = products.filter(p => 
      (selectedCategory === 'ALL' || p.category === selectedCategory) &&
      (selectedBrand === 'ALL' || (p.brands?.length ? p.brands : [p.brand]).includes(selectedBrand)) &&
      (selectedQuality === 'ALL' || p.quality === selectedQuality)
    );
    return ['ALL', ...new Set(validProducts.map(p => p.size).filter(Boolean))];
  }, [products, selectedCategory, selectedBrand, selectedQuality]);

  useEffect(() => {
    if (selectedCategory !== 'ALL' && !dynamicCategories.includes(selectedCategory)) setSelectedCategory('ALL');
  }, [dynamicCategories, selectedCategory]);

  useEffect(() => {
    if (selectedQuality !== 'ALL' && !dynamicQualities.includes(selectedQuality)) setSelectedQuality('ALL');
  }, [dynamicQualities, selectedQuality]);

  useEffect(() => {
    if (selectedBrand !== 'ALL' && !dynamicBrands.includes(selectedBrand)) setSelectedBrand('ALL');
  }, [dynamicBrands, selectedBrand]);

  useEffect(() => {
    if (selectedSize !== 'ALL' && !dynamicSizes.includes(selectedSize)) setSelectedSize('ALL');
  }, [dynamicSizes, selectedSize]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const productBrands = product.brands?.length ? product.brands : [product.brand];
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = selectedBrand === 'ALL' || productBrands.includes(selectedBrand);
      const matchSize = selectedSize === 'ALL' || product.size === selectedSize;
      const matchCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
      const matchQuality = selectedQuality === 'ALL' || product.quality === selectedQuality;

      return matchSearch && matchBrand && matchSize && matchCategory && matchQuality;
    });
  }, [products, searchTerm, selectedBrand, selectedSize, selectedCategory, selectedQuality]);

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalImgIndex(0);
    setIsZoomed(false);
    setIsModalImgLoaded(false); 
    setZoomOrigin('50% 50%');
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsZoomed(false);
    document.body.style.overflow = 'auto'; 
  };

  const nextModalImage = (e) => {
    e.stopPropagation();
    setIsModalImgLoaded(false); 
    const images = selectedProduct.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct.imageUrl];
    setModalImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevModalImage = (e) => {
    e.stopPropagation();
    setIsModalImgLoaded(false); 
    const images = selectedProduct.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct.imageUrl];
    setModalImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
    if (!isZoomed) setZoomOrigin('50% 50%'); 
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBrand('ALL');
    setSelectedSize('ALL');
    setSelectedCategory('ALL');
    setSelectedQuality('ALL');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError(''); 
    try {
      await messageService.addMessage(contactData);
      setContactSuccess(true);
      
      setTimeout(() => {
        setShowContactModal(false);
        setContactSuccess(false);
        setContactData({ phone: '', subject: '', text: '' }); 
      }, 5000); 

    } catch (error) {
      console.error(error);
      setContactError("De momento no es posible dejarnos un mensaje, estamos trabajando para resolverlo a la brevedad posible!");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-slate-900 dark:text-white animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando el inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg inline-block">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      
      <div className="mb-6 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Catálogo de Productos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Encuentra tus favoritos más rápido.</p>
          </div>

          <div className="relative w-full md:w-72 lg:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Producto</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors">
              {dynamicCategories.map(cat => <option key={cat} value={cat}>{cat === 'ALL' ? 'Todos' : cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Calidad</label>
            <select value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors">
              {dynamicQualities.map(q => <option key={q} value={q}>{q === 'ALL' ? 'Todas' : q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Marca</label>
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors">
              {dynamicBrands.map(brand => <option key={brand} value={brand}>{brand === 'ALL' ? 'Todas' : brand}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Talla</label>
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors">
              {dynamicSizes.map(size => <option key={size} value={size}>{size === 'ALL' ? 'Todas' : size}</option>)}
            </select>
          </div>
        </div>

        {(searchTerm !== '' || selectedBrand !== 'ALL' || selectedSize !== 'ALL' || selectedCategory !== 'ALL' || selectedQuality !== 'ALL') && (
          <div className="mt-4 flex justify-end">
             <button onClick={clearFilters} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
               Limpiar todos los filtros
             </button>
          </div>
        )}
      </div>

      <div className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-lg border border-slate-700">
        <div className="text-white text-center md:text-left mb-6 md:mb-0">
          <h3 className="text-xl md:text-2xl font-black tracking-wide">¿No encuentras un modelo en específico o quieres comprar por mayoreo?</h3>
          <p className="text-slate-300 font-medium mt-2 text-sm md:text-base">Escríbenos y un asesor de Rex-Veritatis te contactará a la brevedad posible.</p>
        </div>
        <button 
          onClick={() => { setShowContactModal(true); setContactError(''); }}
          className="flex-shrink-0 flex items-center space-x-2 bg-white text-slate-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-black tracking-wide shadow-md hover:scale-105 transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          <span>Déjanos un Mensaje</span>
        </button>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onOpenModal={openModal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
          <SearchX className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No encontramos productos</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Intenta cambiar o limpiar los filtros de búsqueda.</p>
          <button onClick={clearFilters} className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Limpiar filtros
          </button>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800 relative">
            
            {contactSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase">Mensaje Enviado Correctamente</h3>
                <p className="text-gray-600 dark:text-gray-300 font-bold leading-relaxed">GRACIAS POR CONTACTARNOS, TRATAREMOS DE PONERNOS CONTIGO LO MÁS RÁPIDO POSIBLE.</p>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800 p-2 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Contáctanos</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">Déjanos tus datos y lo que necesitas. Te responderemos por WhatsApp.</p>

                {contactError && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-3 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 dark:text-red-400 font-bold text-sm leading-snug">{contactError}</p>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tu número de WhatsApp</label>
                    <input 
                      type="tel" 
                      required 
                      value={contactData.phone}
                      onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                      placeholder="Ej. 462 123 4567" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Asunto / Tema</label>
                    <input 
                      type="text" 
                      required 
                      value={contactData.subject}
                      onChange={(e) => setContactData({...contactData, subject: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                      placeholder="Ej. Compras por mayoreo" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
                    <textarea 
                      required
                      rows="4"
                      value={contactData.text}
                      onChange={(e) => setContactData({...contactData, text: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors resize-none" 
                      placeholder="Escribe aquí los modelos que buscas o tus dudas..."
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={contactLoading}
                    className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2 shadow-lg"
                  >
                    {contactLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div 
          onClick={closeModal} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-80 backdrop-blur-sm overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] md:h-[600px] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 transition-colors my-auto"
          >
            <div 
              className={`w-full md:w-1/2 h-56 sm:h-64 md:h-full bg-gray-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0 ${isZoomed ? 'cursor-move' : 'cursor-zoom-in'} group transition-colors`} 
              onClick={toggleZoom}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
              {(() => {
                const images = selectedProduct.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct.imageUrl];
                return (
                  <>
                    {/* --- SKELETON LOADER EN EL MODAL --- */}
                    {!isModalImgLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-slate-700 animate-pulse">
                        <img 
                          src="/rexveritatislogo.webp" 
                          alt="Cargando..." 
                          className="h-20 sm:h-24 w-auto opacity-20 dark:opacity-30 object-contain grayscale"
                        />
                      </div>
                    )}
                    
                    <img 
                      src={images[modalImgIndex]} 
                      alt={selectedProduct.name} 
                      onLoad={() => setIsModalImgLoaded(true)}
                      style={{ transformOrigin: isZoomed ? zoomOrigin : 'center' }}
                      className={`w-full h-full object-cover transition-all duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'} ${isModalImgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                    
                    {images.length > 1 && !isZoomed && (
                      <>
                        <button onClick={prevModalImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 p-2 rounded-full shadow hover:bg-white dark:hover:bg-slate-900 transition-colors z-10">
                          <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                        </button>
                        <button onClick={nextModalImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 p-2 rounded-full shadow hover:bg-white dark:hover:bg-slate-900 transition-colors z-10">
                          <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                        </button>
                        <div className="absolute bottom-4 left-0 w-full flex justify-center space-x-2 z-10">
                          {images.map((_, idx) => (
                            <div key={idx} className={`h-2 rounded-full transition-all ${idx === modalImgIndex ? 'w-6 bg-slate-900 dark:bg-white' : 'w-2 bg-gray-400 dark:bg-gray-600'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-lg shadow backdrop-blur-sm pointer-events-none z-10">
                {isZoomed ? <ZoomOut className="h-5 w-5 text-gray-800 dark:text-gray-200" /> : <ZoomIn className="h-5 w-5 text-gray-800 dark:text-gray-200" />}
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 p-4 sm:p-6 md:p-8 bg-white dark:bg-slate-900 overflow-y-auto">
              <div className="flex-shrink-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1 block">
                      {selectedProduct.brands?.length > 1 ? selectedProduct.brands.join(' X ') : (selectedProduct.brand || 'Sin Marca')}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{selectedProduct.name}</h2>
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedProduct.category && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-bold">{selectedProduct.category}</span>}
                      {selectedProduct.quality && selectedProduct.quality !== 'N/A' && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-bold">{selectedProduct.quality}</span>}
                    </div>
                  </div>
                  
                  <button onClick={closeModal} className="p-2 bg-red-500 dark:bg-red-600 rounded-full text-white hover:bg-red-600 dark:hover:bg-red-700 transition-colors flex-shrink-0 shadow-md">
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">${selectedProduct.price.toLocaleString('es-MX')}</span>
                  <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    Talla: {selectedProduct.size}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[80px] my-2 pr-1 overflow-y-auto">
                <h4 className="text-gray-900 dark:text-white font-bold mb-1 text-sm sm:text-base sticky top-0 bg-white dark:bg-slate-900 py-1 z-10">Descripción del Producto</h4>
                <p className="whitespace-pre-line text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedProduct.description || 'Este producto no cuenta con descripción detallada en este momento.'}
                </p>
              </div>

              <div className="flex-shrink-0 pt-4 border-t border-gray-100 dark:border-slate-800 mt-auto">
                {(() => {
                  const cartItem = cart.find(item => item.productId === selectedProduct.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  const availableStock = selectedProduct.stock - quantityInCart;
                  const isOutOfStock = availableStock <= 0;

                  return (
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-1">
                        {quantityInCart > 0 ? (
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1.5 sm:p-2 w-full">
                            <button onClick={() => updateQuantity(selectedProduct.id, quantityInCart - 1)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"><Minus className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">{quantityInCart}</span>
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">en carrito</span>
                            </div>
                            <button onClick={() => addItem(selectedProduct)} disabled={isOutOfStock} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-slate-900 dark:bg-slate-700 rounded-lg shadow-sm text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"><Plus className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(selectedProduct)} disabled={isOutOfStock} className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg flex justify-center items-center space-x-2 sm:space-x-3 transition-transform ${isOutOfStock ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-95'}`}>
                            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                            <span>{isOutOfStock ? 'Agotado Temporalmente' : 'Añadir al Carrito'}</span>
                          </button>
                        )}
                      </div>
                      <div className="text-center px-2 sm:px-4">
                        <span className="block text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Stock</span>
                        <span className={`text-base sm:text-lg font-black ${availableStock > 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>{availableStock}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};