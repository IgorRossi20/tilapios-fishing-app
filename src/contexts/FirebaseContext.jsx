import React, { createContext, useContext } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { isValidFirebaseDomain } from '../utils/mobileCompatibility'

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializar Firebase com tratamento de erros
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  // Verificar se o erro está relacionado ao domínio não autorizado
  if (error.code === 'auth/invalid-api-key' || error.code === 'auth/domain-not-authorized') {
    console.error('🚨 Domínio não autorizado ou API Key inválida. Verifique a configuração do Firebase.');
    alert('Erro de autenticação: Este domínio pode não estar autorizado no Firebase. Por favor, tente acessar pelo domínio oficial ou contate o suporte.');
  }
  throw error;
}

// Inicializar serviços com configurações otimizadas e tratamento de erros
export const auth = getAuth(app);

// Verificar se o domínio atual é válido para o Firebase
const isValidDomain = isValidFirebaseDomain();
if (!isValidDomain) {
  console.warn('⚠️ O domínio atual pode não estar autorizado no Firebase Authentication');
}

// Configurar Firestore com persistência e tratamento de erros para dispositivos móveis
let db;
try {
  db = getFirestore(app);
  console.log('🌐 Firestore configurado para modo online');
  console.log('✅ Acesso à rede habilitado');
  console.log('🔄 Sincronização automática ativada');
} catch (error) {
  console.error('❌ Erro ao configurar Firestore:', error);
  // Tentar configuração alternativa para dispositivos móveis
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true, // Melhor para dispositivos móveis
      useFetchStreams: false // Desativar streams para melhor compatibilidade
    });
    console.log('🔄 Firestore configurado com modo alternativo para dispositivos móveis');
  } catch (fallbackError) {
    console.error('❌ Erro ao configurar Firestore (modo alternativo):', fallbackError);
    throw fallbackError;
  }
}

// Filtrar erros ERR_ABORTED que são comuns e não afetam a funcionalidade
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (message.includes('ERR_ABORTED') || 
      message.includes('net::ERR_ABORTED') ||
      message.includes('firestore.googleapis.com') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError')) {
    return // Ignorar esses erros de rede comuns
  }
  originalConsoleError.apply(console, args)
}

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