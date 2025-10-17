import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Fish, Trophy, Users, TrendingUp, Calendar, Award, Wifi, WifiOff, Heart, MessageCircle, Share2, Camera, MapPin, Clock, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
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
    getFromLocalStorage, 
    saveToLocalStorage,
    syncLocalDataToFirestore,
    loadAllCatches,
    allCatches,
    // Campeonatos do usuário
    userTournaments,
    loadUserTournaments,
    // Posts da comunidade
    allPosts,
    loadPosts,
    likePost,
    addComment,
    sharePost
  } = useFishing()
  const [stats, setStats] = useState({
    totalFish: 0,
    totalWeight: 0,
    averageWeight: 0,
    biggestFish: null
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [recentCatches, setRecentCatches] = useState([])
  const [monthlyKing, setMonthlyKing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedPosts, setFeedPosts] = useState([])
  const [postInteractions, setPostInteractions] = useState({})
  const [showComments, setShowComments] = useState({})
  
  // Restaurar interações do localStorage na montagem
  useEffect(() => {
    try {
      const stored = getFromLocalStorage ? getFromLocalStorage('feed_post_interactions', {}) : JSON.parse(window.localStorage.getItem('feed_post_interactions') || '{}')
      if (stored && typeof stored === 'object') {
        setPostInteractions(stored)
      }
    } catch {}
  }, [getFromLocalStorage])

  // Persistir interações sempre que mudarem
  useEffect(() => {
    try {
      if (saveToLocalStorage) {
        saveToLocalStorage('feed_post_interactions', postInteractions)
      } else {
        window.localStorage.setItem('feed_post_interactions', JSON.stringify(postInteractions))
      }
    } catch {}
  }, [postInteractions, saveToLocalStorage])
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
    // Também carregar posts da comunidade para interações do backend
    loadPosts()
  }, [])

  // Atualizar posts do feed quando posts/capturas ou usuário mudarem
  useEffect(() => {
    loadFeedPosts()
  }, [allPosts, allCatches, user])

  // Sincronizar estado local de curtidas com backend e reconciliar delta
  useEffect(() => {
    try {
      if (Array.isArray(allPosts) && allPosts.length > 0) {
        setPostInteractions(prev => {
          const next = { ...prev }
          allPosts.forEach(p => {
            const pid = p.id
            const remoteLiked = Array.isArray(p.likes) ? p.likes.includes(user?.uid) : false
            const prevEntry = next[pid] || {}
            // Reconciliar comentários locais com os do backend
            const remoteComments = Array.isArray(p.comments)
              ? p.comments
              : Array.isArray(p.commentsList)
              ? p.commentsList
              : []
            const localComments = Array.isArray(prevEntry.commentsList) ? prevEntry.commentsList : []

            const remoteIds = new Set(remoteComments.map(c => c && c.id).filter(Boolean))
            let filteredLocal = localComments.filter(c => !remoteIds.has(c && c.id))

            // Deduplicação adicional por assinatura texto+timestamp
            const remoteSig = new Set(
              remoteComments.map(c => `${(c?.text || '').trim()}|${c?.createdAt || c?.timestamp || c?.date || ''}`)
            )
            filteredLocal = filteredLocal.filter(c => {
              const sig = `${(c?.text || '').trim()}|${c?.timestamp || c?.createdAt || c?.date || ''}`
              return !remoteSig.has(sig)
            })

            // Reflete sempre o estado remoto e zera o delta ao sincronizar
            next[pid] = {
              ...prevEntry,
              liked: remoteLiked,
              likes: 0,
              commentsList: filteredLocal
            }
          })
          return next
        })
      }
    } catch {}
  }, [allPosts, user])

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

  // Monitorar dados pendentes
  useEffect(() => {
    const updatePendingCount = () => {
      const pending = getFromLocalStorage('pending_catches', [])
      setPendingCount(pending.length)
    }
    
    // Atualizar inicialmente
    updatePendingCount()
    
    // Escutar mudanças no localStorage
    window.addEventListener('storage', updatePendingCount)
    
    // Verificar periodicamente
    const interval = setInterval(updatePendingCount, 2000)
    
    return () => {
      window.removeEventListener('storage', updatePendingCount)
      clearInterval(interval)
    }
  }, [getFromLocalStorage])

  // Carregar posts do feed social
  // Funções de interação com posts
  const handleLike = useCallback(async (postId) => {
    try {
      await likePost?.(postId)
    } catch {}
    setPostInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        liked: !prev[postId]?.liked,
        likes: prev[postId]?.liked 
          ? Math.max(0, (prev[postId]?.likes || 0) - 1) 
          : (prev[postId]?.likes || 0) + 1
      }
    }))
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
    let serverComment = null
    try {
      try {
        serverComment = await addComment?.(postId, commentText.trim())
      } catch {}
      setPostInteractions(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: (prev[postId]?.comments || 0) + 1,
          commentsList: [...(prev[postId]?.commentsList || []), {
            id: serverComment?.id || Date.now(),
            text: commentText.trim(),
            user: serverComment?.authorName || user?.displayName || 'Anônimo',
            timestamp: serverComment?.createdAt || new Date().toISOString()
          }]
        }
      }))
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }))
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }))
    }
  }, [newComment, user, addComment, commentSubmitting])

  const handleShare = useCallback(async (postId, postContent) => {
    try {
      try { await sharePost?.(postId) } catch {}
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
      setPostInteractions(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          shares: (prev[postId]?.shares || 0) + 1
        }
      }))
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
      // Obter capturas do localStorage como fallback
      const userCaptures = JSON.parse(localStorage.getItem('capturas') || '[]')
      const fishingCatches = JSON.parse(localStorage.getItem('fishing_catches') || '[]')
      
      // Combinar ambas as fontes de dados
      const allLocalCaptures = [...userCaptures, ...fishingCatches]
      
      // Filtrar capturas do usuário atual
      const myCaptures = allLocalCaptures.filter(capture => capture.userId === user?.uid)
      
      // Usar dados do FishingContext se disponível, senão usar localStorage
      const captures = userCatches.length > 0 ? userCatches : (myCaptures.length > 0 ? myCaptures : allLocalCaptures)
      
      // Calcular estatísticas do usuário
      const userStats = calculateUserStats()
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

      // Carregar capturas recentes do usuário (últimas 5)
       const userRecentCaptures = (userCatches.length > 0 ? userCatches : myCaptures).slice(-5).reverse()
       setRecentCatches(userRecentCaptures)

       // Obter Rei do Lago (top 1 do ranking geral)
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

        {/* Layout de duas colunas */}
        <div className="grid grid-3 gap-4">
          {/* Coluna da esquerda - Estatísticas e informações */}
          <div className="d-flex flex-column gap-4">

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

            {/* Status de Conectividade */}
            {(!isOnline || pendingCount > 0) && (
              <div className="card">
                <div className="d-flex align-center gap-3 mb-3">
                  {!isOnline ? (
                    <WifiOff size={20} className="text-error" />
                  ) : (
                    <Wifi size={20} className="text-success" />
                  )}
                  <h4 className={`font-semibold ${!isOnline ? 'text-error' : 'text-success'}`}>
                    {!isOnline ? 'Offline' : 'Online'}
                  </h4>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  {!isOnline ? (
                    <p>Suas capturas serão sincronizadas quando a conexão for restaurada.</p>
                  ) : (
                    <p>Todas as capturas estão sendo sincronizadas automaticamente.</p>
                  )}
                  {pendingCount > 0 && (
                    <p className="text-warning font-medium mt-2">
                      📋 {pendingCount} capturas aguardando sincronização
                    </p>
                  )}
                </div>
                
                {isOnline && pendingCount > 0 && (
                  <button 
                    onClick={() => syncLocalDataToFirestore()}
                    className="btn btn-sm btn-primary w-full"
                  >
                    🔄 Sincronizar Agora
                  </button>
                )}
              </div>
            )}
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
                   <div key={postKey} className="instagram-post">
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
                           className={`action-btn like-btn ${
                             postInteractions[post.id]?.liked ? 'liked' : ''
                           }`}
                         >
                           <Heart size={24} fill={postInteractions[post.id]?.liked ? 'currentColor' : 'none'} />
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
                             {(
                               (Array.isArray(post.commentsList) ? post.commentsList.length : 0)
                               + (postInteractions[post.id]?.commentsList?.length || 0)
                             )}
                           </span>
                         </button>
                         <button 
                           onClick={() => handleShare(post.id, post.content)}
                           className="action-btn share-btn"
                         >
                           <Share2 size={24} />
                         </button>
                       </div>
                     </div>

                     {/* Likes */}
                     <div className="likes-section">
                      <span className="likes-count">
                        {((post.likesCount || post.likes || 0) + (postInteractions[post.id]?.likes || 0))} curtidas
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
                          <div key={comment.id || `${post.id}-srv-${(comment.createdAt?.seconds || comment.timestamp?.seconds || comment.date || '')}-${(comment.authorName || comment.user || 'anon')}-${(comment.text || '').slice(0,16)}`}
                            className="comment-item">
                            <span className="comment-author">{comment.authorName || comment.user || 'Pescador'}</span>
                            <span className="comment-text">{comment.text}</span>
                          </div>
                        ))}
                        {/* Comentários locais (persistidos) */}
                        {postInteractions[post.id]?.commentsList?.map((comment) => (
                          <div key={comment.id} className="comment-item">
                            <span className="comment-author">{comment.user}</span>
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