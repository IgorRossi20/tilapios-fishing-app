import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Fish, Trophy, Users, MessageCircle, User, LogOut, Award, Menu, X, Home, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../contexts/NotificationContext'
import { formatTimeAgo } from '../utils/postFormat'

const Header = () => {
  const { user, logout } = useAuth()
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotification()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
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

  const unread = getUnreadCount()

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
          
          {/* User info and notifications - hidden on mobile */}
          <div className="user-info" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notifications bell */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Notificações"
                onClick={() => setIsNotifOpen(v => !v)}
                className="touch-target"
                style={{
                  width: 44,
                  height: 44,
                  border: 'none',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--gray-700)',
                  cursor: 'pointer'
                }}
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span
                    aria-label={`${unread} notificações não lidas`}
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      minWidth: 18,
                      height: 18,
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      padding: '0 5px',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(239,68,68,0.5)'
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isNotifOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 340,
                    maxHeight: 420,
                    background: 'white',
                    borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '1px solid var(--gray-100)',
                    overflow: 'hidden',
                    zIndex: 1000
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
                    <strong style={{ fontSize: 14, color: 'var(--gray-800)' }}>Notificações</strong>
                    <button
                      onClick={async () => { await markAllAsRead(); }}
                      className="touch-target"
                      style={{ border: 'none', background: 'transparent', color: 'var(--primary-600)', fontSize: 12, cursor: 'pointer' }}
                    >
                      Marcar todas como lidas
                    </button>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 12).map(n => (
                        <div
                          key={n.id}
                          onClick={async () => { await markAsRead(n.id); setIsNotifOpen(false) }}
                          style={{
                            padding: '12px 14px',
                            display: 'flex',
                            gap: 12,
                            cursor: 'pointer',
                            background: n.read ? 'white' : 'var(--primary-50)'
                          }}
                        >
                          <div style={{ width: 8, marginTop: 6 }}>
                            {!n.read && (
                              <span style={{ display: 'block', width: 8, height: 8, background: 'var(--primary-500)', borderRadius: 999 }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--gray-800)', fontSize: 14, lineHeight: 1.3 }}>{n.message}</div>
                            <div style={{ color: 'var(--gray-500)', fontSize: 12, marginTop: 4 }}>{formatTimeAgo(n.timestamp)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 16, color: 'var(--gray-600)', fontSize: 14 }}>Sem notificações por enquanto.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

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