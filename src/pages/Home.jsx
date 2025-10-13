import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Fish, Trophy, Users, TrendingUp, Calendar, Award, Wifi, WifiOff, Heart, MessageCircle, Share2, Camera, MapPin, Clock, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useFishing } from '../contexts/FishingContext'
import './Home.css'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { 
    userCatches, 
    calculateUserStats, 
    getGeneralRanking, 
    isOnline, 
    getFromLocalStorage, 
    syncLocalDataToFirestore,
    loadAllCatches, // Importar a nova função
    allCatches // Importar o novo estado
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
  const [newComment, setNewComment] = useState({})
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
    // Carregar feed sempre, independente do usuário
    loadAllCatches() // Chamar a nova função para carregar todas as capturas
    loadFeedPosts()
  }, [user, userCatches, loadAllCatches]) // Adicionar loadAllCatches às dependências

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
  const handleLike = useCallback((postId) => {
    setPostInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        liked: !prev[postId]?.liked,
        likes: prev[postId]?.liked 
          ? (prev[postId]?.likes || 0) - 1 
          : (prev[postId]?.likes || 0) + 1
      }
    }))
  }, [])

  const toggleComments = useCallback((postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }, [])

  const handleComment = useCallback((postId) => {
    const commentText = newComment[postId]
    if (commentText && commentText.trim()) {
      setPostInteractions(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: (prev[postId]?.comments || 0) + 1,
          commentsList: [...(prev[postId]?.commentsList || []), {
            id: Date.now(),
            text: commentText.trim(),
            user: user?.displayName || 'Anônimo',
            timestamp: new Date().toISOString()
          }]
        }
      }))
      
      // Limpar campo de comentário
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }))
    }
  }, [newComment, user])

  const handleShare = useCallback((postId, postContent) => {
    if (navigator.share) {
      navigator.share({
        title: 'Captura de Pesca',
        text: `Confira esta captura: ${postContent.species} de ${postContent.weight}kg em ${postContent.location}!`,
        url: window.location.href
      })
    } else {
      // Fallback para navegadores que não suportam Web Share API
      const shareText = `Confira esta captura: ${postContent.species} de ${postContent.weight}kg em ${postContent.location}! ${window.location.href}`
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Link copiado para a área de transferência!')
      })
    }
    
    setPostInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        shares: (prev[postId]?.shares || 0) + 1
      }
    }))
  }, [])

  const loadFeedPosts = useCallback(async () => {
    try {
      // Usar allCatches em vez de localStorage
      let catchesToDisplay = allCatches || []
      
      // Limpar dados antigos com IDs problemáticos (se necessário, mas idealmente isso deve ser feito na fonte)
      catchesToDisplay = catchesToDisplay.filter(catch_ => {
        if (catch_.id && catch_.id.includes('temp_')) {
          return false
        }
        return true
      })
      
      // Filtrar apenas capturas que têm userId (usuários autenticados)
      const authenticatedCatches = catchesToDisplay.filter(catch_ => 
        catch_.userId && 
        catch_.userId !== 'demo' && 
        !catch_.id?.startsWith('demo_')
      )
      
      const posts = authenticatedCatches
        .sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date))
        .slice(0, 20) // Aumentar o limite para mais posts
        .map((catch_, index) => ({
          id: catch_.id || `catch_${catch_.userId || 'unknown'}_${catch_.registeredAt || catch_.date || Date.now()}_${index}_${Math.random().toString(36).substring(2, 12)}`,
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
          timestamp: catch_.registeredAt || catch_.date,
          likes: catch_.likes || 0,
          comments: catch_.comments || 0,
          shares: catch_.shares || 0,
          isLiked: false
        }))
      
      setFeedPosts(posts)
    } catch (error) {
      setFeedPosts([])
    }
  }, [user, allCatches])

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
      
      // Obter ranking geral
      const generalRanking = await getGeneralRanking()
      const userPosition = generalRanking.findIndex(player => player.userId === user?.uid) + 1
      
      setStats({
        totalFish: totalFish,
        totalWeight: totalWeight,
        tournaments: 0, // Implementar depois
        ranking: userPosition || 1
      })

      // Carregar capturas recentes do usuário (últimas 5)
       const userRecentCaptures = myCaptures.slice(-5).reverse()
       console.log('📅 Capturas recentes do usuário:', userRecentCaptures)
       setRecentCatches(userRecentCaptures)

       // Obter Rei do Lago (top 1 do ranking geral)
       console.log('👑 Obtendo Rei do Lago do ranking geral...')
       
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
                   const postKey = post.id || `feed-post-${index}-${post.timestamp || post.content?.species || Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
                         </button>
                         <button 
                           onClick={() => handleShare(post.id)}
                           className="action-btn share-btn"
                         >
                           <Share2 size={24} />
                         </button>
                       </div>
                     </div>

                     {/* Likes */}
                     <div className="likes-section">
                       <span className="likes-count">
                         {(post.likes || 0) + (postInteractions[post.id]?.likes || 0)} curtidas
                       </span>
                     </div>

                     {/* Caption */}
                     <div className="caption-section">
                       <span className="username">{post.user.name}</span>
                       <span className="caption-text">{post.content.description}</span>
                     </div>

                     {/* Timestamp */}
                     <div className="timestamp">
                       {(() => {
                         try {
                           if (!post.timestamp) {
                             return 'Data não disponível'
                           }
                           
                           const date = new Date(post.timestamp)
                           
                           if (isNaN(date.getTime())) {
                             return 'Data não disponível'
                           }
                           
                           return date.toLocaleDateString('pt-BR', {
                             day: '2-digit',
                             month: 'short'
                           }).toUpperCase()
                         } catch (error) {
                           console.error('Erro ao formatar timestamp:', error)
                           return 'Data não disponível'
                         }
                       })()}
                     </div>

                     {/* Comentários */}
                     {showComments[post.id] && (
                       <div className="comments-section">
                         {/* Lista de comentários */}
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
                             onKeyPress={(e) => {
                               if (e.key === 'Enter') {
                                 handleComment(post.id)
                               }
                             }}
                           />
                           <button
                             onClick={() => handleComment(post.id)}
                             disabled={!newComment[post.id]?.trim()}
                             className="comment-submit"
                           >
                             Publicar
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