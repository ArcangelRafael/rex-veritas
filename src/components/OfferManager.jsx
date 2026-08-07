import { useState, useEffect } from 'react';
import { offerService } from '../services/offerService';
import { productService } from '../services/productService'; 
import { Tag, Loader2, Plus, Trash2, Percent, DollarSign, Shuffle, AlertTriangle, CheckCircle2, Info, X, EyeOff, Hash, Layers } from 'lucide-react';

export const OfferManager = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '', onConfirm: null });

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg, onConfirm: null });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg, onConfirm: null });
  const showConfirm = (msg, onConfirmCallback) => setModalConfig({ isOpen: true, type: 'confirm', message: msg, onConfirm: onConfirmCallback });

  const initialForm = {
    title: '',
    type: 'PROMO_CODE', 
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    promoCode: '',
    discountValue: '',
    minSubtotal: '',
    minQuantity: '',
    targetCategory: 'ALL',
    targetBrand: 'ALL',
    targetQuality: 'ALL',
    productIds: ['', ''], 
    hideBanner: false,
    isLimitedUse: false, 
    maxUses: '',
    bannerPosition: 1 
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersData, productsData] = await Promise.all([
        offerService.getOffers(),
        productService.getProducts()
      ]);
      setOffers(offersData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
      showError("Error al cargar la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dynamicCategories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];
  const dynamicBrands = ['ALL', ...new Set(products.flatMap(p => p.brands?.length ? p.brands : [p.brand]).filter(Boolean))];
  const dynamicQualities = ['ALL', ...new Set(products.map(p => p.quality).filter(Boolean))];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, promoCode: code });
  };

  const handleComboChange = (index, value) => {
    const newIds = [...formData.productIds];
    newIds[index] = value;
    setFormData({ ...formData, productIds: newIds });
  };

  const addComboProduct = () => {
    setFormData({ ...formData, productIds: [...formData.productIds, ''] });
  };

  const removeComboProduct = (index) => {
    const newIds = formData.productIds.filter((_, i) => i !== index);
    setFormData({ ...formData, productIds: newIds });
  };

  const updateBannerPosition = async (id, newPosition) => {
    try {
      await offerService.updateOffer(id, { bannerPosition: Number(newPosition) });
      setOffers(offers.map(o => o.id === id ? { ...o, bannerPosition: Number(newPosition) } : o));
      showSuccess("¡Posición del banner actualizada con éxito!");
    } catch (error) {
      showError("Error al actualizar la posición del banner.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let conditions = {};
      let discount = {};

      if (formData.type === 'PROMO_CODE') {
        if (!formData.promoCode) throw new Error("Debes ingresar un código.");
        discount = { type: 'PERCENTAGE', value: Number(formData.discountValue) };
      } 
      else if (formData.type === 'THRESHOLD') {
        conditions = { minSubtotal: Number(formData.minSubtotal) };
        discount = { type: 'PERCENTAGE', value: Number(formData.discountValue) };
      } 
      else if (formData.type === 'BUNDLE') {
        conditions = { 
          minQuantity: Number(formData.minQuantity), 
          targetCategory: formData.targetCategory, 
          targetBrand: formData.targetBrand,
          targetQuality: formData.targetQuality 
        };
        discount = { type: 'FIXED_PRICE_PER_ITEM', value: Number(formData.discountValue) };
      } 
      else if (formData.type === 'COMBO') {
        const validIds = formData.productIds.map(id => id.trim()).filter(id => id !== '');
        if (validIds.length === 0) throw new Error("Debes indicar al menos un ID de producto.");
        conditions = { productIds: validIds };
        discount = { type: 'FIXED_TOTAL', value: Number(formData.discountValue) };
      }

      const newOffer = {
        type: formData.type,
        title: formData.title,
        isActive: true,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : '',
        promoCode: formData.type === 'PROMO_CODE' ? formData.promoCode.toUpperCase() : '',
        hideBanner: formData.type === 'PROMO_CODE' ? formData.hideBanner : false,
        maxUses: (formData.type === 'PROMO_CODE' && formData.isLimitedUse && formData.maxUses) ? Number(formData.maxUses) : null,
        currentUses: 0, 
        bannerPosition: Number(formData.bannerPosition),
        conditions,
        discount
      };

      await offerService.addOffer(newOffer);
      await fetchData();
      setFormData(initialForm);
      showSuccess("¡Oferta de marketing creada y activada exitosamente!");
    } catch (error) {
      showError(error.message || "Error al guardar la oferta en la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id) => {
    showConfirm("¿Seguro que deseas eliminar definitivamente esta oferta del sistema?", async () => {
      closeModal();
      try {
        await offerService.deleteOffer(id);
        setOffers(offers.filter(o => o.id !== id));
        showSuccess("Oferta eliminada correctamente.");
      } catch (error) {
        showError("Ocurrió un error al intentar eliminar la oferta.");
      }
    });
  };

  const getStatus = (offer) => {
    if (offer.maxUses !== null && offer.currentUses >= offer.maxUses) return { label: 'AGOTADA', color: 'bg-gray-100 text-gray-500' };

    const now = new Date();
    const start = new Date(offer.startDate);
    const end = offer.endDate ? new Date(offer.endDate) : null;

    if (now < start) return { label: 'FUTURA / PROGRAMADA', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' };
    if (end && now > end) return { label: 'EXPIRADA', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' };
    return { label: 'ACTIVA HOY', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' };
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-white" /></div>;

  return (
    <div className="space-y-8 relative">
      
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800 relative">
            <div className="flex flex-col items-center text-center">
              {modalConfig.type !== 'confirm' && (
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors"><X className="h-5 w-5" /></button>
              )}
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

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
        <div className="flex items-center space-x-2 mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
          <Tag className="h-6 w-6 text-blue-600 dark:text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Regla de Marketing</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mecánica de la Oferta</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg outline-none font-medium text-slate-900 dark:text-white transition-colors">
                <option value="PROMO_CODE">Cupón de Descuento (Código Promocional)</option>
                <option value="THRESHOLD">Descuento por Volumen de Compra ($ gastado)</option>
                <option value="BUNDLE">Paquete Mayorista (X unidades por Precio Fijo c/u)</option>
                <option value="COMBO">Oferta Específica / Combo Flash (1 o más IDs)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Título / Nombre de la Campaña</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="Ej. Hot Sale Verano, Oferta Flash..." className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                <input type="datetime-local" name="startDate" required value={formData.startDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha de Término (Opcional)</label>
                <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors" />
              </div>
            </div>
            
            <div className="md:col-span-2 pt-2 border-t border-gray-100 dark:border-slate-800">
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">¿Dónde quieres que aparezca este banner?</label>
               <div className="flex items-center space-x-4">
                 <label className="flex items-center space-x-2 cursor-pointer">
                   <input type="radio" name="bannerPosition" value={1} checked={Number(formData.bannerPosition) === 1} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                   <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">Banner 1 (Arriba, más visible)</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                   <input type="radio" name="bannerPosition" value={2} checked={Number(formData.bannerPosition) === 2} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                   <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">Banner 2 (Abajo, cortando productos)</span>
                 </label>
               </div>
            </div>

          </div>

          <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700 transition-colors">
            
            {formData.type === 'PROMO_CODE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Código Promocional</label>
                  <div className="flex space-x-2">
                    <input type="text" name="promoCode" required value={formData.promoCode} onChange={(e) => setFormData({...formData, promoCode: e.target.value.toUpperCase()})} placeholder="Ej. REX20" className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none font-bold uppercase bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                    <button type="button" onClick={generateRandomCode} className="px-4 bg-slate-900 dark:bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 flex items-center transition-colors" title="Generar al azar"><Shuffle className="h-4 w-4" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Porcentaje de Descuento (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" name="discountValue" required min="1" max="100" value={formData.discountValue} onChange={handleChange} placeholder="Ej. 15" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                  </div>
                </div>
                
                <div className="md:col-span-2 pt-4 border-t border-blue-200 dark:border-slate-700 mt-2 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={formData.hideBanner} onChange={(e) => setFormData({...formData, hideBanner: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded-md checked:bg-slate-900 dark:checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer" />
                      <CheckCircle2 className="absolute text-white h-4 w-4 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Ocultar Banner Promocional (Cupón Secreto)</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">El cupón funcionará en el carrito pero no se publicitará en el catálogo.</p>
                    </div>
                  </label>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer group mb-2">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" checked={formData.isLimitedUse} onChange={(e) => setFormData({...formData, isLimitedUse: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-slate-600 rounded-md checked:bg-slate-900 dark:checked:bg-blue-600 checked:border-transparent transition-all cursor-pointer" />
                        <CheckCircle2 className="absolute text-white h-4 w-4 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Limitar cantidad de vidas / usos del código</span>
                    </label>
                    
                    {formData.isLimitedUse && (
                      <div className="pl-8 mt-2 w-1/2 relative">
                        <Hash className="absolute left-11 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="number" name="maxUses" required min="1" value={formData.maxUses} onChange={handleChange} placeholder="Ej. 10 usos máximos" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors text-sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'THRESHOLD' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Gasto Mínimo Requerido (MXN)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" name="minSubtotal" required min="1" value={formData.minSubtotal} onChange={handleChange} placeholder="Ej. 1500" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Porcentaje de Descuento (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" name="discountValue" required min="1" max="100" value={formData.discountValue} onChange={handleChange} placeholder="Ej. 10" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'BUNDLE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cant. Mínima</label>
                  <input type="number" name="minQuantity" required min="2" value={formData.minQuantity} onChange={handleChange} placeholder="Ej. 3" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cada uno le saldrá en (MXN)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" name="discountValue" required min="1" value={formData.discountValue} onChange={handleChange} placeholder="Ej. 250" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                  <select name="targetCategory" value={formData.targetCategory} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors">
                    {dynamicCategories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'Cualquier Categoría' : c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                  <select name="targetBrand" value={formData.targetBrand} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors">
                    {dynamicBrands.map(b => <option key={b} value={b}>{b === 'ALL' ? 'Cualquier Marca' : b}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Calidad</label>
                  <select name="targetQuality" value={formData.targetQuality} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors">
                    {dynamicQualities.map(q => <option key={q} value={q}>{q === 'ALL' ? 'Cualquier Calidad' : q}</option>)}
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'COMBO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">IDs de los Productos (Agrega 1 o más)</label>
                  {formData.productIds.map((id, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input 
                        type="text" 
                        value={id} 
                        onChange={(e) => handleComboChange(index, e.target.value)} 
                        placeholder={`Pegar ID del Producto ${index + 1}...`} 
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none text-sm font-mono bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" 
                      />
                      {formData.productIds.length > 1 && (
                        <button type="button" onClick={() => removeComboProduct(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0" title="Quitar producto">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addComboProduct} className="mt-3 flex items-center space-x-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
                    <Plus className="h-4 w-4" /><span>Agregar otro producto a la oferta</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Precio Fijo Total (Por {formData.productIds.length === 1 ? 'este producto' : 'todos juntos'})
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="number" name="discountValue" required min="1" value={formData.discountValue} onChange={handleChange} placeholder="Ej. 500" className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSaving} className="flex items-center space-x-2 bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span>Crear Oferta</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
          <h3 className="font-bold text-gray-900 dark:text-white">Ofertas Existentes</h3>
        </div>
        
        {offers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay ofertas creadas aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 dark:bg-slate-950 text-white text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Título</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium min-w-[200px]">Mecánica / Detalles</th>
                  <th className="p-4 font-medium text-center">Estado</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                {offers.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).map(offer => {
                  const status = getStatus(offer);
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm text-gray-900 dark:text-white">{offer.title}</p>
                          {offer.hideBanner && <EyeOff className="h-4 w-4 text-gray-400" title="Banner Oculto" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Inicia: {new Date(offer.startDate).toLocaleDateString()}
                          {offer.endDate && ` | Termina: ${new Date(offer.endDate).toLocaleDateString()}`}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {offer.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {offer.type === 'PROMO_CODE' && (
                          <div>
                            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest">{offer.promoCode} (-{offer.discount.value}%)</span>
                            {offer.maxUses !== null && (
                              <p className="text-[10px] text-gray-500 font-bold mt-1">USOS: {offer.currentUses} / {offer.maxUses}</p>
                            )}
                          </div>
                        )}
                        {offer.type === 'THRESHOLD' && `Compra $${offer.conditions.minSubtotal} -> -${offer.discount.value}%`}
                        {offer.type === 'BUNDLE' && `Compra ${offer.conditions.minQuantity} (${offer.conditions.targetCategory}) -> $${offer.discount.value} c/u`}
                        
                        {/* AQUÍ ESTÁ LA SOLUCIÓN AL BUG */}
                        {offer.type === 'COMBO' && (
                          <div>
                            <p>Oferta de {offer.conditions.productIds.length} productos -&gt; Fijo: ${offer.discount.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium leading-tight">
                              Productos: {offer.conditions.productIds.map(id => {
                                const p = products.find(prod => prod.id === id);
                                return p ? p.name : id;
                              }).join(' + ')}
                            </p>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center space-y-2">
                          <span className={`inline-block px-2 py-1 text-[10px] font-black rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-0.5 hover:border-blue-400 focus-within:border-blue-500 transition-colors">
                            <Layers className="h-3 w-3" />
                            <select 
                              value={offer.bannerPosition || 1} 
                              onChange={(e) => updateBannerPosition(offer.id, e.target.value)}
                              className="bg-transparent outline-none cursor-pointer"
                              title="Cambiar posición del Banner"
                            >
                              <option value={1}>Banner 1 (Top)</option>
                              <option value={2}>Banner 2 (Bot)</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <button onClick={() => handleDelete(offer.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};