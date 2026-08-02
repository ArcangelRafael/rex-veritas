import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es un "listener" (escuchador) de Firebase.
    // Nos avisa en tiempo real si el usuario se loguea o cierra sesión.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Una vez que sabemos el estado, dejamos de cargar
    });
    
    // Función de limpieza (cleanup) al desmontar el componente para evitar fugas de memoria
    return unsubscribe;
  }, []);

  // Controladores de sesión
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* No renderizamos los hijos hasta que Firebase nos confirme si hay sesión o no */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook para usar la autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};