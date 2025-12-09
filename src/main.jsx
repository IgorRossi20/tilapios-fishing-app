import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MinimalApp from './MinimalApp.jsx'
import './index.css'
import { initMobileCompatibility } from './utils/mobileCompatibility'

// Inicializar verificações de compatibilidade móvel
try {
  initMobileCompatibility();
} catch (error) {
}

const useMinimal = (
  (import.meta?.env?.VITE_DEBUG_MINIMAL_APP === 'true') ||
  (typeof window !== 'undefined' && window.location && window.location.hash === '#debug')
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {useMinimal ? <MinimalApp /> : <App />}
  </React.StrictMode>,
)