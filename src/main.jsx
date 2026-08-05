import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
// Importamos el Proveedor de Seguridad
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          {/* ENVUELVE LA APP AQUÍ CON TU LLAVE PÚBLICA DE RECAPTCHA V3 */}
          <GoogleReCaptchaProvider reCaptchaKey="6LdUBnctAAAAACtY4DWvjd7N-i-1T41YCiJ51Qjz">
            <App />
          </GoogleReCaptchaProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
)