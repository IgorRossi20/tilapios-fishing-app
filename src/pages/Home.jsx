import React, { useState, useEffect } from 'react'
import { Fish, Trophy, Users, TrendingUp, Calendar, Award, Wifi, WifiOff, Heart, MessageCircle, Share2, Camera, MapPin, Clock, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useFishing } from '../contexts/FishingContext'
import './Home.css'

const Home = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { userCatches, calculateUserStats, getGeneralRanking, isOnline, getFromLocalStorage, syncLocalDataToFirestore } = useFishing()
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
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    if (user) {
      loadDashboardData()
      loadFeedPosts()
    }
  }, [user, userCatches])

  // Monitorar dados pendentes
  useEffect(() => {
    const updatePendingCount = () => {
      const pending = getFromLocalStorage('pending_catches', [])
      setPendingCount(pending.length)
      console.log('📊 [HOME] Dados pendentes atualizados:', pending.length)
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
  const loadFeedPosts = async () => {
    try {
      // Converter capturas em posts sociais
      const allCatches = JSON.parse(localStorage.getItem('fishing_catches') || '[]')
      
      const posts = allCatches
        .sort((a, b) => new Date(b.registeredAt || b.date) - new Date(a.registeredAt || a.date))
        .slice(0, 10)
        .map((catch_, index) => ({
          id: catch_.id || `catch_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'catch',
          user: {
            name: catch_.userName || 'Pescador Anônimo',
            avatar: catch_.userName?.charAt(0)?.toUpperCase() || 'P',
            level: 'Pescador'
          },
          content: {
            species: catch_.species,
            weight: catch_.weight,
            location: catch_.location,
            description: `Capturei um(a) ${catch_.species} de ${catch_.weight}kg em ${catch_.location}! 🎣`,
            image: catch_.photo || null
          },
          timestamp: catch_.registeredAt || catch_.date,
          likes: Math.floor(Math.random() * 20) + 1,
          comments: Math.floor(Math.random() * 8),
          shares: Math.floor(Math.random() * 5)
        }))
      
      setFeedPosts(posts)
    } catch (error) {
      console.error('Erro ao carregar feed:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Carregando dados do dashboard...')
      console.log('👤 Usuário:', user?.uid)
      console.log('🎣 UserCatches do context:', userCatches)
      
      // Obter capturas do localStorage como fallback
      const userCaptures = JSON.parse(localStorage.getItem('capturas') || '[]')
      const fishingCatches = JSON.parse(localStorage.getItem('fishing_catches') || '[]')
      console.log('💾 userCaptures do localStorage (capturas):', userCaptures)
      console.log('💾 fishingCatches do localStorage (fishing_catches):', fishingCatches)
      
      // Combinar ambas as fontes de dados
      const allLocalCaptures = [...userCaptures, ...fishingCatches]
      console.log('💾 Todas as capturas locais combinadas:', allLocalCaptures)
      
      // Filtrar capturas do usuário atual
      const myCaptures = allLocalCaptures.filter(capture => capture.userId === user?.uid)
      console.log('🎣 Minhas capturas filtradas:', myCaptures)
      
      // Usar dados do FishingContext se disponível, senão usar localStorage
      const captures = userCatches.length > 0 ? userCatches : (myCaptures.length > 0 ? myCaptures : allLocalCaptures)
      console.log('📊 Capturas finais para cálculo:', captures)
      
      // Calcular estatísticas do usuário
      const userStats = calculateUserStats()
      console.log('📈 Stats do usuário:', userStats)
      
      const totalFish = userStats.totalCatches || captures.length
      const totalWeight = userStats.totalWeight || captures.reduce((sum, capture) => sum + (capture.weight || 0), 0)
      
      console.log('🐟 Total de peixes:', totalFish)
      console.log('⚖️ Peso total:', totalWeight)
      
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
         console.log('🏆 Rei do Lago encontrado:', kingOfLake)
         setMonthlyKing(kingOfLake)
       } else {
         console.log('❌ Nenhum Rei do Lago encontrado')
         setMonthlyKing(null)
       }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Users size={24} className="text-purple-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-600">{stats.tournaments}</div>
                  <div className="text-xs text-gray-600">Campeonatos</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <Trophy size={24} className="text-warning mx-auto mb-2" />
                  <div className="text-xl font-bold text-warning">#{stats.ranking}</div>
                  <div className="text-xs text-gray-600">Posição</div>
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
                   className="btn btn-primary btn-sm d-flex align-center gap-2"
                 >
                   <Plus size={16} />
                   Nova Captura
                 </button>
               </div>
               
               <div className="text-sm text-gray-600">
                 Acompanhe as últimas capturas e conquistas da comunidade de pescadores
               </div>
             </div>

             {/* Posts do Feed */}
             <div className="d-flex flex-column gap-4">
               {feedPosts.length > 0 ? (
                 feedPosts.map(post => (
                   <div key={post.id} className="card hover:shadow-lg transition-all">
                     {/* Header do Post */}
                     <div className="d-flex align-center gap-3 mb-4">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 d-flex align-center justify-center text-white font-bold text-lg">
                         {post.user.avatar}
                       </div>
                       <div className="flex-1">
                         <div className="font-semibold text-gray-900">{post.user.name}</div>
                         <div className="text-sm text-gray-500 d-flex align-center gap-2">
                           <Clock size={12} />
                           {new Date(post.timestamp).toLocaleDateString('pt-BR', {
                             day: '2-digit',
                             month: 'short',
                             hour: '2-digit',
                             minute: '2-digit'
                           })}
                         </div>
                       </div>
                       <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                         {post.user.level}
                       </div>
                     </div>

                     {/* Conteúdo do Post */}
                     <div className="mb-4">
                       <p className="text-gray-800 mb-3">{post.content.description}</p>
                       
                       {/* Informações da Captura */}
                       <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                         <div className="grid grid-3 gap-4 text-sm">
                           <div className="d-flex align-center gap-2">
                             <Fish size={16} className="text-blue-600" />
                             <div>
                               <div className="font-semibold text-gray-900">{post.content.species}</div>
                               <div className="text-xs text-gray-600">Espécie</div>
                             </div>
                           </div>
                           
                           <div className="d-flex align-center gap-2">
                             <Trophy size={16} className="text-green-600" />
                             <div>
                               <div className="font-semibold text-gray-900">{post.content.weight}kg</div>
                               <div className="text-xs text-gray-600">Peso</div>
                             </div>
                           </div>
                           
                           <div className="d-flex align-center gap-2">
                             <MapPin size={16} className="text-red-600" />
                             <div>
                               <div className="font-semibold text-gray-900">{post.content.location}</div>
                               <div className="text-xs text-gray-600">Local</div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Ações do Post */}
                     <div className="d-flex justify-between align-center pt-3 border-t border-gray-200">
                       <div className="d-flex gap-6">
                         <button className="d-flex align-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                           <Heart size={16} />
                           <span className="text-sm">{post.likes}</span>
                         </button>
                         
                         <button className="d-flex align-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                           <MessageCircle size={16} />
                           <span className="text-sm">{post.comments}</span>
                         </button>
                         
                         <button className="d-flex align-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                           <Share2 size={16} />
                           <span className="text-sm">{post.shares}</span>
                         </button>
                       </div>
                       
                       <div className="text-xs text-gray-500">
                         🎣 Captura registrada
                       </div>
                     </div>
                   </div>
                 ))
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

        {/* Capturas Recentes */}
        <div className="card">
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            <Calendar size={24} className="text-primary" style={{ marginRight: '10px' }} />
            Capturas Recentes
          </h2>
          
          {recentCatches.length > 0 ? (
            <div>
              {recentCatches.map((catch_, index) => {
                const fallbackKey = `unique-${index}-${catch_.species || 'unknown'}-${catch_.weight || 0}-${catch_.registeredAt || catch_.timestamp || Date.now()}`
                return (
                <div key={`recent-catch-${catch_.id || fallbackKey}`} style={{ 
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
                        {catch_.location} • {new Date(catch_.date || catch_.timestamp).toLocaleDateString('pt-BR')}
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
              <button className="btn" onClick={() => navigate('/capture')}>
                Registrar Primeira Captura
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="card mt-3">
        <h2 style={{ marginBottom: '20px' }}>Ações Rápidas</h2>
        <div className="grid grid-3">
          <button className="btn" style={{ padding: '20px', height: 'auto' }} onClick={() => navigate('/capture')}>
            <Fish size={24} style={{ marginBottom: '10px' }} />
            <br />Registrar Captura
          </button>
          <button className="btn btn-secondary" style={{ padding: '20px', height: 'auto' }}>
            <Users size={24} style={{ marginBottom: '10px' }} />
            <br />Criar Campeonato
          </button>
          <button className="btn" style={{ padding: '20px', height: 'auto', background: '#FF9800' }}>
            <Trophy size={24} style={{ marginBottom: '10px' }} />
            <br />Ver Ranking
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home