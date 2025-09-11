import React, { useState, useEffect } from 'react'
import { Users, Plus, Trophy, Calendar, Clock, Star, Shield, Award, Target } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFishing } from '../contexts/FishingContext'
import { useNavigate } from 'react-router-dom'
import './Tournaments.css'

const Tournaments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { 
    userTournaments, 
    allTournaments,
    createTournament, 
    joinTournament,
    leaveTournament,
    deleteTournament,
    finishTournament,
    loadUserTournaments
  } = useFishing()
  
  const [activeTab, setActiveTab] = useState('my-tournaments')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [publicTournaments, setPublicTournaments] = useState([])
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: 20,
    isPrivate: false,
    entryFee: 0,
    prizePool: 0,
    rules: 'Regras padrão de pesca: Registre suas pescas com peso e espécie, ranking por peso total e quantidade de peixes.'
  })

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      await loadUserTournaments()
      
      // Carregar campeonatos públicos (não privados e que o usuário não participa)
      const publicTournaments = allTournaments.filter(tournament => 
        !tournament.isPrivate && 
        (!tournament.participants || !tournament.participants.includes(user?.uid))
      )
      
      setPublicTournaments(publicTournaments)
    } catch (error) {
      console.error('Erro ao carregar campeonatos:', error)
      setMessage('Erro ao carregar campeonatos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTournament = async (e) => {
    e.preventDefault()
    
    try {
      await createTournament(newTournament)
      setMessage('Campeonato criado com sucesso!')
      
      setNewTournament({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        maxParticipants: 20,
        isPrivate: false,
        entryFee: 0,
        prizePool: 0,
        rules: 'Regras padrão de pesca: Registre suas pescas com peso e espécie, ranking por peso total e quantidade de peixes.'
      })
      setShowCreateForm(false)
      loadTournaments()
    } catch (error) {
      console.error('Erro ao criar campeonato:', error)
      setMessage('Erro ao criar campeonato')
    }
  }

  const handleJoinTournament = async (tournamentId) => {
    try {
      await joinTournament(tournamentId)
      setMessage('Você entrou no campeonato com sucesso!')
      await loadTournaments()
    } catch (error) {
      console.error('Erro ao entrar no campeonato:', error)
      setMessage('Erro ao entrar no campeonato: ' + error.message)
    }
  }

  const handleLeaveTournament = async (tournamentId) => {
    if (!window.confirm('Tem certeza que deseja sair deste campeonato?')) return
    
    try {
      await leaveTournament(tournamentId)
      setMessage('Você saiu do campeonato com sucesso!')
      await loadTournaments()
    } catch (error) {
      console.error('Erro ao sair do campeonato:', error)
      setMessage('Erro ao sair do campeonato: ' + error.message)
    }
  }

  const handleDeleteTournament = async (tournamentId) => {
    if (!window.confirm('Tem certeza que deseja deletar este campeonato? Esta ação não pode ser desfeita.')) return
    
    try {
      await deleteTournament(tournamentId)
      setMessage('Campeonato deletado com sucesso!')
      await loadTournaments()
    } catch (error) {
      console.error('Erro ao deletar campeonato:', error)
      setMessage('Erro ao deletar campeonato: ' + error.message)
    }
  }

  const handleFinishTournament = async (tournamentId) => {
    if (!window.confirm('Tem certeza que deseja finalizar este campeonato?')) return
    
    try {
      await finishTournament(tournamentId)
      setMessage('Campeonato finalizado com sucesso!')
      await loadTournaments()
    } catch (error) {
      console.error('Erro ao finalizar campeonato:', error)
      setMessage('Erro ao finalizar campeonato: ' + error.message)
    }
  }

  const isOwner = (tournament) => {
    return tournament.createdBy === user?.uid
  }

  const isParticipant = (tournament) => {
    return tournament.participants?.includes(user?.uid)
  }

  const getTournamentStatus = (tournament) => {
    const now = new Date()
    const startDate = new Date(tournament.startDate)
    const endDate = new Date(tournament.endDate)
    
    if (tournament.status === 'finished') return 'finished'
    if (now < startDate) return 'upcoming'
    if (now >= startDate && now <= endDate) return 'active'
    return 'finished'
  }

  // Limpar mensagem após 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Ativo</span>
      case 'upcoming':
        return <span className="badge badge-warning">Em Breve</span>
      case 'finished':
        return <span className="badge">Finalizado</span>
      default:
        return <span className="badge">Desconhecido</span>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="tournaments">
      <div className="container">
        <div className="header">
          <h1>
            <Users size={32} />
            Campeonatos de Pesca
          </h1>
          <p>
            Participe de campeonatos de pesca e mostre suas habilidades! 🎣
          </p>
        </div>

        {/* Botão Criar Campeonato */}
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-btn"
        >
          <Plus size={20} />
          Criar Novo Campeonato
        </button>

        {/* Formulário de Criação */}
        {showCreateForm && (
          <div className="form-card">
            <h2>Criar Novo Campeonato</h2>
            <form onSubmit={handleCreateTournament}>
              <div className="form-group">
                <label className="form-label">Nome do Campeonato</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                  placeholder="Ex: Campeonato de Pesca do Lago"
                  required
                />
              </div>
            
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-textarea"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                  placeholder="Descreva o campeonato..."
                  required
                />
              </div>
            
              <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input
                  type="date"
                  className="form-input"
                  value={newTournament.startDate}
                  onChange={(e) => setNewTournament({...newTournament, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data de Fim</label>
                <input
                  type="date"
                  className="form-input"
                  value={newTournament.endDate}
                  onChange={(e) => setNewTournament({...newTournament, endDate: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Taxa de Inscrição (R$)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTournament.entryFee}
                  onChange={(e) => setNewTournament({...newTournament, entryFee: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prêmio Total (R$)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTournament.prizePool}
                  onChange={(e) => setNewTournament({...newTournament, prizePool: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Máximo de Participantes</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTournament.maxParticipants}
                  onChange={(e) => setNewTournament({...newTournament, maxParticipants: parseInt(e.target.value)})}
                  min="2"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={newTournament.isPrivate}
                    onChange={(e) => setNewTournament({...newTournament, isPrivate: e.target.checked})}
                    style={{ marginRight: '8px' }}
                  />
                  Campeonato Privado
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Regras do Campeonato de Pesca</label>
              <textarea
                className="form-textarea"
                value={newTournament.rules}
                onChange={(e) => setNewTournament({...newTournament, rules: e.target.value})}
                placeholder="Regras específicas do campeonato..."
                rows="4"
              />
            </div>
            
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Criar Campeonato</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs de Navegação */}
        <div className="tabs">
          <div className="tabs-nav">
            <button 
              onClick={() => setActiveTab('my-tournaments')}
              className={`tab-btn ${activeTab === 'my-tournaments' ? 'active' : ''}`}
            >
              <Trophy size={18} />
              Meus Campeonatos
            </button>
            <button 
              onClick={() => setActiveTab('public-tournaments')}
              className={`tab-btn ${activeTab === 'public-tournaments' ? 'active' : ''}`}
            >
              <Users size={18} />
              Públicos
            </button>
            <button 
              onClick={() => setActiveTab('invitations')}
              className={`tab-btn ${activeTab === 'invitations' ? 'active' : ''}`}
            >
              <Star size={18} />
              Convites (0)
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'my-tournaments' && (
          <div className="tournaments-grid">
            {userTournaments.map(tournament => {
              const currentStatus = getTournamentStatus(tournament)
              const isOwnerOfTournament = isOwner(tournament)
              const isParticipantOfTournament = isParticipant(tournament)
              
              return (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <h3>{tournament.name}</h3>
                    <div className="tournament-badges">
                      {getStatusBadge(currentStatus)}
                      {isOwnerOfTournament && <span className="badge badge-owner">Criador</span>}
                    </div>
                  </div>
                  
                  <div className="tournament-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>
                        {tournament.participants?.length || 0}/{tournament.maxParticipants} pescadores
                      </span>
                    </div>
                    {tournament.entryFee > 0 && (
                      <div className="detail-item">
                        <Target size={16} />
                        <span>
                          Taxa: R$ {tournament.entryFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {tournament.prizePool > 0 && (
                      <div className="detail-item prize">
                        <Award size={16} />
                        <span>
                          Prêmio: R$ {tournament.prizePool.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="tournament-description">
                    {tournament.description}
                  </p>
                  
                  <div className="tournament-actions">
                    <button 
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      className="btn btn-sm"
                    >
                      Ver Detalhes
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/ranking?tournament=${tournament.id}`)}
                      className="btn btn-sm btn-secondary"
                    >
                      Ver Ranking
                    </button>
                    
                    {/* Ações para o criador do campeonato */}
                    {isOwnerOfTournament && (
                      <>
                        {currentStatus === 'active' && (
                          <button 
                            onClick={() => handleFinishTournament(tournament.id)}
                            className="btn btn-sm btn-warning"
                          >
                            Finalizar
                          </button>
                        )}
                        {currentStatus !== 'active' && (
                          <button 
                            onClick={() => handleDeleteTournament(tournament.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Deletar
                          </button>
                        )}
                      </>
                    )}
                    
                    {/* Ações para participantes (não criadores) */}
                    {!isOwnerOfTournament && isParticipantOfTournament && currentStatus !== 'finished' && (
                      <button 
                        onClick={() => handleLeaveTournament(tournament.id)}
                        className="btn btn-sm btn-secondary"
                      >
                        Sair
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            
            {userTournaments.length === 0 && (
              <div className="empty-state">
                <Shield size={48} />
                <p>Você ainda não participa de nenhum campeonato de pesca.</p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="btn"
                >
                  Criar Primeiro Campeonato
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'public-tournaments' && (
          <div className="tournaments-grid">
            {publicTournaments.map(tournament => {
              const currentStatus = getTournamentStatus(tournament)
              const canJoin = currentStatus === 'upcoming' || currentStatus === 'active'
              const isFull = (tournament.participants?.length || 0) >= tournament.maxParticipants
              
              return (
                <div key={tournament.id} className="tournament-card">
                  <div className="tournament-header">
                    <h3>{tournament.name}</h3>
                    <div className="tournament-badges">
                      {getStatusBadge(currentStatus)}
                      {isFull && <span className="badge badge-full">Lotado</span>}
                    </div>
                  </div>
                  
                  <div className="tournament-details">
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>
                        {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <Users size={16} />
                      <span>
                        {tournament.participants?.length || 0}/{tournament.maxParticipants} pescadores
                      </span>
                    </div>
                    {tournament.entryFee > 0 && (
                      <div className="detail-item">
                        <Target size={16} />
                        <span>
                          Taxa: R$ {tournament.entryFee.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {tournament.prizePool > 0 && (
                      <div className="detail-item prize">
                        <Award size={16} />
                        <span>
                          Prêmio: R$ {tournament.prizePool.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="tournament-description">
                    {tournament.description}
                  </p>
                  
                  <div className="tournament-actions">
                    <button 
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                      className="btn btn-sm"
                    >
                      Ver Detalhes
                    </button>
                    
                    <button 
                      onClick={() => navigate(`/ranking?tournament=${tournament.id}`)}
                      className="btn btn-sm btn-secondary"
                    >
                      Ver Ranking
                    </button>
                    
                    {canJoin && !isFull ? (
                      <button 
                        onClick={() => handleJoinTournament(tournament.id)}
                        className="btn btn-sm"
                      >
                        Participar
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="btn btn-sm btn-disabled"
                        title={isFull ? 'Campeonato lotado' : 'Campeonato não disponível para participação'}
                      >
                        {isFull ? 'Lotado' : 'Indisponível'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            
            {publicTournaments.length === 0 && (
              <div className="empty-state">
                <Users size={48} />
                <p>Nenhum campeonato público disponível no momento.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="empty-state">
            <Star size={48} />
            <p>Nenhum convite pendente para campeonatos de pesca.</p>
          </div>
        )}
        {message && (
          <div className={`alert ${message.includes('Erro') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tournaments