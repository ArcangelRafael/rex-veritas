import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProductForm } from '../components/ProductForm';
import { OrderList } from '../components/OrderList';
import { ProductInventory } from '../components/ProductInventory';
import { LogOut, PlusCircle, BarChart3, Package, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('ORDERS'); 

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const AccordionSection = ({ id, title, icon: Icon, children }) => {
    const isOpen = activeSection === id;
    
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-4 transition-all duration-300">
        <button 
          onClick={() => setActiveSection(isOpen ? null : id)}
          className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${isOpen ? 'bg-slate-900 dark:bg-slate-800 text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-800 dark:text-gray-200'}`}
        >
          <div className="flex items-center space-x-3">
            <Icon className={`h-6 w-6 ${isOpen ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5 opacity-70" /> : <ChevronDown className="h-5 w-5 opacity-70" />}
        </button>
        
        {isOpen && (
          <div className="p-6 bg-gray-50 dark:bg-slate-950/50 border-t border-gray-100 dark:border-slate-800 animate-in slide-in-from-top-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Administrando tienda con: <span className="text-slate-900 dark:text-gray-200">{currentUser?.email}</span>
          </p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900/30 font-bold text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      <div className="space-y-2">
        <AccordionSection id="ORDERS" title="Gestor de Pedidos" icon={Package}>
          <OrderList />
        </AccordionSection>

        <AccordionSection id="INVENTORY" title="Modificar Producto e Inteligencia de Negocios" icon={BarChart3}>
          <ProductInventory />
        </AccordionSection>

        <AccordionSection id="ADD_PRODUCT" title="Agregar Nuevo Producto" icon={PlusCircle}>
          <div className="max-w-3xl">
            <ProductForm />
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};