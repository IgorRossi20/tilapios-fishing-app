import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import useToast from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase/config'
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { toDateSafe } from '../utils/postFormat'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const { success, error, warning, info } = useToast()
  const [localNotifications, setLocalNotifications] = useState([])
  const [dbNotifications, setDbNotifications] = useState([])

  // Mapear documento do Firestore para item de UI
  const mapDbNotification = useCallback((id, data) => {
    let message = 'Nova interação'
    if (data?.type === 'like') {
      message = `${data?.actorName || 'Alguém'} curtiu sua publicação`
    } else if (data?.type === 'comment') {
      const preview = (data?.commentText || '').slice(0, 80)
      message = `${data?.actorName || 'Alguém'} comentou: ${preview}`
    }
    return {
      id,
      message,
      type: 'info',
      category: 'social',
      timestamp: data?.createdAt || new Date().toISOString(),
      read: !!data?.read,
      postId: data?.postId || null
    }
  }, [])

  // Assinatura em tempo real das notificações sociais do usuário
  useEffect(() => {
    if (!user?.uid) {
      setDbNotifications([])
      return
    }
    try {
      const notifCol = collection(db, 'notifications')
      const q = query(
        notifCol,
        where('recipientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
      const unsubscribe = onSnapshot(q, snapshot => {
        const items = snapshot.docs.map(d => mapDbNotification(d.id, d.data()))
        setDbNotifications(items)
      })
      return () => unsubscribe()
    } catch (e) {
      return () => {}
    }
  }, [user, mapDbNotification])

  // Função para adicionar notificação ao histórico local (toasts)
  const addNotification = useCallback((message, type, category = 'general') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      category,
      timestamp: new Date().toISOString(),
      read: false
    }
    setLocalNotifications(prev => [notification, ...prev.slice(0, 49)])

    // Mostrar toast
    switch (type) {
      case 'success':
        success(message)
        break
      case 'error':
        error(message)
        break
      case 'warning':
        warning(message)
        break
      default:
        info(message)
    }

    return notification.id
  }, [success, error, warning, info])

  // Notificações específicas para campeonatos
  const notifyTournamentCreated = useCallback((tournamentName) => {
    return addNotification(
      `Campeonato "${tournamentName}" criado com sucesso!`,
      'success',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentJoined = useCallback((tournamentName) => {
    return addNotification(
      `Você entrou no campeonato "${tournamentName}"!`,
      'success',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentLeft = useCallback((tournamentName) => {
    return addNotification(
      `Você saiu do campeonato "${tournamentName}".`,
      'info',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentFinished = useCallback((tournamentName) => {
    return addNotification(
      `Campeonato "${tournamentName}" foi finalizado!`,
      'success',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentDeleted = useCallback((tournamentName) => {
    return addNotification(
      `Campeonato "${tournamentName}" foi excluído.`,
      'warning',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentStarted = useCallback((tournamentName) => {
    return addNotification(
      `O campeonato "${tournamentName}" começou! Boa sorte!`,
      'info',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentEnding = useCallback((tournamentName, hoursLeft) => {
    return addNotification(
      `O campeonato "${tournamentName}" termina em ${hoursLeft} horas!`,
      'warning',
      'tournament'
    )
  }, [addNotification])

  const notifyNewParticipant = useCallback((tournamentName, participantName) => {
    return addNotification(
      `${participantName} entrou no campeonato "${tournamentName}"!`,
      'info',
      'tournament'
    )
  }, [addNotification])

  const notifyTournamentFull = useCallback((tournamentName) => {
    return addNotification(
      `O campeonato "${tournamentName}" está lotado!`,
      'warning',
      'tournament'
    )
  }, [addNotification])

  // Notificações para capturas
  const notifyCatchRegistered = useCallback((fishSpecies, weight) => {
    return addNotification(
      `Captura registrada: ${fishSpecies} (${weight}kg)!`,
      'success',
      'catch'
    )
  }, [addNotification])

  const notifyNewRecord = useCallback((fishSpecies, weight) => {
    return addNotification(
      `Novo recorde pessoal: ${fishSpecies} (${weight}kg)! 🏆`,
      'success',
      'achievement'
    )
  }, [addNotification])

  // Notificações de ranking
  const notifyRankingUpdate = useCallback((tournamentName, position) => {
    const positionText = position === 1 ? '1º lugar' : position === 2 ? '2º lugar' : position === 3 ? '3º lugar' : `${position}º lugar`
    return addNotification(
      `Você está em ${positionText} no campeonato "${tournamentName}"!`,
      'info',
      'ranking'
    )
  }, [addNotification])

  // Notificações de sincronização
  const notifySyncSuccess = useCallback(() => {
    return addNotification(
      'Dados sincronizados com sucesso!',
      'success',
      'sync'
    )
  }, [addNotification])

  const notifySyncError = useCallback(() => {
    return addNotification(
      'Erro na sincronização. Dados salvos localmente.',
      'warning',
      'sync'
    )
  }, [addNotification])

  const notifyOfflineMode = useCallback(() => {
    return addNotification(
      'Modo offline ativado. Dados serão sincronizados quando a conexão for restaurada.',
      'info',
      'sync'
    )
  }, [addNotification])

  // Notificações de convites
  const notifyInviteSent = useCallback((inviteeEmail, tournamentName) => {
    return addNotification(
      `Convite enviado para ${inviteeEmail} para o campeonato "${tournamentName}"!`,
      'success',
      'invite'
    )
  }, [addNotification])

  const notifyInviteReceived = useCallback((tournamentName, inviterName) => {
    return addNotification(
      `Você foi convidado por ${inviterName} para o campeonato "${tournamentName}"!`,
      'info',
      'invite'
    )
  }, [addNotification])

  const notifyInviteAccepted = useCallback(() => {
    return addNotification(
      'Convite aceito! Você entrou no campeonato!',
      'success',
      'invite'
    )
  }, [addNotification])

  const notifyInviteDeclined = useCallback((tournamentName) => {
    return addNotification(
      `Convite para o campeonato "${tournamentName}" foi recusado.`,
      'info',
      'invite'
    )
  }, [addNotification])

  const notifyInviteExpired = useCallback((tournamentName) => {
    return addNotification(
      `Convite para o campeonato "${tournamentName}" expirou.`,
      'warning',
      'invite'
    )
  }, [addNotification])

  // Lista combinada para consumo na UI
  const notifications = useMemo(() => {
    const all = [...dbNotifications, ...localNotifications]
    return all.sort((a, b) => {
      const ta = (toDateSafe(a.timestamp)?.getTime()) || 0
      const tb = (toDateSafe(b.timestamp)?.getTime()) || 0
      return tb - ta
    })
  }, [dbNotifications, localNotifications])

  // Funções de gerenciamento
  const markAsRead = useCallback(async (notificationId) => {
    // Tentar marcar no Firestore se for uma notificação remota
    try {
      const remote = dbNotifications.find(n => n.id === notificationId)
      if (remote) {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true })
        setDbNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
        return
      }
    } catch {}
    // Senão, marcar local
    setLocalNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [dbNotifications])

  const markAllAsRead = useCallback(async () => {
    try {
      // Marcar todas remotas
      await Promise.all(
        dbNotifications.filter(n => !n.read).map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      )
      setDbNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
    // Marcar todas locais
    setLocalNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }, [dbNotifications])

  const clearNotifications = useCallback(() => {
    setLocalNotifications([])
    // Não apagamos as notificações remotas do Firestore aqui por segurança
  }, [])

  const getUnreadCount = useCallback(() => {
    const localUnread = localNotifications.filter(n => !n.read).length
    const remoteUnread = dbNotifications.filter(n => !n.read).length
    return localUnread + remoteUnread
  }, [localNotifications, dbNotifications])

  const value = {
    notifications,
    addNotification,
    // Notificações de campeonatos
    notifyTournamentCreated,
    notifyTournamentJoined,
    notifyTournamentLeft,
    notifyTournamentFinished,
    notifyTournamentDeleted,
    notifyTournamentStarted,
    notifyTournamentEnding,
    notifyNewParticipant,
    notifyTournamentFull,
    // Notificações de capturas
    notifyCatchRegistered,
    notifyNewRecord,
    // Notificações de ranking
    notifyRankingUpdate,
    // Notificações de sincronização
    notifySyncSuccess,
    notifySyncError,
    notifyOfflineMode,
    // Notificações de convites
    notifyInviteSent,
    notifyInviteReceived,
    notifyInviteAccepted,
    notifyInviteDeclined,
    notifyInviteExpired,
    // Gerenciamento
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider