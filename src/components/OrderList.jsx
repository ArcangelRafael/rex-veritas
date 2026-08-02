import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { Clock, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // Nuevo estado para controlar qué pestaña estamos viendo
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' o 'CONCLUIDAS'

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleComplete = async (orderId) => {
    if (!window.confirm('¿Seguro que quieres finalizar este pedido? Se moverá al historial de concluidas.')) return;
    
    try {
      setProcessingId(orderId);
      await orderService.completeOrder(orderId);
      await fetchOrders(); 
    } catch (error) {
      alert("Error al completar el pedido.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (orderId, items) => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido? El stock regresará a la tienda y el pedido pasará a concluidas.')) return;
    
    try {
      setProcessingId(orderId);
      await orderService.cancelOrderAndReturnStock(orderId, items);
      await fetchOrders(); 
    } catch (error) {
      alert("Error al cancelar el pedido.");
    } finally {
      setProcessingId(null);
    }
  };

  const statusStyles = {
    PENDING: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, label: 'Pendiente' },
    COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Finalizado' },
    CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Cancelado' }
  };

  // Separar los pedidos matemáticamente para las pestañas
  const pendingOrders = orders.filter(order => order.status === 'PENDING');
  const completedOrders = orders.filter(order => order.status === 'COMPLETED' || order.status === 'CANCELLED');
  
  // La lista que realmente se va a dibujar en pantalla dependiendo de la pestaña activa
  const displayOrders = activeTab === 'PENDING' ? pendingOrders : completedOrders;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-2">
        <Package className="h-6 w-6 text-slate-700" />
        <h2 className="text-xl font-bold text-gray-800">Gestor de Pedidos</h2>
      </div>

      {/* Navegación de Pestañas */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'PENDING' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Pendientes ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('CONCLUIDAS')}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'CONCLUIDAS' 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Concluidas ({completedOrders.length})
        </button>
      </div>

      {/* Contenido de la Lista */}
      {displayOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay pedidos en esta sección.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {displayOrders.map((order) => {
            const StatusIcon = statusStyles[order.status].icon;
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${statusStyles[order.status].bg}`}>
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID: {order.id}</span>
                    <div className="flex items-center mt-1 space-x-2">
                      <StatusIcon className={`h-5 w-5 ${statusStyles[order.status].color}`} />
                      <span className={`font-bold ${statusStyles[order.status].color}`}>
                        {statusStyles[order.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-medium text-gray-600">
                      {order.createdAt.toLocaleDateString('es-MX')}
                    </span>
                    <span className="block text-lg font-extrabold text-slate-900">
                      ${order.totalAmount.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Cliente:</p>
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600 font-medium">Teléfono: {order.customerPhone}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Artículos solicitados:</p>
                    <ul className="space-y-2">
                      {order.items.map((item, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-800">{item.quantity}x {item.name}</span>
                          <span className="text-gray-600">${item.price * item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Los botones solo existen si el pedido está en estado PENDING */}
                {order.status === 'PENDING' && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleCancel(order.id, order.items)}
                      className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar (Devolver Stock)
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleComplete(order.id)}
                      className="px-4 py-2 bg-slate-900 text-white font-medium hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>Finalizar</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};