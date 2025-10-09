import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const isValidUrl = (url) => {
  try {
    return url && typeof url === 'string' && url.trim() !== '' && url.startsWith('http')
  } catch { return false }
}

const isValidKey = (key) => {
  try {
    return key && typeof key === 'string' && key.trim() !== '' && key.length > 10
  } catch { return false }
}

export default function SupabaseSetup() {
  const { user } = useAuth()
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [status, setStatus] = useState({ configured: false, message: '' })

  useEffect(() => {
    try {
      const lsUrl = window.localStorage.getItem('TILAPIOS_SUPABASE_URL') || ''
      const lsKey = window.localStorage.getItem('TILAPIOS_SUPABASE_ANON_KEY') || ''
      setUrl(lsUrl)
      setKey(lsKey)
    } catch {}
  }, [])

  const save = () => {
    try {
      if (!isValidUrl(url)) {
        setStatus({ configured: false, message: 'URL inválida. Use https://xxxxx.supabase.co' })
        return
      }
      if (!isValidKey(key)) {
        setStatus({ configured: false, message: 'Chave anônima inválida.' })
        return
      }
      window.localStorage.setItem('TILAPIOS_SUPABASE_URL', url)
      window.localStorage.setItem('TILAPIOS_SUPABASE_ANON_KEY', key)
      setStatus({ configured: true, message: 'Salvo! Recarregando para aplicar...' })
      setTimeout(() => window.location.reload(), 800)
    } catch (e) {
      setStatus({ configured: false, message: 'Erro ao salvar no navegador.' })
    }
  }

  const clear = () => {
    try {
      window.localStorage.removeItem('TILAPIOS_SUPABASE_URL')
      window.localStorage.removeItem('TILAPIOS_SUPABASE_ANON_KEY')
      setUrl('')
      setKey('')
      setStatus({ configured: false, message: 'Overrides removidos. Recarregando...' })
      setTimeout(() => window.location.reload(), 800)
    } catch {}
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Configuração do Supabase</h2>
        <p>Faça login para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20, maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 8 }}>Configurar Supabase</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Cole sua URL do projeto e a chave anônima para habilitar o upload de imagens.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Project URL</div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxxx.supabase.co"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Anon Public Key</div>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJhbGciOi..."
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} style={{ background: '#4caf50', color: '#fff', border: 0, padding: '10px 14px', borderRadius: 6, cursor: 'pointer' }}>Salvar e Aplicar</button>
          <button onClick={clear} style={{ background: '#f44336', color: '#fff', border: 0, padding: '10px 14px', borderRadius: 6, cursor: 'pointer' }}>Limpar Overrides</button>
        </div>
        {status.message && (
          <div style={{ marginTop: 10, color: status.configured ? '#2e7d32' : '#c62828' }}>
            {status.message}
          </div>
        )}
        <div style={{ marginTop: 16, fontSize: 13, color: '#777' }}>
          Dica: para produção, configure as variáveis no Vercel. Esta página guarda as credenciais apenas no seu navegador.
        </div>
      </div>
    </div>
  )
}