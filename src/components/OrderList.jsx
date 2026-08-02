import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { Clock, CheckCircle2, XCircle, Package, Loader2, Copy, ChevronDown, ChevronUp, Search, Edit, Save, Plus, Minus, Trash2, AlertTriangle, Info } from 'lucide-react';

export const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING'); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedOrders, setExpandedOrders] = useState([]);
  
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);

  // --- SISTEMA DE MODALS (Reemplazo de Alerts) ---
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error' | 'confirm'
    message: '',
    onConfirm: null
  });

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showSuccess = (msg) => setModalConfig({ isOpen: true, type: 'success', message: msg, onConfirm: null });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg, onConfirm: null });
  const showConfirm = (msg, onConfirmCallback) => setModalConfig({ isOpen: true, type: 'confirm', message: msg, onConfirm: onConfirmCallback });

  // ------------------------------------------------

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      showError("Error crítico al cargar los pedidos desde la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleComplete = (orderId) => {
    showConfirm('¿Seguro que quieres finalizar este pedido? Se moverá a concluidas.', async () => {
      closeModal();
      try {
        setProcessingId(orderId);
        await orderService.completeOrder(orderId);
        await fetchOrders(); 
        showSuccess("Pedido finalizado con éxito.");
      } catch (error) {
        showError("Error al completar el pedido.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleCancel = (orderId, items) => {
    showConfirm('¿Seguro que quieres cancelar este pedido? El stock regresará a la base de datos.', async () => {
      closeModal();
      try {
        setProcessingId(orderId);
        await orderService.cancelOrderAndReturnStock(orderId, items);
        await fetchOrders(); 
        showSuccess("Pedido cancelado y stock devuelto exitosamente.");
      } catch (error) {
        showError("Error al cancelar el pedido.");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const handleCopy = (order) => {
    const text = `📦 PEDIDO: ${order.id}\n📅 Fecha: ${order.createdAt.toLocaleDateString('es-MX')} ${order.createdAt.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}\n👤 Cliente: ${order.customerName}\n📱 Tel: ${order.customerPhone}\n\n🛒 ARTÍCULOS:\n${order.items.map(i => `- ${i.quantity}x ${i.name} (ID: ${i.productId})`).join('\n')}\n\n💰 TOTAL: $${order.totalAmount.toLocaleString('es-MX')}`;
    navigator.clipboard.writeText(text);
    showSuccess('¡Información copiada al portapapeles!');
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
    if (editingOrderId === orderId) setEditingOrderId(null);
  };

  const startEditing = (order) => {
    setEditingOrderId(order.id);
    setEditItems([...order.items]);
  };

  const updateEditQuantity = (productId, delta) => {
    setEditItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(0, newQty) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const saveEdit = async (orderId, oldItems) => {
    if (editItems.length === 0) {
      showError("El pedido no puede quedar vacío. Si quieres borrarlo, presiona Cancelar Pedido.");
      return;
    }
    try {
      setProcessingId(orderId);
      await orderService.modifyOrderItems(orderId, oldItems, editItems);
      setEditingOrderId(null);
      await fetchOrders();
      showSuccess("¡Pedido actualizado y stock ajustado correctamente!");
    } catch (error) {
      showError(error.message || "Error al modificar el pedido.");
    } finally {
      setProcessingId(null);
    }
  };

  const statusStyles = {
    PENDING: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, label: 'Pendiente' },
    COMPLETED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Finalizado' },
    CANCELLED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Cancelado' }
  };

  const baseOrders = activeTab === 'PENDING' 
    ? orders.filter(order => order.status === 'PENDING')
    : orders.filter(order => order.status === 'COMPLETED' || order.status === 'CANCELLED');

  let displayOrders = baseOrders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  displayOrders.sort((a, b) => {
    return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* --- RENDER DEL MODAL --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              
              {modalConfig.type === 'error' && <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />}
              {modalConfig.type === 'success' && <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              {modalConfig.type === 'confirm' && <Info className="h-14 w-14 text-blue-500 mb-4" />}

              <p className="text-gray-800 font-medium text-lg mb-6">{modalConfig.message}</p>

              <div className="flex w-full space-x-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button onClick={closeModal} className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={modalConfig.onConfirm} className="flex-1 py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------- */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-slate-700" />
          <h2 className="text-xl font-bold text-gray-800">Gestor de Pedidos</h2>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Cliente o Artículo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none bg-white"
          >
            <option value="desc">Más nuevos</option>
            <option value="asc">Más viejos</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => { setActiveTab('PENDING'); setSearchTerm(''); }}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'PENDING' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Pendientes ({orders.filter(o => o.status === 'PENDING').length})
        </button>
        <button
          onClick={() => { setActiveTab('CONCLUIDAS'); setSearchTerm(''); }}
          className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'CONCLUIDAS' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Concluidas ({orders.filter(o => o.status !== 'PENDING').length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No hay pedidos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayOrders.map((order) => {
            const StatusIcon = statusStyles[order.status].icon;
            const isProcessing = processingId === order.id;
            const isExpanded = expandedOrders.includes(order.id);
            const isEditing = editingOrderId === order.id;

            const currentItemsList = isEditing ? editItems : order.items;
            const currentTotal = isEditing 
              ? editItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
              : order.totalAmount;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
                
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className={`px-6 py-4 cursor-pointer hover:bg-opacity-80 transition-colors border-b border-gray-100 flex justify-between items-center ${statusStyles[order.status].bg}`}
                >
                  <div className="flex items-center space-x-4">
                    <button className="p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors">
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID: {order.id}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(order); }} className="text-gray-400 hover:text-slate-900" title="Copiar Datos">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center mt-1 space-x-2">
                        <StatusIcon className={`h-5 w-5 ${statusStyles[order.status].color}`} />
                        <span className={`font-bold ${statusStyles[order.status].color}`}>
                          {statusStyles[order.status].label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-medium text-gray-600">
                      {order.createdAt.toLocaleDateString('es-MX')} - {order.createdAt.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className="block text-lg font-extrabold text-slate-900">
                      ${currentTotal.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-white animate-in slide-in-from-top-2">
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Datos del Cliente</p>
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-600 font-medium">WhatsApp: {order.customerPhone}</p>
                        <p className="text-sm text-gray-600 font-medium">Email: {order.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Comentarios</p>
                        <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded border border-gray-100">
                          {order.comments || "Sin comentarios."}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase">Artículos solicitados:</p>
                        {order.status === 'PENDING' && !isEditing && (
                          <button onClick={() => startEditing(order)} className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            <Edit className="h-4 w-4" /> <span>Modificar Pedido</span>
                          </button>
                        )}
                      </div>

                      <ul className="space-y-3">
                        {currentItemsList.map((item, i) => (
                          <li key={i} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-100">
                            <div className="flex-1">
                              <span className="font-bold text-gray-800 block">{item.name}</span>
                              <span className="text-xs text-gray-400 font-mono">ID: {item.productId}</span>
                            </div>
                            
                            {isEditing ? (
                              <div className="flex items-center space-x-3 mr-4 bg-gray-100 rounded-lg p-1">
                                <button onClick={() => updateEditQuantity(item.productId, -1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Minus className="h-3 w-3" /></button>
                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateEditQuantity(item.productId, 1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Plus className="h-3 w-3" /></button>
                                <button onClick={() => updateEditQuantity(item.productId, -item.quantity)} className="ml-2 p-1 text-red-500 hover:bg-red-100 rounded" title="Eliminar artículo"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-700 mr-6">{item.quantity}x</span>
                            )}
                            
                            <span className="text-gray-600 font-medium w-20 text-right">${(item.price * item.quantity).toLocaleString('es-MX')}</span>
                          </li>
                        ))}
                      </ul>

                      {isEditing && (
                        <div className="mt-4 flex justify-end space-x-3 border-t border-gray-200 pt-3">
                          <button onClick={() => setEditingOrderId(null)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
                          <button 
                            onClick={() => saveEdit(order.id, order.items)}
                            disabled={isProcessing}
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExpanded && order.status === 'PENDING' && !isEditing && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4 rounded-b-xl">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleCancel(order.id, order.items)}
                      className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar Pedido
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