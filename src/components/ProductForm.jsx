import { useState } from 'react';
import { productService } from '../services/productService';
import { Loader2, Plus, Trash2, Rocket, AlertTriangle, CheckCircle2, Edit, Calendar, EyeOff, Eye } from 'lucide-react';

const DEFAULT_CATEGORIES = ['Gorra', 'Playera', 'Accesorio'];
const DEFAULT_QUALITIES = ['G5', 'Original', 'Clon', 'Premium'];

export const ProductForm = () => {
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('rex_cats')) || DEFAULT_CATEGORIES);
  const [qualities, setQualities] = useState(() => JSON.parse(localStorage.getItem('rex_quals')) || DEFAULT_QUALITIES);
  
  const [managingOptions, setManagingOptions] = useState(null); 
  const [newOption, setNewOption] = useState('');

  // Estado para la opción de fecha de lanzamiento: 'NOW' | 'SCHEDULED'
  const [releaseOption, setReleaseOption] = useState('NOW');
  const [scheduledDate, setScheduledDate] = useState('');

  const initialFormState = {
    name: '',
    category: categories[0] || 'Gorra',
    quality: qualities[0] || 'G5',
    brands: [''], 
    size: '',
    price: '',
    stock: '',
    imageUrls: [''], 
    description: '',
    isActive: true, // Si false, el producto estará OCULTO
    isBoosted: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg });

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field) => setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  const removeArrayField = (index, field) => setFormData(prev => ({ ...prev, [field]: formData[field].filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const cleanBrands = formData.brands.filter(b => b.trim() !== '');
      const cleanImageUrls = formData.imageUrls.filter(u => u.trim() !== '');
      if (cleanBrands.length === 0) throw new Error("Debes añadir al menos una marca.");
      if (cleanImageUrls.length === 0) throw new Error("Debes añadir al menos una URL de imagen.");
      if (Number(formData.price) <= 0) throw new Error("El precio debe ser mayor a 0.");
      if (Number(formData.stock) < 0) throw new Error("El stock no puede ser negativo.");

      let releaseDateCalculated = new Date().toISOString();
      if (releaseOption === 'SCHEDULED') {
        if (!scheduledDate) throw new Error("Por favor selecciona una fecha de lanzamiento válida.");
        releaseDateCalculated = new Date(scheduledDate).toISOString();
      }

      const productData = {
        name: formData.name,
        category: formData.category,
        quality: formData.quality,
        brand: cleanBrands[0], 
        brands: cleanBrands,   
        size: formData.size,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: cleanImageUrls[0], 
        imageUrls: cleanImageUrls,   
        description: formData.description,
        isActive: formData.isActive,
        isBoosted: formData.isBoosted,
        releaseDate: releaseDateCalculated
      };

      await productService.addProduct(productData);
      setFormData(initialFormState);
      setReleaseOption('NOW');
      setScheduledDate('');
      showSuccess("¡Producto agregado al catálogo exitosamente!");
    } catch (error) {
      showError(error.message || "Ocurrió un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      
      {/* MODAL GESTOR DE OPCIONES */}
      {managingOptions && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Administrar {managingOptions === 'categories' ? 'Categorías' : 'Calidades'}</h3>
            <div className="flex space-x-2 mb-4">
              <input type="text" value={newOption} onChange={e => setNewOption(e.target.value)} placeholder="Nueva opción..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-slate-900 dark:focus:ring-slate-400 outline-none" />
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

      {/* MODAL GLOBAL ERRORES/ÉXITO */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              {modalConfig.type === 'error' ? <AlertTriangle className="h-14 w-14 text-red-500 mb-4" /> : <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              <p className="text-gray-800 dark:text-white font-medium text-lg mb-6">{modalConfig.message}</p>
              <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">Entendido</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-2 sm:p-6 rounded-xl transition-colors">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo de Producto</label>
            <div className="flex space-x-2">
              <select name="category" value={formData.category} onChange={handleChange} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setManagingOptions('categories')} className="px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700" title="Administrar Tipos">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Calidad</label>
            <div className="flex space-x-2">
              <select name="quality" value={formData.quality} onChange={handleChange} className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none">
                {qualities.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
              <button type="button" onClick={() => setManagingOptions('qualities')} className="px-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700" title="Administrar Calidades">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Ej. Los Angeles" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Talla</label>
            <input type="text" name="size" required value={formData.size} onChange={handleChange} placeholder="Ej. Unitalla, M, L" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Precio (MXN)</label>
            <input type="number" name="price" required min="0" value={formData.price} onChange={handleChange} placeholder="Ej. 450" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Stock Inicial</label>
            <input type="number" name="stock" required min="0" value={formData.stock} onChange={handleChange} placeholder="Ej. 10" className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" />
          </div>
        </div>

        {/* FECHA DE LANZAMIENTO */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>Fecha de Lanzamiento</span>
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="releaseOption" 
                  value="NOW" 
                  checked={releaseOption === 'NOW'} 
                  onChange={() => setReleaseOption('NOW')} 
                  className="w-4 h-4 text-slate-900 dark:text-blue-600 focus:ring-slate-900 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AHORA (Inmediato)</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="releaseOption" 
                  value="SCHEDULED" 
                  checked={releaseOption === 'SCHEDULED'} 
                  onChange={() => setReleaseOption('SCHEDULED')} 
                  className="w-4 h-4 text-slate-900 dark:text-blue-600 focus:ring-slate-900 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PROGRAMAR FECHA</span>
              </label>
            </div>

            {releaseOption === 'SCHEDULED' && (
              <input 
                type="datetime-local" 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors text-sm"
                required
              />
            )}
          </div>
        </div>

        {/* Marcas */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Marcas / Colaboraciones</label>
          {formData.brands.map((brand, index) => (
            <div key={`brand-${index}`} className="flex items-center space-x-2 mb-3">
              <input type="text" value={brand} onChange={(e) => handleArrayChange(index, 'brands', e.target.value)} placeholder="Ej. New Era" required className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
              {formData.brands.length > 1 && <button type="button" onClick={() => removeArrayField(index, 'brands')} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"><Trash2 className="h-5 w-5" /></button>}
            </div>
          ))}
          <button type="button" onClick={() => addArrayField('brands')} className="mt-1 flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"><Plus className="h-4 w-4" /> <span>Añadir otra marca</span></button>
        </div>

        {/* Imágenes */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">URLs de Imágenes</label>
          {formData.imageUrls.map((url, index) => (
            <div key={`img-${index}`} className="flex items-center space-x-2 mb-3">
              <input type="url" value={url} onChange={(e) => handleArrayChange(index, 'imageUrls', e.target.value)} placeholder="https://..." required className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors" />
              {formData.imageUrls.length > 1 && <button type="button" onClick={() => removeArrayField(index, 'imageUrls')} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50"><Trash2 className="h-5 w-5" /></button>}
            </div>
          ))}
          <button type="button" onClick={() => addArrayField('imageUrls')} className="mt-1 flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"><Plus className="h-4 w-4" /> <span>Añadir otra imagen</span></button>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
          <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Detalles..." className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg outline-none transition-colors"></textarea>
        </div>

        {/* CHECKBOXES ADMINISTRATIVOS */}
        <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
          
          {/* OCULTAR PRODUCTO */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="isActive" 
              checked={!formData.isActive} 
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: !e.target.checked }))} 
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer" 
            />
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <EyeOff className="h-4 w-4" />
              <span>Ocultar producto (No aparecerá en la web ni en filtrados para el cliente)</span>
            </div>
          </label>
          
          {/* ACTIVATE BOOST */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" name="isBoosted" checked={formData.isBoosted} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" />
            <div className="flex items-center space-x-1 text-blue-700 dark:text-blue-400 font-bold text-sm"><Rocket className="h-4 w-4" /> <span>Activar Boost de Marketing</span></div>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full mt-8 bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}<span>Guardar Producto</span>
        </button>
      </form>
    </div>
  );
};