import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { Loader2, SearchX, X, ChevronLeft, ChevronRight, ShoppingCart, ZoomIn, ZoomOut, Minus, Plus, Search } from 'lucide-react';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { addItem, updateQuantity, cart } = useCart();

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');

  // --- ESTADOS DEL MODAL ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImgIndex, setModalImgIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

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

  // --- EXTRACCIÓN DINÁMICA DE OPCIONES ---
  const brands = useMemo(() => {
    const allBrands = products.flatMap(p => p.brands?.length ? p.brands : [p.brand]);
    return ['ALL', ...new Set(allBrands.filter(Boolean))];
  }, [products]);
  
  const sizes = useMemo(() => ['ALL', ...new Set(products.map(p => p.size).filter(Boolean))], [products]);
  const categories = useMemo(() => ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const qualities = useMemo(() => ['ALL', ...new Set(products.map(p => p.quality).filter(Boolean))], [products]);

  // --- BÚSQUEDA Y FILTRADO ---
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

  // --- FUNCIONES DEL MODAL ---
  const openModal = (product) => {
    setSelectedProduct(product);
    setModalImgIndex(0);
    setIsZoomed(false);
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
    const images = selectedProduct.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct.imageUrl];
    setModalImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevModalImage = (e) => {
    e.stopPropagation();
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
      
      {/* CABECERA Y PANEL DE FILTROS */}
      <div className="mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
        
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat === 'ALL' ? 'Todos' : cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Calidad</label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors"
            >
              {qualities.map(q => <option key={q} value={q}>{q === 'ALL' ? 'Todas' : q}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Marca</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors"
            >
              {brands.map(brand => <option key={brand} value={brand}>{brand === 'ALL' ? 'Todas' : brand}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Talla</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none text-slate-900 dark:text-white transition-colors"
            >
              {sizes.map(size => <option key={size} value={size}>{size === 'ALL' ? 'Todas' : size}</option>)}
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

      {/* GRILLA DE PRODUCTOS */}
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

      {/* MODAL DE PRODUCTO ACTUALIZADO (ESTRUCTURA RÍGIDA) */}
      {selectedProduct && (
        <div 
          onClick={closeModal} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            // NUEVO: Altura fija obligatoria md:h-[600px] para estandarizar el tamaño de todas las tarjetas
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:h-[600px] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
          >
            {/* PANEL IZQUIERDO: IMAGEN */}
            <div 
              className={`w-full md:w-1/2 h-64 md:h-full bg-gray-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0 ${isZoomed ? 'cursor-move' : 'cursor-zoom-in'} group transition-colors`} 
              onClick={toggleZoom}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomOrigin('50% 50%')}
            >
              {(() => {
                const images = selectedProduct.imageUrls?.length ? selectedProduct.imageUrls : [selectedProduct.imageUrl];
                return (
                  <>
                    <img 
                      src={images[modalImgIndex]} 
                      alt={selectedProduct.name} 
                      style={{ transformOrigin: isZoomed ? zoomOrigin : 'center' }}
                      className={`w-full h-full object-cover transition-transform duration-200 ${isZoomed ? 'scale-[2.5]' : 'scale-100'}`}
                    />
                    
                    {images.length > 1 && !isZoomed && (
                      <>
                        <button onClick={prevModalImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 p-2 rounded-full shadow hover:bg-white dark:hover:bg-slate-900 transition-colors">
                          <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                        </button>
                        <button onClick={nextModalImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-900/80 p-2 rounded-full shadow hover:bg-white dark:hover:bg-slate-900 transition-colors">
                          <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                        </button>
                        <div className="absolute bottom-4 left-0 w-full flex justify-center space-x-2">
                          {images.map((_, idx) => (
                            <div key={idx} className={`h-2 rounded-full transition-all ${idx === modalImgIndex ? 'w-6 bg-slate-900 dark:bg-white' : 'w-2 bg-gray-400 dark:bg-gray-600'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

              <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 p-1.5 rounded-lg shadow backdrop-blur-sm pointer-events-none">
                {isZoomed ? <ZoomOut className="h-5 w-5 text-gray-800 dark:text-gray-200" /> : <ZoomIn className="h-5 w-5 text-gray-800 dark:text-gray-200" />}
              </div>
            </div>

            {/* PANEL DERECHO: DETALLES Y BOTONES */}
            <div className="w-full md:w-1/2 flex flex-col flex-1 min-h-0 p-5 md:p-8 bg-white dark:bg-slate-900">
              
              {/* BLOQUE SUPERIOR (Fijo) */}
              <div className="flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1 block">
                      {selectedProduct.brands?.length > 1 ? selectedProduct.brands.join(' X ') : (selectedProduct.brand || 'Sin Marca')}
                    </span>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{selectedProduct.name}</h2>
                    
                    <div className="flex space-x-2 mt-2">
                      {selectedProduct.category && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-bold">{selectedProduct.category}</span>}
                      {selectedProduct.quality && selectedProduct.quality !== 'N/A' && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-md font-bold">{selectedProduct.quality}</span>}
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">${selectedProduct.price.toLocaleString('es-MX')}</span>
                  <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-bold">
                    Talla: {selectedProduct.size}
                  </span>
                </div>
              </div>

              {/* BLOQUE DE DESCRIPCIÓN (Scrollable) */}
              {/* NUEVO: flex-1 con overflow-y-auto confina el texto excesivo dentro del contenedor */}
              <div className="flex-1 overflow-y-auto pr-3 mb-4">
                {/* sticky top-0 hace que el título de la descripción no se mueva al scrollear */}
                <h4 className="text-gray-900 dark:text-white font-bold mb-2 sticky top-0 bg-white dark:bg-slate-900 pb-2">Descripción del Producto</h4>
                <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedProduct.description || 'Este producto no cuenta con descripción detallada en este momento.'}
                </p>
              </div>

              {/* BLOQUE INFERIOR DE ACCIONES (Fijo) */}
              <div className="flex-shrink-0 pt-5 border-t border-gray-100 dark:border-slate-800">
                {(() => {
                  const cartItem = cart.find(item => item.productId === selectedProduct.id);
                  const quantityInCart = cartItem ? cartItem.quantity : 0;
                  const availableStock = selectedProduct.stock - quantityInCart;
                  const isOutOfStock = availableStock <= 0;

                  return (
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        {quantityInCart > 0 ? (
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 w-full">
                            
                            <button
                              onClick={() => updateQuantity(selectedProduct.id, quantityInCart - 1)}
                              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{quantityInCart}</span>
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">en carrito</span>
                            </div>
                            
                            <button
                              onClick={() => addItem(selectedProduct)}
                              disabled={isOutOfStock}
                              className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-slate-700 rounded-lg shadow-sm text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(selectedProduct)}
                            disabled={isOutOfStock}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center space-x-3 transition-transform ${
                              isOutOfStock ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-95'
                            }`}
                          >
                            <ShoppingCart className="h-6 w-6" />
                            <span>{isOutOfStock ? 'Agotado Temporalmente' : 'Añadir al Carrito'}</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="text-center px-4">
                        <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Stock</span>
                        <span className={`text-lg font-black ${availableStock > 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
                          {availableStock}
                        </span>
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