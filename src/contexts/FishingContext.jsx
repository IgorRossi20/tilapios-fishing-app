import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, orderBy } from 'firebase/firestore'
import { db } from './FirebaseContext'
import { useAuth } from './AuthContext'

const FishingContext = createContext()

const useFishing = () => {
  const context = useContext(FishingContext)
  if (!context) {
    throw new Error('useFishing deve ser usado dentro de um FishingProvider')
  }
  return context
}

const FishingProvider = ({ children }) => {
  const { user } = useAuth()
  const [userTournaments, setUserTournaments] = useState([])
  const [allTournaments, setAllTournaments] = useState([])
  const [userCatches, setUserCatches] = useState([])
  const [allCatches, setAllCatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle', 'syncing', 'error'

  // Detectar mudanças na conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (user) {
        syncLocalDataToFirestore()
      }
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [user])

  // Configurar sincronização periódica para evitar ERR_ABORTED
   useEffect(() => {
    if (!user) {
      // Limpar dados quando não há usuário
      setUserTournaments([])
      setUserCatches([])
      return
    }

    console.log('🔄 Usuário autenticado, carregando dados:', user.uid)

    // Função para carregar dados do cache local
    const loadFromCache = () => {
      const tournaments = getFromLocalStorage(`user_tournaments_${user.uid}`, [])
      const catches = getFromLocalStorage(`user_catches_${user.uid}`, [])
      
      if (tournaments.length > 0) {
        setUserTournaments(tournaments)
        console.log('📦 Torneios carregados do cache:', tournaments.length)
      }
      
      if (catches.length > 0) {
        setUserCatches(catches)
        console.log('📦 Capturas carregadas do cache:', catches.length)
      }
      
      return { tournaments, catches }
    }

      const syncUserData = async () => {
        // Verificar se o usuário ainda está autenticado
        if (!user || !user.uid) {
          console.log('❌ Usuário não autenticado, cancelando sincronização')
          return
        }
        
        console.log('🔄 [SYNC] Iniciando sincronização para usuário:', user.uid)
        console.log('🔄 [SYNC] Status online:', isOnline)
        console.log('🔄 [SYNC] Timestamp:', new Date().toISOString())
        
        // Primeiro, carregar do cache para resposta imediata
        const cached = loadFromCache()
        
        // Se há dados no cache, usar eles e tentar sincronizar em background
        if (cached.tournaments.length > 0 || cached.catches.length > 0) {
          console.log('📦 Usando dados do cache, sincronização em background')
          // Sincronização em background (sem bloquear a UI)
          setTimeout(async () => {
            try {
              console.log('🔄 Sincronização em background iniciada')
              // Tentar sincronizar apenas se online e autenticado
              if (navigator.onLine && user && user.uid) {
                await syncWithFirestore()
              }
            } catch (error) {
              console.warn('⚠️ Sincronização em background falhou:', error.message)
            }
          }, 2000)
        } else {
          // Se não há cache, tentar sincronizar imediatamente
          console.log('🔄 Sem cache, tentando sincronização imediata')
          try {
            await syncWithFirestore()
          } catch (error) {
            console.warn('⚠️ Sincronização falhou, mantendo dados vazios:', error.message)
          }
        }
      }

      // Função auxiliar para sincronizar com Firestore
      const syncWithFirestore = async () => {
        // Verificar novamente se o usuário está autenticado
        if (!user || !user.uid) {
          console.log('❌ Usuário não autenticado, cancelando sincronização com Firestore')
          return
        }
        
        try {
          console.log('🔄 [FIRESTORE] Iniciando sincronização com Firestore...')
          console.log('🔄 [FIRESTORE] UID do usuário:', user.uid)
          console.log('🔄 [FIRESTORE] Database instance:', !!db)
          
          // Sincronizar torneios do usuário
          console.log('🔄 [FIRESTORE] Buscando torneios do usuário...')
          const tournamentsQuery = query(
            collection(db, 'fishing_tournaments'),
            where('participants', 'array-contains', user.uid)
          )
          const tournamentsSnapshot = await getDocs(tournamentsQuery)
          const tournaments = []
          tournamentsSnapshot.forEach((doc) => {
            tournaments.push({ id: doc.id, ...doc.data() })
          })
          setUserTournaments(tournaments)
          saveToLocalStorage(`user_tournaments_${user.uid}`, tournaments)
          console.log('✅ [FIRESTORE] Torneios sincronizados:', tournaments.length)

          // Sincronizar capturas do usuário
          console.log('🔄 [FIRESTORE] Buscando capturas do usuário...')
          const catchesQuery = query(
            collection(db, 'fishing_catches'),
            where('userId', '==', user.uid)
          )
          const catchesSnapshot = await getDocs(catchesQuery)
          const catches = []
          catchesSnapshot.forEach((doc) => {
            catches.push({ id: doc.id, ...doc.data() })
          })
          setUserCatches(catches)
          saveToLocalStorage(`user_catches_${user.uid}`, catches)
          console.log('✅ [FIRESTORE] Capturas sincronizadas:', catches.length)
          
          console.log('✅ [FIRESTORE] Sincronização com Firestore completa')
        } catch (error) {
          console.warn('⚠️ Erro na sincronização com Firestore:', error.message)
          throw error
        }
      }

     // Sincronização inicial (apenas se usuário autenticado)
     if (user && user.uid) {
       syncUserData()
     }

     // Sincronização periódica a cada 30 segundos (apenas se usuário autenticado)
     const syncInterval = setInterval(() => {
       if (user && user.uid) {
         syncUserData()
       }
     }, 30000)

     // Cleanup
     return () => {
       clearInterval(syncInterval)
     }
   }, [user])

   // Configurar sincronização global periódica para todos os torneios e capturas
   useEffect(() => {
     // Função para sincronizar dados globais
      const syncGlobalData = async () => {
         try {
           // Primeiro carregar do cache para resposta imediata
           const cachedTournaments = getFromLocalStorage('all_tournaments', [])
           const cachedCatches = getFromLocalStorage('all_catches', [])
           
           if (cachedTournaments.length > 0 || cachedCatches.length > 0) {
             setAllTournaments(cachedTournaments)
             setAllCatches(cachedCatches)
             console.log('📱 Dados carregados do cache primeiro:', { tournaments: cachedTournaments.length, catches: cachedCatches.length })
           }
           
           // Sincronizar com Firestore online
           console.log('🔄 Sincronizando dados globais online...')
           
           // Sincronizar todos os torneios
           const allTournamentsSnapshot = await getDocs(collection(db, 'fishing_tournaments'))
           const tournaments = []
           allTournamentsSnapshot.forEach((doc) => {
             tournaments.push({ id: doc.id, ...doc.data() })
           })
           setAllTournaments(tournaments)
           saveToLocalStorage('all_tournaments', tournaments)

           // Sincronizar todas as capturas
           const allCatchesSnapshot = await getDocs(collection(db, 'fishing_catches'))
           const catches = []
           allCatchesSnapshot.forEach((doc) => {
             catches.push({ id: doc.id, ...doc.data() })
           })
           setAllCatches(catches)
           saveToLocalStorage('all_catches', catches)
           
           console.log('🌐 Dados globais sincronizados online:', { tournaments: tournaments.length, catches: catches.length })
         } catch (error) {
           console.log('⚠️ Erro na sincronização global (modo offline), usando cache:', error.message)
           const cachedTournaments = getFromLocalStorage('all_tournaments', [])
           const cachedCatches = getFromLocalStorage('all_catches', [])
           setAllTournaments(cachedTournaments)
           setAllCatches(cachedCatches)
         }
       }

     // Sincronização inicial
     syncGlobalData()

     // Sincronização periódica a cada 45 segundos (offset do usuário)
     const globalSyncInterval = setInterval(syncGlobalData, 45000)

     // Cleanup
     return () => {
       clearInterval(globalSyncInterval)
     }
   }, [])

  // Funções utilitárias para localStorage
  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error)
    }
  }

  const getFromLocalStorage = (key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error)
      return defaultValue
    }
  }

  // Sincronizar dados locais com Firestore
  const syncLocalDataToFirestore = async () => {
    console.log('🔄 [PENDING] Iniciando sincronização de dados pendentes...')
    console.log('🔄 [PENDING] Usuário:', !!user, user?.uid)
    console.log('🔄 [PENDING] Online:', isOnline)
    console.log('🔄 [PENDING] Timestamp:', new Date().toISOString())
    
    if (!user || !isOnline) {
      console.log('❌ [PENDING] Cancelando: usuário não autenticado ou offline')
      return
    }
    
    setSyncStatus('syncing')
    try {
      // Verificar e sincronizar capturas pendentes
      const pendingCatches = getFromLocalStorage('pending_catches', [])
      console.log('📋 [PENDING] Capturas pendentes encontradas:', pendingCatches.length)
      console.log('📋 [PENDING] Dados pendentes:', pendingCatches)
      
      if (pendingCatches.length === 0) {
        console.log('✅ [PENDING] Nenhuma captura pendente para sincronizar')
        setSyncStatus('idle')
        return
      }
      
      let syncedCount = 0
      let errorCount = 0
      
      for (const catchData of pendingCatches) {
        try {
          console.log('📤 [PENDING] Sincronizando captura:', catchData.id || 'sem ID')
          const docRef = await addDoc(collection(db, 'fishing_catches'), {
            ...catchData,
            userId: user.uid,
            userName: user.displayName || user.email,
            registeredAt: catchData.registeredAt || new Date().toISOString(),
            syncedAt: new Date().toISOString()
          })
          console.log('✅ [PENDING] Captura sincronizada com ID:', docRef.id)
          syncedCount++
        } catch (error) {
          console.error('❌ [PENDING] Erro ao sincronizar captura:', error)
          errorCount++
        }
      }
      
      // Sempre limpar dados pendentes, mesmo com erros
      console.log('🧹 [PENDING] Limpando capturas pendentes...')
      console.log('📊 [PENDING] Resultado: ', { sincronizadas: syncedCount, erros: errorCount })
      
      // Forçar limpeza
      localStorage.removeItem('pending_catches')
      saveToLocalStorage('pending_catches', [])
      
      // Recarregar dados atualizados
      await loadUserCatches()
      
      console.log('✅ [PENDING] Limpeza concluída - dados pendentes removidos')
      setSyncStatus('idle')
      
      // Forçar atualização da interface
      window.dispatchEvent(new Event('storage'))
      
    } catch (error) {
      console.error('❌ [PENDING] Erro crítico na sincronização:', error)
      // Mesmo com erro, tentar limpar dados pendentes
      localStorage.removeItem('pending_catches')
      saveToLocalStorage('pending_catches', [])
      setSyncStatus('error')
    }
  }

  // Carregar campeonatos do usuário
  const loadUserTournaments = async () => {
    if (!user || !user.uid) {
      setUserTournaments([])
      setLoading(false)
      return
    }
    
    try {
      // Tentar carregar do cache local primeiro
      const cacheKey = `user_tournaments_${user.uid}`
      const cachedTournaments = getFromLocalStorage(cacheKey, [])
      if (cachedTournaments.length > 0) {
        setUserTournaments(cachedTournaments)
      }

      // Só fazer consulta ao Firestore se estiver online e autenticado
      if (!isOnline) {
        setLoading(false)
        return
      }

      const q = query(
        collection(db, 'fishing_tournaments'),
        where('participants', 'array-contains', user.uid)
      )
      const querySnapshot = await getDocs(q)
      const tournaments = []
      querySnapshot.forEach((doc) => {
        tournaments.push({ id: doc.id, ...doc.data() })
      })
      setUserTournaments(tournaments)

      // Atualizar cache local
      saveToLocalStorage(cacheKey, tournaments)
      // Também manter compatibilidade com uma chave genérica, se existir em código legado
      saveToLocalStorage('fishing_tournaments', tournaments)
    } catch (error) {
      console.warn('Aviso ao carregar campeonatos (usando fallback local):', error)
      // Fallback para cache local
      const cacheKey = `user_tournaments_${user.uid}`
      const cachedTournaments = getFromLocalStorage(cacheKey, [])
      if (cachedTournaments.length > 0) {
        setUserTournaments(cachedTournaments)
      }
    } finally {
      setLoading(false)
    }
  }

  // Carregar capturas do usuário com cache local
  const loadUserCatches = async () => {
    if (!user || !user.uid) return
    
    try {
      // Tentar carregar do cache local primeiro
      const cachedCatches = getFromLocalStorage(`user_catches_${user.uid}`, [])
      if (cachedCatches.length > 0) {
        setUserCatches(cachedCatches)
      }
      
      // Se online, buscar dados atualizados do Firestore
      if (isOnline) {
        const q = query(
          collection(db, 'fishing_catches'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const catches = []
        querySnapshot.forEach((doc) => {
          catches.push({ id: doc.id, ...doc.data() })
        })
        
        // Atualizar estado e cache local
        setUserCatches(catches)
        saveToLocalStorage(`user_catches_${user.uid}`, catches)
        
        // Também salvar no formato antigo para compatibilidade
        saveToLocalStorage('fishing_catches', catches)
      }
    } catch (error) {
      console.warn('Aviso ao carregar capturas (usando fallback local):', error?.message || error)
      // Em caso de erro, usar dados do cache se disponíveis
      const cachedCatches = getFromLocalStorage(`user_catches_${user.uid}`, [])
      if (cachedCatches.length > 0) {
        setUserCatches(cachedCatches)
      }
    }
  }

  // Criar campeonato
  const createTournament = async (tournamentData) => {
    try {
      const docRef = await addDoc(collection(db, 'fishing_tournaments'), {
        ...tournamentData,
        createdBy: user.uid,
        participants: [user.uid],
        createdAt: new Date().toISOString(),
        status: 'active'
      })
      
      await loadUserTournaments()
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar campeonato:', error)
      throw error
    }
  }

  // Participar de campeonato
  const joinTournament = async (tournamentId) => {
    try {
      const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
      await updateDoc(tournamentRef, {
        participants: arrayUnion(user.uid)
      })
      
      await loadUserTournaments()
    } catch (error) {
      console.error('Erro ao participar do campeonato:', error)
      throw error
    }
  }

  // Registrar nova captura com suporte offline
  const registerCatch = async (catchData) => {
    console.log('🎣 Iniciando registro de captura...')
    console.log('👤 Usuário autenticado:', !!user, user?.uid)
    console.log('📊 Dados da captura:', catchData)
    
    if (!user) {
      console.error('❌ Usuário não autenticado!')
      throw new Error('Usuário não autenticado')
    }
    
    if (!user.uid) {
      console.error('❌ UID do usuário não encontrado!')
      throw new Error('UID do usuário não encontrado')
    }
    
    const newCatch = {
      ...catchData,
      userId: user.uid,
      userName: user.displayName || user.email,
      registeredAt: new Date().toISOString(),
      id: `temp_${Date.now()}_${user.uid.substring(0, 8)}_${Math.random().toString(36).substring(2, 9)}_${performance.now().toString(36).substring(2, 8)}`
    }
    
    console.log('📝 Dados estruturados para salvar:', newCatch)
    
    try {
      if (isOnline) {
        console.log('🌐 Online - salvando no Firestore...')
        // Se online, salvar diretamente no Firestore
        const docRef = await addDoc(collection(db, 'fishing_catches'), {
          ...newCatch,
          syncedAt: new Date().toISOString()
        })
        
        console.log('✅ Captura salva no Firestore com ID:', docRef.id)
        
        // Atualizar ID com o ID real do Firestore
        newCatch.id = docRef.id
        
        // Recarregar capturas após registro
        await loadUserCatches()
      } else {
        // Se offline, salvar na lista de pendentes
        const pendingCatches = getFromLocalStorage('pending_catches', [])
        pendingCatches.push(newCatch)
        saveToLocalStorage('pending_catches', pendingCatches)
        
        // Atualizar cache local do usuário
        const userCacheKey = `user_catches_${user.uid}`
        const currentCatches = getFromLocalStorage(userCacheKey, [])
        currentCatches.push({ ...newCatch, isPending: true })
        saveToLocalStorage(userCacheKey, currentCatches)
        
        // Atualizar estado local
        setUserCatches(prev => [...prev, { ...newCatch, isPending: true }])
        
        console.log('Captura salva offline. Será sincronizada quando a conexão for restaurada.')
      }
    } catch (error) {
      console.error('Erro ao registrar captura:', error)
      
      // Em caso de erro, tentar salvar offline
      const pendingCatches = getFromLocalStorage('pending_catches', [])
      pendingCatches.push(newCatch)
      saveToLocalStorage('pending_catches', pendingCatches)
      
      throw new Error('Captura salva offline devido a erro de conexão')
    }
  }

  // Calcular estatísticas do usuário
  const calculateUserStats = (tournamentId = null) => {
    let catches = userCatches
    
    if (tournamentId) {
      catches = userCatches.filter(c => c.tournamentId === tournamentId)
    }
    
    const totalCatches = catches.length
    const totalWeight = catches.reduce((sum, c) => sum + (c.weight || 0), 0)
    const averageWeight = totalCatches > 0 ? totalWeight / totalCatches : 0
    const biggestFish = catches.reduce((max, c) => 
      (c.weight || 0) > (max.weight || 0) ? c : max, { weight: 0 }
    )
    
    return {
      totalCatches,
      totalWeight,
      averageWeight,
      biggestFish
    }
  }

  // Obter ranking de um campeonato
  const getTournamentRanking = async (tournamentId, rankingType = 'weight') => {
    try {
      // Se usuário não autenticado, evitar consulta ao Firestore e usar cache
      if (!user) {
        const allLocalCatches = getFromLocalStorage('all_catches', [])
        const tournamentCatches = allLocalCatches.filter(c => c.tournamentId === tournamentId)
        return computeRankingFromCatches(tournamentCatches, rankingType)
      }
      
      const q = query(
        collection(db, 'fishing_catches'),
        where('tournamentId', '==', tournamentId)
      )
      const querySnapshot = await getDocs(q)
      const catches = []
      querySnapshot.forEach((doc) => {
        catches.push({ id: doc.id, ...doc.data() })
      })
      
      return computeRankingFromCatches(catches, rankingType)
    } catch (error) {
      console.warn('Aviso ao obter ranking do torneio (usando fallback local):', error?.message || error)
      
      // Em caso de erro, tentar usar dados locais como fallback
      try {
        const allLocalCatches = getFromLocalStorage('all_catches', [])
        const userLocalCatches = user ? getFromLocalStorage(`user_catches_${user.uid}`, []) : []
        const combinedCatches = [...allLocalCatches, ...userLocalCatches]
        const tournamentCatches = combinedCatches.filter(c => c.tournamentId === tournamentId)
        return computeRankingFromCatches(tournamentCatches, rankingType)
      } catch (localError) {
        console.warn('Aviso ao acessar dados locais para ranking do torneio:', localError?.message || localError)
      }
      
      return []
    }
  }

  // Obter ranking geral usando dados sincronizados em tempo real
  const getGeneralRanking = (rankingType = 'weight') => {
    // Usar dados sincronizados em tempo real para ranking instantâneo
    const catchesToUse = allCatches.length > 0 ? allCatches : getFromLocalStorage('all_catches', [])
    return computeRankingFromCatches(catchesToUse, rankingType)
  }

  // Funções para posts do feed
  const createPost = async (postData) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const newPost = {
      ...postData,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorAvatar: user.photoURL || '👤',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
      shares: 0
    }
    
    try {
      if (isOnline) {
        const docRef = await addDoc(collection(db, 'posts'), newPost)
        return { id: docRef.id, ...newPost }
      } else {
        // Salvar localmente se offline
        const tempId = `temp_post_${Date.now()}`
        const postWithId = { id: tempId, ...newPost, isTemp: true }
        const localPosts = getFromLocalStorage('local_posts', [])
        localPosts.unshift(postWithId)
        saveToLocalStorage('local_posts', localPosts)
        return postWithId
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
      throw error
    }
  }
  
  const loadPosts = async () => {
    try {
      // Carregar posts locais primeiro
      const localPosts = getFromLocalStorage('local_posts', [])
      
      if (isOnline) {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(postsQuery)
        const posts = []
        snapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() })
        })
        
        // Combinar com posts locais não sincronizados
        const tempPosts = localPosts.filter(post => post.isTemp)
        return [...tempPosts, ...posts]
      } else {
        return localPosts
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
      return getFromLocalStorage('local_posts', [])
    }
  }
  
  const likePost = async (postId) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      if (isOnline) {
        const postRef = doc(db, 'posts', postId)
        const postDoc = await getDoc(postRef)
        
        if (postDoc.exists()) {
          const postData = postDoc.data()
          const likes = postData.likes || []
          const userLiked = likes.includes(user.uid)
          
          if (userLiked) {
            // Remover curtida
            await updateDoc(postRef, {
              likes: likes.filter(uid => uid !== user.uid)
            })
          } else {
            // Adicionar curtida
            await updateDoc(postRef, {
              likes: arrayUnion(user.uid)
            })
          }
          
          return !userLiked
        }
      }
    } catch (error) {
      console.error('Erro ao curtir post:', error)
      throw error
    }
  }
  
  const addComment = async (postId, commentText) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const comment = {
      id: `comment_${Date.now()}`,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorAvatar: user.photoURL || '👤',
      text: commentText,
      createdAt: new Date().toISOString()
    }
    
    try {
      if (isOnline) {
        const postRef = doc(db, 'posts', postId)
        await updateDoc(postRef, {
          comments: arrayUnion(comment)
        })
      }
      return comment
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      throw error
    }
  }
  
  const sharePost = async (postId) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      if (isOnline) {
        const postRef = doc(db, 'posts', postId)
        const postDoc = await getDoc(postRef)
        
        if (postDoc.exists()) {
          const postData = postDoc.data()
          await updateDoc(postRef, {
            shares: (postData.shares || 0) + 1
          })
        }
      }
    } catch (error) {
      console.error('Erro ao compartilhar post:', error)
      throw error
    }
  }

  const value = {
    userTournaments,
    allTournaments,
    userCatches,
    allCatches,
    loading,
    isOnline,
    syncStatus,
    createTournament,
    joinTournament,
    registerCatch,
    loadUserTournaments,
    loadUserCatches,
    calculateUserStats,
    getTournamentRanking,
    getGeneralRanking,
    syncLocalDataToFirestore,
    saveToLocalStorage,
    getFromLocalStorage,
    // Funções do feed
    createPost,
    loadPosts,
    likePost,
    addComment,
    sharePost
  }

  // Helper para computar ranking a partir de uma lista de capturas
  const computeRankingFromCatches = (catchesList = [], rankingType = 'weight') => {
    if (!Array.isArray(catchesList) || catchesList.length === 0) return []
    const userStats = {}
    catchesList.forEach(c => {
      if (!userStats[c.userId]) {
        userStats[c.userId] = {
          userId: c.userId,
          userName: c.userName,
          totalCatches: 0,
          totalWeight: 0,
          biggestFish: { weight: 0 }
        }
      }
      userStats[c.userId].totalCatches++
      userStats[c.userId].totalWeight += c.weight || 0
      if ((c.weight || 0) > userStats[c.userId].biggestFish.weight) {
        userStats[c.userId].biggestFish = c
      }
    })
    const ranking = Object.values(userStats)
    if (rankingType === 'weight') {
      ranking.sort((a, b) => b.totalWeight - a.totalWeight)
    } else {
      ranking.sort((a, b) => b.totalCatches - a.totalCatches)
    }
    return ranking
  }

  return (
    <FishingContext.Provider value={value}>
      {children}
    </FishingContext.Provider>
  )
}

export { FishingProvider, useFishing }
export default FishingContext