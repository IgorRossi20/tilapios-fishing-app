import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Fish, Trophy, Users, MessageCircle, User, LogOut, Award, Menu, X, Home, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../contexts/NotificationContext'
import { formatTimeAgo } from '../utils/postFormat'

const Header = () => {
  const { user, logout } = useAuth()
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotification()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [hoverNotifId, setHoverNotifId] = useState(null)

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

          {/* User info and notifications - Now visible on all devices */}
          <div className="user-info-section" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  style={{
                    position: 'absolute',
                    top: 52,
                    right: 0,
                    width: 'min(400px, calc(100vw - 32px))',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    animation: 'slideDown 0.2s ease-out'
                  }}
                >
                  {/* Header do dropdown */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={18} style={{ color: '#3b82f6' }} />
                      <strong style={{ fontSize: 16, color: '#1e293b', fontWeight: 600 }}>Notificações</strong>
                      {unread > 0 && (
                        <span style={{
                          background: '#ef4444',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 10,
                          minWidth: 18,
                          textAlign: 'center'
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>
                    {notifications && notifications.length > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAllAsRead();
                        }}
                        className="touch-target"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#3b82f6',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 6,
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(59,130,246,0.1)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        Marcar todas
                      </button>
                    )}
                  </div>

                  {/* Lista de notificações */}
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {notifications && notifications.length > 0 ? (
                      notifications.slice(0, 12).map(n => {
                        const isLike = n.message?.toLowerCase().includes('curtiu')
                        const isComment = n.message?.toLowerCase().includes('comentou')

                        return (
                          <div
                            key={n.id}
                            onClick={async () => {
                              await markAsRead(n.id)
                              setIsNotifOpen(false)
                              if (n.postId) {
                                navigate(`/?postId=${encodeURIComponent(n.postId)}`)
                              }
                            }}
                            onMouseEnter={() => setHoverNotifId(n.id)}
                            onMouseLeave={() => setHoverNotifId(null)}
                            style={{
                              padding: '14px 18px',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              cursor: 'pointer',
                              background: hoverNotifId === n.id
                                ? 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(99,102,241,0.08) 100%)'
                                : (n.read ? 'white' : 'rgba(219,234,254,0.4)'),
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'all 0.2s ease',
                              transform: hoverNotifId === n.id ? 'translateX(2px)' : 'translateX(0)'
                            }}
                          >
                            {/* Ícone da notificação */}
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: isLike
                                ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                                : isComment
                                  ? 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'
                                  : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}>
                              {isLike ? (
                                <Heart size={16} fill="#ef4444" color="#ef4444" />
                              ) : isComment ? (
                                <MessageCircle size={16} color="#3b82f6" />
                              ) : (
                                <Bell size={16} color="#6366f1" />
                              )}
                            </div>

                            {/* Conteúdo da notificação */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                color: '#1e293b',
                                fontSize: 14,
                                lineHeight: 1.4,
                                fontWeight: n.read ? 400 : 600,
                                marginBottom: 4
                              }}>
                                {n.message}
                              </div>
                              <div style={{
                                color: '#64748b',
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                <span>{formatTimeAgo(n.timestamp)}</span>
                              </div>
                            </div>

                            {/* Indicador não lido */}
                            {!n.read && (
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#3b82f6',
                                flexShrink: 0,
                                marginTop: 6,
                                boxShadow: '0 0 0 3px rgba(59,130,246,0.2)'
                              }} />
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div style={{
                        padding: 48,
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <Bell size={28} color="#94a3b8" />
                        </div>
                        <div style={{
                          color: '#64748b',
                          fontSize: 14,
                          fontWeight: 500,
                          marginBottom: 4
                        }}>
                          Nenhuma notificação
                        </div>
                        <div style={{
                          color: '#94a3b8',
                          fontSize: 13
                        }}>
                          Você está em dia por aqui!
                        </div>
                      </div>
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