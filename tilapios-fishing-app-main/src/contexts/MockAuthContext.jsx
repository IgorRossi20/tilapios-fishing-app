import React, { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

// Sistema de autenticação mock para demonstração
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Iniciar como true para verificar localStorage

  // Função para fazer login
  const login = async (email, password) => {
    console.log('🔐 Tentativa de login:', { email, password })
    
    // Buscar usuários do localStorage sempre que fazer login
    let mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]')
    
    // Se não há usuários, criar usuários de teste
    if (mockUsers.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado. Criando usuários de teste...')
      const testUsers = [
        {
          uid: 'user_test_1',
          email: 'test@test.com',
          password: '123456',
          displayName: 'Usuário Teste',
          createdAt: new Date().toISOString(),
          totalFish: 0,
          totalWeight: 0,
          tournaments: [],
          achievements: []
        },
        {
          uid: 'user_test_2',
          email: 'test@teste.com',
          password: '123456',
          displayName: 'Usuário Teste 2',
          createdAt: new Date().toISOString(),
          totalFish: 0,
          totalWeight: 0,
          tournaments: [],
          achievements: []
        }
      ]
      
      localStorage.setItem('mockUsers', JSON.stringify(testUsers))
      mockUsers = testUsers
      console.log('✅ Usuários de teste criados:', testUsers)
    }
    
    console.log('👥 Usuários disponíveis:', mockUsers)
    setLoading(true)
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      const existingUser = mockUsers.find(u => u.email === email && u.password === password)
      console.log('🔍 Usuário encontrado:', existingUser)
      
      if (!existingUser) {
        console.log('❌ Usuário não encontrado')
        const error = new Error('Usuário não encontrado. Verifique email e senha.')
        error.code = 'auth/user-not-found'
        throw error
      }
      
      const userData = {
        uid: existingUser.uid,
        email: existingUser.email,
        displayName: existingUser.displayName,
        totalFish: existingUser.totalFish || 0,
        totalWeight: existingUser.totalWeight || 0,
        tournaments: existingUser.tournaments || [],
        achievements: existingUser.achievements || []
      }
      
      setUser(userData)
      localStorage.setItem('currentUser', JSON.stringify(userData))
      console.log('🎉 Login bem-sucedido:', userData)
      setLoading(false)
      
      return { user: userData }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Função para registrar usuário
  const register = async (email, password, displayName) => {
    console.log('📝 Tentativa de registro:', { email, password, displayName })
    
    // Buscar usuários do localStorage sempre que fazer registro
    const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]')
    console.log('👥 Usuários existentes:', mockUsers)
    setLoading(true)
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    try {
      // Verificar se usuário já existe
      const existingUser = mockUsers.find(u => u.email === email)
      console.log('🔍 Usuário já existe?', existingUser)
      
      if (existingUser) {
        console.log('❌ Email já está em uso')
        const error = new Error('Este email já está cadastrado. Tente fazer login.')
        error.code = 'auth/email-already-in-use'
        throw error
      }
      
      // Criar novo usuário
      const newUser = {
        uid: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        email,
        password, // Em produção, nunca armazenar senha em texto plano
        displayName,
        createdAt: new Date().toISOString(),
        totalFish: 0,
        totalWeight: 0,
        tournaments: [],
        achievements: []
      }
      
      // Salvar no localStorage (simulando banco de dados)
      const updatedUsers = [...mockUsers, newUser]
      localStorage.setItem('mockUsers', JSON.stringify(updatedUsers))
      console.log('✅ Novo usuário criado:', newUser)
      console.log('💾 Usuários salvos no localStorage:', updatedUsers)
      
      // Fazer login automático após registro
      const userData = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        totalFish: newUser.totalFish,
        totalWeight: newUser.totalWeight,
        tournaments: newUser.tournaments,
        achievements: newUser.achievements
      }
      
      setUser(userData)
      localStorage.setItem('currentUser', JSON.stringify(userData))
      console.log('🎉 Login automático após registro:', userData)
      setLoading(false)
      
      return { user: userData }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  // Função para logout
  const logout = async () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  // Verificar se há usuário logado ao carregar a página
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        console.log('✅ Usuário carregado do localStorage:', userData)
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setLoading(false)
  }, [])

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthProvider }