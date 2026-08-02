import { useState } from 'react';
import { productService } from '../services/productService';
import { PackagePlus } from 'lucide-react';

export const ProductForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estado inicial del formulario
  const initialForm = {
    name: '',
    brand: '',
    size: '',
    price: '',
    stock: '',
    imageUrl: '',
    description: ''
  };
  
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Mandamos llamar a nuestro Servicio (que habla con Firebase)
      await productService.addProduct(formData);
      setMessage('¡Producto agregado exitosamente!');
      setFormData(initialForm); // Limpiamos el formulario
    } catch (error) {
      setMessage('Error al guardar el producto.');
      console.error(error);
    } finally {
      setLoading(false);
      // Borramos el mensaje de éxito después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <PackagePlus className="h-6 w-6 text-slate-700" />
        <h2 className="text-xl font-bold text-gray-800">Agregar Nuevo Producto</h2>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Ej. Gorra Los Angeles" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Marca</label>
          <input type="text" name="brand" required value={formData.brand} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Ej. New Era" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Talla</label>
          <input type="text" name="size" required value={formData.size} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Ej. Unitalla, M, L" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Precio (MXN)</label>
          <input type="number" name="price" required min="0" value={formData.price} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Ej. 450" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stock Inicial (Unidades)</label>
          <input type="number" name="stock" required min="1" value={formData.stock} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Ej. 10" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">URL de la Imagen</label>
          <input type="url" name="imageUrl" required value={formData.imageUrl} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="https://..." />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
          <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Detalles del producto..."></textarea>
        </div>

        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Producto en el Catálogo'}
          </button>
        </div>
      </form>
    </div>
  );
};