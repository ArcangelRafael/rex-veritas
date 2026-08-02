import { Link } from 'react-router-dom';
import { ShoppingCart, Store, Sun, Moon } from 'lucide-react'; // Añadimos Sun y Moon
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext'; // Importamos el Hook del tema

export const Navbar = () => {
  const { totalItems } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300 dark:bg-slate-950 dark:border-b dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo, Nombre y Switch de Modo Oscuro */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold hover:text-gray-300 transition-colors">
              <Store className="h-6 w-6" />
              <span>Tienda Rex-Veritatis</span>
            </Link>

            {/* Switch de Modo Oscuro */}
            <button 
              onClick={toggleDarkMode}
              className="flex items-center justify-center p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 ml-2"
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>

          {/* Icono del Carrito con contador */}
          <Link to="/checkout" className="relative p-2 hover:bg-slate-800 rounded-full transition-colors dark:hover:bg-slate-800/50">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
          
        </div>
      </div>
    </nav>
  );
};