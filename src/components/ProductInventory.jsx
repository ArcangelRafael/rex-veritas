import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Search, Edit, TrendingUp, TrendingDown, Minus, Star, AlertTriangle, Package, Loader2, Save, X, CheckCircle2, Plus, Trash2, Rocket } from 'lucide-react';

export const ProductInventory = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- SISTEMA DE MODALS ---
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg });

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const getProductStats = (productId) => {
    const now = new Date();
    const productOrders = [];
    
    orders.forEach(order => {
      const item = order.items.find(i => i.productId === productId);
      if (item) {
        productOrders.push({ qty: item.quantity, date: order.createdAt, orderId: order.id });
      }
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

  // --- MANEJO DE EDICIÓN Y CAMPOS DINÁMICOS ---
  const startEditing = (product) => {
    setEditingProduct({
      ...product,
      brands: product.brands?.length ? [...product.brands] : [product.brand || ''],
      imageUrls: product.imageUrls?.length ? [...product.imageUrls] : [product.imageUrl || ''],
      isBoosted: product.isBoosted || false
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejo de arrays (Marcas e Imágenes)
  const handleArrayChange = (index, field, value) => {
    const newArray = [...editingProduct[field]];
    newArray[index] = value;
    setEditingProduct(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field) => {
    setEditingProduct(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayField = (index, field) => {
    const newArray = editingProduct[field].filter((_, i) => i !== index);
    setEditingProduct(prev => ({ ...prev, [field]: newArray }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      // Limpiamos los campos vacíos antes de guardar
      const cleanBrands = editingProduct.brands.filter(b => b.trim() !== '');
      const cleanImageUrls = editingProduct.imageUrls.filter(u => u.trim() !== '');

      if (cleanBrands.length === 0) throw new Error("Debes añadir al menos una marca.");
      if (cleanImageUrls.length === 0) throw new Error("Debes añadir al menos una imagen.");

      const updates = {
        name: editingProduct.name,
        brand: cleanBrands[0], // Guardamos la principal para la tienda
        brands: cleanBrands,
        size: editingProduct.size,
        price: Number(editingProduct.price),
        stock: Number(editingProduct.stock),
        imageUrl: cleanImageUrls[0], // Guardamos la principal para la tienda
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
    if (cat === 'ESTRELLA') return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Star className="h-3 w-3 fill-current" /> <span>Estrella</span></span>;
    if (cat === 'POCO_RECURRENTE') return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full"><AlertTriangle className="h-3 w-3" /> <span>Poco Recurrente</span></span>;
    return <span className="inline-flex items-center space-x-1 text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full"><Package className="h-3 w-3" /> <span>Normal</span></span>;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-900" /></div>;

  return (
    <div className="space-y-4 relative">
      
      {/* MODAL DE ALERTAS GLOBALES */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              {modalConfig.type === 'error' ? <AlertTriangle className="h-14 w-14 text-red-500 mb-4" /> : <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              <p className="text-gray-800 font-medium text-lg mb-6">{modalConfig.message}</p>
              <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative w-full md:w-96 mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar producto por Nombre o ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
        />
      </div>

      {/* Tabla Estilo Excel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className="p-4 font-medium">Producto</th>
              <th className="p-4 font-medium text-center">Stock</th>
              <th className="p-4 font-medium text-center">Clasificación</th>
              <th className="p-4 font-medium text-center">Tendencia</th>
              <th className="p-4 font-medium text-center">Total Vendido</th>
              <th className="p-4 font-medium">Última Compra</th>
              <th className="p-4 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => {
              const stats = getProductStats(product.id);
              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 relative">
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        {product.isBoosted && <div className="absolute top-0 right-0 bg-blue-500 p-0.5 rounded-bl-lg"><Rocket className="h-3 w-3 text-white" /></div>}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">ID: {product.id}</p>
                        <div className="flex space-x-1 mt-1">
                          {!product.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase inline-block">Pausado</span>}
                          {product.isBoosted && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase inline-block">Boost</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold text-sm ${product.stock < 5 ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                  </td>
                  <td className="p-4 text-center">{renderCategory(stats.category)}</td>
                  <td className="p-4 text-center">
                    {stats.momentum === 'ASCENSO' ? <span className="text-green-600 flex justify-center items-center text-xs font-bold"><TrendingUp className="h-4 w-4 mr-1" /> Ascenso</span> :
                     stats.momentum === 'DESCENSO' ? <span className="text-red-600 flex justify-center items-center text-xs font-bold"><TrendingDown className="h-4 w-4 mr-1" /> Descenso</span> :
                     <span className="text-gray-500 flex justify-center items-center text-xs font-bold"><Minus className="h-4 w-4 mr-1" /> Estable</span>}
                  </td>
                  <td className="p-4 text-center font-bold text-gray-700">{stats.totalSold}</td>
                  <td className="p-4 text-sm">
                    {stats.lastOrder ? (
                      <div>
                        <p className="text-gray-900">{stats.lastOrder.date.toLocaleDateString('es-MX')}</p>
                        <p className="text-xs text-blue-600 font-mono cursor-help" title="ID de la orden">Ord: {stats.lastOrder.orderId.substring(0,6)}...</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin ventas</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => startEditing(product)}
                      className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                    >
                      <Edit className="h-4 w-4" /> <span>Modificar</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE EDICIÓN DE PRODUCTO --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Modificar Producto</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                  <input type="text" name="name" required value={editingProduct.name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-slate-900" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Talla</label>
                  <input type="text" name="size" required value={editingProduct.size} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-slate-900" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio (MXN)</label>
                  <input type="number" name="price" required min="0" value={editingProduct.price} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-slate-900" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Unidades en Stock</label>
                  <input type="number" name="stock" required min="0" value={editingProduct.stock} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-slate-900" />
                </div>
              </div>

              {/* Sección Dinámica: Marcas */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Marcas / Colaboraciones</label>
                {editingProduct.brands.map((brand, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input type="text" value={brand} onChange={(e) => handleArrayChange(index, 'brands', e.target.value)} placeholder="Ej. New Era" required className="flex-1 px-3 py-2 border rounded-lg focus:ring-slate-900" />
                    {editingProduct.brands.length > 1 && (
                      <button type="button" onClick={() => removeArrayField(index, 'brands')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('brands')} className="mt-1 flex items-center space-x-1 text-sm text-slate-700 font-bold hover:text-slate-900"><Plus className="h-4 w-4" /> <span>Añadir otra marca</span></button>
              </div>

              {/* Sección Dinámica: Imágenes */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">URLs de Imágenes</label>
                {editingProduct.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input type="url" value={url} onChange={(e) => handleArrayChange(index, 'imageUrls', e.target.value)} placeholder="https://..." required className="flex-1 px-3 py-2 border rounded-lg focus:ring-slate-900" />
                    {editingProduct.imageUrls.length > 1 && (
                      <button type="button" onClick={() => removeArrayField(index, 'imageUrls')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayField('imageUrls')} className="mt-1 flex items-center space-x-1 text-sm text-slate-700 font-bold hover:text-slate-900"><Plus className="h-4 w-4" /> <span>Añadir otra imagen</span></button>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                <textarea name="description" rows="3" value={editingProduct.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-slate-900"></textarea>
              </div>

              {/* Checkboxes Administrativos */}
              <div className="flex flex-col space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isActive" name="isActive" checked={editingProduct.isActive} onChange={handleInputChange} className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Producto Activo (Visible en el catálogo público)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="isBoosted" name="isBoosted" checked={editingProduct.isBoosted} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <label htmlFor="isBoosted" className="text-sm font-bold text-blue-700 flex items-center space-x-1"><Rocket className="h-4 w-4" /> <span>Activar Boost de Marketing</span></label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};