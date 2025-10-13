import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { db } from '../services/firebaseConfig'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { useAuth } from './AuthContext'
import {
  getFromLocalStorage,
  saveToLocalStorage
} from '../utils/localStorageUtils'
import {
  isSupabaseConfigured,
  uploadImageToSupabase
} from '../services/supabaseStorage'
import * as notification from '../utils/notificationUtils'

const FishingContext = createContext()

// Constantes para coleções
const COLLECTIONS = {
  FISHING_TOURNAMENTS: 'fishing_tournaments',
  FISHING_CATCHES: 'fishing_catches',
  POSTS: 'posts',
  TOURNAMENT_INVITES: 'tournament_invites'
}

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
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, success, error
  const [globalRanking, setGlobalRanking] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingData, setPendingData] = useState({ catches: 0, participations: 0 })

  // Adicionar captura otimista
  const addOptimisticCatch = (catchData) => {
    // Adicionar à lista de capturas do usuário
    setUserCatches(prevCatches => [catchData, ...prevCatches])
    // Adicionar à lista de todas as capturas
    setAllCatches(prevCatches => [catchData, ...prevCatches])
  }

  // Efeito para detectar status da conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Efeito para sincronizar dados quando online
  useEffect(() => {
    if (isOnline) {
      console.log('🔄 Conexão restaurada, sincronizando dados...')
      syncLocalDataToFirestore()
    }
  }, [isOnline])

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        if (user) {
          await Promise.all([
            loadUserTournaments(),
            loadUserCatches(),
            syncGlobalData()
          ])
        } else {
          await syncGlobalData()
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [user])

  // Sincronizar dados locais com o Firestore
  const syncLocalDataToFirestore = async () => {
    if (syncStatus === 'syncing' || !isOnline) return
    setSyncStatus('syncing')

    try {
      // Sincronizar campeonatos pendentes
      const pendingTournaments = getFromLocalStorage('pending_tournaments', [])
      if (pendingTournaments.length > 0) {
        const batch = writeBatch(db)
        pendingTournaments.forEach(tournament => {
          const docRef = doc(collection(db, 'fishing_tournaments'))
          batch.set(docRef, tournament)
        })
        await batch.commit()
        saveToLocalStorage('pending_tournaments', [])
      }

      // Sincronizar capturas pendentes
      const pendingCatches = getFromLocalStorage('pending_catches', [])
      if (pendingCatches.length > 0) {
        const batch = writeBatch(db)
        pendingCatches.forEach(catchItem => {
          const docRef = doc(collection(db, 'fishing_catches'))
          batch.set(docRef, catchItem)
        })
        await batch.commit()
        saveToLocalStorage('pending_catches', [])
      }

      // Sincronizar participações pendentes
      await syncPendingParticipations()

      // Recarregar dados após sincronização
      if (user) {
        await loadUserTournaments()
        await loadUserCatches()
      }
      await syncGlobalData()

      setSyncStatus('success')
      console.log('✅ Sincronização concluída com sucesso!')
    } catch (error) {
      setSyncStatus('error')
      console.error('❌ Erro durante a sincronização:', error)
    }
  }

  // Sincronizar dados globais (campeonatos e capturas)
  const syncGlobalData = async () => {
    try {
      if (isOnline) {
        // Carregar todos os campeonatos
        const tournamentsQuery = query(
          collection(db, 'fishing_tournaments'),
          orderBy('createdAt', 'desc')
        )
        const tournamentsSnapshot = await getDocs(tournamentsQuery)
        const tournaments = tournamentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        saveToLocalStorage('all_tournaments', tournaments)
        setAllTournaments(tournaments)

        // Carregar todas as capturas
        const catchesQuery = query(
          collection(db, 'fishing_catches'),
          orderBy('registeredAt', 'desc')
        )
        const catchesSnapshot = await getDocs(catchesQuery)
        const catches = catchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        saveToLocalStorage('all_catches', catches)
        setAllCatches(catches)
      } else {
        // Carregar do cache local se offline
        setAllTournaments(getFromLocalStorage('all_tournaments', []))
        setAllCatches(getFromLocalStorage('all_catches', []))
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados globais:', error)
      // Fallback para cache local em caso de erro
      setAllTournaments(getFromLocalStorage('all_tournaments', []))
      setAllCatches(getFromLocalStorage('all_catches', []))
    }
  }

  // Mesclar participantes de um campeonato com o cache local
  const mergeParticipantsWithLocal = (
    tournamentId,
    participantsFromFirestore
  ) => {
    const pendingParticipants = getFromLocalStorage(
      'pending_participations',
      []
    )
    const localParticipants = pendingParticipants
      .filter(p => p.tournamentId === tournamentId)
      .map(p => ({
        userId: p.userId,
        userName: p.userName,
        joinedAt: p.joinedAt,
        isPending: true
      }))

    const firestoreUserIds = new Set(
      participantsFromFirestore.map(p => p.userId)
    )
    const uniqueLocalParticipants = localParticipants.filter(
      p => !firestoreUserIds.has(p.userId)
    )

    return [...participantsFromFirestore, ...uniqueLocalParticipants]
  }

  // Sincronizar participações pendentes
  const syncPendingParticipations = async () => {
    const pendingParticipations = getFromLocalStorage(
      'pending_participations',
      []
    )
    if (pendingParticipations.length === 0) return

    const batch = writeBatch(db)
    const successfulSyncs = []

    for (const participation of pendingParticipations) {
      try {
        const tournamentRef = doc(
          db,
          'fishing_tournaments',
          participation.tournamentId
        )
        const tournamentDoc = await getDoc(tournamentRef)

        if (tournamentDoc.exists()) {
          const tournamentData = tournamentDoc.data()
          const participants = tournamentData.participants || []

          // Evitar duplicatas
          if (!participants.some(p => p.userId === participation.userId)) {
            batch.update(tournamentRef, {
              participants: arrayUnion({
                userId: participation.userId,
                userName: participation.userName,
                joinedAt: participation.joinedAt
              })
            })
            successfulSyncs.push(participation)
          } else {
            // Se já existe, remover da lista de pendentes
            successfulSyncs.push(participation)
          }
        }
      } catch (error) {
        console.error(
          `❌ Erro ao sincronizar participação para o campeonato ${participation.tournamentId}:`,
          error
        )
      }
    }

    if (successfulSyncs.length > 0) {
      await batch.commit()
      const remainingParticipations = pendingParticipations.filter(
        p => !successfulSyncs.includes(p)
      )
      saveToLocalStorage('pending_participations', remainingParticipations)
    }
  }

  // Carregar campeonatos do usuário
  const loadUserTournaments = async () => {
    if (!user) return
    try {
      if (isOnline) {
        const q = query(
          collection(db, 'fishing_tournaments'),
          where('participants', 'array-contains', {
            userId: user.uid,
            userName: user.displayName || user.email,
            joinedAt: expect.any(String) // Isso não funciona em queries, precisa ajustar
          }),
          orderBy('createdAt', 'desc')
        )
        // A query acima é complexa e pode não funcionar como esperado.
        // Uma abordagem mais simples é buscar todos e filtrar no cliente,
        // ou reestruturar os dados. Por enquanto, vamos buscar todos e filtrar.

        const allTournamentsQuery = query(
          collection(db, 'fishing_tournaments'),
          orderBy('createdAt', 'desc')
        )
        const querySnapshot = await getDocs(allTournamentsQuery)
        const tournaments = []
        querySnapshot.forEach(doc => {
          const data = doc.data()
          if (
            data.participants &&
            data.participants.some(p => p.userId === user.uid)
          ) {
            tournaments.push({ id: doc.id, ...data })
          }
        })

        saveToLocalStorage(`user_tournaments_${user.uid}`, tournaments)
        setUserTournaments(tournaments)
      } else {
        setUserTournaments(
          getFromLocalStorage(`user_tournaments_${user.uid}`, [])
        )
      }
    } catch (error) {
      console.error('❌ Erro ao carregar campeonatos do usuário:', error)
      setUserTournaments(
        getFromLocalStorage(`user_tournaments_${user.uid}`, [])
      )
    }
  }

  // Carregar capturas do usuário
  const loadUserCatches = async () => {
    if (!user) return
    try {
      if (isOnline) {
        const q = query(
          collection(db, 'fishing_catches'),
          where('userId', '==', user.uid),
          orderBy('registeredAt', 'desc')
        )
        const querySnapshot = await getDocs(q)
        const catches = []
        querySnapshot.forEach(doc => {
          catches.push({ id: doc.id, ...doc.data() })
        })
        saveToLocalStorage(`user_catches_${user.uid}`, catches)
        setUserCatches(catches)
      } else {
        setUserCatches(getFromLocalStorage(`user_catches_${user.uid}`, []))
      }
    } catch (error) {
      console.error('❌ Erro ao carregar capturas do usuário:', error)
      setUserCatches(getFromLocalStorage(`user_catches_${user.uid}`, []))
    }
  }

  const loadAllCatches = async () => {
    try {
      if (isOnline) {
        const catchesQuery = query(
          collection(db, 'fishing_catches'),
          orderBy('registeredAt', 'desc')
        );
        const snapshot = await getDocs(catchesQuery);
        const allCatchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        saveToLocalStorage('all_catches', allCatchesData);
        setAllCatches(allCatchesData);
        return allCatchesData;
      } else {
        const localCatches = getFromLocalStorage('all_catches', []);
        setAllCatches(localCatches);
        return localCatches;
      }
    } catch (error) {
      console.error("Erro ao carregar todas as capturas:", error);
      const localCatches = getFromLocalStorage('all_catches', []);
      setAllCatches(localCatches);
      return localCatches;
    }
  };

  // Criar novo campeonato
  const createTournament = async tournamentData => {
    if (!user) throw new Error('Usuário não autenticado')

    const newTournament = {
      ...tournamentData,
      createdBy: user.uid,
      creatorName: user.displayName || user.email,
      createdAt: new Date().toISOString(),
      status: 'open', // open, in_progress, finished, cancelled
      participants: [
        {
          userId: user.uid,
          userName: user.displayName || user.email,
          joinedAt: new Date().toISOString()
        }
      ],
      participantCount: 1
    }

    try {
      if (isOnline) {
        const docRef = await addDoc(
          collection(db, 'fishing_tournaments'),
          newTournament
        )
        notification.notifyTournamentCreated(newTournament.name)
        await loadUserTournaments()
        return { id: docRef.id, ...newTournament }
      } else {
        const pendingTournaments = getFromLocalStorage(
          'pending_tournaments',
          []
        )
        pendingTournaments.push(newTournament)
        saveToLocalStorage('pending_tournaments', pendingTournaments)
        notification.notifyTournamentCreated(newTournament.name)

        // Adicionar ao estado local
        setUserTournaments(prev => [
          { id: `temp-${Date.now()}`, ...newTournament },
          ...prev
        ])
        return { id: `temp-${Date.now()}`, ...newTournament }
      }
    } catch (error) {
      console.error('❌ Erro ao criar campeonato:', error)
      throw error
    }
  }

  // Entrar em um campeonato
  const joinTournament = async tournamentId => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
      let tournament

      if (isOnline) {
        const tournamentDoc = await getDoc(tournamentRef)
        if (!tournamentDoc.exists()) {
          throw new Error('Campeonato não encontrado')
        }
        tournament = { id: tournamentDoc.id, ...tournamentDoc.data() }
      } else {
        // Tentar encontrar no cache local
        const localTournaments = getFromLocalStorage('all_tournaments', [])
        tournament = localTournaments.find(t => t.id === tournamentId)
        if (!tournament) {
          throw new Error(
            'Campeonato não encontrado. Conecte-se à internet para encontrá-lo.'
          )
        }
      }

      // Validações
      if (tournament.status !== 'open') {
        throw new Error('Este campeonato não está aberto para inscrições.')
      }
      if (
        tournament.participants &&
        tournament.participants.some(p => p.userId === user.uid)
      ) {
        throw new Error('Você já está neste campeonato.')
      }
      if (
        tournament.maxParticipants &&
        tournament.participants.length >= tournament.maxParticipants
      ) {
        throw new Error('O campeonato atingiu o número máximo de participantes.')
      }
      const now = new Date()
      const startDate = new Date(tournament.startDate)
      if (now > startDate) {
        throw new Error('Este campeonato já começou.')
      }

      const participant = {
        userId: user.uid,
        userName: user.displayName || user.email,
        joinedAt: new Date().toISOString()
      }

      if (isOnline) {
        await updateDoc(tournamentRef, {
          participants: arrayUnion(participant),
          participantCount: (tournament.participantCount || 0) + 1
        })
        notification.notifyJoinedTournament(tournament.name)
        await loadUserTournaments()
      } else {
        // Salvar participação pendente
        const pendingParticipations = getFromLocalStorage(
          'pending_participations',
          []
        )
        pendingParticipations.push({ tournamentId, ...participant })
        saveToLocalStorage('pending_participations', pendingParticipations)

        // Atualizar cache local do campeonato
        const allLocalTournaments = getFromLocalStorage('all_tournaments', [])
        const updatedTournaments = allLocalTournaments.map(t =>
          t.id === tournamentId
            ? {
                ...t,
                participants: [...(t.participants || []), participant],
                participantCount: (t.participantCount || 0) + 1
              }
            : t
        )
        saveToLocalStorage('all_tournaments', updatedTournaments)
        setAllTournaments(updatedTournaments)

        notification.notifyJoinedTournament(tournament.name)
      }
    } catch (error) {
      console.error('❌ Erro ao entrar no campeonato:', error)
      throw error
    }
  }

  // Sair de um campeonato
  const leaveTournament = async tournamentId => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Campeonato não encontrado')
      }

      const tournament = tournamentDoc.data()

      if (tournament.status !== 'open') {
        throw new Error('Não é possível sair de um campeonato que não está aberto.')
      }
      if (tournament.createdBy === user.uid) {
        throw new Error(
          'O criador não pode sair do campeonato. Cancele-o se desejar.'
        )
      }

      const participant = tournament.participants.find(p => p.userId === user.uid)
      if (!participant) {
        throw new Error('Você não está neste campeonato.')
      }

      if (isOnline) {
        await updateDoc(tournamentRef, {
          participants: arrayRemove(participant),
          participantCount: (tournament.participantCount || 1) - 1
        })
        notification.notifyLeftTournament(tournament.name)
        await loadUserTournaments()
      } else {
        // Implementar lógica offline para sair
        throw new Error(
          'Funcionalidade de sair do campeonato offline não implementada.'
        )
      }
    } catch (error) {
      console.error('❌ Erro ao sair do campeonato:', error)
      throw error
    }
  }

  // Deletar/cancelar um campeonato
  const deleteTournament = async tournamentId => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const tournamentRef = doc(db, 'fishing_tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)

      if (!tournamentDoc.exists()) {
        throw new Error('Campeonato não encontrado')
      }

      const tournament = tournamentDoc.data()

      if (tournament.createdBy !== user.uid) {
        throw new Error('Apenas o criador pode cancelar o campeonato.')
      }
      if (tournament.status === 'finished') {
        throw new Error('Não é possível cancelar um campeonato finalizado.')
      }
      if (tournament.status === 'cancelled') {
        throw new Error('Este campeonato já está cancelado.')
      }
      if (tournament.participantCount > 1) {
        // Adicionar verificação de capturas
        const catchesQuery = query(
          collection(db, 'fishing_catches'),
          where('tournamentId', '==', tournamentId)
        )
        const catchesSnapshot = await getDocs(catchesQuery)
        if (!catchesSnapshot.empty) {
          throw new Error(
            'Não é possível cancelar um campeonato que já possui capturas registradas.'
          )
        }
      }

      if (isOnline) {
        await updateDoc(tournamentRef, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        })
        notification.notifyTournamentCancelled(tournament.name)
        await loadUserTournaments()
      } else {
        // Lógica offline
        const userCacheKey = `user_tournaments_${user.uid}`
        const currentTournaments = getFromLocalStorage(userCacheKey, [])
        const updatedTournaments = currentTournaments.map(t =>
          t.id === tournamentId ? { ...t, status: 'cancelled' } : t
        )
        saveToLocalStorage(userCacheKey, updatedTournaments)
        setUserTournaments(updatedTournaments)
        notification.notifyTournamentCancelled(tournament.name)
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar campeonato:', error)
      throw error
    }
  }

  // Finalizar um campeonato
  const finishTournament = async tournamentId => {
    if (!user) throw new Error('Usuário não autenticado')
    try {
      const tournament =
        allTournaments.find(t => t.id === tournamentId) ||
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
        throw new Error(
          'Não é possível finalizar um campeonato que ainda não começou'
        )
      }

      // Permitir finalização antecipada apenas se for pelo menos 50% do tempo
      const totalDuration = endDate - startDate
      const elapsedTime = now - startDate
      const minimumDurationForEarlyFinish = totalDuration * 0.5

      if (now < endDate && elapsedTime < minimumDurationForEarlyFinish) {
        throw new Error(
          'Campeonato só pode ser finalizado antecipadamente após pelo menos 50% do tempo decorrido'
        )
      }

      // Verificar se há pelo menos um participante
      const participantCount = tournament.participants
        ? tournament.participants.length
        : 0
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
          t.id === tournamentId
            ? {
                ...t,
                status: 'finished',
                finishedAt: new Date().toISOString(),
                finalRanking: finalRanking
              }
            : t
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
        throw new Error(
          'Supabase não está configurado. Verifique as variáveis de ambiente.'
        )
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

  // Fallback: converter File em Data URL (base64) para armazenar localmente/Firestore
  const fileToDataURL = file => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = e =>
          reject(
            new Error(
              'Falha ao ler arquivo: ' + (e?.message || 'erro desconhecido')
            )
          )
        reader.readAsDataURL(file)
      } catch (err) {
        reject(err)
      }
    })
  }

  // Registrar nova captura com suporte offline
  const registerCatch = async catchData => {
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

    // Fazer upload da imagem se existir (com fallback para Data URL quando Supabase não está configurado)
    let photoURL = null
    if (catchData.photo && catchData.photo instanceof File) {
      try {
        console.log('📸 Fazendo upload da foto...')
        photoURL = await uploadImage(catchData.photo, `catches/${user.uid}`)
        console.log('✅ Foto enviada com sucesso:', photoURL)
      } catch (error) {
        console.error('❌ Erro no upload da foto:', error)
        // Fallback: armazenar como Data URL para não perder a imagem quando Supabase não está disponível
        try {
          console.log('🔄 Aplicando fallback: convertendo foto para Data URL...')
          photoURL = await fileToDataURL(catchData.photo)
          console.log('✅ Fallback concluído, imagem convertida em Data URL')
        } catch (fallbackError) {
          console.error('❌ Erro no fallback de imagem:', fallbackError)
          photoURL = null
        }
      }
    }

    const newCatch = {
      ...catchData,
      photo: photoURL, // Substituir o arquivo pela URL
      userId: user.uid,
      userName: user.displayName || user.email,
      registeredAt: new Date().toISOString(),
      id: `temp_${Date.now()}_${user.uid.substring(
        0,
        8
      )}_${Math.random()
        .toString(36)
        .substring(2, 15)}_${performance.now().toString().replace('.', '')}`
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
        notification.notifyCatchRegistered(
          newCatch.species || 'Peixe',
          newCatch.weight
        )

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
        notification.notifyCatchRegistered(
          newCatch.species || 'Peixe',
          newCatch.weight
        )

        console.log(
          'Captura salva offline. Será sincronizada quando a conexão for restaurada.'
        )

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
    const biggestFish = catches.reduce(
      (max, c) => ((c.weight || 0) > (max.weight || 0) ? c : max),
      { weight: 0 }
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
        const tournamentCatches = allLocalCatches.filter(
          c => c.tournamentId === tournamentId
        )
        return computeRankingFromCatches(tournamentCatches, rankingType)
      }

      const q = query(
        collection(db, 'fishing_catches'),
        where('tournamentId', '==', tournamentId)
      )
      const querySnapshot = await getDocs(q)
      const catches = []
      querySnapshot.forEach(doc => {
        catches.push({ id: doc.id, ...doc.data() })
      })

      return computeRankingFromCatches(catches, rankingType)
    } catch (error) {
      console.warn(
        'Aviso ao obter ranking do torneio (usando fallback local):',
        error?.message || error
      )

      // Em caso de erro, tentar usar dados locais como fallback
      try {
        const allLocalCatches = getFromLocalStorage('all_catches', [])
        const userLocalCatches = user
          ? getFromLocalStorage(`user_catches_${user.uid}`, [])
          : []
        const combinedCatches = [...allLocalCatches, ...userLocalCatches]
        const tournamentCatches = combinedCatches.filter(
          c => c.tournamentId === tournamentId
        )
        return computeRankingFromCatches(tournamentCatches, rankingType)
      } catch (localError) {
        console.warn(
          'Aviso ao acessar dados locais para ranking do torneio:',
          localError?.message || localError
        )
      }

      return []
    }
  }

  // Obter ranking geral usando dados sincronizados em tempo real
  const getGeneralRanking = (rankingType = 'weight') => {
    // Usar dados sincronizados em tempo real para ranking instantâneo
    const catchesToUse =
      allCatches.length > 0 ? allCatches : getFromLocalStorage('all_catches', [])
    return computeRankingFromCatches(catchesToUse, rankingType)
  }

  // Encerrar automaticamente campeonatos cujo período já acabou e gerar ranking
  useEffect(() => {
    const finalizeExpiredTournaments = async () => {
      const now = new Date()
      const listToCheck = allTournaments || []
      for (const t of listToCheck) {
        try {
          const endDate = new Date(t.endDate)
          if (isNaN(endDate.getTime())) continue
          const shouldFinish =
            endDate <= now && t.status !== 'finished' && t.status !== 'cancelled'
          if (!shouldFinish) continue
          const finalRanking = await getTournamentRanking(t.id, 'weight')
          if (isOnline) {
            const tournamentRef = doc(db, 'fishing_tournaments', t.id)
            await updateDoc(tournamentRef, {
              status: 'finished',
              finishedAt: new Date().toISOString(),
              finalRanking
            })
          }
          // Atualizar estado local
          setAllTournaments(prev =>
            prev.map(x =>
              x.id === t.id
                ? {
                    ...x,
                    status: 'finished',
                    finishedAt: new Date().toISOString(),
                    finalRanking
                  }
                : x
            )
          )
          setUserTournaments(prev =>
            prev.map(x =>
              x.id === t.id
                ? {
                    ...x,
                    status: 'finished',
                    finishedAt: new Date().toISOString(),
                    finalRanking
                  }
                : x
            )
          )
        } catch (error) {
          console.warn(
            '⚠️ Falha ao finalizar automaticamente campeonato:',
            t?.id,
            error?.message || error
          )
        }
      }
    }
    finalizeExpiredTournaments()
    const interval = setInterval(finalizeExpiredTournaments, 60000) // checar a cada 60s
    return () => clearInterval(interval)
  }, [allTournaments, isOnline])

  // Funções para posts do feed
  const createPost = async postData => {
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
        const tempId = `temp_post_${Date.now()}_${user.uid.substring(
          0,
          8
        )}_${Math.random().toString(36).substring(2, 15)}`
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
        snapshot.forEach(doc => {
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

  const likePost = async postId => {
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

  const sharePost = async postId => {
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
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString() // 7 dias
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

  const generateTournamentInviteLink = tournamentId => {
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
    addOptimisticCatch,
    uploadImage,
    loadUserTournaments,
    loadUserCatches,
    loadAllCatches,
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
  const computeRankingFromCatches = (
    catchesList = [],
    rankingType = 'weight'
  ) => {
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

        if (
          !stats.firstCatchDate ||
          new Date(catchDate) < new Date(stats.firstCatchDate)
        ) {
          stats.firstCatchDate = catchDate
        }

        if (
          !stats.lastCatchDate ||
          new Date(catchDate) > new Date(stats.lastCatchDate)
        ) {
          stats.lastCatchDate = catchDate
        }
      }
    })

    // Calcular estatísticas derivadas
    Object.values(userStats).forEach(stats => {
      // Médias
      stats.averageWeight =
        stats.totalCatches > 0 ? stats.totalWeight / stats.totalCatches : 0
      stats.averageLength =
        stats.totalCatches > 0 ? stats.totalLength / stats.totalCatches : 0

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
          if (b.totalWeight !== a.totalWeight)
            return b.totalWeight - a.totalWeight
          if (b.totalCatches !== a.totalCatches)
            return b.totalCatches - a.totalCatches
          return b.biggestFish.weight - a.biggestFish.weight
        })
        break

      case 'quantity':
        ranking.sort((a, b) => {
          if (b.totalCatches !== a.totalCatches)
            return b.totalCatches - a.totalCatches
          if (b.totalWeight !== a.totalWeight)
            return b.totalWeight - a.totalWeight
          return b.uniqueSpecies - a.uniqueSpecies
        })
        break

      case 'biggest':
        ranking.sort((a, b) => {
          if (b.biggestFish.weight !== a.biggestFish.weight)
            return b.biggestFish.weight - a.biggestFish.weight
          if (b.totalWeight !== a.totalWeight)
            return b.totalWeight - a.totalWeight
          return b.totalCatches - a.totalCatches
        })
        break

      case 'species':
        ranking.sort((a, b) => {
          if (b.uniqueSpecies !== a.uniqueSpecies)
            return b.uniqueSpecies - a.uniqueSpecies
          if (b.totalCatches !== a.totalCatches)
            return b.totalCatches - a.totalCatches
          return b.totalWeight - a.totalWeight
        })
        break

      case 'score':
      default:
        ranking.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          if (b.totalWeight !== a.totalWeight)
            return b.totalWeight - a.totalWeight
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
  const calculateAdvancedScore = stats => {
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
    <FishingContext.Provider value={value}>{children}</FishingContext.Provider>
  )
}

export { FishingProvider, useFishing }
export default FishingContext