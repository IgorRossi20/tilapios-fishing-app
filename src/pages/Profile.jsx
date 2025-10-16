import React, { useState, useEffect } from 'react'
import { User, Trophy, Fish, MapPin, Calendar, Settings, Edit3, Camera, Award, Target, TrendingUp, CheckCircle, Star, Compass, Anchor, Save, Activity, BarChart2, Heart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFishing } from '../contexts/FishingContext'
import './Profile.css'
import { compressImage, validateImageFile } from '../utils/imageCompression'

const Profile = () => {
  const { user, logout } = useAuth()
  const { userCatches, userTournaments, calculateUserStats } = useFishing()
  const [activeTab, setActiveTab] = useState('stats')
  const [userStats, setUserStats] = useState(null)
  const [recentCatches, setRecentCatches] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    experience: '',
    avatarUrl: ''
  })

  useEffect(() => {
    loadUserData()
  }, [userCatches, userTournaments])

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
      
      const tournamentsParticipated = Array.isArray(userTournaments) ? userTournaments.length : 0
      const tournamentsWon = Array.isArray(userTournaments)
        ? userTournaments.filter(t => t.status === 'finished' && t.winner?.userId === (user?.uid)).length
        : 0

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
        tournamentsWon,
        tournamentsParticipated
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
      
      // Carregar dados do perfil (preferir localStorage se existir)
      const storedProfile = (() => {
        try {
          const raw = localStorage.getItem('profileData')
          return raw ? JSON.parse(raw) : null
        } catch {
          return null
        }
      })()

      setProfileData({
        displayName: storedProfile?.displayName || user?.displayName || 'Pescador',
        bio: storedProfile?.bio || '',
        experience: storedProfile?.experience || 'Intermediário',
        avatarUrl: storedProfile?.avatarUrl || user?.photoURL || ''
      })
      
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      // Persistir localmente por enquanto
      try {
        localStorage.setItem('profileData', JSON.stringify(profileData))
      } catch (err) {
      }
      setEditMode(false)
    } catch (error) {
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      // Valida e comprime para melhorar desempenho e tamanho
      validateImageFile(file)
      const compressed = await compressImage(file, 1.5 * 1024 * 1024)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result }))
      }
      reader.readAsDataURL(compressed)
    } catch (err) {
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
      return 'Data não disponível'
    }
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
    <div className="profile-container">
      {/* Header do Perfil */}
      <div className="profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {profileData.avatarUrl ? (
              <img src={profileData.avatarUrl} alt="Avatar" className="avatar-image" />
            ) : (
              (user?.displayName?.charAt(0) || 'U')
            )}
            <div className="avatar-glow"></div>
          </div>
          <div className="profile-info">
            <div className="profile-name-container">
              {editMode ? (
                <input
                  type="text"
                  className="profile-name-input"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  placeholder="Seu nome de guerra"
                />
              ) : (
                <h2 className="profile-name">{profileData.displayName}</h2>
              )}
              <span className="profile-badge">
                <Star size={14} className="badge-icon" />
                {experienceLevel.level}
              </span>
            </div>
            {editMode ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                placeholder="Conte um pouco sobre você e sua paixão pela pesca..."
                className="profile-bio-textarea"
                maxLength={150}
              />
            ) : (
              <p className="profile-bio">
                {profileData.bio || 'Clique em "Editar" para adicionar uma descrição sobre você e sua paixão pela pesca...'}
              </p>
            )}
            <div className="profile-meta">
              <span className="profile-meta-item">
                <Trophy size={16} className="meta-icon" />
                {userStats?.tournamentsWon || 0} torneios vencidos
              </span>
              <span className="profile-meta-item">
                <Activity size={16} className="meta-icon" />
                {userStats?.totalFish || 0} capturas
              </span>
            </div>
          </div>
          <div className="profile-actions">
            {editMode && (
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="avatar-file-input"
                title="Alterar foto"
              />
            )}
            {editMode && (
              <button 
                className="profile-btn save-btn"
                onClick={handleSaveProfile}
              >
                <Save size={16} />
                Salvar
              </button>
            )}
            <button 
              className="profile-btn edit-btn"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit3 size={16} />
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        {/* Nível de Experiência */}
        <div className="experience-bar-container">
          <div className="experience-progress" style={{ 
            width: `${Math.min((userStats?.totalFish || 0) / (experienceLevel.level === 'Iniciante' ? 10 : experienceLevel.level === 'Intermediário' ? 50 : experienceLevel.level === 'Avançado' ? 100 : 200) * 100, 100)}%`,
            background: `linear-gradient(90deg, ${experienceLevel.color} 0%, ${experienceLevel.color}90 100%)`
          }}></div>
          <div className="experience-details">
            <div className="experience-info">
              <span className="experience-level" style={{ color: experienceLevel.color }}>
                {experienceLevel.level}
              </span>
              <span className="experience-count">
                {userStats?.totalFish || 0} peixes pescados
              </span>
            </div>
            {experienceLevel.level !== 'Mestre' && (
              <div className="experience-next-level">
                Próximo nível: {experienceLevel.level === 'Iniciante' ? 10 : experienceLevel.level === 'Intermediário' ? 50 : 100} peixes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="profile-tabs">
        {[
          { id: 'stats', label: 'Estatísticas', icon: TrendingUp },
          { id: 'catches', label: 'Capturas', icon: Fish },
          { id: 'achievements', label: 'Conquistas', icon: Award }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} className="tab-icon" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'stats' && (
        <div className="profile-content">
          <h3 className="content-title"><BarChart2 size={20} className="title-icon" /> Estatísticas</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-container fish-icon">
                <Fish size={32} className="stat-icon" />
              </div>
              <div className="stat-value">
                {userStats?.totalFish || 0}
              </div>
              <div className="stat-label">Total de Peixes</div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min((userStats?.totalFish || 0) / 100 * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-container trophy-icon">
                <Trophy size={32} className="stat-icon" />
              </div>
              <div className="stat-value">
                {userStats?.totalWeight?.toFixed(1) || '0.0'}kg
              </div>
              <div className="stat-label">Peso Total</div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min((userStats?.totalWeight || 0) / 100 * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-container target-icon">
                <Target size={32} className="stat-icon" />
              </div>
              <div className="stat-value">
                {userStats?.biggestFish?.weight?.toFixed(1) || '0.0'}kg
              </div>
              <div className="stat-label">Maior Peixe</div>
              {userStats?.biggestFish?.species && (
                <div className="stat-detail">{userStats.biggestFish.species}</div>
              )}
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min((userStats?.biggestFish?.weight || 0) / 20 * 100, 100)}%` }}></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-container calendar-icon">
                <Calendar size={32} className="stat-icon" />
              </div>
              <div className="stat-value">
                {userStats?.fishingDays || 0}
              </div>
              <div className="stat-label">Dias Pescando</div>
              <div className="stat-progress">
                <div className="stat-progress-bar" style={{ width: `${Math.min((userStats?.fishingDays || 0) / 30 * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
          
          <div className="additional-stats">
            <div className="additional-stat-item">
              <Compass size={20} className="additional-stat-icon" />
              <div className="additional-stat-content">
                <div className="additional-stat-label">Espécie Favorita</div>
                <div className="additional-stat-value">{userStats?.favoriteSpecies || 'Nenhuma'}</div>
              </div>
            </div>
            <div className="additional-stat-item">
              <Trophy size={20} className="additional-stat-icon" />
              <div className="additional-stat-content">
                <div className="additional-stat-label">Ranking Mensal</div>
                <div className="additional-stat-value">{userStats?.monthlyRanking || '-'}º lugar</div>
              </div>
            </div>
            <div className="additional-stat-item">
              <Heart size={20} className="additional-stat-icon" />
              <div className="additional-stat-content">
                <div className="additional-stat-label">Média por Captura</div>
                <div className="additional-stat-value">{userStats?.averageWeight?.toFixed(2) || '0.00'}kg</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catches' && (
        <div className="profile-content">
          <h3 className="content-title"><Fish size={20} className="title-icon" /> Capturas Recentes</h3>
          {recentCatches.length === 0 ? (
            <div className="empty-state">
              <Fish size={48} className="empty-icon" />
              <p className="empty-title">Nenhuma captura registrada ainda</p>
              <p className="empty-subtitle">Que tal registrar sua primeira captura?</p>
            </div>
          ) : (
            <div className="catches-grid">
              {recentCatches.map((capture, index) => {
                const fallbackKey = `capture-${index}-${capture.species || 'unknown'}-${capture.weight || 0}-${capture.registeredAt || capture.timestamp || Date.now()}`
                return (
                <div key={capture.id || fallbackKey} className="catch-card">
                  <div className="catch-header">
                    <h4 className="catch-species">{capture.species}</h4>
                    <span className="catch-date">
                      {formatDate(capture.registeredAt || capture.date)}
                    </span>
                  </div>
                  
                  <div className="catch-content">
                    {capture.photo ? (
                      <div className="catch-photo-container">
                        <img 
                          src={capture.photo} 
                          alt={capture.species}
                          className="catch-photo"
                          loading="lazy"
                        />
                        <div className="catch-weight-badge">{capture.weight}kg</div>
                      </div>
                    ) : (
                      <div className="catch-no-photo">
                        <Fish size={32} className="catch-no-photo-icon" />
                        <span className="no-photo-text">Sem foto</span>
                      </div>
                    )}
                    
                    <div className="catch-details">
                      <div className="catch-detail-item">
                        <MapPin size={16} className="catch-detail-icon" />
                        <span className="catch-location">{capture.location || 'Local não informado'}</span>
                      </div>
                      {capture.description ? (
                        <p className="catch-description">{capture.description}</p>
                      ) : (
                        <p className="catch-description catch-no-description">Sem descrição</p>
                      )}
                      <div className="catch-stats">
                        <div className="catch-stat">
                          <span className="catch-stat-label">Peso:</span>
                          <span className="catch-stat-value">{capture.weight}kg</span>
                        </div>
                        {capture.length && (
                          <div className="catch-stat">
                            <span className="catch-stat-label">Tamanho:</span>
                            <span className="catch-stat-value">{capture.length}cm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="profile-content">
          <h3 className="content-title"><Award size={20} className="title-icon" /> Conquistas</h3>
          <div className="achievements-summary">
            <div className="achievements-stats">
              <div className="achievement-stat">
                <span className="achievement-stat-value">{achievements.filter(a => a.unlocked).length}</span>
                <span className="achievement-stat-label">Desbloqueadas</span>
              </div>
              <div className="achievement-stat">
                <span className="achievement-stat-value">{achievements.length}</span>
                <span className="achievement-stat-label">Total</span>
              </div>
              <div className="achievement-stat">
                <span className="achievement-stat-value">
                  {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                </span>
                <span className="achievement-stat-label">Completado</span>
              </div>
            </div>
          </div>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-header">
                  <div className="achievement-icon-container">
                    <span className="achievement-icon">{achievement.icon}</span>
                    {achievement.unlocked && (
                      <div className="achievement-check">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                  <div className="achievement-info">
                    <h4 className="achievement-title">{achievement.title}</h4>
                    <p className="achievement-description">{achievement.description}</p>
                  </div>
                </div>
                {achievement.unlocked ? (
                  <div className="achievement-unlocked-status">
                    <CheckCircle size={14} className="unlocked-icon" />
                    Desbloqueado!
                  </div>
                ) : (
                  <div className="achievement-progress-container">
                    <div className="achievement-progress-text">
                      Progresso: {Math.round(achievement.progress * 100)}%
                    </div>
                    <div className="achievement-progress-bar">
                      <div 
                        className="achievement-progress-fill"
                        style={{ width: `${achievement.progress * 100}%` }}
                      />
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