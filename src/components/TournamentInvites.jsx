import React, { useState, useEffect } from 'react'
import { useFishing } from '../contexts/FishingContext'
import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'

const TournamentInvites = ({ tournamentId, tournamentName, isCreator }) => {
  const { sendTournamentInvite, generateTournamentInviteLink, joinTournamentByInvite, userInvites, declineTournamentInvite, loadUserInvites, isInvitesPollingFallbackActive } = useFishing()
  const { notifyInviteSent, notifyInviteAccepted, notifyInviteDeclined } = useNotification()
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [showInviteLink, setShowInviteLink] = useState(false)



  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      await sendTournamentInvite(tournamentId, inviteEmail.trim())
      setInviteEmail('')
      setShowInviteForm(false)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLink = () => {
    const link = generateTournamentInviteLink(tournamentId)
    setInviteLink(link)
    setShowInviteLink(true)
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      notifyInviteSent('Link copiado!', tournamentName)
    } catch (error) {
    }
  }

  const handleAcceptInvite = async (invite) => {
    try {
      await joinTournamentByInvite(invite.tournamentId, invite.id)
      notifyInviteAccepted()
    } catch (error) {
    }
  }

  const handleDeclineInvite = async (invite) => {
    try {
      await declineTournamentInvite(invite)
    } catch (error) {
    }
  }

  if (!isCreator && userInvites.length === 0) {
    return null
  }

  return (
    <div className="tournament-invites">
      {/* Seção para criadores enviarem convites */}
      {isCreator && (
        <div className="invite-section">
          <h4>🎯 Convidar Participantes</h4>
          
          <div className="invite-actions">
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="btn btn-outline"
            >
              📧 Enviar Convite por Email
            </button>
            
            <button
              onClick={handleGenerateLink}
              className="btn btn-outline"
            >
              🔗 Gerar Link de Convite
            </button>
          </div>

          {/* Formulário de convite por email */}
          {showInviteForm && (
            <form onSubmit={handleSendInvite} className="invite-form">
              <div className="form-group">
                <label htmlFor="inviteEmail">Email do participante:</label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !inviteEmail.trim()}
                >
                  {loading ? '📤 Enviando...' : '📤 Enviar Convite'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Link de convite */}
          {showInviteLink && (
            <div className="invite-link-section">
              <h5>🔗 Link de Convite</h5>
              <div className="invite-link-container">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly={true}
                  className="invite-link-input"
                />
                <button
                  onClick={copyInviteLink}
                  className="btn btn-primary btn-sm"
                >
                  📋 Copiar
                </button>
              </div>
              <p className="invite-link-help">
                Compartilhe este link para que outros possam participar do campeonato!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seção de convites recebidos */}
      <div className="received-invites">
        <h4>
          📬 Convites Recebidos
          {isInvitesPollingFallbackActive && (
            <span className="fallback-badge" aria-label="Fallback ativo">
              🔄 Fallback ativo
              <span className="tooltip">
                Realtime indisponível; usando polling a cada {Math.round(Number(import.meta.env.VITE_INVITES_POLL_INTERVAL_MS || 30000) / 1000)}s
              </span>
            </span>
          )}
        </h4>
        <div className="invites-list">
          {userInvites.length > 0 ? (
            userInvites.map(invite => (
              <div key={invite.id} className="invite-card">
                <div className="invite-info">
                  <h5>{invite.tournamentName}</h5>
                  <p>Convidado por: {invite.inviterName}</p>
                  <p className="invite-date">
                    Recebido em: {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="invite-expires">
                    Expira em: {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="invite-actions">
                  <button
                    onClick={() => handleAcceptInvite(invite)}
                    className="btn btn-success btn-sm"
                  >
                    ✅ Aceitar
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(invite)}
                    className="btn btn-danger btn-sm"
                  >
                    ❌ Recusar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '10px 12px',
              color: '#6c757d',
              fontSize: '0.95em',
              border: '1px dashed #dee2e6',
              borderRadius: 8
            }}>
              Nenhum convite por enquanto.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tournament-invites {
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .invite-section h4,
        .received-invites h4 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 1.1rem;
        }

        .invite-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .invite-form {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          margin-top: 10px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #495057;
        }

        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .invite-link-section {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          margin-top: 10px;
        }

        .invite-link-section h5 {
          margin: 0 0 10px 0;
          color: #495057;
        }

        .invite-link-container {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .invite-link-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          background: #f8f9fa;
          font-size: 14px;
        }

        .invite-link-help {
          margin: 0;
          font-size: 12px;
          color: #6c757d;
        }

        .invites-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .invite-card {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .invite-info h5 {
          margin: 0 0 5px 0;
          color: #495057;
        }

        .invite-info p {
          margin: 2px 0;
          font-size: 14px;
          color: #6c757d;
        }

        .invite-date,
        .invite-expires {
          font-size: 12px !important;
        }

        .invite-card .invite-actions {
          margin: 0;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .invite-card {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .invite-actions {
            justify-content: center;
          }

          .invite-link-container {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default TournamentInvites


<style jsx>{`
        .fallback-badge {
          margin-left: var(--spacing-2);
          font-size: 0.78em;
          color: var(--gray-100);
          background: var(--gray-800);
          border: 1px solid var(--gray-700);
          padding: var(--spacing-1) var(--spacing-2);
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          position: relative;
          cursor: help;
          box-shadow: var(--shadow-sm);
          transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease-out;
        }

        .fallback-badge:hover,
        .fallback-badge:focus {
          background: var(--gray-700);
          border-color: var(--gray-600);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .fallback-badge .tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: var(--gray-900);
          color: var(--gray-100);
          border: 1px solid var(--gray-800);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-2) var(--spacing-3);
          border-radius: var(--radius-lg);
          font-size: 0.78em;
          line-height: 1.4;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 5;
        }

        .fallback-badge:hover .tooltip,
        .fallback-badge:focus .tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0px);
        }
      `}</style>