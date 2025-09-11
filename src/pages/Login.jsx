import React, { useState } from 'react'
import { Fish, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './Login.css'

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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Fish size={48} className="login-logo" />
          <h1 className="login-title">Tilapios</h1>
          <p className="login-subtitle">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
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
              <Mail size={16} />
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
              <Lock size={16} />
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
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              isLogin ? 'Entrar' : 'Criar Conta'
            )}
          </button>

          {isLogin && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="forgot-password-btn"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
        </form>

        {showForgotPassword && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Recuperar Senha</h3>
              <form onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label className="form-label">
                      <Mail size={16} />
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
                <div className="modal-actions">
                  <button 
                    type="submit" 
                    className="modal-btn modal-btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="login-spinner"></div>
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
                    className="modal-btn modal-btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="switch-section">
          <p className="switch-text">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <button 
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
              setFormData({ email: '', password: '', displayName: '' })
            }}
            className="switch-mode-btn"
          >
            {isLogin ? 'Criar Conta' : 'Fazer Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login