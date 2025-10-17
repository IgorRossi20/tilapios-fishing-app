import React, { createContext, useContext } from 'react'
import { auth, db, storage } from '../firebase/config'
import { disableNetwork, enableNetwork } from 'firebase/firestore'
import { isValidFirebaseDomain } from '../utils/mobileCompatibility'

// As instâncias do Firebase (auth, db, storage) são fornecidas por src/firebase/config

// Detectar ambiente de produção
const isProduction = import.meta.env.PROD || window.location.hostname.includes('vercel.app')
const currentDomain = window.location.hostname

// Serviços já inicializados (auth, db, storage) vindos do config.js

// Verificar se o domínio atual é válido para o Firebase
const isValidDomain = isValidFirebaseDomain();
if (!isValidDomain) {
  // Ativar modo offline quando domínio não autorizado
  window.FIRESTORE_OFFLINE_MODE = true
  ;(async () => {
    try {
      await disableNetwork(db)
      console.info('Firestore em modo offline: domínio não autorizado para Firebase Auth.')
    } catch (e) {
      console.warn('Falha ao desativar rede do Firestore:', e?.message || e)
    }
  })()
}

// Firestore já configurado no config.js (initializeFirestore com auto long polling)

// Filtrar erros ERR_ABORTED que são comuns e não afetam a funcionalidade
const originalConsoleError = console.error

// Interceptar erros de rede para suprimir ERR_ABORTED do Firestore
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('ERR_ABORTED') ||
    event.message.includes('firestore.googleapis.com') ||
    event.message.includes('Failed to fetch') ||
    event.message.includes('NetworkError')
  )) {
    event.preventDefault()
    return false
  }
})

// Interceptar erros não tratados de Promise para suprimir ERR_ABORTED do Firestore
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    event.reason.toString().includes('ERR_ABORTED') ||
    event.reason.toString().includes('firestore.googleapis.com') ||
    event.reason.toString().includes('Failed to fetch') ||
    event.reason.toString().includes('NetworkError') ||
    event.reason.toString().includes('auth/network-request-failed') ||
    event.reason.toString().includes('auth/timeout')
  )) {
    event.preventDefault()
    return false
  }
})

// Alternar rede do Firestore conforme status online/offline
window.addEventListener('online', () => {
  if (!window.FIRESTORE_OFFLINE_MODE) {
    enableNetwork(db).catch(() => {})
  }
})
window.addEventListener('offline', () => {
  disableNetwork(db).catch(() => {})
})

// Definir flag global para modo online
window.FIRESTORE_OFFLINE_MODE = false

// Reexportar instâncias para manter compatibilidade com imports existentes
export { auth, db, storage }

const FirebaseContext = createContext({
  auth,
  db,
  storage
})

export const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebase deve ser usado dentro de FirebaseProvider')
  }
  return context
}

export const FirebaseProvider = ({ children }) => {
  const value = {
    auth,
    db,
    storage
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}