import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Search, Edit, TrendingUp, TrendingDown, Minus, Star, AlertTriangle, Package, Loader2, Save, X, CheckCircle2, Plus, Trash2, Rocket, Copy, EyeOff, Eye, Info, Filter } from 'lucide-react';

const DEFAULT_CATEGORIES = ['Gorra', 'Playera', 'Accesorio'];
const DEFAULT_QUALITIES = ['G5', 'Original', 'Clon', 'Premium'];

export const ProductInventory = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL'); 
  const [filterBrand, setFilterBrand] = useState('ALL');       
  
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('rex_cats')) || DEFAULT_CATEGORIES);
  const [qualities, setQualities] = useState(() => JSON.parse(localStorage.getItem('rex_quals')) || DEFAULT_QUALITIES);
  const [managingOptions, setManagingOptions] = useState(null); 
  const [newOption, setNewOption] = useState('');

  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingProductId, setProcessingDeleteId] = useState(null);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '', onConfirm: null });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg, onConfirm: null });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg, onConfirm: null });
  const showConfirm = (msg, onConfirmCallback) => setModalConfig({ isOpen: true, type: 'confirm', message: msg, onConfirm: onConfirmCallback });

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData] = await Promise.all([
        productService.getAllAdminProducts(),
        orderService.getOrders()
      ]);
      setProducts(productsData);
      setOrders(ordersData.filter(o => o.status !== 'CANCELLED'));
    } catch (error) {
      showError("Error cargando los datos de inteligencia de negocios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 1. EXTRACCIÓN DINÁMICA DE MARCAS (Vigila qué Categoría está seleccionada) ---
  const dynamicBrands = useMemo(() => {
    let filtered = products;
    if (filterCategory !== 'ALL') {
      filtered = products.filter(p => p.category === filterCategory);
    }
    const allBrands = filtered.flatMap(p => p.brands?.length ? p.brands : [p.brand]);
    return ['ALL', ...new Set(allBrands.filter(Boolean))];
  }, [products, filterCategory]);

  // --- 2. EXTRACCIÓN DINÁMICA DE CATEGORÍAS (Vigila qué Marca está seleccionada) ---
  const dynamicCategories = useMemo(() => {
    if (filterBrand === 'ALL') return categories; // Si no hay marca, muestra todas tus categorías base
    
    const availableCats = new Set(
      products.filter(p => {
        const pBrands = p.brands?.length ? p.brands : [p.brand];
        return pBrands.includes(filterBrand);
      }).map(p => p.category)
    );
    // Muestra solo las categorías de la marca que sí existen en tus categorías configuradas
    return categories.filter(c => availableCats.has(c));
  }, [products, filterBrand, categories]);

  // --- 3. SEGURO CONTRA CONFLICTOS ---
  // Si se actualiza la Categoría y la Marca actual ya no es válida, resetea la marca.
  useEffect(() => {
    if (filterBrand !== 'ALL' && !dynamicBrands.includes(filterBrand)) {
      setFilterBrand('ALL');
    }
  }, [dynamicBrands, filterBrand]);

  // Si se actualiza la Marca y la Categoría actual ya no es válida, resetea la categoría.
  useEffect(() => {
    if (filterCategory !== 'ALL' && !dynamicCategories.includes(filterCategory)) {
      setFilterCategory('ALL');
    }
  }, [dynamicCategories, filterCategory]);

  const getProductStats = (productId) => {
    const now = new Date();
    const productOrders = [];
    orders.forEach(order => {
      const item = order.items.find(i => i.productId === productId);
      if (item) productOrders.push({ qty: item.quantity, date: order.createdAt, orderId: order.id });
    });
    const totalSold = productOrders.reduce((sum, o) => sum + o.qty, 0);
    const lastOrder = productOrders.sort((a, b) => b.date - a.date)[0] || null;
    const daysSinceLastOrder = lastOrder ? (now - lastOrder.date) / (1000 * 60 * 60 * 24) : Infinity;

    const salesP1 = productOrders.filter(o => (now - o.date) / (1000 * 60 * 60 * 24) <= 7).reduce((sum, o) => sum + o.qty, 0);
    const salesP2 = productOrders.filter(o => {
      const days = (now - o.date) / (1000 * 60 * 60 * 24);
      return days > 7 && days <= 14;
    }).reduce((sum, o) => sum + o.qty, 0);

    let category = 'NORMAL';
    if (totalSold >= 10 && daysSinceLastOrder <= 30) category = 'ESTRELLA';
    else if (totalSold <= 2 || daysSinceLastOrder > 45) category = 'POCO_RECURRENTE';

    let momentum = 'ESTABLE';
    if (salesP1 >= (salesP2 * 1.5) || (salesP2 === 0 && salesP1 > 1)) momentum = 'ASCENSO';
    else if (salesP2 > 0 && salesP1 <= (salesP2 * 0.5)) momentum = 'DESCENSO';

    return { totalSold, lastOrder, category, momentum };
  };

  const saveOptions = (type, newArr) => {
    if(type === 'categories') { setCategories(newArr); localStorage.setItem('rex_cats', JSON.stringify(newArr)); }
    if(type === 'qualities') { setQualities(newArr); localStorage.setItem('rex_quals', JSON.stringify(newArr)); }
  };
  const handleAddOption = () => {
    if(!newOption.trim()) return;
    const current = managingOptions === 'categories' ? categories : qualities;
    if(!current.includes(newOption.trim())) saveOptions(managingOptions, [...current, newOption.trim()]);
    setNewOption('');
  };
  const handleRemoveOption = (opt) => {
    const current = managingOptions === 'categories' ? categories : qualities;
    saveOptions(managingOptions, current.filter(o => o !== opt));
  };

  const handleDeleteProduct = (productId, productName) => {
    showConfirm(`¿Seguro que deseas eliminar definitivamente "${productName}"? Esta acción no se puede deshacer.`, async () => {
      closeModal();
      try {
        setProcessingDeleteId(productId);
        await productService.deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        showSuccess("Producto eliminado correctamente.");
      } catch (err) {
        showError("Error al eliminar el producto.");
      } finally {
        setProcessingDeleteId(null);
      }
    });
  };

  const startEditing = (product) => {
    setEditingProduct({
      ...product,
      category: product.category || categories[0],
      quality: product.quality || qualities[0],
      description: product.description || '',
      brands: product.brands?.length ? [...product.brands] : [product.brand || ''],
      imageUrls: product.imageUrls?.length ? [...product.imageUrls] : [product.imageUrl || ''],
      isBoosted: product.isBoosted || false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProduct(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleArrayChange = (index, field, value) => {
    const newArray = [...editingProduct[field]];
    newArray[index] = value;
    setEditingProduct(prev => ({ ...prev, [field]: newArray }));
  };
  const addArrayField = (field) => setEditingProduct(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  const removeArrayField = (index, field) => setEditingProduct(prev => ({ ...prev, [field]: editingProduct[field].filter((_, i) => i !== index) }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const cleanBrands = editingProduct.brands.filter(b => b.trim() !== '');
      const cleanImageUrls = editingProduct.imageUrls.filter(u => u.trim() !== '');
      if (cleanBrands.length === 0) throw new Error("Debes añadir al menos una marca.");
      if (cleanImageUrls.length === 0) throw new Error("Debes añadir al menos una imagen.");

      const updates = {
        name: editingProduct.name,
        category: editingProduct.category,
        quality: editingProduct.quality,
        brand: cleanBrands[0], 
        brands: cleanBrands,
        size: editingProduct.size,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        imageUrl: cleanImageUrls[0], 
        imageUrls: cleanImageUrls,
        description: editingProduct.description,
        isActive: editingProduct.isActive,
        isBoosted: editingProduct.isBoosted
      };
      
      await productService.updateProduct(editingProduct.id, updates);
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...updates } : p));
      setEditingProduct(null);
      showSuccess("¡Producto actualizado exitosamente!");
    } catch (error) {
      showError(error.message || "Error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderCategory = (cat) => {
    if (cat === 'ESTRELLA') return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full"><Star className="h-3 w-3 fill-current" /> <span>Estrella</span></span>;
    if (cat === 'POCO_RECURRENTE') return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full"><AlertTriangle className="h-3 w-3" /> <span>Poco Recurrente</span></span>;
    return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full"><Package className="h-3 w-3" /> <span>Normal</span></span>;
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'ALL' || p.category === filterCategory;
    
    const pBrands = p.brands?.length ? p.brands : [p.brand];
    const matchBrand = filterBrand === 'ALL' || pBrands.includes(filterBrand);

    return matchSearch && matchCategory && matchBrand;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-white" /></div>;

  return (
    <div className="space-y-4 relative">
      
      {managingOptions && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Administrar {managingOptions === 'categories' ? 'Categorías' : 'Calidades'}</h3>
            <div className="flex space-x-2 mb-4">
              <input type="text" value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Nueva opción..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none" />
              <button type="button" onClick={handleAddOption} className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-700">Añadir</button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto mb-6">
              {(managingOptions === 'categories' ? categories : qualities).map((opt, i) => (
                <li key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{opt}</span>
                  <button type="button" onClick={() => handleRemoveOption(opt)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setManagingOptions(null)} className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700">Cerrar</button>
          </div>
        </div>
      )}

      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              {modalConfig.type === 'error' && <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />}
              {modalConfig.type === 'success' && <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              {modalConfig.type === 'confirm' && <Info className="h-14 w-14 text-blue-500 mb-4" />}
              <p className="text-gray-800 dark:text-white font-medium text-lg mb-6">{modalConfig.message}</p>
              <div className="flex w-full space-x-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button onClick={closeModal} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={modalConfig.onConfirm} className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">Eliminar</button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Entendido</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-4 bg-gray-50 dark:bg-slate-950/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800">
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por Nombre o ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
          />
        </div>

        {/* --- MENÚS DESPLEGABLES CONECTADOS ENTRE SÍ --- */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)} 
              className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors appearance-none cursor-pointer text-sm font-bold"
            >
              <option value="ALL">Todos los Productos</option>
              {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="relative flex-1 sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Star className="h-4 w-4 text-gray-400" />
            </div>
            <select 
              value={filterBrand} 
              onChange={(e) => setFilterBrand(e.target.value)} 
              className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors appearance-none cursor-pointer text-sm font-bold"
            >
              <option value="ALL">Todas las Marcas</option>
              {dynamicBrands.filter(b => b !== 'ALL').map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-x-auto transition-colors">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-900 dark:bg-slate-950 text-white text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Producto</th>
              <th className="p-4 font-medium text-center">Visible</th>
              <th className="p-4 font-medium text-center">Stock</th>
              <th className="p-4 font-medium text-center">Clasificación</th>
              <th className="p-4 font-medium text-center">Tendencia</th>
              <th className="p-4 font-medium text-center">Total Vendido</th>
              <th className="p-4 font-medium">Última Compra</th>
              <th className="p-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
            {filteredProducts.map((product) => {
              const stats = getProductStats(product.id);
              const isDeleting = deletingProductId === product.id;

              return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        disabled={isDeleting}
                        title="Eliminar producto"
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4" />}
                      </button>

                      <div className="h-10 w-10 rounded bg-gray-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 relative">
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        {product.isBoosted && <div className="absolute top-0 right-0 bg-blue-500 p-0.5 rounded-bl-lg"><Rocket className="h-3 w-3 text-white" /></div>}
                      </div>
                      
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">ID: {product.id}</p>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 uppercase tracking-wider">
                          [{product.category || 'Gorra'}] - {product.quality || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    {product.isActive ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                        <Eye className="h-3 w-3" />
                        <span>Sí</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                        <EyeOff className="h-3 w-3" />
                        <span>No</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    <span className={`font-bold text-sm ${product.stock < 5 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{product.stock}</span>
                  </td>
                  <td className="p-4 text-center">{renderCategory(stats.category)}</td>
                  <td className="p-4 text-center">
                    {stats.momentum === 'ASCENSO' ? <span className="text-green-600 dark:text-green-400 flex justify-center items-center text-xs font-bold"><TrendingUp className="h-4 w-4 mr-1" /> Ascenso</span> :
                     stats.momentum === 'DESCENSO' ? <span className="text-red-600 dark:text-red-400 flex justify-center items-center text-xs font-bold"><TrendingDown className="h-4 w-4 mr-1" /> Descenso</span> :
                     <span className="text-gray-500 dark:text-gray-400 flex justify-center items-center text-xs font-bold"><Minus className="h-4 w-4 mr-1" /> Estable</span>}
                  </td>
                  <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-300">{stats.totalSold}</td>
                  <td className="p-4 text-sm">
                    {stats.lastOrder ? (
                      <div>
                        <p className="text-gray-900 dark:text-gray-300">{stats.lastOrder.date.toLocaleDateString('es-MX')}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono" title={stats.lastOrder.orderId}>Ord: {stats.lastOrder.orderId.substring(0,6)}...</p>
                          <button 
                            onClick={() => { navigator.clipboard.writeText(stats.lastOrder.orderId); showSuccess('ID copiado al portapapeles'); }}
                            className="text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">Sin ventas</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => startEditing(product)} className="inline-flex items-center space-x-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 font-medium text-sm transition-colors">
                      <Edit className="h-4 w-4" /> <span>Modificar</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-slate-700" />
            <p>No se encontraron productos con esos filtros.</p>
          </div>
        )}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Modificar Producto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo de Producto</label>
                  <div className="flex space-x-2">
                    <select name="category" value={editingProduct.category} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" onClick={() => setManagingOptions('categories')} className="px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Calidad</label>
                  <div className="flex space-x-2">
                    <select name="quality" value={editingProduct.quality} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none">
                      {qualities.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <button type="button" onClick={() => setManagingOptions('qualities')} className="px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" name="name" required value={editingProduct.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Talla</label>
                  <input type="text" name="size" required value={editingProduct.size} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Precio (MXN)</label>
                  <input type="number" name="price" required min="0" value={editingProduct.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input type="number" name="stock" required min="0" value={editingProduct.stock} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Marcas / Colaboraciones</label>
                {editingProduct.brands.map((brand, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input type="text" value={brand} onChange={(e) => handleArrayChange(index, 'brands', e.target.value)} required className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                    {editingProduct.brands.length > 1 && <button type="button" onClick={() => removeArrayField(index, 'brands')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-5 w-5" /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('brands')} className="mt-1 flex items-center space-x-1 text-sm text-slate-700 dark:text-slate-300 font-bold hover:text-slate-900 dark:hover:text-white"><Plus className="h-4 w-4" /> <span>Añadir otra marca</span></button>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">URLs de Imágenes</label>
                {editingProduct.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input type="url" value={url} onChange={(e) => handleArrayChange(index, 'imageUrls', e.target.value)} required className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
                    {editingProduct.imageUrls.length > 1 && <button type="button" onClick={() => removeArrayField(index, 'imageUrls')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-5 w-5" /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('imageUrls')} className="mt-1 flex items-center space-x-1 text-sm text-slate-700 dark:text-slate-300 font-bold hover:text-slate-900 dark:hover:text-white"><Plus className="h-4 w-4" /> <span>Añadir otra imagen</span></button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción del Producto</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  value={editingProduct.description} 
                  onChange={handleInputChange} 
                  placeholder="Detalles del producto, materiales, medidas..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors"
                ></textarea>
              </div>

              <div className="flex flex-col space-y-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="editIsActive" 
                    name="isActive" 
                    checked={!editingProduct.isActive} 
                    onChange={(e) => setEditingProduct(prev => ({ ...prev, isActive: !e.target.checked }))} 
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer" 
                  />
                  <label htmlFor="editIsActive" className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center space-x-1 cursor-pointer">
                    <EyeOff className="h-4 w-4" />
                    <span>Ocultar producto (No aparecerá en la web ni en filtrados para el cliente)</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="editIsBoosted" name="isBoosted" checked={editingProduct.isBoosted} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="editIsBoosted" className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center space-x-1 cursor-pointer"><Rocket className="h-4 w-4" /> <span>Activar Boost</span></label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}<span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};