import React, { useState, useEffect } from 'react'
import { User, Trophy, Fish, MapPin, Calendar, Settings, Edit3, Camera, Award, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFishing } from '../contexts/FishingContext'
import './Profile.css'

const Profile = () => {
  const { user, logout } = useAuth()
  const { userCatches, calculateUserStats } = useFishing()
  const [activeTab, setActiveTab] = useState('stats')
  const [userStats, setUserStats] = useState(null)
  const [recentCatches, setRecentCatches] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    favoriteSpot: '',
    experience: ''
  })

  useEffect(() => {
    loadUserData()
  }, [userCatches])

  // Função para encontrar espécie favorita
  const getFavoriteSpecies = (catches) => {
    if (!catches || catches.length === 0) return 'Nenhuma'
    
    const speciesCount = {}
    catches.forEach(catch_ => {
      speciesCount[catch_.species] = (speciesCount[catch_.species] || 0) + 1
    })
    
    return Object.keys(speciesCount).reduce((a, b) => 
      speciesCount[a] > speciesCount[b] ? a : b
    )
  }

  // Sistema dinâmico de conquistas
  const calculateAchievements = (stats) => {
    // Contar espécies específicas
    const tambaCount = userCatches.filter(catch_ => {
      const species = catch_.species?.toLowerCase() || ''
      return species.includes('tamba') || species.includes('tambaqui') || species.includes('tambacu')
    }).length
    
    const piraraCount = userCatches.filter(catch_ => 
      catch_.species?.toLowerCase().includes('pirarar')
    ).length
    
    const achievements = [
      {
        id: 'first_catch',
        title: 'Primeira Captura',
        description: 'Registre sua primeira captura',
        icon: '🎣',
        unlocked: stats.totalFish >= 1,
        progress: Math.min(stats.totalFish, 1)
      },
      {
        id: 'rookie',
        title: 'Pescador Iniciante',
        description: 'Capture 5 peixes',
        icon: '🐟',
        unlocked: stats.totalFish >= 5,
        progress: Math.min(stats.totalFish / 5, 1)
      },
      {
        id: 'experienced',
        title: 'Pescador Experiente',
        description: 'Capture 20 peixes',
        icon: '🏆',
        unlocked: stats.totalFish >= 20,
        progress: Math.min(stats.totalFish / 20, 1)
      },
      {
        id: 'heavy_catch',
        title: 'Peixe Pesado',
        description: 'Capture um peixe de mais de 5kg',
        icon: '💪',
        unlocked: stats.biggestFish?.weight >= 5,
        progress: stats.biggestFish?.weight ? Math.min(stats.biggestFish.weight / 5, 1) : 0
      },
      {
        id: 'legend',
        title: 'Lenda Viva',
        description: 'Capture um peixe de mais de 10kg',
        icon: '⭐',
        unlocked: stats.biggestFish?.weight >= 10,
        progress: stats.biggestFish?.weight ? Math.min(stats.biggestFish.weight / 10, 1) : 0
      },
      {
        id: 'giant_river',
        title: 'Gigante dos Rios',
        description: 'Capture um peixe de mais de 20kg',
        icon: '🐋',
        unlocked: stats.biggestFish?.weight >= 20,
        progress: stats.biggestFish?.weight ? Math.min(stats.biggestFish.weight / 20, 1) : 0
      },
      {
          id: 'tamba_king',
          title: 'Rei dos Tambas',
          description: 'Capture mais de 20 tambas, tambaquis ou tambacus',
          icon: '👑',
          unlocked: tambaCount >= 20,
          progress: Math.min(tambaCount / 20, 1)
        },
      {
        id: 'pirarar_king',
        title: 'Rei das Pirararas',
        description: 'Capture mais de 20 pirararas',
        icon: '🤴',
        unlocked: piraraCount >= 20,
        progress: Math.min(piraraCount / 20, 1)
      },
      {
        id: 'weight_master',
        title: 'Mestre do Peso',
        description: 'Acumule 50kg em capturas',
        icon: '⚖️',
        unlocked: stats.totalWeight >= 50,
        progress: Math.min(stats.totalWeight / 50, 1)
      }
    ]
    
    return achievements
  }

  const loadUserData = async () => {
    try {
      // Usar dados reais do FishingContext
      const stats = calculateUserStats()
      
      const calculatedStats = {
        totalFish: stats.totalCatches || 0,
        totalWeight: stats.totalWeight || 0,
        biggestFish: stats.biggestFish?.weight ? {
          species: stats.biggestFish.species,
          weight: stats.biggestFish.weight,
          location: stats.biggestFish.location
        } : null,
        favoriteSpecies: getFavoriteSpecies(userCatches),
        fishingDays: Math.ceil((stats.totalCatches || 0) / 3),
        averageWeight: stats.averageWeight || 0,
        currentRanking: 8,
        monthlyRanking: 3,
        tournamentsWon: 2,
        tournamentsParticipated: 7
      }
      
      // Usar capturas reais do usuário
      const sortedCatches = [...userCatches].sort((a, b) => 
        new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date)
      )
      setRecentCatches(sortedCatches.slice(0, 10)) // Últimas 10 capturas
      setUserStats(calculatedStats)
      
      // Sistema dinâmico de conquistas
      const dynamicAchievements = calculateAchievements(calculatedStats)
      setAchievements(dynamicAchievements)
      
      // Carregar dados do perfil
      setProfileData({
        displayName: user?.displayName || 'Pescador',
        bio: '', // Campo vazio para o usuário preencher
        location: 'São Paulo, SP',
        favoriteSpot: 'Lago Azul',
        experience: 'Intermediário'
      })
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      // Aqui implementar salvamento no Firebase
      console.log('Salvando perfil:', profileData)
      setEditMode(false)
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getExperienceLevel = (totalFish) => {
    if (totalFish < 10) return { level: 'Iniciante', color: '#4CAF50' }
    if (totalFish < 50) return { level: 'Intermediário', color: '#FF9800' }
    if (totalFish < 100) return { level: 'Avançado', color: '#2196F3' }
    return { level: 'Mestre', color: '#9C27B0' }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  const experienceLevel = getExperienceLevel(userStats?.totalFish || 0)

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      {/* Header do Perfil */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{profileData.displayName}</h2>
            {editMode ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                placeholder="Conte um pouco sobre você e sua paixão pela pesca..."
                style={{
                  width: '100%',
                  minHeight: '60px',
                  margin: '0 0 10px 0',
                  padding: '8px',
                  border: '2px solid #3498db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#7f8c8d',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', minHeight: '20px' }}>
                {profileData.bio || 'Clique em "Editar" para adicionar uma descrição sobre você...'}
              </p>
            )}
            <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#95a5a6' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={16} />
                {profileData.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Fish size={16} />
                {profileData.favoriteSpot}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {editMode && (
              <button 
                className="btn"
                onClick={handleSaveProfile}
                style={{ 
                  background: '#27ae60',
                  border: '2px solid #27ae60',
                  color: 'white',
                  padding: '8px 16px'
                }}
              >
                Salvar
              </button>
            )}
            <button 
              className="btn"
              onClick={() => setEditMode(!editMode)}
              style={{ 
                background: 'transparent',
                border: '2px solid #3498db',
                color: '#3498db',
                padding: '8px 16px'
              }}
            >
              <Edit3 size={16} />
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        {/* Nível de Experiência */}
        <div style={{ 
          background: `linear-gradient(90deg, ${experienceLevel.color}20 0%, transparent 100%)`,
          padding: '15px',
          borderRadius: '8px',
          border: `1px solid ${experienceLevel.color}30`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: experienceLevel.color }}>
              {experienceLevel.level}
            </span>
            <span style={{ fontSize: '14px', color: '#7f8c8d' }}>
              {userStats?.totalFish || 0} peixes pescados
            </span>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[
          { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
          { id: 'catches', label: 'Capturas', icon: Fish },
          { id: 'achievements', label: 'Conquistas', icon: Award }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className="btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#3498db' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#3498db',
                border: '2px solid #3498db',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'stats' && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>📊 Estatísticas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <Fish size={32} style={{ color: '#3498db', marginBottom: '10px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {userStats?.totalFish || 0}
              </div>
              <div style={{ color: '#7f8c8d' }}>Total de Peixes</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <Trophy size={32} style={{ color: '#f39c12', marginBottom: '10px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {userStats?.totalWeight?.toFixed(1) || '0.0'}kg
              </div>
              <div style={{ color: '#7f8c8d' }}>Peso Total</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <Target size={32} style={{ color: '#e74c3c', marginBottom: '10px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {userStats?.biggestFish?.weight?.toFixed(1) || '0.0'}kg
              </div>
              <div style={{ color: '#7f8c8d' }}>Maior Peixe</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <Calendar size={32} style={{ color: '#9b59b6', marginBottom: '10px' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                {userStats?.fishingDays || 0}
              </div>
              <div style={{ color: '#7f8c8d' }}>Dias Pescando</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catches' && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🎣 Capturas Recentes</h3>
          {recentCatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              <Fish size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
              <p>Nenhuma captura registrada ainda.</p>
              <p>Que tal registrar sua primeira captura?</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {recentCatches.map((capture, index) => {
                const fallbackKey = `capture-${index}-${capture.species || 'unknown'}-${capture.weight || 0}-${capture.registeredAt || capture.timestamp || Date.now()}`
                return (
                <div key={capture.id || fallbackKey} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  {capture.photo && (
                    <img 
                      src={capture.photo} 
                      alt={capture.species}
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '8px', 
                        objectFit: 'cover' 
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{capture.species}</h4>
                    <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: '14px' }}>
                      {capture.weight}kg • {capture.location}
                    </p>
                    <p style={{ margin: 0, color: '#95a5a6', fontSize: '12px' }}>
                      {formatDate(capture.registeredAt || capture.date)}
                    </p>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🏆 Conquistas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                style={{ 
                  padding: '20px',
                  background: achievement.unlocked ? '#f8f9fa' : '#f5f5f5',
                  borderRadius: '8px',
                  border: achievement.unlocked ? '2px solid #27ae60' : '2px solid #bdc3c7',
                  opacity: achievement.unlocked ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '32px' }}>{achievement.icon}</span>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{achievement.title}</h4>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlocked ? (
                  <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: 'bold' }}>
                    ✅ Desbloqueado!
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '5px' }}>
                      🔒 Progresso: {Math.round(achievement.progress * 100)}%
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: '#e9ecef', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${achievement.progress * 100}%`,
                        height: '100%',
                        background: '#3498db',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile