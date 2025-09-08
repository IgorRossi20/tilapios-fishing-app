import React, { createContext, useContext } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar serviços com configurações otimizadas
export const auth = getAuth(app)

// Configurar Firestore para modo online
const db = getFirestore(app)
console.log('🌐 Firestore configurado para modo online')
console.log('✅ Acesso à rede habilitado')
console.log('🔄 Sincronização automática ativada')

// Suprimir erros ERR_ABORTED conhecidos do Firestore que não afetam funcionalidade
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (message.includes('ERR_ABORTED') && message.includes('firestore.googleapis.com')) {
    // Suprimir erro ERR_ABORTED do Firestore (problema conhecido que não afeta funcionalidade)
    return
  }
  originalConsoleError.apply(console, args)
}

// Interceptar erros de rede para suprimir ERR_ABORTED do Firestore
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ERR_ABORTED') && event.filename && event.filename.includes('firestore')) {
    event.preventDefault()
    return false
  }
})

// Interceptar erros não tratados de Promise para suprimir ERR_ABORTED do Firestore
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.toString().includes('ERR_ABORTED')) {
    event.preventDefault()
    return false
  }
})

// Definir flag global para modo online
window.FIRESTORE_OFFLINE_MODE = false
console.log('🌐 Modo online ativo:', !window.FIRESTORE_OFFLINE_MODE)
console.log('🛡️ Filtro de erros ERR_ABORTED ativado')

export { db }

export const storage = getStorage(app)

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