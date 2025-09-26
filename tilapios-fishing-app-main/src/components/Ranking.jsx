import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Fish, Weight, TrendingUp, Users, Calendar } from 'lucide-react'
import { useFishing } from '../contexts/FishingContext'
import './Ranking.css'

const Ranking = () => {
  const { userTournaments, getTournamentRanking, getGeneralRanking } = useFishing()
  const [selectedTournament, setSelectedTournament] = useState('general')
  const [rankingType, setRankingType] = useState('score') // 'score', 'weight', 'quantity', 'biggest', 'species'
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(false)
  const [tournamentInfo, setTournamentInfo] = useState(null)

  useEffect(() => {
    if (selectedTournament) {
      loadRanking()
    }
  }, [selectedTournament, rankingType])

  const loadRanking = async () => {
    if (!selectedTournament) return
    
    try {
      setLoading(true)
      
      if (selectedTournament === 'general') {
        // Carregar ranking geral
        const rankingData = await getGeneralRanking(rankingType)
        setRanking(rankingData)
        setTournamentInfo(null)
      } else {
        // Carregar ranking específico do campeonato
        const rankingData = await getTournamentRanking(selectedTournament, rankingType)
        setRanking(rankingData)
        
        // Find tournament info
        const tournament = userTournaments.find(t => t.id === selectedTournament)
        setTournamentInfo(tournament)
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy size={24} className="rank-icon gold" />
      case 2:
        return <Medal size={24} className="rank-icon silver" />
      case 3:
        return <Award size={24} className="rank-icon bronze" />
      default:
        return <span className="rank-number">{position}</span>
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return 'Data não disponível'
      }
      
      const date = new Date(dateString)
      
      if (isNaN(date.getTime())) {
        return 'Data não disponível'
      }
      
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return 'Data não disponível'
    }
  }

  const getStatusBadge = (tournament) => {
    const now = new Date()
    const startDate = new Date(tournament.startDate)
    const endDate = new Date(tournament.endDate)
    
    if (now < startDate) {
      return <span className="status-badge upcoming">Em Breve</span>
    } else if (now >= startDate && now <= endDate) {
      return <span className="status-badge active">Em Andamento</span>
    } else {
      return <span className="status-badge finished">Finalizado</span>
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-brand">
            <span className="brand-name">Tilapios</span>
          </div>
          <h1 className="page-title">
            <Trophy size={32} />
            Ranking
          </h1>
          <p className="page-subtitle">Veja quem está dominando as águas!</p>
        </div>

        <div className="card">
          <div className="d-flex flex-column gap-4">
            <div className="form-group">
              <label htmlFor="tournament-select" className="form-label">
                📅 Campeonato
              </label>
              <select 
                id="tournament-select"
                value={selectedTournament} 
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="form-select"
              >
                <option value="general">🏆 Ranking Geral (Todas as Pescas)</option>
                {userTournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">📊 Ranking por</label>
              <div className="d-flex gap-2 flex-wrap">
                <button 
                  className={`btn ${rankingType === 'score' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRankingType('score')}
                >
                  <Trophy size={18} />
                  Pontuação
                </button>
                <button 
                  className={`btn ${rankingType === 'weight' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRankingType('weight')}
                >
                  <Weight size={18} />
                  Peso
                </button>
                <button 
                  className={`btn ${rankingType === 'quantity' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRankingType('quantity')}
                >
                  <Fish size={18} />
                  Quantidade
                </button>
                <button 
                  className={`btn ${rankingType === 'biggest' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRankingType('biggest')}
                >
                  <Award size={18} />
                  Maior Peixe
                </button>
                <button 
                  className={`btn ${rankingType === 'species' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRankingType('species')}
                >
                  <TrendingUp size={18} />
                  Diversidade
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedTournament === 'general' ? (
          <div className="tournament-info">
            <div className="tournament-header">
              <h2>🏆 Ranking Geral</h2>
              <span className="status-badge active">Todas as Pescas</span>
            </div>
            <div className="tournament-details">
              <div className="detail-item">
                <Fish size={16} />
                <span>Inclui todas as capturas registradas</span>
              </div>
              <div className="detail-item">
                <Users size={16} />
                <span>Todos os pescadores</span>
              </div>
            </div>
          </div>
        ) : tournamentInfo && (
          <div className="card">
            <div className="d-flex flex-column gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{tournamentInfo.name}</h2>
              <div className="d-flex gap-4 text-sm text-gray-600">
                <span className="d-flex align-center gap-1">
                  <Calendar size={16} />
                  {new Date(tournamentInfo.startDate).toLocaleDateString('pt-BR')} - 
                  {new Date(tournamentInfo.endDate).toLocaleDateString('pt-BR')}
                </span>
                <span className="d-flex align-center gap-1">
                  <Users size={16} />
                  {tournamentInfo.participants?.length || 0} participantes
                </span>
              </div>
              {tournamentInfo.description && (
                <p className="text-gray-700">{tournamentInfo.description}</p>
              )}
            </div>
          </div>
        )}

        <div className="ranking-content">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando ranking...</p>
            </div>
          ) : ranking.length > 0 ? (
            <div className="card">
              <div className="d-flex justify-between align-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 d-flex align-center gap-2">
                  {getRankIcon(1)}
                  {selectedTournament === 'general' ? 'Ranking Geral' : 'Ranking do Campeonato'}
                </h3>
                <div className="d-flex flex-column gap-1 text-sm text-gray-600">
                  <span className="d-flex align-center gap-1">
                    {rankingType === 'score' ? (
                      <><Trophy size={16} /> Por pontuação geral</>
                    ) : rankingType === 'weight' ? (
                      <><Weight size={16} /> Por peso total</>
                    ) : rankingType === 'quantity' ? (
                      <><Fish size={16} /> Por quantidade</>
                    ) : rankingType === 'biggest' ? (
                      <><Award size={16} /> Por maior peixe</>
                    ) : (
                      <><TrendingUp size={16} /> Por diversidade de espécies</>
                    )}
                  </span>
                  <span className="d-flex align-center gap-1">
                    <Users size={16} />
                    {ranking.length} {ranking.length === 1 ? 'pescador' : 'pescadores'}
                  </span>
                </div>
              </div>
              
              {/* Pódio dos Top 3 */}
              {ranking.length >= 3 && (
                <div className="podium-container">
                  <div className="podium-title">
                    <Trophy size={24} className="text-yellow-600" />
                    <h3>🏆 Pódio dos Campeões</h3>
                  </div>
                  
                  <div className="podium">
                    {/* 2º Lugar */}
                    <div className="podium-position second-place">
                      <div className="podium-rank">2º</div>
                      <div className="podium-avatar silver">
                        {ranking[1]?.userName?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div className="podium-name">{ranking[1]?.userName || 'Pescador'}</div>
                      <div className="podium-score">
                        {rankingType === 'weight' 
                          ? `${ranking[1]?.totalWeight?.toFixed(1)}kg`
                          : ranking[1]?.totalCatches
                        }
                      </div>
                      <div className="podium-medal">🥈</div>
                      <div className="podium-base silver-base"></div>
                    </div>
                    
                    {/* 1º Lugar */}
                    <div className="podium-position first-place">
                      <div className="crown">👑</div>
                      <div className="podium-rank champion">1º</div>
                      <div className="podium-avatar gold">
                        {ranking[0]?.userName?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div className="podium-name champion-name">{ranking[0]?.userName || 'Pescador'}</div>
                      <div className="podium-score champion-score">
                        {rankingType === 'weight' 
                          ? `${ranking[0]?.totalWeight?.toFixed(1)}kg`
                          : ranking[0]?.totalCatches
                        }
                      </div>
                      <div className="podium-medal">🏆</div>
                      <div className="podium-base gold-base"></div>
                      <div className="champion-glow"></div>
                    </div>
                    
                    {/* 3º Lugar */}
                    <div className="podium-position third-place">
                      <div className="podium-rank">3º</div>
                      <div className="podium-avatar bronze">
                        {ranking[2]?.userName?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                      <div className="podium-name">{ranking[2]?.userName || 'Pescador'}</div>
                      <div className="podium-score">
                        {rankingType === 'weight' 
                          ? `${ranking[2]?.totalWeight?.toFixed(1)}kg`
                          : ranking[2]?.totalCatches
                        }
                      </div>
                      <div className="podium-medal">🥉</div>
                      <div className="podium-base bronze-base"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Lista completa do ranking */}
              <div className="ranking-list">
                <div className="ranking-list-header">
                  <h3>📊 Ranking Completo</h3>
                  <span className="ranking-count">{ranking.length} pescadores</span>
                </div>
                
                {ranking.map((participant, index) => {
                  const isPodium = index < 3;
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  
                  return (
                    <div 
                      key={participant.userId} 
                      className={`ranking-card ${
                        isFirst ? 'champion-card'
                        : isSecond ? 'silver-card'
                        : isThird ? 'bronze-card'
                        : 'regular-card'
                      }`}
                    >
                      {/* Badge de posição */}
                      <div className={`position-badge ${
                        isFirst ? 'gold-badge'
                        : isSecond ? 'silver-badge'
                        : isThird ? 'bronze-badge'
                        : 'regular-badge'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      {/* Conteúdo principal */}
                      <div className="ranking-card-content">
                        {/* Avatar e informações básicas */}
                        <div className="player-section">
                          <div className={`player-avatar ${
                            isFirst ? 'gold-avatar'
                            : isSecond ? 'silver-avatar'
                            : isThird ? 'bronze-avatar'
                            : 'regular-avatar'
                          }`}>
                            {participant.userName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          
                          <div className="player-info">
                            <div className={`player-name ${
                              isFirst ? 'champion-name'
                              : isPodium ? 'podium-name'
                              : 'regular-name'
                            }`}>
                              {participant.userName || 'Pescador'}
                              {isFirst && <span className="champion-title">👑 CAMPEÃO</span>}
                            </div>
                            
                            {/* Ícones de ranking */}
                            <div className="ranking-icons">
                              {getRankIcon(index + 1)}
                              {isPodium && (
                                <span className="medal-emoji">
                                  {isFirst ? '🏆' : isSecond ? '🥈' : '🥉'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Estatísticas */}
                        <div className="stats-section">
                          {rankingType === 'score' && (
                            <div className={`stat-item ${
                              isPodium ? 'podium-stat' : 'regular-stat'
                            }`}>
                              <Trophy size={16} className="stat-icon" />
                              <div className="stat-content">
                                <div className="stat-value">{participant.score || 0}</div>
                                <div className="stat-label">pontos</div>
                              </div>
                            </div>
                          )}
                          
                          <div className={`stat-item ${
                            isPodium ? 'podium-stat' : 'regular-stat'
                          }`}>
                            <Fish size={16} className="stat-icon" />
                            <div className="stat-content">
                              <div className="stat-value">{participant.totalCatches}</div>
                              <div className="stat-label">capturas</div>
                            </div>
                          </div>
                          
                          <div className={`stat-item ${
                            isPodium ? 'podium-stat' : 'regular-stat'
                          }`}>
                            <Weight size={16} className="stat-icon" />
                            <div className="stat-content">
                              <div className="stat-value">{participant.totalWeight.toFixed(1)}kg</div>
                              <div className="stat-label">peso total</div>
                            </div>
                          </div>
                          
                          {(rankingType === 'biggest' || rankingType === 'score') && participant.biggestFish && participant.biggestFish.weight > 0 && (
                            <div className={`stat-item ${
                              isPodium ? 'podium-stat' : 'regular-stat'
                            }`}>
                              <Trophy size={16} className="stat-icon" />
                              <div className="stat-content">
                                <div className="stat-value">{participant.biggestFish.weight.toFixed(1)}kg</div>
                                <div className="stat-label">maior peixe</div>
                              </div>
                            </div>
                          )}
                          
                          {(rankingType === 'species' || rankingType === 'score') && (
                            <div className={`stat-item ${
                              isPodium ? 'podium-stat' : 'regular-stat'
                            }`}>
                              <TrendingUp size={16} className="stat-icon" />
                              <div className="stat-content">
                                <div className="stat-value">{participant.uniqueSpecies || 0}</div>
                                <div className="stat-label">espécies</div>
                              </div>
                            </div>
                          )}
                          
                          {rankingType === 'weight' && (
                            <div className={`stat-item ${
                              isPodium ? 'podium-stat' : 'regular-stat'
                            }`}>
                              <Award size={16} className="stat-icon" />
                              <div className="stat-content">
                                <div className="stat-value">{participant.averageWeight?.toFixed(1) || '0.0'}kg</div>
                                <div className="stat-label">peso médio</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Pontuação principal */}
                        <div className="score-section">
                          <div className={`main-score ${
                            isFirst ? 'champion-score'
                            : isPodium ? 'podium-score'
                            : 'regular-score'
                          }`}>
                            {rankingType === 'score' 
                              ? participant.score || 0
                              : rankingType === 'weight' 
                              ? `${participant.totalWeight.toFixed(1)}kg`
                              : rankingType === 'biggest'
                              ? `${participant.biggestFish?.weight?.toFixed(1) || '0.0'}kg`
                              : rankingType === 'species'
                              ? participant.uniqueSpecies || 0
                              : participant.totalCatches
                            }
                          </div>
                          <div className="score-label">
                            {rankingType === 'score' ? 'PONTUAÇÃO'
                              : rankingType === 'weight' ? 'PESO TOTAL'
                              : rankingType === 'biggest' ? 'MAIOR PEIXE'
                              : rankingType === 'species' ? 'ESPÉCIES ÚNICAS'
                              : 'CAPTURAS'
                            }
                          </div>
                          
                          {isPodium && (
                            <div className={`medal-badge ${
                              isFirst ? 'gold-medal'
                              : isSecond ? 'silver-medal'
                              : 'bronze-medal'
                            }`}>
                              {isFirst ? 'OURO' : isSecond ? 'PRATA' : 'BRONZE'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Barra de progresso para o campeão */}
                      {isFirst && (
                        <div className="champion-progress">
                          <div className="progress-info">
                            <span>Liderança consolidada</span>
                            <span>100%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedTournament ? (
            <div className="card text-center">
              <div className="d-flex flex-column align-center gap-4 p-5">
                <div className="text-gray-400">
                  <Fish size={64} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum dado encontrado</h3>
                  <p className="text-gray-600 mb-2">
                    {selectedTournament === 'general' 
                      ? 'Ainda não há capturas registradas no sistema.'
                      : 'Este campeonato ainda não possui capturas registradas.'
                    }
                  </p>
                  <p className="text-primary font-medium">Seja o primeiro a registrar uma captura!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Trophy size={64} className="empty-icon" />
              <h3>Selecione um campeonato</h3>
              <p>Escolha um campeonato para ver o ranking dos pescadores.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Ranking