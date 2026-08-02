import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { emailService } from '../services/emailService';
import { Trash2, ArrowLeft, MessageCircleWarning, CheckCircle2, Send, Minus, Plus } from 'lucide-react';

export const Checkout = () => {
  // Ya no necesitamos addItem aquí, solo updateQuantity y removeItem
  const { cart, total, totalItems, removeItem, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    comments: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        comments: formData.comments,
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        status: 'PENDING'
      };

      const orderId = await orderService.createOrder(orderData);
      const orderDetails = cart.map(item => `${item.quantity}x ${item.name} ($${item.price})`).join(' | ');

      await emailService.sendOrderNotification({
        id: orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        comments: formData.comments || 'Sin comentarios adicionales.', 
        itemsDetails: orderDetails,
        totalAmount: total.toLocaleString('es-MX')
      });

      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/'), 4000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Hubo un error al procesar tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">¡Pedido Registrado con Éxito!</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Hemos recibido tu orden y notificado al administrador.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Redirigiendo al catálogo...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 transition-colors">
          <Trash2 className="h-10 w-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tu carrito está vacío</h2>
        <Link to="/" className="inline-flex items-center space-x-2 bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700">
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center space-x-4">
        <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Finalizar Compra</h1>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded flex items-start space-x-3">
          <MessageCircleWarning className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Resumen del Carrito */}
        <div className="lg:w-3/5">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resumen de Pedido ({totalItems} artículos)</h2>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-slate-800">
              {cart.map((item) => (
                <li key={item.productId} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                      ${(item.price * item.quantity).toLocaleString('es-MX')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                      
                      {/* Botón Restar */}
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded shadow-sm text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                      
                      {/* Botón Sumar - AHORA USA updateQuantity Y RESPETA EL STOCK */}
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stockLimits}
                        className="w-8 h-8 flex items-center justify-center bg-slate-900 dark:bg-slate-700 rounded shadow-sm text-white hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeItem(item.productId)} 
                      title="Eliminar producto"
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Formulario de Contacto */}
        <div className="lg:w-2/5">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 sticky top-24 transition-colors">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Tus Datos de Contacto</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  name="customerName" 
                  required 
                  value={formData.customerName} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                  placeholder="Ej. Juan Pérez" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Teléfono (WhatsApp)</label>
                <input 
                  type="tel" 
                  name="customerPhone" 
                  required 
                  value={formData.customerPhone} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                  placeholder="Ej. 462 123 4567" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  name="customerEmail" 
                  required 
                  value={formData.customerEmail} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Comentarios extras (Opcional)</label>
                <textarea 
                  name="comments" 
                  rows="2" 
                  value={formData.comments} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none transition-colors" 
                  placeholder="Alguna indicación especial..."
                ></textarea>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-800 pt-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">Total a Pagar</span>
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${total.toLocaleString('es-MX')}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 dark:bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <span>Procesando pedido...</span> : <><Send className="h-5 w-5" /><span>Confirmar Pedido</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};