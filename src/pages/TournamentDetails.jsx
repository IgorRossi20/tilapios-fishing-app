import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Users, 
  Calendar, 
  Clock, 
  Trophy, 
  Target, 
  Award, 
  ArrowLeft,
  User,
  Crown,
  Fish,
  MapPin,
  Settings,
  UserMinus,
  Play,
  Square
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFishing } from '../contexts/FishingContext'
import './TournamentDetails.css'

const TournamentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { 
    userTournaments, 
    allTournaments,
    leaveTournament,
    deleteTournament,
    finishTournament,
    getTournamentRanking,
    joinTournament
  } = useFishing()
  
  const [tournament, setTournament] = useState(null)
  const [participants, setParticipants] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('participants')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadTournamentDetails()
  }, [id, userTournaments, allTournaments])

  const loadTournamentDetails = async () => {
    try {
      setLoading(true)
      
      // Buscar campeonato nos arrays disponíveis
      const foundTournament = userTournaments.find(t => t.id === id) || 
                             allTournaments.find(t => t.id === id)
      
      if (!foundTournament) {
        setMessage('Campeonato não encontrado')
        return
      }
      
      setTournament(foundTournament)
      
      // Carregar participantes (simulado - em produção viria do Firestore)
      const participantsList = foundTournament.participantNames?.map((name, index) => ({
        id: foundTournament.participants?.[index] || `participant_${index}`,
        name: name,
        isCreator: foundTournament.participants?.[index] === foundTournament.createdBy,
        joinedAt: foundTournament.createdAt // Simplificado
      })) || []
      
      setParticipants(participantsList)
      
      // Carregar ranking se o campeonato estiver ativo ou finalizado
      if (foundTournament.status === 'active' || foundTournament.status === 'finished') {
        const tournamentRanking = await getTournamentRanking(id)
        setRanking(tournamentRanking)
      }
      
    } catch (error) {
      setMessage('Erro ao carregar detalhes do campeonato')
    } finally {
      setLoading(false)
    }
  }

  const getTournamentStatus = (tournament) => {
    if (!tournament) return 'unknown'
    
    const now = new Date()
    const startDate = new Date(tournament.startDate)
    const endDate = new Date(tournament.endDate)
    
    if (tournament.status === 'finished') return 'finished'
    if (tournament.status === 'cancelled') return 'cancelled'
    if (now < startDate) return 'upcoming'
    if (now >= startDate && now <= endDate) return 'active'
    return 'finished'
  }

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Em Breve', class: 'status-upcoming' },
      active: { text: 'Ativo', class: 'status-active' },
      finished: { text: 'Finalizado', class: 'status-finished' },
      cancelled: { text: 'Cancelado', class: 'status-cancelled' }
    }
    
    const badge = badges[status] || { text: 'Desconhecido', class: 'status-unknown' }
    
    return (
      <span className={`status-badge ${badge.class}`}>
        {badge.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOwner = () => {
    return tournament?.createdBy === user?.uid
  }

  const isParticipant = () => {
    return tournament?.participants?.includes(user?.uid)
  }

  const handleLeaveTournament = async () => {
    if (!window.confirm('Tem certeza que deseja sair deste campeonato?')) {
      return
    }
    
    try {
      await leaveTournament(id)
      setMessage('Você saiu do campeonato com sucesso')
      setTimeout(() => {
        navigate('/tournaments')
      }, 2000)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleDeleteTournament = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este campeonato? Esta ação não pode ser desfeita.')) {
      return
    }
    
    try {
      await deleteTournament(id)
      setMessage('Campeonato excluído com sucesso')
      setTimeout(() => {
        navigate('/tournaments')
      }, 2000)
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleFinishTournament = async () => {
    if (!window.confirm('Tem certeza que deseja finalizar este campeonato?')) {
      return
    }
    
    try {
      await finishTournament(id)
      setMessage('Campeonato finalizado com sucesso')
      loadTournamentDetails() // Recarregar dados
    } catch (error) {
      setMessage(error.message)
    }
  }

  const handleJoinTournament = async () => {
    try {
      await joinTournament(id)
      setMessage('Você entrou no campeonato com sucesso')
      // Recarregar detalhes para refletir participação
      await loadTournamentDetails()
    } catch (error) {
      setMessage(error.message || 'Erro ao participar do campeonato')
    }
  }

  if (loading) {
    return (
      <div className="tournament-details">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando detalhes do campeonato...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="tournament-details">
        <div className="error-state">
          <Trophy size={48} />
          <h2>Campeonato não encontrado</h2>
          <p>{message || 'O campeonato que você está procurando não existe ou foi removido.'}</p>
          <button onClick={() => navigate('/tournaments')} className="btn">
            <ArrowLeft size={16} />
            Voltar aos Campeonatos
          </button>
        </div>
      </div>
    )
  }

  const currentStatus = getTournamentStatus(tournament)
  const isFull = (tournament?.participants?.length || 0) >= (tournament?.maxParticipants || 0)

  return (
    <div className="tournament-details">
      {/* Header */}
      <div className="header">
        <button 
          onClick={() => navigate('/tournaments')} 
          className="back-btn"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        
        <div className="tournament-header">
          <div className="title-section">
            <h1>{tournament.name}</h1>
            {getStatusBadge(currentStatus)}
          </div>
          
          {isOwner() && (
            <div className="owner-badge">
              <Crown size={16} />
              <span>Criador</span>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tournament Info */}
      <div className="tournament-info-card">
        <div className="info-grid">
          <div className="info-item">
            <Calendar size={20} />
            <div>
              <span className="label">Período</span>
              <span className="value">
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </span>
            </div>
          </div>
          
          <div className="info-item">
            <Users size={20} />
            <div>
              <span className="label">Participantes</span>
              <span className="value">
                {tournament.participants?.length || 0}/{tournament.maxParticipants}
              </span>
            </div>
          </div>
          
          {tournament.entryFee > 0 && (
            <div className="info-item">
              <Target size={20} />
              <div>
                <span className="label">Taxa de Inscrição</span>
                <span className="value">R$ {tournament.entryFee.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {tournament.prizePool > 0 && (
            <div className="info-item prize">
              <Award size={20} />
              <div>
                <span className="label">Prêmio Total</span>
                <span className="value">R$ {tournament.prizePool.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
        {tournament.description && (
          <div className="description">
            <h3>Descrição</h3>
            <p>{tournament.description}</p>
          </div>
        )}
        
        {tournament.rules && (
          <div className="rules">
            <h3>Regras</h3>
            <p>{tournament.rules}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          onClick={() => setActiveTab('participants')}
          className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
        >
          <Users size={18} />
          Participantes ({participants.length})
        </button>
        
        {(currentStatus === 'active' || currentStatus === 'finished') && (
          <button 
            onClick={() => setActiveTab('ranking')}
            className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
          >
            <Trophy size={18} />
            Ranking
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'participants' && (
        <div className="participants-section">
          <div className="participants-grid">
            {participants.map((participant, index) => (
              <div key={participant.id} className="participant-card">
                <div className="participant-info">
                  <div className="avatar">
                    {participant.isCreator ? (
                      <Crown size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="details">
                    <span className="name">{participant.name}</span>
                    <span className="role">
                      {participant.isCreator ? 'Criador' : 'Participante'}
                    </span>
                  </div>
                </div>
                
                <div className="participant-stats">
                  <span className="join-date">
                    Desde {formatDate(participant.joinedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {participants.length === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <p>Nenhum participante ainda</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="ranking-section">
          {ranking.length > 0 ? (
            <div className="ranking-list">
              {ranking.map((entry, index) => (
                <div key={entry.userId} className={`ranking-item ${index < 3 ? 'podium' : ''}`}>
                  <div className="position">
                    {index + 1}
                    {index === 0 && <Crown size={16} className="crown" />}
                  </div>
                  
                  <div className="user-info">
                    <span className="name">{entry.userName}</span>
                    <span className="stats">
                      {entry.totalWeight.toFixed(2)}kg • {entry.totalCatches} peixes
                    </span>
                  </div>
                  
                  <div className="score">
                    {entry.score} pts
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Trophy size={48} />
              <p>Nenhuma captura registrada ainda</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <button 
          onClick={() => navigate(`/ranking?tournament=${id}`)}
          className="btn btn-secondary"
        >
          <Trophy size={16} />
          Ver Ranking Completo
        </button>

        {/* Botão para entrar no campeonato (não criador, não participante) */}
        {!isParticipant() && !isOwner() && !tournament?.isPrivate && (currentStatus === 'upcoming' || currentStatus === 'active') && (
          <button 
            onClick={handleJoinTournament}
            className={`btn ${isFull ? 'btn-disabled' : 'btn-primary'}`}
            disabled={isFull}
            title={isFull ? 'Campeonato lotado' : 'Entrar no Campeonato'}
          >
            <Users size={16} />
            {isFull ? 'Campeonato Lotado' : 'Participar do Campeonato'}
          </button>
        )}
        
        {isParticipant() && !isOwner() && currentStatus !== 'finished' && (
          <button 
            onClick={handleLeaveTournament}
            className="btn btn-danger"
          >
            <UserMinus size={16} />
            Sair do Campeonato
          </button>
        )}
        
        {isOwner() && (
          <div className="owner-actions">
            {currentStatus === 'active' && (
              <button 
                onClick={handleFinishTournament}
                className="btn btn-warning"
              >
                <Square size={16} />
                Finalizar Campeonato
              </button>
            )}
            
            {(currentStatus === 'upcoming' || currentStatus === 'active') && (
              <button 
                onClick={handleDeleteTournament}
                className="btn btn-danger"
              >
                <Settings size={16} />
                Excluir Campeonato
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TournamentDetails