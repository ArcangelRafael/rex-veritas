import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { emailService } from '../services/emailService';
import { Trash2, ArrowLeft, MessageCircleWarning, CheckCircle2, Send } from 'lucide-react';

export const Checkout = () => {
  const { cart, total, totalItems, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Agregamos los nuevos campos al estado inicial
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
      // 2. Pasamos los nuevos datos a Firebase
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

      // 3. Pasamos los nuevos datos a EmailJS
      await emailService.sendOrderNotification({
        id: orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        comments: formData.comments || 'Sin comentarios adicionales.', // Por si lo dejan vacío
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Registrado con Éxito!</h1>
        <p className="text-gray-600 mb-8">Hemos recibido tu orden y notificado al administrador.</p>
        <p className="text-sm text-gray-400">Redirigiendo al catálogo...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-gray-100 p-6 rounded-full inline-block mb-6">
          <Trash2 className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
        <Link to="/" className="inline-flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center space-x-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900">Finalizar Compra</h1>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start space-x-3">
          <MessageCircleWarning className="h-6 w-6 text-red-600 flex-shrink-0" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Resumen del Carrito */}
        <div className="lg:w-3/5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Resumen de Pedido ({totalItems} artículos)</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {cart.map((item) => (
                <li key={item.productId} className="p-6 flex items-center space-x-4">
                  <div className="h-20 w-20 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                      ${(item.price * item.quantity).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Formulario de Contacto Actualizado */}
        <div className="lg:w-2/5">
          <div className="bg-slate-50 rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Tus Datos de Contacto</h2>
            
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                <input type="text" name="customerName" required value={formData.customerName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900" placeholder="Ej. Juan Pérez" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono (WhatsApp)</label>
                <input type="tel" name="customerPhone" required value={formData.customerPhone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900" placeholder="Ej. 462 123 4567" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" name="customerEmail" required value={formData.customerEmail} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900" placeholder="ejemplo@correo.com" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Comentarios extras (Opcional)</label>
                <textarea name="comments" rows="2" value={formData.comments} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900" placeholder="Alguna indicación especial..."></textarea>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600 font-medium">Total a Pagar</span>
                  <span className="text-3xl font-extrabold text-slate-900">${total.toLocaleString('es-MX')}</span>
                </div>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 disabled:opacity-50">
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