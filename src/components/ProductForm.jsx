import { useState } from 'react';
import { productService } from '../services/productService';
import { Loader2, Plus, Trash2, Rocket, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ProductForm = () => {
  const initialFormState = {
    name: '',
    brands: [''], // Iniciamos con un espacio para la primera marca
    size: '',
    price: '',
    stock: '',
    imageUrls: [''], // Iniciamos con un espacio para la primera imagen
    description: '',
    isActive: true,
    isBoosted: false
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  // --- SISTEMA DE MODALS ---
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '' });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg });

  // --- MANEJADORES DE ESTADO ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejo de arreglos dinámicos (Marcas e Imágenes)
  const handleArrayChange = (index, field, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayField = (index, field) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // 1. Limpiamos campos vacíos
      const cleanBrands = formData.brands.filter(b => b.trim() !== '');
      const cleanImageUrls = formData.imageUrls.filter(u => u.trim() !== '');

      // 2. Validaciones estrictas
      if (cleanBrands.length === 0) throw new Error("Debes añadir al menos una marca.");
      if (cleanImageUrls.length === 0) throw new Error("Debes añadir al menos una URL de imagen.");
      if (Number(formData.price) <= 0) throw new Error("El precio debe ser mayor a 0.");
      if (Number(formData.stock) < 0) throw new Error("El stock no puede ser negativo.");

      // 3. Preparamos el objeto para Firestore (incluyendo compatibilidad con la tienda pública)
      const productData = {
        name: formData.name,
        brand: cleanBrands[0], // Marca principal para retrocompatibilidad
        brands: cleanBrands,   // Todas las marcas
        size: formData.size,
        price: Number(formData.price),
        stock: Number(formData.stock),
        imageUrl: cleanImageUrls[0], // Imagen principal para retrocompatibilidad
        imageUrls: cleanImageUrls,   // Todas las imágenes
        description: formData.description,
        isActive: formData.isActive,
        isBoosted: formData.isBoosted
      };

      // 4. Guardamos en la base de datos
      await productService.addProduct(productData);
      
      // 5. Reiniciamos el formulario y mostramos éxito
      setFormData(initialFormState);
      showSuccess("¡Producto agregado al catálogo exitosamente!");

    } catch (error) {
      showError(error.message || "Ocurrió un error al guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      
      {/* --- MODAL DE ALERTAS GLOBALES --- */}
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

      {/* --- FORMULARIO PRINCIPAL --- */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-2 sm:p-6 rounded-xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Producto</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Ej. Gorra Los Angeles" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Talla</label>
            <input 
              type="text" 
              name="size" 
              required 
              value={formData.size} 
              onChange={handleChange} 
              placeholder="Ej. Unitalla, M, L" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Precio (MXN)</label>
            <input 
              type="number" 
              name="price" 
              required 
              min="0" 
              value={formData.price} 
              onChange={handleChange} 
              placeholder="Ej. 450" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Stock Inicial (Unidades)</label>
            <input 
              type="number" 
              name="stock" 
              required 
              min="0" 
              value={formData.stock} 
              onChange={handleChange} 
              placeholder="Ej. 10" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" 
            />
          </div>
        </div>

        {/* Sección Dinámica: Marcas */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-3">Marcas / Colaboraciones</label>
          {formData.brands.map((brand, index) => (
            <div key={`brand-${index}`} className="flex items-center space-x-2 mb-3">
              <input 
                type="text" 
                value={brand} 
                onChange={(e) => handleArrayChange(index, 'brands', e.target.value)} 
                placeholder="Ej. New Era" 
                required 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white" 
              />
              {formData.brands.length > 1 && (
                <button type="button" onClick={() => removeArrayField(index, 'brands')} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayField('brands')} className="mt-1 flex items-center space-x-1 text-sm text-slate-600 font-bold hover:text-slate-900 transition-colors">
            <Plus className="h-4 w-4" /> <span>Añadir otra marca (Colaboración)</span>
          </button>
        </div>

        {/* Sección Dinámica: Imágenes */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-3">URLs de Imágenes</label>
          {formData.imageUrls.map((url, index) => (
            <div key={`img-${index}`} className="flex items-center space-x-2 mb-3">
              <input 
                type="url" 
                value={url} 
                onChange={(e) => handleArrayChange(index, 'imageUrls', e.target.value)} 
                placeholder="https://..." 
                required 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white" 
              />
              {formData.imageUrls.length > 1 && (
                <button type="button" onClick={() => removeArrayField(index, 'imageUrls')} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayField('imageUrls')} className="mt-1 flex items-center space-x-1 text-sm text-slate-600 font-bold hover:text-slate-900 transition-colors">
            <Plus className="h-4 w-4" /> <span>Añadir otra imagen al carrusel</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
          <textarea 
            name="description" 
            rows="4" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Detalles del producto, materiales, medidas..." 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
          ></textarea>
        </div>

        {/* Checkboxes Administrativos */}
        <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="isActive" 
              checked={formData.isActive} 
              onChange={handleChange} 
              className="w-5 h-5 text-slate-900 rounded focus:ring-slate-900 border-gray-300 cursor-pointer" 
            />
            <span className="text-sm font-medium text-gray-700">Producto Activo (Visible en el catálogo público inmediatamente)</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              name="isBoosted" 
              checked={formData.isBoosted} 
              onChange={handleChange} 
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer" 
            />
            <div className="flex items-center space-x-1 text-blue-700 font-bold text-sm">
              <Rocket className="h-4 w-4" /> 
              <span>Activar Boost de Marketing</span>
            </div>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full mt-8 bg-slate-900 text-white font-bold py-4 px-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          <span>{loading ? 'Guardando...' : 'Guardar Producto en el Catálogo'}</span>
        </button>

      </form>
    </div>
  );
};