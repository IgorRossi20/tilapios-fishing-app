import React, { createContext, useContext } from 'react'
import { auth, db, storage } from '../firebase/config'
import { disableNetwork, enableNetwork } from 'firebase/firestore'
import { isValidFirebaseDomain } from '../utils/mobileCompatibility'

// As instâncias do Firebase (auth, db, storage) são fornecidas por src/firebase/config

// Detectar ambiente de produção
const isProduction = import.meta.env.PROD || window.location.hostname.includes('vercel.app')
const currentDomain = window.location.hostname

// Serviços já inicializados (auth, db, storage) vindos do config.js

// Verificar se o domínio atual é válido para o Firebase e aplicar flags de ambiente
const isValidDomain = isValidFirebaseDomain()
const forceOffline = String(import.meta.env.VITE_FIRESTORE_FORCE_OFFLINE || '').toLowerCase() === 'true'
const forceOnlineDev = String(import.meta.env.VITE_FIREBASE_FORCE_ONLINE_DEV || '').toLowerCase() === 'true'

// Decidir modo offline: forçado por env ou domínio não autorizado (sem força online)
const shouldGoOffline = forceOffline || (!isValidDomain && !forceOnlineDev)
window.FIRESTORE_OFFLINE_MODE = shouldGoOffline

if (shouldGoOffline) {
  ;(async () => {
    try {
      await disableNetwork(db)
      console.info('Firestore em modo offline (forçado ou domínio não autorizado).')
    } catch (e) {
      console.warn('Falha ao desativar rede do Firestore:', e?.message || e)
    }
  })()
} else {
  ;(async () => {
    try {
      await enableNetwork(db)
      console.info('Firestore habilitado em modo ONLINE.')
    } catch (e) {
      console.warn('Falha ao habilitar rede do Firestore:', e?.message || e)
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

// Preservar flag global conforme calculado acima (removido reset para false)
// window.FIRESTORE_OFFLINE_MODE = false

// Reexportar instâncias para manter compatibilidade com imports existentes
export { auth, db, storage }

const FirebaseContext = createContext({
  auth,
  db,
  storage
})

export const useFirebase = () => useContext(FirebaseContext)

export const FirebaseProvider = ({ children }) => {
  return (
    <FirebaseContext.Provider value={{ auth, db, storage }}>
      {children}
    </FirebaseContext.Provider>
  )
}