import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initMobileCompatibility } from './utils/mobileCompatibility'

// Inicializar verificações de compatibilidade móvel
try {
  initMobileCompatibility();
} catch (error) {
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)