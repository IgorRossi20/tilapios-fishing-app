import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc, getDocFromCache } from 'firebase/firestore'
import { auth, db } from './FirebaseContext'

const AuthContext = createContext()
export { AuthContext }

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Função para fazer login
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result
    } catch (error) {
      throw error
    }
  }

  // Função para registrar usuário
  const register = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Atualizar perfil com nome
      await updateProfile(result.user, {
        displayName: displayName
      })

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        createdAt: new Date(),
        totalFish: 0,
        totalWeight: 0,
        tournaments: [],
        achievements: []
      })

      return result
    } catch (error) {
      throw error
    }
  }

  // Função para logout
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  // Função para resetar senha
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Email de recuperação enviado com sucesso!' }
    } catch (error) {
      throw error
    }
  }

  const getUserData = async (uid) => {
    try {
      // Primeiro, tentar carregar do cache local para resposta imediata
      const cachedUserData = localStorage.getItem(`userData_${uid}`)
      if (cachedUserData) {
        const userData = JSON.parse(cachedUserData)
        console.log('📱 Dados do usuário carregados do cache local:', userData)
        
        // Sincronizar imediatamente com Firestore online
        try {
          const userRef = doc(db, 'users', uid)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            const freshData = { id: userSnap.id, ...userSnap.data() }
            localStorage.setItem(`userData_${uid}`, JSON.stringify(freshData))
            console.log('🔄 Dados do usuário sincronizados online:', freshData)
            return freshData // Retornar dados atualizados
          }
        } catch (syncError) {
          console.log('⚠️ Sincronização online falhou, usando cache:', syncError.message)
        }
        
        return userData
      }
      
      // Se não há cache, tentar buscar online
      console.log('🌐 Buscando dados do usuário online...')
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const userData = { id: userSnap.id, ...userSnap.data() }
        // Salvar no cache para próximas vezes
        localStorage.setItem(`userData_${uid}`, JSON.stringify(userData))
        console.log('✅ Dados do usuário obtidos online e salvos no cache:', userData)
        return userData
      } else {
        // Se não existe no Firestore, criar perfil básico
        console.log('👤 Criando perfil básico do usuário')
        const userData = {
          id: uid,
          name: user?.displayName || 'Usuário',
          email: user?.email || '',
          photoURL: user?.photoURL || null,
          createdAt: new Date().toISOString()
        }
        // Salvar no cache
        localStorage.setItem(`userData_${uid}`, JSON.stringify(userData))
        return userData
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar dados online, usando dados básicos:', error.message)
      
      // Criar dados básicos do Firebase Auth
      const basicUserData = {
        id: uid,
        name: user?.displayName || 'Usuário',
        email: user?.email || '',
        photoURL: user?.photoURL || null,
        createdAt: new Date().toISOString()
      }
      
      // Salvar no cache para próximas vezes
      localStorage.setItem(`userData_${uid}`, JSON.stringify(basicUserData))
      console.log('💾 Dados básicos salvos no cache local')
      
      return basicUserData
    }
  }

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Buscar dados adicionais do usuário
        const userData = await getUserData(user.uid)
        setUser({
          ...user,
          ...userData
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    getUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}