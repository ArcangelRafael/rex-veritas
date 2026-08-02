import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { ProductCard } from '../components/ProductCard';
import { Loader2, SearchX } from 'lucide-react';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los filtros
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedSize, setSelectedSize] = useState('ALL');

  // Traer los productos desde Firebase cuando la página carga
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        // Solo mostraremos los que tengan stock mayor a 0 (opcional, pero buena práctica)
        const inStockProducts = data.filter(p => p.stock > 0);
        setProducts(inStockProducts);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar el catálogo. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Extraer marcas y tallas únicas dinámicamente de los productos disponibles
  const brands = useMemo(() => ['ALL', ...new Set(products.map(p => p.brand))], [products]);
  const sizes = useMemo(() => ['ALL', ...new Set(products.map(p => p.size))], [products]);

  // Aplicar los filtros de forma local (rápido y eficiente)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchBrand = selectedBrand === 'ALL' || product.brand === selectedBrand;
      const matchSize = selectedSize === 'ALL' || product.size === selectedSize;
      return matchBrand && matchSize;
    });
  }, [products, selectedBrand, selectedSize]);

  // Vistas condicionales de carga y error
  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
        <p className="text-gray-500 font-medium">Cargando el inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-500 mt-1">Encuentra tus gorras y playeras favoritas.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filtro de Marca */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Marca
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="block w-full sm:w-40 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-slate-900 focus:border-slate-900"
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>
                  {brand === 'ALL' ? 'Todas' : brand}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Talla */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Talla
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="block w-full sm:w-40 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-slate-900 focus:border-slate-900"
            >
              {sizes.map(size => (
                <option key={size} value={size}>
                  {size === 'ALL' ? 'Todas' : size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Productos o Mensaje de Vacío */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <SearchX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No encontramos productos</h3>
          <p className="text-gray-500 mt-2">Intenta cambiar los filtros de búsqueda.</p>
          <button 
            onClick={() => { setSelectedBrand('ALL'); setSelectedSize('ALL'); }}
            className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};