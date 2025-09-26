import React from 'react'
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import './AuthError.css'

const AuthError = ({ error, onRetry }) => {
  const isDomainError = error?.code === 'auth/domain-not-authorized' || 
                       error?.message?.includes('domain') ||
                       error?.message?.includes('unauthorized')

  const currentDomain = window.location.hostname
  const isVercelDomain = currentDomain.includes('vercel.app')

  if (isDomainError && isVercelDomain) {
    return (
      <div className="auth-error-container">
        <div className="auth-error-card">
          <div className="auth-error-icon">
            <AlertCircle size={48} color="#ff4444" />
          </div>
          
          <h2 className="auth-error-title">Domínio Não Autorizado</h2>
          
          <p className="auth-error-description">
            O domínio <strong>{currentDomain}</strong> não está autorizado no Firebase Authentication.
          </p>

          <div className="auth-error-steps">
            <h3>Como resolver:</h3>
            <ol>
              <li>
                <a 
                  href="https://console.firebase.google.com/project/tilapios-app-293fd/authentication/settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="firebase-link"
                >
                  Acesse o Firebase Console <ExternalLink size={16} />
                </a>
              </li>
              <li>Vá para <strong>Authentication → Settings → Authorized domains</strong></li>
              <li>Clique em <strong>"Add domain"</strong></li>
              <li>Adicione: <code>{currentDomain}</code></li>
              <li>Aguarde alguns minutos para a propagação</li>
            </ol>
          </div>

          <div className="auth-error-actions">
            <button 
              onClick={onRetry} 
              className="retry-button"
            >
              <RefreshCw size={16} />
              Tentar Novamente
            </button>
          </div>

          <div className="auth-error-note">
            <p>
              <strong>Nota:</strong> Esta configuração precisa ser feita apenas uma vez pelo administrador do projeto.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Erro genérico de autenticação
  return (
    <div className="auth-error-container">
      <div className="auth-error-card">
        <div className="auth-error-icon">
          <AlertCircle size={48} color="#ff4444" />
        </div>
        
        <h2 className="auth-error-title">Erro de Autenticação</h2>
        
        <p className="auth-error-description">
          Ocorreu um erro ao inicializar a autenticação.
        </p>

        <div className="auth-error-details">
          <code>{error?.message || 'Erro desconhecido'}</code>
        </div>

        <div className="auth-error-actions">
          <button 
            onClick={onRetry} 
            className="retry-button"
          >
            <RefreshCw size={16} />
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthError