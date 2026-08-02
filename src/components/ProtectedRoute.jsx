import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // Si no hay un usuario logueado en Firebase, lo redirigimos a la ruta /admin/login
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si está logueado, le permitimos ver el componente hijo (El Dashboard)
  return children;
};