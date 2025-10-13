import React, { useState, useEffect } from 'react'
import { Fish, Mail, Lock, User, Check, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)

  const { login, register, resetPassword } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Validação em tempo real para feedback visual
    const input = e.target;
    
    // Remover classes anteriores
    input.classList.remove('valid', 'invalid');
    
    if (value.trim() === '') return;
    
    // Validar email
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value)) {
        input.classList.add('valid');
      } else {
        input.classList.add('invalid');
      }
    }
    
    // Validar senha
    if (name === 'password') {
      if (value.length >= 6) {
        input.classList.add('valid');
      } else {
        input.classList.add('invalid');
      }
    }
    
    // Validar nome completo
    if (name === 'displayName' && !isLogin) {
      if (value.trim().length >= 3) {
        input.classList.add('valid');
      } else {
        input.classList.add('invalid');
      }
    }
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
      // Feedback visual para erro
      document.querySelector('.login-card').classList.add('error-animation')
      setTimeout(() => {
        document.querySelector('.login-card').classList.remove('error-animation')
      }, 1000)
      return
    }

    if (!isLogin && !formData.displayName) {
      setError('Por favor, informe seu nome para criar a conta.')
      setLoading(false)
      // Feedback visual para erro
      document.querySelector('.login-card').classList.add('error-animation')
      setTimeout(() => {
        document.querySelector('.login-card').classList.remove('error-animation')
      }, 1000)
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      // Feedback visual para erro
      document.querySelector('.login-card').classList.add('error-animation')
      setTimeout(() => {
        document.querySelector('.login-card').classList.remove('error-animation')
      }, 1000)
      return
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        setSuccess('Login realizado com sucesso!')
        // Feedback visual para login bem-sucedido
        document.querySelector('.login-card').classList.add('success-animation')
        setTimeout(() => {
          document.querySelector('.login-card').classList.remove('success-animation')
        }, 1000)
      } else {
        await register(formData.email, formData.password, formData.displayName)
        setSuccess('Conta criada com sucesso! Redirecionando...')
        // Feedback visual para registro bem-sucedido
        document.querySelector('.login-card').classList.add('success-animation')
        setTimeout(() => {
          document.querySelector('.login-card').classList.remove('success-animation')
        }, 1000)
      }
    } catch (error) {
      setError(error.message || getErrorMessage(error.code) || 'Erro inesperado. Tente novamente.')
      // Feedback visual para erro
      document.querySelector('.login-card').classList.add('error-animation')
      setTimeout(() => {
        document.querySelector('.login-card').classList.remove('error-animation')
      }, 1000)
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
          <div className="login-logo">
            <Fish size={40} />
          </div>
          <h1 className="login-title">Tilapios</h1>
          <p className="login-subtitle">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
          <div className="login-divider"></div>
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
              <label className="form-label" htmlFor="displayName">
                <User size={16} aria-hidden="true" />
                <span>Nome Completo</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className={`form-input ${formData.displayName.length >= 2 ? 'valid' : formData.displayName.length > 0 ? 'invalid' : ''}`}
                  placeholder="Digite seu nome completo"
                  required={!isLogin}
                  autoComplete="name"
                  minLength="2"
                />
                {formData.displayName.length >= 2 && (
                  <div className="input-success-icon">
                    <Check size={16} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              <Mail size={16} aria-hidden="true" />
              <span>Endereço de Email</span>
            </label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${formData.email.includes('@') && formData.email.includes('.') ? 'valid' : formData.email.length > 0 ? 'invalid' : ''}`}
                placeholder="exemplo@email.com"
                required
                autoComplete="email"
              />
              {formData.email.includes('@') && formData.email.includes('.') && (
                <div className="input-success-icon">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              <Lock size={16} aria-hidden="true" />
              <span>{isLogin ? 'Senha' : 'Senha (mín. 6 caracteres)'}</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${formData.password.length >= 6 ? 'valid' : formData.password.length > 0 ? 'invalid' : ''}`}
                placeholder={isLogin ? "Digite sua senha" : "Crie uma senha segura"}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength="6"
              />
              <button 
                type="button" 
                className="password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {formData.password.length >= 6 && (
                <div className="input-success-icon">
                  <Check size={16} />
                </div>
              )}
            </div>
            {!isLogin && formData.password.length > 0 && formData.password.length < 6 && (
              <div className="input-hint">
                A senha deve ter pelo menos 6 caracteres
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight size={20} className="btn-icon" />
              </>
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
              // Adicionar classe para animação de saída
              const formElement = document.querySelector('.login-form');
              formElement.classList.add('form-exit');
              
              // Aguardar a animação terminar antes de mudar o estado
              setTimeout(() => {
                setIsLogin(!isLogin)
                setError('')
                setSuccess('')
                setFormData({ email: '', password: '', displayName: '' })
                
                // Remover classe de saída e adicionar classe de entrada
                formElement.classList.remove('form-exit');
                formElement.classList.add('form-enter');
                
                // Remover classe de entrada após a animação
                setTimeout(() => {
                  formElement.classList.remove('form-enter');
                }, 500);
              }, 300);
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