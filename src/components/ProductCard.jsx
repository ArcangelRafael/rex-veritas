import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { addItem, cart } = useCart();

  // Verificamos cuántas unidades de este producto ya hay en el carrito
  const cartItem = cart.find(item => item.productId === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  
  // Calculamos si aún nos queda stock disponible para agregar más
  const availableStock = product.stock - quantityInCart;
  const isOutOfStock = availableStock <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
      {/* Contenedor de la Imagen */}
      <div className="relative h-64 bg-gray-100 flex-shrink-0">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
        
        {/* Etiquetas flotantes */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
            {product.brand}
          </span>
          <span className="bg-gray-200 text-slate-800 text-xs font-bold px-2 py-1 rounded w-max">
            Talla: {product.size}
          </span>
        </div>
      </div>

      {/* Información del Producto */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1" title={product.name}>
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
          {product.description || 'Sin descripción detallada.'}
        </p>
        
        <div className="flex items-center justify-between mb-4 mt-auto">
          <span className="text-xl font-extrabold text-slate-900">
            ${product.price.toLocaleString('es-MX')}
          </span>
          <span className="text-sm font-medium text-gray-500">
            Stock: {availableStock}
          </span>
        </div>

        {/* Botón de Agregar al Carrito */}
        <button
          onClick={() => addItem(product)}
          disabled={isOutOfStock}
          className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-bold transition-colors ${
            isOutOfStock 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 active:transform active:scale-95'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span>{isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}</span>
        </button>
      </div>
    </div>
  );
};