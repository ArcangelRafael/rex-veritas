import { Link } from 'react-router-dom';
import { ShoppingCart, Store } from 'lucide-react'; // Iconos profesionales
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { totalItems } = useCart();

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Nombre */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold hover:text-gray-300 transition-colors">
            <Store className="h-6 w-6" />
            <span>Tienda de Gorras</span>
          </Link>

          {/* Icono del Carrito con contador */}
          <Link to="/checkout" className="relative p-2 hover:bg-slate-800 rounded-full transition-colors">
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