import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Award, Fish, Weight, TrendingUp, Users, Calendar } from 'lucide-react'
import { useFishing } from '../contexts/FishingContext'
import './Ranking.css'

const Ranking = () => {
  const { userTournaments, getTournamentRanking, getGeneralRanking } = useFishing()
  const [selectedTournament, setSelectedTournament] = useState('general')
  const [rankingType, setRankingType] = useState('weight') // 'weight' or 'quantity'
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
    return new Date(dateString).toLocaleDateString('pt-BR')
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
              <div className="d-flex gap-2">
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
                    {rankingType === 'weight' ? (
                      <><Weight size={16} /> Por peso total</>
                    ) : (
                      <><Fish size={16} /> Por quantidade</>
                    )}
                  </span>
                  <span className="d-flex align-center gap-1">
                    <Users size={16} />
                    {ranking.length} {ranking.length === 1 ? 'pescador' : 'pescadores'}
                  </span>
                </div>
              </div>
              
              <div className="ranking-table">
                <div className="table-header">
                  <div className="col-rank">Posição</div>
                  <div className="col-name">Pescador</div>
                  <div className="col-catches">Pescas</div>
                  <div className="col-weight">Peso Total</div>
                  <div className="col-biggest">Maior Peixe</div>
                  <div className="col-score">Pontuação</div>
                </div>
                
                {ranking.map((participant, index) => {
                  const isPodium = index < 3;
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  
                  return (
                    <div 
                      key={participant.userId} 
                      className={`position-relative p-6 rounded-xl transition-all duration-300 ${
                        isFirst 
                          ? 'bg-gradient-to-r from-yellow-100 via-yellow-50 to-amber-100 border-2 border-yellow-400 shadow-lg transform hover:scale-105'
                          : isSecond
                          ? 'bg-gradient-to-r from-gray-100 via-gray-50 to-slate-100 border-2 border-gray-400 shadow-md transform hover:scale-102'
                          : isThird
                          ? 'bg-gradient-to-r from-orange-100 via-orange-50 to-amber-100 border-2 border-orange-400 shadow-md transform hover:scale-102'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      style={{
                        boxShadow: isPodium ? '0 8px 25px rgba(0,0,0,0.15)' : undefined
                      }}
                    >
                      {/* Badge de posição */}
                      <div className={`absolute -top-3 -left-3 w-12 h-12 rounded-full d-flex align-center justify-center font-bold text-white shadow-lg ${
                        isFirst ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                        : isSecond ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                        : isThird ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      <div className="d-flex align-center gap-6">
                        {/* Avatar e ícone de ranking */}
                        <div className="d-flex align-center gap-4">
                          <div className={`w-16 h-16 rounded-full d-flex align-center justify-center text-2xl font-bold text-white ${
                            isFirst ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                            : isSecond ? 'bg-gradient-to-br from-gray-500 to-slate-600'
                            : isThird ? 'bg-gradient-to-br from-orange-500 to-red-600'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}>
                            {participant.userName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          
                          <div className="d-flex align-center gap-2">
                            {getRankIcon(index + 1)}
                            {isPodium && (
                              <span className="text-2xl">
                                {isFirst ? '👑' : isSecond ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Informações do pescador */}
                        <div className="flex-1">
                          <div className={`font-bold mb-2 ${
                            isFirst ? 'text-2xl text-yellow-800'
                            : isPodium ? 'text-xl text-gray-800'
                            : 'text-lg text-gray-900'
                          }`}>
                            {participant.userName || 'Pescador'}
                            {isFirst && <span className="ml-2 text-yellow-600">🏆 CAMPEÃO</span>}
                          </div>
                          
                          <div className="grid grid-3 gap-4 text-sm">
                            <div className={`d-flex align-center gap-2 p-2 rounded-lg ${
                              isPodium ? 'bg-white bg-opacity-70' : 'bg-gray-50'
                            }`}>
                              <Fish size={16} className="text-blue-600" />
                              <div>
                                <div className="font-semibold text-gray-900">{participant.totalCatches}</div>
                                <div className="text-xs text-gray-600">capturas</div>
                              </div>
                            </div>
                            
                            <div className={`d-flex align-center gap-2 p-2 rounded-lg ${
                              isPodium ? 'bg-white bg-opacity-70' : 'bg-gray-50'
                            }`}>
                              <Weight size={16} className="text-green-600" />
                              <div>
                                <div className="font-semibold text-gray-900">{participant.totalWeight.toFixed(1)}kg</div>
                                <div className="text-xs text-gray-600">peso total</div>
                              </div>
                            </div>
                            
                            {participant.biggestFish && participant.biggestFish.weight > 0 && (
                              <div className={`d-flex align-center gap-2 p-2 rounded-lg ${
                                isPodium ? 'bg-white bg-opacity-70' : 'bg-gray-50'
                              }`}>
                                <Trophy size={16} className="text-amber-600" />
                                <div>
                                  <div className="font-semibold text-gray-900">{participant.biggestFish.weight.toFixed(1)}kg</div>
                                  <div className="text-xs text-gray-600">maior peixe</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Pontuação principal */}
                        <div className="text-right">
                          <div className={`font-bold mb-1 ${
                            isFirst ? 'text-4xl text-yellow-700'
                            : isPodium ? 'text-3xl text-gray-700'
                            : 'text-2xl text-primary'
                          }`}>
                            {rankingType === 'weight' 
                              ? `${participant.totalWeight.toFixed(1)}kg`
                              : participant.totalCatches
                            }
                          </div>
                          <div className={`text-xs font-medium ${
                            isPodium ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {rankingType === 'weight' ? 'PESO TOTAL' : 'CAPTURAS'}
                          </div>
                          
                          {isPodium && (
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                              isFirst ? 'bg-yellow-200 text-yellow-800'
                              : isSecond ? 'bg-gray-200 text-gray-800'
                              : 'bg-orange-200 text-orange-800'
                            }`}>
                              {isFirst ? 'OURO' : isSecond ? 'PRATA' : 'BRONZE'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Barra de progresso para o primeiro lugar */}
                      {isFirst && (
                        <div className="mt-4 pt-4 border-t border-yellow-300">
                          <div className="d-flex justify-between text-xs text-yellow-700 mb-1">
                            <span>Liderança consolidada</span>
                            <span>100%</span>
                          </div>
                          <div className="w-full bg-yellow-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full" style={{width: '100%'}}></div>
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