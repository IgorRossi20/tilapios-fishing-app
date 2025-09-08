import React from 'react'
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
import { AuthProvider } from './contexts/AuthContext'
import { FishingProvider } from './contexts/FishingContext'
import { useAuth } from './hooks/useAuth'
import { FirebaseProvider } from './contexts/FirebaseContext'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Carregando...</p>
        </div>
      </div>
    )
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