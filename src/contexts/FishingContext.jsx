import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { COLLECTIONS } from '../firebase/config'
import { uploadImageToSupabase, isSupabaseConfigured } from '../supabase/config'
import { useAuth } from './AuthContext'
import { useNotification } from './NotificationContext'

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
  const notification = useNotification()
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
        
        // Sincronização para usuário iniciada
        
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
            collection(db, COLLECTIONS.FISHING_TOURNAMENTS),
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
           const allTournamentsSnapshot = await getDocs(collection(db, COLLECTIONS.FISHING_TOURNAMENTS))
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
      console.log('📊 [PENDING] Resultado capturas: ', { sincronizadas: syncedCount, erros: errorCount })
      
      // Notificar sincronização se houver dados sincronizados
      if (syncedCount > 0) {
        notification.notifyDataSynced(`${syncedCount} captura${syncedCount > 1 ? 's' : ''} sincronizada${syncedCount > 1 ? 's' : ''}`)
      }
      
      // Forçar limpeza
      localStorage.removeItem('pending_catches')
      saveToLocalStorage('pending_catches', [])
      
      // Sincronizar campeonatos pendentes
      const pendingTournaments = getFromLocalStorage('pending_tournaments', [])
      console.log('📋 [PENDING] Campeonatos pendentes encontrados:', pendingTournaments.length)
      
      let tournamentSyncedCount = 0
      let tournamentErrorCount = 0
      
      for (const tournamentData of pendingTournaments) {
        try {
          console.log('📤 [PENDING] Sincronizando campeonato:', tournamentData.name)
          const docRef = await addDoc(collection(db, COLLECTIONS.FISHING_TOURNAMENTS), {
            ...tournamentData,
            syncedAt: new Date().toISOString()
          })
          console.log('✅ [PENDING] Campeonato sincronizado com ID:', docRef.id)
          tournamentSyncedCount++
        } catch (error) {
          console.error('❌ [PENDING] Erro ao sincronizar campeonato:', error)
          tournamentErrorCount++
        }
      }
      
      // Limpar campeonatos pendentes
      if (pendingTournaments.length > 0) {
        localStorage.removeItem('pending_tournaments')
        saveToLocalStorage('pending_tournaments', [])
        console.log('📊 [PENDING] Resultado campeonatos: ', { sincronizados: tournamentSyncedCount, erros: tournamentErrorCount })
        
        // Notificar sincronização de campeonatos
        if (tournamentSyncedCount > 0) {
          notification.notifyDataSynced(`${tournamentSyncedCount} campeonato${tournamentSyncedCount > 1 ? 's' : ''} sincronizado${tournamentSyncedCount > 1 ? 's' : ''}`)
        }
      }
      
      // Sincronizar participações pendentes
      const pendingParticipations = getFromLocalStorage('pending_participations', [])
      console.log('📋 [PENDING] Participações pendentes encontradas:', pendingParticipations.length)
      
      let participationSyncedCount = 0
      let participationErrorCount = 0
      
      for (const participation of pendingParticipations) {
        try {
          console.log('📤 [PENDING] Sincronizando participação:', participation.tournamentId)
          const tournamentRef = doc(db, COLLECTIONS.FISHING_TOURNAMENTS, participation.tournamentId)
          await updateDoc(tournamentRef, {
            participants: arrayUnion(participation.userId),
            participantNames: arrayUnion(participation.userName)
          })
          console.log('✅ [PENDING] Participação sincronizada')
          participationSyncedCount++
        } catch (error) {
          console.error('❌ [PENDING] Erro ao sincronizar participação:', error)
          participationErrorCount++
        }
      }
      
      // Limpar participações pendentes
      if (pendingParticipations.length > 0) {
        localStorage.removeItem('pending_participations')
        saveToLocalStorage('pending_participations', [])
        console.log('📊 [PENDING] Resultado participações: ', { sincronizadas: participationSyncedCount, erros: participationErrorCount })
      }
      
      // Recarregar dados atualizados
      await loadUserCatches()
      await loadUserTournaments()
      
      console.log('✅ [PENDING] Limpeza concluída - todos os dados pendentes removidos')
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
        collection(db, COLLECTIONS.FISHING_TOURNAMENTS),
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
      saveToLocalStorage(COLLECTIONS.FISHING_TOURNAMENTS, tournaments)
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

  // Criar campeonato com validações e suporte offline
  const createTournament = async (tournamentData) => {
    console.log('🏆 Iniciando criação de campeonato...')
    console.log('👤 Usuário autenticado:', !!user, user?.uid)
    console.log('📊 Dados do campeonato:', tournamentData)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    
    // Validações básicas
    if (!tournamentData.name || tournamentData.name.trim() === '') {
      throw new Error('Nome do campeonato é obrigatório')
    }
    
    if (tournamentData.name.length < 3) {
      throw new Error('Nome do campeonato deve ter pelo menos 3 caracteres')
    }
    
    if (tournamentData.name.length > 100) {
      throw new Error('Nome do campeonato deve ter no máximo 100 caracteres')
    }
    
    if (!tournamentData.startDate || !tournamentData.endDate) {
      throw new Error('Datas de início e fim são obrigatórias')
    }
    
    // Validações de datas
    const startDate = new Date(tournamentData.startDate)
    const endDate = new Date(tournamentData.endDate)
    const now = new Date()
    
    // Verificar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Datas inválidas fornecidas')
    }
    
    if (startDate >= endDate) {
      throw new Error('Data de início deve ser anterior à data de fim')
    }
    
    // Data de fim deve ser pelo menos 1 hora no futuro
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    if (endDate <= oneHourFromNow) {
      throw new Error('Data de fim deve ser pelo menos 1 hora no futuro')
    }
    
    // Duração mínima de 1 hora
    const durationHours = (endDate - startDate) / (1000 * 60 * 60)
    if (durationHours < 1) {
      throw new Error('Campeonato deve ter duração mínima de 1 hora')
    }
    
    // Duração máxima de 30 dias
    if (durationHours > 720) {
      throw new Error('Campeonato deve ter duração máxima de 30 dias')
    }
    
    // Validações de participantes
    if (tournamentData.maxParticipants && (tournamentData.maxParticipants < 2 || tournamentData.maxParticipants > 1000)) {
      throw new Error('Número máximo de participantes deve estar entre 2 e 1000')
    }
    
    // Validações financeiras
    if (tournamentData.entryFee && (tournamentData.entryFee < 0 || tournamentData.entryFee > 10000)) {
      throw new Error('Taxa de entrada deve estar entre R$ 0 e R$ 10.000')
    }
    
    if (tournamentData.prizePool && (tournamentData.prizePool < 0 || tournamentData.prizePool > 100000)) {
      throw new Error('Prêmio deve estar entre R$ 0 e R$ 100.000')
    }
    
    // Validação de descrição
    if (tournamentData.description && tournamentData.description.length > 1000) {
      throw new Error('Descrição deve ter no máximo 1000 caracteres')
    }
    
    // Validação de regras
    if (tournamentData.rules && tournamentData.rules.length > 2000) {
      throw new Error('Regras devem ter no máximo 2000 caracteres')
    }
    
    const newTournament = {
      ...tournamentData,
      createdBy: user.uid,
      creatorName: user.displayName || user.email,
      participants: [user.uid],
      participantNames: [user.displayName || user.email],
      createdAt: new Date().toISOString(),
      status: startDate <= now ? 'active' : 'upcoming',
      maxParticipants: tournamentData.maxParticipants || 100,
      entryFee: tournamentData.entryFee || 0,
      prize: tournamentData.prize || 0,
      rules: tournamentData.rules || '',
      location: tournamentData.location || '',
      description: tournamentData.description || ''
    }
    
    try {
      if (isOnline) {
        console.log('🌐 Online - salvando campeonato no Firestore...')
        const docRef = await addDoc(collection(db, COLLECTIONS.FISHING_TOURNAMENTS), newTournament)
        console.log('✅ Campeonato criado com ID:', docRef.id)
        
        // Notificar sucesso
        notification.notifyTournamentCreated(newTournament.name)
        
        // Recarregar dados
        await loadUserTournaments()
        return docRef.id
      } else {
        console.log('📱 Offline - salvando campeonato localmente...')
        // Salvar offline
        const tempId = `temp_tournament_${Date.now()}_${user.uid.substring(0, 8)}_${Math.random().toString(36).substring(2, 15)}`
        const tournamentWithId = { id: tempId, ...newTournament, isPending: true }
        
        // Salvar na lista de pendentes
        const pendingTournaments = getFromLocalStorage('pending_tournaments', [])
        pendingTournaments.push(tournamentWithId)
        saveToLocalStorage('pending_tournaments', pendingTournaments)
        
        // Atualizar cache local do usuário
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        currentTournaments.push(tournamentWithId)
        saveToLocalStorage(userCacheKey, currentTournaments)
        
        // Atualizar estado local
        setUserTournaments(prev => [...prev, tournamentWithId])
        
        // Notificar sucesso offline
        notification.notifyTournamentCreated(newTournament.name)
        
        console.log('📱 Campeonato salvo offline. Será sincronizado quando a conexão for restaurada.')
        return tempId
      }
    } catch (error) {
      console.error('❌ Erro ao criar campeonato:', error)
      throw error
    }
  }

  // Participar de campeonato com validações
  const joinTournament = async (tournamentId) => {
    console.log('🎯 Tentando participar do campeonato:', tournamentId)
    console.log('👤 Usuário:', user?.uid)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    
    // Validação do ID do campeonato
    if (!tournamentId || typeof tournamentId !== 'string') {
      throw new Error('ID do campeonato inválido')
    }
    
    try {
      // Verificar se o campeonato existe e se o usuário já participa
      const tournament = allTournaments.find(t => t.id === tournamentId) || 
                        userTournaments.find(t => t.id === tournamentId)
      
      if (!tournament) {
        throw new Error('Campeonato não encontrado')
      }
      
      // Validações de status do campeonato
      if (tournament.status === 'finished') {
        throw new Error('Este campeonato já foi finalizado')
      }
      
      if (tournament.status === 'cancelled') {
        throw new Error('Este campeonato foi cancelado')
      }
      
      // Verificar se o usuário já participa
      if (tournament.participants && tournament.participants.includes(user.uid)) {
        throw new Error('Você já está participando deste campeonato')
      }
      
      // Verificar se o usuário é o criador (já participa automaticamente)
      if (tournament.createdBy === user.uid) {
        throw new Error('Você é o criador deste campeonato e já participa automaticamente')
      }
      
      // Validações de capacidade
      if (tournament.maxParticipants && tournament.participants && 
          tournament.participants.length >= tournament.maxParticipants) {
        throw new Error('Campeonato lotado')
      }
      
      // Validações de tempo
      const now = new Date()
      const startDate = new Date(tournament.startDate)
      const endDate = new Date(tournament.endDate)
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Campeonato com datas inválidas')
      }
      
      // Não permitir inscrição após o fim do campeonato
      if (endDate <= now) {
        throw new Error('Período de inscrição encerrado')
      }
      
      // Permitir inscrição até 30 minutos após o início (para casos de atraso)
      const thirtyMinutesAfterStart = new Date(startDate.getTime() + 30 * 60 * 1000)
      if (now > thirtyMinutesAfterStart && tournament.status === 'active') {
        throw new Error('Não é possível se inscrever em campeonato que já começou há mais de 30 minutos')
      }
      
      // Validações de perfil do usuário
      if (!user.displayName && !user.email) {
        throw new Error('Perfil incompleto. Atualize suas informações antes de participar')
      }
      
      if (isOnline) {
        console.log('🌐 Online - atualizando participação no Firestore...')
        const tournamentRef = doc(db, COLLECTIONS.FISHING_TOURNAMENTS, tournamentId)
        await updateDoc(tournamentRef, {
          participants: arrayUnion(user.uid),
          participantNames: arrayUnion(user.displayName || user.email)
        })
        
        console.log('✅ Participação registrada com sucesso')
        
        // Notificar sucesso
        notification.notifyTournamentJoined(tournament.name)
        
        await loadUserTournaments()
      } else {
        console.log('📱 Offline - salvando participação localmente...')
        // Salvar participação offline
        const pendingParticipations = getFromLocalStorage('pending_participations', [])
        pendingParticipations.push({
          tournamentId,
          userId: user.uid,
          userName: user.displayName || user.email,
          timestamp: new Date().toISOString()
        })
        saveToLocalStorage('pending_participations', pendingParticipations)
        
        // Atualizar cache local
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        const updatedTournament = { ...tournament }
        if (!updatedTournament.participants) updatedTournament.participants = []
        if (!updatedTournament.participantNames) updatedTournament.participantNames = []
        
        updatedTournament.participants.push(user.uid)
        updatedTournament.participantNames.push(user.displayName || user.email)
        updatedTournament.isPendingParticipation = true
        
        currentTournaments.push(updatedTournament)
        saveToLocalStorage(userCacheKey, currentTournaments)
        
        // Atualizar estado local
        setUserTournaments(prev => [...prev, updatedTournament])
        
        // Notificar sucesso offline
        notification.notifyTournamentJoined(tournament.name)
        
        console.log('📱 Participação salva offline. Será sincronizada quando a conexão for restaurada.')
      }
    } catch (error) {
      console.error('❌ Erro ao participar do campeonato:', error)
      throw error
    }
  }

  // Sair de campeonato
  const leaveTournament = async (tournamentId) => {
    console.log('🚪 Saindo do campeonato:', tournamentId)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    
    try {
      const tournament = allTournaments.find(t => t.id === tournamentId) || 
                        userTournaments.find(t => t.id === tournamentId)
      
      if (!tournament) {
        throw new Error('Campeonato não encontrado')
      }
      
      if (tournament.createdBy === user.uid) {
        throw new Error('Criador do campeonato não pode sair. Use a função de cancelar campeonato.')
      }
      
      if (tournament.status === 'finished') {
        throw new Error('Não é possível sair de um campeonato finalizado')
      }
      
      if (isOnline) {
        const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
        const tournamentDoc = await getDoc(tournamentRef)
        
        if (tournamentDoc.exists()) {
          const data = tournamentDoc.data()
          const updatedParticipants = (data.participants || []).filter(id => id !== user.uid)
          const updatedParticipantNames = (data.participantNames || []).filter(name => name !== (user.displayName || user.email))
          
          await updateDoc(tournamentRef, {
            participants: updatedParticipants,
            participantNames: updatedParticipantNames
          })
        }
        
        // Notificar sucesso
        notification.notifyTournamentLeft(tournament.name)
        
        await loadUserTournaments()
      } else {
        // Remover localmente
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        const filteredTournaments = currentTournaments.filter(t => t.id !== tournamentId)
        saveToLocalStorage(userCacheKey, filteredTournaments)
        setUserTournaments(filteredTournaments)
        
        // Notificar sucesso offline
        notification.notifyTournamentLeft(tournament.name)
      }
    } catch (error) {
      console.error('❌ Erro ao sair do campeonato:', error)
      throw error
    }
  }

  // Cancelar/Deletar campeonato (apenas criador)
  const deleteTournament = async (tournamentId) => {
    console.log('🗑️ Deletando campeonato:', tournamentId)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    
    // Validação do ID do campeonato
    if (!tournamentId || typeof tournamentId !== 'string') {
      throw new Error('ID do campeonato inválido')
    }
    
    try {
      const tournament = allTournaments.find(t => t.id === tournamentId) || 
                        userTournaments.find(t => t.id === tournamentId)
      
      if (!tournament) {
        throw new Error('Campeonato não encontrado')
      }
      
      // Verificar se o usuário é o criador
      if (tournament.createdBy !== user.uid) {
        throw new Error('Apenas o criador pode deletar o campeonato')
      }
      
      // Verificar se o campeonato já foi deletado/cancelado
      if (tournament.status === 'cancelled') {
        throw new Error('Este campeonato já foi cancelado')
      }
      
      // Verificar se o campeonato já foi finalizado
      if (tournament.status === 'finished') {
        throw new Error('Não é possível deletar um campeonato já finalizado')
      }
      
      // Validações de tempo e participantes
      const now = new Date()
      const startDate = new Date(tournament.startDate)
      const participantCount = tournament.participants ? tournament.participants.length : 0
      
      // Não permitir deletar campeonato ativo com múltiplos participantes
      if (tournament.status === 'active' && participantCount > 1) {
        throw new Error('Não é possível deletar um campeonato ativo com outros participantes')
      }
      
      // Não permitir deletar campeonato que já começou há mais de 1 hora
      const oneHourAfterStart = new Date(startDate.getTime() + 60 * 60 * 1000)
      if (now > oneHourAfterStart && tournament.status === 'active') {
        throw new Error('Não é possível deletar um campeonato que já está em andamento há mais de 1 hora')
      }
      
      // Verificar se há capturas registradas no campeonato
      const tournamentCatches = userCatches.filter(catch_ => catch_.tournamentId === tournamentId)
      if (tournamentCatches.length > 0) {
        throw new Error('Não é possível deletar um campeonato que já possui capturas registradas')
      }
      
      if (isOnline) {
        // Deletar do Firestore
        const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
        await updateDoc(tournamentRef, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: user.uid
        })
        
        // Notificar sucesso
        notification.notifyTournamentDeleted(tournament.name)
        
        await loadUserTournaments()
      } else {
        // Marcar como cancelado localmente
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        const updatedTournaments = currentTournaments.map(t => 
          t.id === tournamentId ? { ...t, status: 'cancelled', cancelledAt: new Date().toISOString() } : t
        )
        saveToLocalStorage(userCacheKey, updatedTournaments)
        setUserTournaments(updatedTournaments)
        
        // Notificar sucesso offline
        notification.notifyTournamentDeleted(tournament.name)
      }
    } catch (error) {
      console.error('❌ Erro ao deletar campeonato:', error)
      throw error
    }
  }

  // Finalizar campeonato (apenas criador)
  const finishTournament = async (tournamentId) => {
    console.log('🏁 Finalizando campeonato:', tournamentId)
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    
    // Validação do ID do campeonato
    if (!tournamentId || typeof tournamentId !== 'string') {
      throw new Error('ID do campeonato inválido')
    }
    
    try {
      const tournament = allTournaments.find(t => t.id === tournamentId) || 
                        userTournaments.find(t => t.id === tournamentId)
      
      if (!tournament) {
        throw new Error('Campeonato não encontrado')
      }
      
      // Verificar se o usuário é o criador
      if (tournament.createdBy !== user.uid) {
        throw new Error('Apenas o criador pode finalizar o campeonato')
      }
      
      // Verificar status atual
      if (tournament.status === 'finished') {
        throw new Error('Campeonato já foi finalizado')
      }
      
      if (tournament.status === 'cancelled') {
        throw new Error('Não é possível finalizar um campeonato cancelado')
      }
      
      // Validações de tempo
      const now = new Date()
      const startDate = new Date(tournament.startDate)
      const endDate = new Date(tournament.endDate)
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Campeonato com datas inválidas')
      }
      
      // Não permitir finalizar antes do início
      if (now < startDate) {
        throw new Error('Não é possível finalizar um campeonato que ainda não começou')
      }
      
      // Permitir finalização antecipada apenas se for pelo menos 50% do tempo
      const totalDuration = endDate - startDate
      const elapsedTime = now - startDate
      const minimumDurationForEarlyFinish = totalDuration * 0.5
      
      if (now < endDate && elapsedTime < minimumDurationForEarlyFinish) {
        throw new Error('Campeonato só pode ser finalizado antecipadamente após pelo menos 50% do tempo decorrido')
      }
      
      // Verificar se há pelo menos um participante
      const participantCount = tournament.participants ? tournament.participants.length : 0
      if (participantCount < 1) {
        throw new Error('Não é possível finalizar um campeonato sem participantes')
      }
      
      // Calcular ranking final
      const finalRanking = await getTournamentRanking(tournamentId, 'weight')
      
      if (isOnline) {
        const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
        await updateDoc(tournamentRef, {
          status: 'finished',
          finishedAt: new Date().toISOString(),
          finishedBy: user.uid,
          finalRanking: finalRanking
        })
        
        // Notificar sucesso
        notification.notifyTournamentFinished(tournament.name)
        
        await loadUserTournaments()
      } else {
        // Finalizar localmente
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        const updatedTournaments = currentTournaments.map(t => 
          t.id === tournamentId ? { 
            ...t, 
            status: 'finished', 
            finishedAt: new Date().toISOString(),
            finalRanking: finalRanking 
          } : t
        )
        saveToLocalStorage(userCacheKey, updatedTournaments)
        setUserTournaments(updatedTournaments)
        
        // Notificar sucesso offline
        notification.notifyTournamentFinished(tournament.name)
      }
      
      return finalRanking
    } catch (error) {
      console.error('❌ Erro ao finalizar campeonato:', error)
      throw error
    }
  }

  // Função para fazer upload de imagem usando Supabase Storage
  const uploadImage = async (file, path) => {
    if (!file) {
      console.log('⚠️ Nenhum arquivo fornecido para upload')
      return null
    }
    
    try {
      console.log('📤 Iniciando upload da imagem com Supabase...')
      
      // Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase não está configurado')
        throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.')
      }
      
      // Verificar se o usuário está autenticado
      if (!user) {
        console.error('❌ Usuário não está autenticado')
        throw new Error('Usuário deve estar autenticado para fazer upload')
      }
      
      console.log('👤 Usuário autenticado:', user.uid)
      
      // Usar a função do Supabase para upload
      const imageUrl = await uploadImageToSupabase(file, user.uid, 'catches')
      
      console.log('✅ Upload concluído com Supabase:', imageUrl)
      return imageUrl
      
    } catch (error) {
      console.error('❌ Erro no upload da imagem:', error)
      throw new Error('Erro ao fazer upload da imagem: ' + error.message)
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

    // Fazer upload da imagem se existir
    let photoURL = null
    if (catchData.photo && catchData.photo instanceof File) {
      try {
        console.log('📸 Fazendo upload da foto...')
        photoURL = await uploadImage(catchData.photo, `catches/${user.uid}`)
        console.log('✅ Foto enviada com sucesso:', photoURL)
      } catch (error) {
        console.error('❌ Erro no upload da foto:', error)
        // Continuar sem a foto em caso de erro
        photoURL = null
      }
    }
    
    const newCatch = {
      ...catchData,
      photo: photoURL, // Substituir o arquivo pela URL
      userId: user.uid,
      userName: user.displayName || user.email,
      registeredAt: new Date().toISOString(),
      id: `temp_${Date.now()}_${user.uid.substring(0, 8)}_${Math.random().toString(36).substring(2, 15)}_${performance.now().toString().replace('.', '')}`
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
        
        // Notificar sucesso
        notification.notifyCatchRegistered(newCatch.species || 'Peixe', newCatch.weight)
        
        // Recarregar capturas após registro
        await loadUserCatches()
        
        // Retornar os dados da captura
        return newCatch
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
        
        // Notificar sucesso offline
        notification.notifyCatchRegistered(newCatch.species || 'Peixe', newCatch.weight)
        
        console.log('Captura salva offline. Será sincronizada quando a conexão for restaurada.')
        
        // Retornar os dados da captura
        return newCatch
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
        const tempId = `temp_post_${Date.now()}_${user.uid.substring(0, 8)}_${Math.random().toString(36).substring(2, 15)}`
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
      console.log('📱 Posts locais carregados:', localPosts)
      
      if (isOnline) {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(postsQuery)
        const posts = []
        snapshot.forEach((doc) => {
          const postData = { id: doc.id, ...doc.data() }
          console.log('🔍 Post carregado do Firestore:', postData)
          posts.push(postData)
        })
        
        // Combinar com posts locais não sincronizados
        const tempPosts = localPosts.filter(post => post.isTemp)
        const allPosts = [...tempPosts, ...posts]
        console.log('📋 Todos os posts combinados:', allPosts)
        return allPosts
      } else {
        console.log('📴 Modo offline - retornando apenas posts locais')
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

  // Funções de convites para campeonatos
  const sendTournamentInvite = async (tournamentId, inviteeEmail) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      const tournament = allTournaments.find(t => t.id === tournamentId)
      if (!tournament) throw new Error('Campeonato não encontrado')
      
      if (tournament.createdBy !== user.uid) {
        throw new Error('Apenas o criador pode enviar convites')
      }
      
      const invite = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tournamentId,
        tournamentName: tournament.name,
        inviterId: user.uid,
        inviterName: user.displayName || user.email,
        inviteeEmail,
        status: 'pending', // 'pending', 'accepted', 'declined'
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      }
      
      if (isOnline) {
        // Salvar convite no Firestore
        await addDoc(collection(db, COLLECTIONS.TOURNAMENT_INVITES), invite)
        notification.notifyInviteSent(inviteeEmail, tournament.name)
      } else {
        // Salvar no cache local
        const pendingInvites = getFromLocalStorage('pending_invites', [])
        pendingInvites.push(invite)
        saveToLocalStorage('pending_invites', pendingInvites)
        notification.notifyInviteSent(inviteeEmail, tournament.name)
      }
      
      return invite
    } catch (error) {
      console.error('Erro ao enviar convite:', error)
      throw error
    }
  }
  
  const generateTournamentInviteLink = (tournamentId) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/tournaments/join/${tournamentId}`
  }
  
  const joinTournamentByInvite = async (tournamentId, inviteId = null) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    try {
      // Usar a função existente de joinTournament
      await joinTournament(tournamentId)
      
      // Se há um convite específico, marcar como aceito
      if (inviteId && isOnline) {
        const inviteRef = doc(db, COLLECTIONS.TOURNAMENT_INVITES, inviteId)
        await updateDoc(inviteRef, {
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        })
      }
      
      notification.notifyInviteAccepted()
    } catch (error) {
      console.error('Erro ao aceitar convite:', error)
      throw error
    }
  }
  
  const loadUserInvites = async () => {
    if (!user) return []
    
    try {
      if (isOnline) {
        const invitesQuery = query(
          collection(db, COLLECTIONS.TOURNAMENT_INVITES),
          where('inviteeEmail', '==', user.email),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        )
        
        const invitesSnapshot = await getDocs(invitesQuery)
        const invites = invitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Filtrar convites não expirados
        const validInvites = invites.filter(invite => {
          const expiresAt = new Date(invite.expiresAt)
          return expiresAt > new Date()
        })
        
        return validInvites
      } else {
        // Retornar convites do cache local (se houver)
        return getFromLocalStorage(`user_invites_${user.uid}`, [])
      }
    } catch (error) {
      console.error('Erro ao carregar convites:', error)
      return []
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
    leaveTournament,
    deleteTournament,
    finishTournament,
    registerCatch,
    uploadImage,
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
    sharePost,
    // Funções de convites
    sendTournamentInvite,
    generateTournamentInviteLink,
    joinTournamentByInvite,
    loadUserInvites
  }

  // Helper para computar ranking a partir de uma lista de capturas
  const computeRankingFromCatches = (catchesList = [], rankingType = 'weight') => {
    if (!Array.isArray(catchesList) || catchesList.length === 0) return []
    
    const userStats = {}
    
    // Processar todas as capturas
    catchesList.forEach(c => {
      if (!userStats[c.userId]) {
        userStats[c.userId] = {
          userId: c.userId,
          userName: c.userName,
          totalCatches: 0,
          totalWeight: 0,
          averageWeight: 0,
          biggestFish: { weight: 0, species: '', length: 0 },
          smallestFish: { weight: Infinity, species: '', length: Infinity },
          speciesCount: {},
          uniqueSpecies: 0,
          totalLength: 0,
          averageLength: 0,
          score: 0,
          lastCatchDate: null,
          firstCatchDate: null,
          catchDates: [],
          activeDays: 0
        }
      }
      
      const stats = userStats[c.userId]
      const weight = c.weight || 0
      const length = c.length || 0
      const species = c.species || 'Desconhecido'
      const catchDate = c.date || c.createdAt
      
      // Estatísticas básicas
      stats.totalCatches++
      stats.totalWeight += weight
      stats.totalLength += length
      
      // Maior peixe
      if (weight > stats.biggestFish.weight) {
        stats.biggestFish = {
          weight,
          species,
          length,
          location: c.location,
          date: catchDate
        }
      }
      
      // Menor peixe
      if (weight < stats.smallestFish.weight && weight > 0) {
        stats.smallestFish = {
          weight,
          species,
          length,
          location: c.location,
          date: catchDate
        }
      }
      
      // Contagem de espécies
      if (!stats.speciesCount[species]) {
        stats.speciesCount[species] = 0
      }
      stats.speciesCount[species]++
      
      // Datas de pesca
      if (catchDate) {
        const dateStr = new Date(catchDate).toDateString()
        if (!stats.catchDates.includes(dateStr)) {
          stats.catchDates.push(dateStr)
        }
        
        if (!stats.firstCatchDate || new Date(catchDate) < new Date(stats.firstCatchDate)) {
          stats.firstCatchDate = catchDate
        }
        
        if (!stats.lastCatchDate || new Date(catchDate) > new Date(stats.lastCatchDate)) {
          stats.lastCatchDate = catchDate
        }
      }
    })
    
    // Calcular estatísticas derivadas
    Object.values(userStats).forEach(stats => {
      // Médias
      stats.averageWeight = stats.totalCatches > 0 ? stats.totalWeight / stats.totalCatches : 0
      stats.averageLength = stats.totalCatches > 0 ? stats.totalLength / stats.totalCatches : 0
      
      // Espécies únicas
      stats.uniqueSpecies = Object.keys(stats.speciesCount).length
      
      // Dias ativos
      stats.activeDays = stats.catchDates.length
      
      // Sistema de pontuação avançado
      stats.score = calculateAdvancedScore(stats)
      
      // Limpar dados temporários
      delete stats.catchDates
    })
    
    const ranking = Object.values(userStats)
    
    // Ordenação baseada no tipo de ranking
    switch (rankingType) {
      case 'weight':
        ranking.sort((a, b) => {
          if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
          if (b.totalCatches !== a.totalCatches) return b.totalCatches - a.totalCatches
          return b.biggestFish.weight - a.biggestFish.weight
        })
        break
        
      case 'quantity':
        ranking.sort((a, b) => {
          if (b.totalCatches !== a.totalCatches) return b.totalCatches - a.totalCatches
          if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
          return b.uniqueSpecies - a.uniqueSpecies
        })
        break
        
      case 'biggest':
        ranking.sort((a, b) => {
          if (b.biggestFish.weight !== a.biggestFish.weight) return b.biggestFish.weight - a.biggestFish.weight
          if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
          return b.totalCatches - a.totalCatches
        })
        break
        
      case 'species':
        ranking.sort((a, b) => {
          if (b.uniqueSpecies !== a.uniqueSpecies) return b.uniqueSpecies - a.uniqueSpecies
          if (b.totalCatches !== a.totalCatches) return b.totalCatches - a.totalCatches
          return b.totalWeight - a.totalWeight
        })
        break
        
      case 'score':
      default:
        ranking.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          if (b.totalWeight !== a.totalWeight) return b.totalWeight - a.totalWeight
          return b.totalCatches - a.totalCatches
        })
        break
    }
    
    // Adicionar posição no ranking
    ranking.forEach((participant, index) => {
      participant.position = index + 1
      participant.isWinner = index === 0
      participant.isPodium = index < 3
    })
    
    return ranking
  }
  
  // Sistema de pontuação avançado
  const calculateAdvancedScore = (stats) => {
    let score = 0
    
    // Pontos por peso total (1 ponto por kg)
    score += stats.totalWeight * 1
    
    // Pontos por quantidade de peixes (5 pontos por peixe)
    score += stats.totalCatches * 5
    
    // Bônus por diversidade de espécies (20 pontos por espécie única)
    score += stats.uniqueSpecies * 20
    
    // Bônus por maior peixe (peso do maior peixe * 10)
    score += stats.biggestFish.weight * 10
    
    // Bônus por consistência (pontos por dia ativo)
    score += stats.activeDays * 15
    
    // Bônus por peso médio alto (se > 2kg, bônus de 50 pontos)
    if (stats.averageWeight > 2) {
      score += 50
    }
    
    // Bônus por pescador experiente (se > 10 peixes, bônus de 100 pontos)
    if (stats.totalCatches > 10) {
      score += 100
    }
    
    // Bônus por especialista em espécies (se > 5 espécies, bônus de 200 pontos)
    if (stats.uniqueSpecies > 5) {
      score += 200
    }
    
    return Math.round(score)
  }

  return (
    <FishingContext.Provider value={value}>
      {children}
    </FishingContext.Provider>
  )
}

export { FishingProvider, useFishing }
export default FishingContext