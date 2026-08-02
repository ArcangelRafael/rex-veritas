import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProductForm } from '../components/ProductForm';
import { OrderList } from '../components/OrderList';
import { LogOut } from 'lucide-react';

export const AdminDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabecera del Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <p className="text-gray-600 mt-1">Administrando tienda con: {currentUser?.email}</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors border border-red-200 font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Grid del Dashboard - Formulario arriba, Pedidos abajo */}
      <div className="space-y-8">
        
        {/* Sección Superior: Formulario para Agregar Productos */}
        <section>
          <ProductForm />
        </section>

        {/* Sección Inferior: El Gestor de Pedidos */}
        <section className="pt-8 border-t border-gray-200">
          <OrderList />
        </section>

      </div>
    </div>
  );
};