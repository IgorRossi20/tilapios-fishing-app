import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Tournaments from './pages/Tournaments'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Login from './pages/Login'
import CaptureForm from './pages/CaptureForm'
import CatchRegistration from './components/CatchRegistration'
import Ranking from './components/Ranking'
import LoadingSpinner from './components/LoadingSpinner'
import { AuthProvider } from './contexts/AuthContext'
import { FishingProvider } from './contexts/FishingContext'
import { useAuth } from './hooks/useAuth'
import { FirebaseProvider } from './contexts/FirebaseContext'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="app-container">
      {user && <Header />}
      <main className="main-content">
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
            path="/feed" 
            element={user ? <Feed /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/capture" 
            element={user ? <CaptureForm /> : <Navigate to="/login" />} 
          />
          <Route 
             path="/catch" 
             element={user ? <CatchRegistration /> : <Navigate to="/login" />} 
           />
           <Route 
             path="/ranking" 
             element={user ? <Ranking /> : <Navigate to="/login" />} 
           />

          </Routes>
      </main>
    </div>
  )
}

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    // Simula o carregamento inicial do site
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 2000) // 2 segundos de loading

    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoading) {
    return <LoadingSpinner />
  }

  return (
    <FirebaseProvider>
      <AuthProvider>
        <FishingProvider>
          <Router>
            <AppRoutes />
          </Router>
        </FishingProvider>
      </AuthProvider>
    </FirebaseProvider>
  )
}

export default App