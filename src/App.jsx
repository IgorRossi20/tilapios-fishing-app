import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import LoadingSpinner from './components/LoadingSpinner'
import AuthError from './components/AuthError'
import { ToastContainer } from './components/Toast'
import { AuthProvider } from './contexts/AuthContext'
import { FishingProvider } from './contexts/FishingContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { useAuth } from './hooks/useAuth'
import { FirebaseProvider } from './contexts/FirebaseContext'
import useToast from './hooks/useToast'


// Lazy loading para componentes pesados
const Tournaments = lazy(() => import('./pages/Tournaments'))
const TournamentDetails = lazy(() => import('./pages/TournamentDetails'))
const Profile = lazy(() => import('./pages/Profile'))
const CatchRegistration = lazy(() => import('./components/CatchRegistration'))
const Ranking = lazy(() => import('./components/Ranking'))

function AppRoutes() {
  const { user, loading, authError } = useAuth()
  const { toasts, removeToast } = useToast()

  if (loading) {
    return <LoadingSpinner message="Inicializando aplicação..." />
  }

  // Mostrar tela de erro se houver problema de autenticação
  if (authError && authError.type === 'domain-not-authorized') {
    return <AuthError error={authError} />
  }

  return (
    <div className="app-container">
      {user && <Header />}
      <main className="main-content">
        <Suspense fallback={<LoadingSpinner message="Carregando página..." />}>
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <Login />} 
            />
            <Route 
              path="/" 
              element={user ? <Home /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/ranking" 
              element={user ? <Ranking /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/tournaments" 
              element={user ? <Tournaments /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/tournaments/:id" 
              element={user ? <TournamentDetails /> : <Navigate to="/login" />} 
            />
            {/* Feed removido como página separada - agora está apenas na Home */}
            <Route 
              path="/profile" 
              element={user ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/capture" 
              element={user ? <CatchRegistration /> : <Navigate to="/login" />} 
            />
            <Route 
               path="/catch" 
               element={user ? <CatchRegistration /> : <Navigate to="/login" />} 
             />

            </Routes>
        </Suspense>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

function App() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <NotificationProvider>
          <FishingProvider>
            <Router>
              <AppRoutes />
            </Router>
          </FishingProvider>
        </NotificationProvider>
      </AuthProvider>
    </FirebaseProvider>
  )
}

export default App