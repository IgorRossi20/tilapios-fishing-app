import React, { useState } from 'react'
import { Fish, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const { login, register, resetPassword } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validações básicas
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      setLoading(false)
      return
    }

    if (!isLogin && !formData.displayName) {
      setError('Por favor, informe seu nome para criar a conta.')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        setSuccess('Login realizado com sucesso!')
      } else {
        await register(formData.email, formData.password, formData.displayName)
        setSuccess('Conta criada com sucesso! Redirecionando...')
      }
    } catch (error) {
      console.error('Erro no formulário:', error)
      setError(error.message || getErrorMessage(error.code) || 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!resetEmail) {
      setError('Por favor, informe seu email.')
      setLoading(false)
      return
    }

    try {
      await resetPassword(resetEmail)
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.')
      setShowForgotPassword(false)
      setResetEmail('')
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error)
      setError(getErrorMessage(error.code) || 'Erro ao enviar email de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado. Verifique email e senha.'
      case 'auth/wrong-password':
        return 'Senha incorreta. Tente novamente.'
      case 'auth/email-already-in-use':
        return 'Este email já está cadastrado. Tente fazer login.'
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.'
      case 'auth/invalid-email':
        return 'Email inválido. Verifique o formato.'
      default:
        return 'Erro inesperado. Tente novamente.'
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-3">
          <Fish size={48} className="text-primary" style={{ marginBottom: '10px' }} />
          <h1 style={{ color: '#2196F3', marginBottom: '10px' }}>Tilapios</h1>
          <p style={{ color: '#666' }}>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#c62828', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: '#e8f5e8', 
            color: '#2e7d32', 
            padding: '10px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            textAlign: 'center',
            border: '1px solid #c8e6c9'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">
                <User size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Nome
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="form-input"
                placeholder="Seu nome"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Sua senha"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', marginBottom: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
            ) : (
              isLogin ? 'Entrar' : 'Criar Conta'
            )}
          </button>

          {isLogin && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#2196F3', 
                  fontSize: '14px',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </form>

        {showForgotPassword && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ maxWidth: '400px', width: '90%', margin: '20px' }}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Recuperar Senha</h3>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="form-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="submit" 
                    className="btn" 
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div>
                    ) : (
                      'Enviar Email'
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForgotPassword(false)
                      setResetEmail('')
                      setError('')
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, background: '#f5f5f5', color: '#666' }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="text-center">
          <p style={{ color: '#666', marginBottom: '10px' }}>
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <button 
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
              setFormData({ email: '', password: '', displayName: '' })
            }}
            className="btn btn-secondary"
            style={{ background: 'transparent', color: '#2196F3', border: '2px solid #2196F3' }}
          >
            {isLogin ? 'Criar Conta' : 'Fazer Login'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default Login