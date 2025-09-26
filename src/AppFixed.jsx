import React, { Suspense, lazy, useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy loading dos componentes
const Header = lazy(() => import('./components/Header'))
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const ToastContainer = lazy(() => import('./components/ToastContainer'))
const CatchRegistration = lazy(() => import('./pages/CatchRegistration'))
const Ranking = lazy(() => import('./pages/Ranking'))

// Lazy loading dos contextos
const FirebaseProvider = lazy(() => import('./contexts/FirebaseContext').then(module => ({ default: module.FirebaseProvider })))
const AuthProvider = lazy(() => import('./contexts/AuthContext').then(module => ({ default: module.AuthProvider })))
const NotificationProvider = lazy(() => import('./contexts/NotificationContext').then(module => ({ default: module.NotificationProvider })))
const FishingProvider = lazy(() => import('./contexts/FishingContext').then(module => ({ default: module.FishingProvider })))

// Lazy loading das páginas
const Tournaments = lazy(() => import('./pages/Tournaments'))
const TournamentDetails = lazy(() => import('./pages/TournamentDetails'))
const Profile = lazy(() => import('./pages/Profile'))

function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (error) => {
      console.error('Erro capturado:', error)
      setError(error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', (event) => {
      handleError(event.reason)
    })

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#ffebee',
        color: '#c62828',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1>🚨 Erro na Aplicação</h1>
        <p>Algo deu errado. Detalhes do erro:</p>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          maxWidth: '80%',
          overflow: 'auto'
        }}>
          {error?.message || error?.toString() || 'Erro desconhecido'}
        </pre>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Recarregar Página
        </button>
      </div>
    )
  }

  return children
}

function AppFixed() {
  const [initStep, setInitStep] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 Iniciando aplicação...')
        setInitStep(1)
        
        // Aguardar um pouco para garantir que tudo carregou
        await new Promise(resolve => setTimeout(resolve, 100))
        setInitStep(2)
        
        console.log('✅ Aplicação inicializada com sucesso')
      } catch (err) {
        console.error('❌ Erro na inicialização:', err)
        setError(err)
      }
    }

    initApp()
  }, [])

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#ffebee',
        color: '#c62828',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1>🚨 Erro de Inicialização</h1>
        <p>Falha ao inicializar a aplicação:</p>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          maxWidth: '80%',
          overflow: 'auto'
        }}>
          {error.message || error.toString()}
        </pre>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (initStep < 2) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ marginTop: '20px', color: '#666' }}>
            Carregando Tilapios... ({initStep}/2)
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh'
          }}>
            <LoadingSpinner />
          </div>
        }>
          <Suspense fallback={<LoadingSpinner />}>
            <FirebaseProvider>
              <Suspense fallback={<LoadingSpinner />}>
                <AuthProvider>
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotificationProvider>
                      <Suspense fallback={<LoadingSpinner />}>
                        <FishingProvider>
                          <div className="App">
                            <Header />
                            <main>
                              <Suspense fallback={<LoadingSpinner />}>
                                <Home />
                              </Suspense>
                            </main>
                            <ToastContainer />
                          </div>
                        </FishingProvider>
                      </Suspense>
                    </NotificationProvider>
                  </Suspense>
                </AuthProvider>
              </Suspense>
            </FirebaseProvider>
          </Suspense>
        </Suspense>
      </Router>
    </ErrorBoundary>
  )
}

export default AppFixed