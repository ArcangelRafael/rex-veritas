import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      {/* AQUÍ ESTÁ LA MAGIA: Agregamos las clases dark: y una transición suave */}
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* El Navbar se mostrará en todas las rutas */}
        <Navbar />
        
        {/* Contenedor principal para las vistas */}
        <main>
          <Routes>
            {/* Rutas Públicas (Clientes) */}
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            
            {/* Rutas de Administración (Tu amigo) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Ruta Protegida: Solo accesible si hay sesión iniciada */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;