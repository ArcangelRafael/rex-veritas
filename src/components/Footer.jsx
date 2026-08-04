import { Code2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 py-8 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">

        {/* Créditos */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium flex items-center justify-center md:justify-start gap-2 mb-1">
            <Code2 className="h-5 w-5 text-slate-900 dark:text-white" />
            <span>Desarrollado por <span className="font-extrabold text-slate-900 dark:text-white tracking-wide">Arc RafaeLuis IX</span></span>
          </p>
          <p>Mira mis otros proyectos y ponte en contacto.</p>
        </div>

        {/* Redes y Contacto */}
        <div className="flex flex-col items-center md:items-end space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">¿Quieres una página similar?</p>
          <div className="flex items-center space-x-3">
            
            {/* Botón Instagram con SVG Nativo */}
            <a
              href="https://www.instagram.com/sir_arcangelrafael_elmagnanimo/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90 hover:scale-105 transition-all shadow-sm"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span>Instagram</span>
            </a>
            
            {/* Botón Facebook con SVG Nativo */}
            <a
              href="https://www.facebook.com/luis.durmon.2025/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 hover:scale-105 transition-all shadow-sm"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
              </svg>
              <span>Facebook</span>
            </a>
            
          </div>
        </div>

      </div>
    </footer>
  );
};