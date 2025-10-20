import React from 'react'
import { useFishing } from '../contexts/FishingContext'
import './SyncStatus.css'

const SyncStatus = () => {
  const { isOnline, syncStatus, getFromLocalStorage } = useFishing()
  
  const pendingCatches = getFromLocalStorage('pending_catches', [])
  const pendingInviteUpdates = getFromLocalStorage('pending_invite_status_updates', [])
  const pendingCountTotal = (pendingCatches?.length || 0) + (pendingInviteUpdates?.length || 0)
  const hasPendingData = pendingCountTotal > 0
  
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: '📴',
        text: 'Offline',
        className: 'sync-status offline',
        description: hasPendingData ? `${pendingCountTotal} itens pendentes` : 'Dados salvos localmente'
      }
    }
    
    if (syncStatus === 'syncing') {
      return {
        icon: '🔄',
        text: 'Sincronizando...',
        className: 'sync-status syncing',
        description: 'Enviando dados para o servidor'
      }
    }
    
    if (syncStatus === 'error') {
      return {
        icon: '⚠️',
        text: 'Erro na sincronização',
        className: 'sync-status error',
        description: 'Falha ao sincronizar dados'
      }
    }
    
    if (hasPendingData) {
      return {
        icon: '⏳',
        text: 'Dados pendentes',
        className: 'sync-status pending',
        description: `${pendingCountTotal} itens aguardando sincronização`
      }
    }
    
    return {
      icon: '✅',
      text: 'Sincronizado',
      className: 'sync-status online',
      description: 'Todos os dados estão atualizados'
    }
  }
  
  const statusInfo = getStatusInfo()
  
  return (
    <div className={statusInfo.className} title={statusInfo.description}>
      <span className="sync-icon">{statusInfo.icon}</span>
      <span className="sync-text">{statusInfo.text}</span>
      {hasPendingData && (
        <span className="pending-count">{pendingCountTotal}</span>
      )}
    </div>
  )
}

export default SyncStatus