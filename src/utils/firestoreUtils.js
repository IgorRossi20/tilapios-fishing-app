// Utilitários para operações seguras do Firestore
// Trata erros de rede de forma elegante

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'

// Função para executar operações do Firestore com retry e tratamento de erros
const executeWithRetry = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Erros que devem ser ignorados (problemas de rede temporários)
      if (
        error.code === 'unavailable' ||
        error.code === 'cancelled' ||
        error.message?.includes('ERR_ABORTED') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
      ) {
        // console.log(`🔄 Tentativa ${attempt}/${maxRetries} falhou (erro de rede), tentando novamente...`)
        
        if (attempt === maxRetries) {
          // console.warn('⚠️ Operação falhou após múltiplas tentativas (problemas de rede)')
          return null // Retorna null em vez de lançar erro
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        continue
      }
      
      // Erros que devem ser propagados (problemas de permissão, dados inválidos, etc.)
      throw error
    }
  }
}

// Wrapper para getDocs com tratamento de erros
export const safeGetDocs = async (queryRef) => {
  return executeWithRetry(async () => {
    const snapshot = await getDocs(queryRef)
    return snapshot
  })
}

// Wrapper para getDoc com tratamento de erros
export const safeGetDoc = async (docRef) => {
  return executeWithRetry(async () => {
    const snapshot = await getDoc(docRef)
    return snapshot
  })
}

// Wrapper para setDoc com tratamento de erros
export const safeSetDoc = async (docRef, data, options = {}) => {
  return executeWithRetry(async () => {
    await setDoc(docRef, data, options)
    return true
  })
}

// Wrapper para addDoc com tratamento de erros
export const safeAddDoc = async (collectionRef, data) => {
  return executeWithRetry(async () => {
    const docRef = await addDoc(collectionRef, data)
    return docRef
  })
}

// Wrapper para updateDoc com tratamento de erros
export const safeUpdateDoc = async (docRef, data) => {
  return executeWithRetry(async () => {
    await updateDoc(docRef, data)
    return true
  })
}

// Wrapper para deleteDoc com tratamento de erros
export const safeDeleteDoc = async (docRef) => {
  return executeWithRetry(async () => {
    await deleteDoc(docRef)
    return true
  })
}

// Função para criar queries de forma segura
export const createSafeQuery = (collectionRef, ...constraints) => {
  try {
    return query(collectionRef, ...constraints)
  } catch (error) {
    // console.error('❌ Erro ao criar query:', error)
    return collectionRef // Retorna a coleção sem filtros em caso de erro
  }
}

// Função para verificar se um erro é relacionado à rede
export const isNetworkError = (error) => {
  return (
    error.code === 'unavailable' ||
    error.code === 'cancelled' ||
    error.message?.includes('ERR_ABORTED') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('firestore.googleapis.com')
  )
}

// Função para verificar se um erro é de permissão
export const isPermissionError = (error) => {
  return (
    error.code === 'permission-denied' ||
    error.code === 'unauthenticated'
  )
}

export default {
  safeGetDocs,
  safeGetDoc,
  safeSetDoc,
  safeAddDoc,
  safeUpdateDoc,
  safeDeleteDoc,
  createSafeQuery,
  isNetworkError,
  isPermissionError
}