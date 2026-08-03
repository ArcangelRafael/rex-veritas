import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService'; 
import { orderService } from '../services/orderService';
import { emailService } from '../services/emailService';
import { Trash2, ArrowLeft, MessageCircleWarning, CheckCircle2, Send, Minus, Plus, AlertTriangle } from 'lucide-react';

export const Checkout = () => {
  const { cart, total, totalItems, removeItem, clearCart, addItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [checkingStock, setCheckingStock] = useState(true);
  const [stockWarnings, setStockWarnings] = useState({});
  const [catalog, setCatalog] = useState({}); 

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    comments: ''
  });

  useEffect(() => {
    const validateStock = async () => {
      try {
        if (cart.length === 0) {
          setCheckingStock(false);
          return;
        }

        const currentProducts = await productService.getProducts();
        
        const catalogMap = {};
        currentProducts.forEach(p => {
          catalogMap[p.id] = p;
        });
        setCatalog(catalogMap);

        const warnings = {};
        cart.forEach(item => {
          const productInDb = currentProducts.find(p => p.id === item.productId);
          
          if (!productInDb) {
            warnings[item.productId] = `Este producto ya no está disponible en la tienda.`;
          } else if (productInDb.stock < item.quantity) {
            warnings[item.productId] = `Tenías ${item.quantity} en el carrito, pero el stock actual es ${productInDb.stock}. Por favor, ajusta la cantidad.`;
          }
        });
        
        setStockWarnings(warnings);
      } catch (err) {
        console.error("Error al validar inventario:", err);
      } finally {
        setCheckingStock(false);
      }
    };

    validateStock();
  }, [cart]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (Object.keys(stockWarnings).length > 0) {
      setError('Por favor, ajusta los productos con problemas de stock antes de confirmar el pedido.');
      return;
    }
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
          quantity: item.quantity,
          imageUrl: item.imageUrl || '',
          category: item.category || 'Gorra',
          quality: item.quality || 'N/A',
          size: item.size || 'Unitalla',
          brands: item.brands || []
        })),
        totalAmount: total,
        status: 'PENDING'
      };

      const orderId = await orderService.createOrder(orderData);
      
      const orderDetails = cart.map(item => 
        `${item.quantity}x [${item.category || 'Gorra'}] ${item.name} [${item.size || 'Unitalla'}] [${(item.brands || []).join(' X ') || 'Sin Marca'}] [${item.quality || 'N/A'}] ($${item.price})`
      ).join(' | ');

      await emailService.sendOrderNotification({
        id: orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        comments: formData.comments || 'Sin comentarios adicionales.', 
        itemsDetails: orderDetails,
        totalAmount: total.toLocaleString('es-MX')
      });

      // Vaciamos el carrito y mostramos el modal, pero YA NO redirigimos automáticamente
      clearCart();
      setSuccess(true);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Hubo un error al procesar tu pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const groupedCart = cart.reduce((acc, item) => {
    const category = item.category && item.category !== 'ALL' ? item.category : 'Gorra';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // NUEVO MODAL DE ÉXITO
  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800 text-center">
          <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Pedido Exitoso!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
            Gracias, durante las proximas horas, nos pondremos en contacto contigo para concretar tu compra.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-lg"
          >
            ACEPTAR
          </button>
        </div>
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
        
        <div className="lg:w-3/5">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors relative">
            
            {checkingStock && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <span className="font-bold text-slate-900 dark:text-white">Validando stock...</span>
              </div>
            )}

            <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resumen de Pedido ({totalItems} artículos)</h2>
              <button 
                onClick={clearCart}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm">Vaciar Carrito</span>
              </button>
            </div>
            
            <div className="flex flex-col">
              {Object.entries(groupedCart).map(([category, items]) => (
                <div key={category} className="border-b border-gray-200 dark:border-slate-800 last:border-0">
                  
                  <div className="bg-gray-50 dark:bg-slate-950/50 px-6 py-3 border-y border-gray-100 dark:border-slate-800/50 first:border-t-0">
                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {category}
                    </h3>
                  </div>

                  <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                    {items.map((item) => {
                      const liveProduct = catalog[item.productId] || {};
                      const itemSize = item.size || liveProduct.size || 'N/A';
                      const itemQuality = item.quality || liveProduct.quality || '';
                      const brandsArr = (item.brands && item.brands.length > 0) ? item.brands : (liveProduct.brands && liveProduct.brands.length > 0 ? liveProduct.brands : [liveProduct.brand].filter(Boolean));
                      const brandsText = brandsArr.length > 0 ? brandsArr.join(' X ') : 'Sin Marca';

                      return (
                        <li key={item.productId} className="p-4 sm:p-6 flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="h-20 w-20 flex-shrink-0 rounded-md border border-gray-200 dark:border-slate-700 overflow-hidden">
                              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                                {item.name} <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">[{itemSize}] [{brandsText}]{itemQuality && itemQuality !== 'N/A' ? ` [${itemQuality}]` : ''}</span>
                              </h3>
                              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                                ${(item.price * item.quantity).toLocaleString('es-MX')}
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                              <div className="flex items-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded shadow-sm text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                
                                <span className="w-10 text-center font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                                
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
                          </div>

                          {stockWarnings[item.productId] && (
                            <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-bold border border-red-100 dark:border-red-900/30">
                              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                              <span>{stockWarnings[item.productId]}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            
          </div>
        </div>

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
                  disabled={loading || checkingStock} 
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