import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Fish, Trophy, Users, MessageCircle, User, LogOut, Award, Menu, X, Home } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Header = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const isActive = (path) => {
    return location.pathname === path ? 'text-primary' : ''
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="logo" onClick={closeMenu}>
            <div className="logo-icon">
              <Fish size={28} />
            </div>
            <span className="logo-text hide-on-small">Tilapios</span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-btn touch-target"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            <span className="menu-icon">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </span>
          </button>
          
          {/* Navigation links */}
          <ul className={`nav-links ${isMenuOpen ? 'nav-links-open' : ''}`}>
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/')}`} 
                onClick={closeMenu}
                aria-current={location.pathname === '/' ? 'page' : undefined}
              >
                <Home size={16} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/ranking" 
                className={`nav-link ${isActive('/ranking')}`} 
                onClick={closeMenu}
                aria-current={location.pathname === '/ranking' ? 'page' : undefined}
              >
                <Trophy size={16} />
                <span>Ranking</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/tournaments" 
                className={`nav-link ${isActive('/tournaments')}`} 
                onClick={closeMenu}
                aria-current={location.pathname === '/tournaments' ? 'page' : undefined}
              >
                <Users size={16} />
                <span>Campeonatos</span>
              </Link>
            </li>

            <li>
              <Link 
                to="/profile" 
                className={`nav-link ${isActive('/profile')}`} 
                onClick={closeMenu}
                aria-current={location.pathname === '/profile' ? 'page' : undefined}
              >
                <User size={16} />
                <span>Perfil</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={() => { handleLogout(); closeMenu(); }}
                className="btn btn-outline-danger logout-btn touch-target"
                aria-label="Fazer logout"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </li>
          </ul>
          
          {/* User info - hidden on mobile */}
          <div className="user-info">
            <span className="user-greeting" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              Olá, {user?.displayName || user?.email?.split('@')[0]}!
            </span>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header