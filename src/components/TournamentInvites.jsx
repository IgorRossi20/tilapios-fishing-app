import React, { useState, useEffect } from 'react'
import { useFishing } from '../contexts/FishingContext'
import { useNotification } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'

const TournamentInvites = ({ tournamentId, tournamentName, isCreator }) => {
  const { sendTournamentInvite, generateTournamentInviteLink, loadUserInvites, joinTournamentByInvite } = useFishing()
  const { notifyInviteSent, notifyInviteAccepted, notifyInviteDeclined } = useNotification()
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [userInvites, setUserInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [showInviteLink, setShowInviteLink] = useState(false)

  useEffect(() => {
    if (user) {
      loadInvites()
    }
  }, [user])

  const loadInvites = async () => {
    try {
      const invites = await loadUserInvites()
      setUserInvites(invites)
    } catch (error) {
    }
  }

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
      // Recarregar convites para atualizar a lista
      await loadInvites()
    } catch (error) {
    }
  }

  const handleDeclineInvite = async (invite) => {
    try {
      // Aqui você pode implementar a lógica para recusar o convite
      // Por enquanto, apenas notificamos
      notifyInviteDeclined(invite.tournamentName)
      // Recarregar convites para atualizar a lista
      await loadInvites()
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
      {userInvites.length > 0 && (
        <div className="received-invites">
          <h4>📬 Convites Recebidos</h4>
          <div className="invites-list">
            {userInvites.map(invite => (
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
            ))}
          </div>
        </div>
      )}

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