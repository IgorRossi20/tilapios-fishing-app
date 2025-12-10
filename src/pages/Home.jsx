import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Fish, Trophy, Users, TrendingUp, Calendar, Award, Heart, MessageCircle, Share2, Camera, MapPin, Clock, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { useFishing } from '../contexts/FishingContext'
import './Home.css'
import { formatPostForUI, toDateSafe, formatTimeAgo } from '../utils/postFormat'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    userCatches,
    calculateUserStats,
    getGeneralRanking,
    isOnline,
    loadAllCatches,
    allCatches,
    // Campeonatos do usuário
    userTournaments,
    loadUserTournaments,
    // Posts da comunidade
    allPosts,
    likePost,
    addComment,
    sharePost,
    clearTempPostsAndCreateSamples,
    cleanDuplicateComments,
    cleanDuplicateLikes
  } = useFishing()
  const [stats, setStats] = useState({
    totalFish: 0,
    totalWeight: 0,
    averageWeight: 0,
    biggestFish: null
  })

  const [recentCatches, setRecentCatches] = useState([])
  const [monthlyKing, setMonthlyKing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedPosts, setFeedPosts] = useState([])

  const [showComments, setShowComments] = useState({})




  const [newComment, setNewComment] = useState({})
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState({})

  // Carregar dados do dashboard quando usuário/log de capturas mudar
  useEffect(() => {
    if (user) {
      loadDashboardData()
      // Carregar campeonatos do usuário apenas quando logar
      loadUserTournaments()
    }
  }, [user, userCatches])

  // Carregar todas as capturas apenas uma vez ao montar
  useEffect(() => {
    loadAllCatches()
    // Removido: carregar posts via fetch
    // O feed usa assinatura em tempo real pelo FishingContext (allPosts)
  }, [])

  // Atualizar posts do feed quando posts/capturas ou usuário mudarem
  useEffect(() => {
    loadFeedPosts()
  }, [allPosts, allCatches, user])




  // Memoizar stats calculados para evitar recálculos desnecessários
  const memoizedStats = useMemo(() => {
    if (!userCatches || userCatches.length === 0) {
      return {
        totalFish: 0,
        totalWeight: 0,
        averageWeight: 0,
        biggestFish: null
      }
    }
    return calculateUserStats(userCatches)
  }, [userCatches, calculateUserStats])

  // Memoizar posts do feed para evitar re-renderizações
  const memoizedFeedPosts = useMemo(() => feedPosts, [feedPosts])

  // Rolar e destacar post ao acessar com ?postId=...
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const targetId = params.get('postId')
    if (!targetId) return

    let observer

    const onFound = (el) => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('post-highlight')
      setTimeout(() => el.classList.remove('post-highlight'), 2000)
      // Remove o postId da URL para evitar re-aplicação ao voltar para a Home
      try {
        navigate({ pathname: location.pathname }, { replace: true })
      } catch { }
    }

    const tryScroll = () => {
      const el = document.getElementById(`post-${targetId}`)
      if (el) {
        onFound(el)
        return true
      }
      return false
    }

    // Tenta imediatamente; se ainda não existir, observa mutações no feed
    if (!tryScroll()) {
      const container = document.querySelector('.feed-container')
      if (container && 'MutationObserver' in window) {
        observer = new MutationObserver(() => {
          if (tryScroll() && observer) {
            observer.disconnect()
          }
        })
        observer.observe(container, { childList: true, subtree: true })
      } else {
        const id = setTimeout(() => { tryScroll() }, 400)
        return () => clearTimeout(id)
      }
    }

    return () => {
      if (observer) observer.disconnect()
    }
  }, [location.search, memoizedFeedPosts])

  // Carregar posts do feed social
  // Funções de interação com posts
  const handleLike = useCallback(async (postId) => {
    try {
      const isLiked = await likePost?.(postId)
      setFeedPosts(prev => prev.map(post => {
        if (post.id !== postId) return post
        const nextLiked = (typeof isLiked === 'boolean') ? isLiked : !post.isLiked
        const delta = nextLiked ? 1 : -1
        return {
          ...post,
          isLiked: nextLiked,
          likesCount: Math.max(0, (post.likesCount || 0) + delta)
        }
      }))
    } catch { }
  }, [likePost])

  const toggleComments = useCallback((postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }, [])

  const handleComment = useCallback(async (postId) => {
    const commentText = newComment[postId]
    if (!commentText || !commentText.trim()) return
    if (commentSubmitting[postId]) return
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }))
    try {
      const comment = await addComment?.(postId, commentText.trim())
      setFeedPosts(prev => prev.map(post => {
        if (post.id !== postId) return post
        return {
          ...post,
          commentsList: [...(post.commentsList || []), comment]
        }
      }))
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }))
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }))
    }
  }, [newComment, addComment, commentSubmitting])

  const handleShare = useCallback(async (postId, postContent) => {
    try {
      try { await sharePost?.(postId) } catch { }
      const title = 'Captura de Pesca'
      const text = postContent?.species && postContent?.weight && postContent?.location
        ? `Confira esta captura: ${postContent.species} de ${postContent.weight}kg em ${postContent.location}!`
        : 'Confira esta captura da comunidade!'
      const url = window.location.href

      if (navigator.share) {
        navigator.share({ title, text, url }).catch(() => {
          // Usuário cancelou; ainda assim não quebrar
        })
      } else {
        const shareText = `${text} ${url}`
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(shareText).then(() => {
            alert('Link copiado para a área de transferência!')
          }).catch(() => {
            // Sem clipboard; exibir prompt
            window.prompt('Copie o link de compartilhamento:', shareText)
          })
        } else {
          window.prompt('Copie o link de compartilhamento:', shareText)
        }
      }
    } finally {
      // no offline local increments in online-only mode
    }
  }, [sharePost])

  const loadFeedPosts = useCallback(async () => {
    try {
      // Preferir posts da comunidade (com suporte a interações no backend)
      const sourcePosts = Array.isArray(allPosts) && allPosts.length > 0 ? allPosts : []

      // toDateSafe agora importado de utils/postFormat

      const mapped = sourcePosts
        .slice(0, 30)
        .map(p => formatPostForUI(p, user))

      // Fallback: se não houver posts ainda, manter comportamento anterior com capturas
      if (mapped.length === 0) {
        let catchesToDisplay = allCatches || []
        const authenticatedCatches = catchesToDisplay.filter(catch_ =>
          catch_.userId && catch_.userId !== 'demo' && !catch_.id?.startsWith('demo_')
        )
        const postsFromCatches = authenticatedCatches
          .sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date))
          .slice(0, 20)
          .map((catch_, index) => ({
            id: catch_.id || `catch_${catch_.userId || 'unknown'}_${(() => { const d = new Date(catch_.registeredAt || catch_.date); return isNaN(d.getTime()) ? 0 : d.getTime() })()}`,
            type: 'catch',
            user: {
              name: catch_.userName || user?.displayName || user?.email || 'Pescador',
              avatar: catch_.userAvatar || user?.photoURL || catch_.userName?.charAt(0)?.toUpperCase() || 'P',
              level: 'Pescador'
            },
            content: {
              species: catch_.species,
              weight: catch_.weight,
              location: catch_.location,
              description: catch_.notes || `Capturei um(a) ${catch_.species} de ${catch_.weight}kg em ${catch_.location}! 🎣`,
              image: catch_.photo || null
            },
            timestamp: toDateSafe(catch_.registeredAt) || toDateSafe(catch_.date) || new Date(),
            createdAt: toDateSafe(catch_.registeredAt) || toDateSafe(catch_.date) || new Date(),
            likes: catch_.likes || 0,
            comments: catch_.comments || 0,
            shares: catch_.shares || 0,
            isLiked: false
          }))
        setFeedPosts(postsFromCatches)
      } else {
        setFeedPosts(mapped)
      }
    } catch (error) {
      setFeedPosts([])
    }
  }, [user, allPosts, allCatches])

  const loadDashboardData = async () => {
    try {
      // Modo somente online: usar exclusivamente dados do contexto
      const captures = Array.isArray(userCatches) ? userCatches : []

      // Calcular estatísticas do usuário a partir de dados remotos
      const userStats = calculateUserStats(captures)
      const totalFish = userStats.totalCatches || captures.length
      const totalWeight = userStats.totalWeight || captures.reduce((sum, capture) => sum + (capture.weight || 0), 0)

      // Contar campeonatos em que o usuário participa (inclui proprietário)
      const tournamentsCount = Array.isArray(userTournaments)
        ? userTournaments.filter(t => {
          const arr = Array.isArray(t.participants) ? t.participants : []
          const isParticipant = arr.some(p => (p?.userId || p?.id) === user?.uid)
          const isOwner = t.createdBy === user?.uid
          return isParticipant || isOwner
        }).length
        : 0

      // Obter ranking geral
      const generalRanking = await getGeneralRanking()
      const userPosition = generalRanking.findIndex(player => player.userId === user?.uid) + 1
      const finalPosition = userPosition > 0 ? userPosition : 1

      setStats({
        totalFish: totalFish,
        totalWeight: totalWeight,
        tournaments: tournamentsCount,
        ranking: finalPosition
      })

      // Últimas 5 capturas do usuário (remoto)
      const userRecentCaptures = captures.slice(-5).reverse()
      setRecentCatches(userRecentCaptures)

      // Rei do Lago (top 1 do ranking geral)
      if (generalRanking.length > 0 && generalRanking[0].totalWeight > 0) {
        const kingOfLake = {
          userId: generalRanking[0].userId,
          name: generalRanking[0].userName || 'Pescador',
          totalFish: generalRanking[0].totalCatches,
          totalWeight: generalRanking[0].totalWeight,
          biggestFish: generalRanking[0].biggestFish
        }
        setMonthlyKing(kingOfLake)
      } else {
        setMonthlyKing(null)
      }

    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header da página */}
        <div className="page-header">
          <h1 className="page-title">
            🎣 Bem-vindo, {user?.displayName}!
          </h1>
          <p className="page-subtitle">
            Acompanhe as últimas capturas da comunidade e compartilhe suas conquistas
          </p>
        </div>

        {/* Layout Responsivo: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="home-layout-grid">
          {/* Coluna da esquerda - Estatísticas e informações */}
          <div className="home-stats-column">

            {/* Estatísticas Principais */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Suas Estatísticas</h3>
              <div className="stats-container" style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-3)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div className="grid grid-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Fish size={24} className="text-primary mx-auto mb-2" />
                    <div className="text-xl font-bold text-primary">{stats.totalFish}</div>
                    <div className="text-xs text-gray-600">Peixes</div>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp size={24} className="text-secondary mx-auto mb-2" />
                    <div className="text-xl font-bold text-secondary">{stats.totalWeight}kg</div>
                    <div className="text-xs text-gray-600">Peso Total</div>
                  </div>

                  <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <Users size={24} className="text-primary-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-primary-600">{stats.tournaments}</div>
                    <div className="text-xs text-gray-600">Campeonatos</div>
                  </div>

                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <Trophy size={24} className="text-warning mx-auto mb-2" />
                    <div className="text-xl font-bold text-warning">#{stats.ranking}</div>
                    <div className="text-xs text-gray-600">Posição</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Coluna da direita - Feed Social */}
          <div className="d-flex flex-column gap-4" style={{ gridColumn: 'span 2' }}>
            {/* Header do Feed */}
            <div className="card">
              <div className="d-flex justify-between align-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 d-flex align-center gap-2">
                  📱 Feed da Comunidade
                </h3>
                <button
                  onClick={() => navigate('/catch')}
                  className="btn btn-sm d-flex align-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #1E88E5, #0D47A1)',
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(13, 71, 161, 0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                >
                  <Plus size={16} />
                  Nova Captura
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Acompanhe as últimas capturas e conquistas da comunidade de pescadores
              </div>
            </div>

            {/* Posts do Feed - Estilo Instagram */}
            <div className="feed-container">
              {feedPosts.length > 0 ? (
                feedPosts.map((post, index) => {
                  const postKey = post.id || `feed-post-${index}`
                  return (
                    <div key={postKey} id={post.id ? `post-${post.id}` : undefined} className="instagram-post">
                      {/* Header do Post - Estilo Instagram */}
                      <div className="post-header">
                        <div className="user-info">
                          <div className="user-avatar">
                            {post.user.avatar}
                          </div>
                          <div className="user-details">
                            <div className="username">{post.user.name}</div>
                            <div className="location">{post.content.location}</div>
                          </div>
                        </div>
                        <div className="post-options">
                          <div className="three-dots">•••</div>
                        </div>
                      </div>

                      {/* Imagem do Post */}
                      <div className="post-image">
                        {post.content.image ? (
                          <img src={post.content.image} alt="Captura" />
                        ) : (
                          <div className="placeholder-image">
                            <Fish size={48} />
                            <div className="catch-info">
                              <div className="species">{post.content.species}</div>
                              <div className="weight">{post.content.weight}kg</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ações do Post */}
                      <div className="post-actions">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`action-btn like-btn ${post.isLiked ? 'liked' : ''
                              }`}
                            disabled={!isOnline}
                          >
                            <Heart size={24} fill={post.isLiked ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="action-btn comment-btn"
                          >
                            <MessageCircle size={24} />
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 12,
                                color: '#666'
                              }}
                            >
                              {Array.isArray(post.commentsList) ? post.commentsList.length : 0}
                            </span>
                          </button>
                          <button
                            onClick={() => handleShare(post.id, post.content)}
                            disabled={!isOnline}
                            className="action-btn share-btn"
                          >
                            <Share2 size={24} />
                          </button>
                        </div>
                      </div>

                      {/* Likes */}
                      <div className="likes-section">
                        <span className="likes-count">
                          {(() => {
                            const base = (post.likesCount || post.likes || 0)
                            return `${base} curtidas`
                          })()}
                        </span>
                      </div>

                      {/* Caption */}
                      <div className="caption-section">
                        <span className="username">{post.user.name}</span>
                        <span className="caption-text">{post.content.description}</span>
                      </div>

                      {/* Timestamp */}
                      <div className="timestamp">
                        {formatTimeAgo(post.createdAt || post.timestamp)}
                      </div>

                      {/* Comentários */}
                      {showComments[post.id] && (
                        <div className="comments-section">
                          {/* Comentários do backend */}
                          {Array.isArray(post.commentsList) && post.commentsList.map((comment) => (
                            <div key={comment.id || `${post.id}-srv-${(comment.createdAt?.seconds || comment.timestamp?.seconds || comment.date || '')}-${(comment.authorName || comment.user || 'anon')}-${(comment.text || '').slice(0, 16)}`}
                              className="comment-item">
                              <span className="comment-author">{comment.authorName || comment.user || 'Pescador'}</span>
                              <span className="comment-text">{comment.text}</span>
                            </div>
                          ))}


                          {/* Campo para novo comentário */}
                          <div className="comment-input-container">
                            <input
                              type="text"
                              placeholder="Adicione um comentário..."
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))}
                              className="comment-input"
                              disabled={!!commentSubmitting[post.id]}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !commentSubmitting[post.id]) {
                                  handleComment(post.id)
                                }
                              }}
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={!!commentSubmitting[post.id] || !newComment[post.id]?.trim()}
                              className="comment-submit"
                            >
                              {commentSubmitting[post.id] ? 'Publicando...' : 'Publicar'}
                            </button>
                          </div>
                        </div>
                      )}




                    </div>
                  )
                })
              ) : (
                <div className="card text-center p-8">
                  <div className="text-gray-400 mb-4">
                    <Fish size={48} className="mx-auto" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma captura ainda</h4>
                  <p className="text-gray-600 mb-4">Seja o primeiro a compartilhar uma captura com a comunidade!</p>
                  <button
                    onClick={() => navigate('/catch')}
                    className="btn btn-primary"
                  >
                    Registrar Primeira Captura
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção inferior - Capturas recentes (opcional) */}
        <div className="mt-8">
          <div className="grid grid-2">
            {/* Rei do Lago */}
            <div className="card">
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <Award size={24} className="text-warning" style={{ marginRight: '10px', color: '#FF9800' }} />
                👑 Rei do Lago
              </h2>

              <div style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-3)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {monthlyKing ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 15px auto'
                    }}>
                      <Trophy size={40} style={{ color: 'white' }} />
                    </div>
                    <h3 style={{ color: '#FF9800', marginBottom: '10px' }}>{monthlyKing.name}</h3>
                    <p style={{ color: '#666', margin: '5px 0' }}>
                      <strong>{monthlyKing.totalFish}</strong> peixes capturados
                    </p>
                    <p style={{ color: '#666', margin: '5px 0' }}>
                      <strong>{monthlyKing.totalWeight.toFixed(1)}kg</strong> peso total
                    </p>
                    {monthlyKing.biggestFish && monthlyKing.biggestFish.weight > 0 && (
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        🐟 Maior peixe: <strong>{monthlyKing.biggestFish.weight.toFixed(1)}kg</strong>
                      </p>
                    )}
                    <div style={{
                      marginTop: '15px',
                      padding: '8px 12px',
                      background: '#FFF3E0',
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: '#FF9800',
                      fontWeight: 'bold'
                    }}>
                      🏆 TOP 1 DO RANKING GERAL
                    </div>
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#666' }}>Nenhum rei coroado ainda!</p>
                )}
              </div>
            </div>

            {/* Capturas Recentes */}
            <div className="card">
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <Calendar size={24} className="text-primary" style={{ marginRight: '10px' }} />
                Capturas Recentes
              </h2>

              <div style={{
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-3)',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {recentCatches.length > 0 ? (
                  <div>
                    {recentCatches.map((catch_, index) => {
                      const uniqueKey = catch_.id || `recent-catch-${index}-${catch_.species || 'unknown'}-${catch_.weight || 0}-${catch_.registeredAt || catch_.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                      return (
                        <div key={uniqueKey} style={{
                          padding: '15px',
                          border: '1px solid #eee',
                          borderRadius: '8px',
                          marginBottom: '10px',
                          background: '#f9f9f9'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{catch_.species}</h4>
                              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                                {catch_.location} • {(() => {
                                  const dateValue = catch_.registeredAt || catch_.date || catch_.timestamp || new Date().toISOString()
                                  try {
                                    const date = new Date(dateValue)
                                    return isNaN(date.getTime()) ? 'Data não disponível' : date.toLocaleDateString('pt-BR')
                                  } catch (error) {
                                    return 'Data não disponível'
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="badge badge-success">
                              {catch_.weight}kg
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate('/profile')}>
                      Ver Todas as Capturas
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Fish size={48} style={{ color: '#ddd', marginBottom: '15px' }} />
                    <p style={{ color: '#666', marginBottom: '20px' }}>Nenhuma captura registrada ainda.</p>
                    <button className="btn" onClick={() => navigate('/catch')}>
                      Registrar Primeira Captura
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

export default Home