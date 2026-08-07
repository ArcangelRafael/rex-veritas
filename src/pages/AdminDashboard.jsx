import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProductForm } from '../components/ProductForm';
import { OrderList } from '../components/OrderList';
import { ProductInventory } from '../components/ProductInventory';
import { MessageList } from '../components/MessageList'; 
import { OfferManager } from '../components/OfferManager';
import { productService } from '../services/productService'; 
import { LogOut, PlusCircle, BarChart3, Package, ChevronDown, ChevronUp, MessageSquare, Ghost, Loader2, CheckCircle2, AlertTriangle, Info, X, Tag } from 'lucide-react';

const AccordionSection = ({ id, title, icon: Icon, badge, badgeText, isOpen, onToggle, children }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-4 transition-all duration-300">
      <button 
        onClick={() => onToggle(isOpen ? null : id)}
        className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${isOpen ? 'bg-slate-900 dark:bg-slate-800 text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-800 dark:text-gray-200'}`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`h-6 w-6 ${isOpen ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
          
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {badge > 0 && (
              <span className="animate-pulse bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full shadow-lg">
                {badge} {badgeText}
              </span>
            )}
          </div>
          
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 opacity-70" /> : <ChevronDown className="h-5 w-5 opacity-70" />}
      </button>
      
      <div className={`p-6 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-slate-800 ${isOpen ? 'block animate-in slide-in-from-top-2' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(null); 
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); 
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0); 
  
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanSuccess, setCleanSuccess] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'success', message: '', onConfirm: null });

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });
  const showError = (msg) => setModalConfig({ isOpen: true, type: 'error', message: msg, onConfirm: null });
  const showConfirm = (msg, onConfirmCallback) => setModalConfig({ isOpen: true, type: 'confirm', message: msg, onConfirm: onConfirmCallback });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleCleanGhostCarts = () => {
    showConfirm('¿Seguro que deseas reiniciar los contadores de carritos? Esto apagará los avisos de "X personas lo tienen en su carrito" en toda la tienda.', async () => {
      closeModal();
      setIsCleaning(true);
      try {
        await productService.resetAllGhostCarts();
        setCleanSuccess(true);
        setTimeout(() => setCleanSuccess(false), 3000);
      } catch (error) {
        showError("Hubo un error al limpiar los carritos.");
      } finally {
        setIsCleaning(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      
      {/* MODAL CORREGIDO (Colores en Dark Mode adaptados) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
            <div className="flex flex-col items-center text-center relative">
              
              {modalConfig.type !== 'confirm' && (
                <button onClick={closeModal} className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}

              {modalConfig.type === 'error' && <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />}
              {modalConfig.type === 'success' && <CheckCircle2 className="h-14 w-14 text-green-500 mb-4" />}
              {modalConfig.type === 'confirm' && <Info className="h-14 w-14 text-blue-500 mb-4" />}
              
              <p className="text-gray-800 dark:text-gray-200 font-medium text-lg mb-6">{modalConfig.message}</p>
              
              <div className="flex w-full space-x-3">
                {modalConfig.type === 'confirm' ? (
                  <>
                    <button onClick={closeModal} className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={modalConfig.onConfirm} className="flex-1 py-2.5 px-4 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors">Confirmar</button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full py-2.5 px-4 bg-slate-900 dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors">Entendido</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
          {/* CORRECCIÓN: Email adaptado al dark mode */}
          <p className="text-gray-500 mt-1 text-sm font-medium">Administrando tienda con: <span className="text-slate-900 dark:text-white font-bold">{currentUser?.email}</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={handleCleanGhostCarts}
            disabled={isCleaning || cleanSuccess}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors border shadow-sm w-full sm:w-auto ${cleanSuccess ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200 dark:bg-slate-800 dark:text-orange-400 dark:border-slate-700 dark:hover:bg-slate-700'}`}
          >
            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : (cleanSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Ghost className="h-4 w-4" />)}
            <span>{cleanSuccess ? 'Carritos Limpios' : 'Vaciar Carritos Fantasma'}</span>
          </button>

          <button onClick={handleLogout} className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 border border-red-200 dark:bg-slate-800 dark:text-red-400 dark:border-slate-700 dark:hover:bg-slate-700 font-bold text-sm w-full sm:w-auto transition-colors">
            <LogOut className="h-4 w-4" /><span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        
        <AccordionSection id="MESSAGES" title="Mensajes y Mayoreo" icon={MessageSquare} badge={unreadMessagesCount} badgeText="NUEVOS" isOpen={activeSection === 'MESSAGES'} onToggle={setActiveSection}>
          <MessageList onUnreadCountChange={setUnreadMessagesCount} />
        </AccordionSection>

        <AccordionSection id="ORDERS" title="Gestor de Pedidos" icon={Package} badge={pendingOrdersCount} badgeText="PENDIENTES" isOpen={activeSection === 'ORDERS'} onToggle={setActiveSection}>
          <OrderList onPendingCountChange={setPendingOrdersCount} />
        </AccordionSection>

        <AccordionSection id="OFFERS" title="Creador de Ofertas (Marketing)" icon={Tag} isOpen={activeSection === 'OFFERS'} onToggle={setActiveSection}>
          <OfferManager />
        </AccordionSection>

        <AccordionSection id="INVENTORY" title="Modificar Producto e Inteligencia de Negocios" icon={BarChart3} isOpen={activeSection === 'INVENTORY'} onToggle={setActiveSection}>
          <ProductInventory />
        </AccordionSection>

        <AccordionSection id="ADD_PRODUCT" title="Agregar Nuevo Producto" icon={PlusCircle} isOpen={activeSection === 'ADD_PRODUCT'} onToggle={setActiveSection}>
          <div className="max-w-3xl"><ProductForm /></div>
        </AccordionSection>
      </div>
    </div>
  );
};