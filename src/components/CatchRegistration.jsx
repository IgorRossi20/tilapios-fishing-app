import React, { useState, useEffect } from 'react'
import { Fish, Calendar, Weight, Camera, Trophy, TrendingUp, Award } from 'lucide-react'
import { useFishing } from '../contexts/FishingContext'
import { compressImage, validateImageFile } from '../utils/imageCompression'
import './CatchRegistration.css'

const CatchRegistration = () => {
  const { userTournaments, registerCatch, calculateUserStats } = useFishing()
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    tournamentId: '',
    photo: null,
    notes: ''
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const [userStats, setUserStats] = useState(null)

  // Espécies de peixes comuns
  const fishSpecies = [
    'Tilápia',
    'Tambacu',
    'Tambaqui',
    'Pintado',
    'Pirarucu',
    'Pirarara',
    'Dourado',
    'Pacu'
  ]

  useEffect(() => {
    const stats = calculateUserStats()
    setUserStats(stats)
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.species || !formData.weight) {
      setMessage('Espécie e peso são obrigatórios!')
      setMessageType('error')
      return
    }

    // Prevenir dupla submissão
    if (loading) {
      return
    }

    try {
      setLoading(true)
      await registerCatch({
        ...formData,
        weight: parseFloat(formData.weight),
        caughtAt: new Date().toISOString()
      })
      
      setMessage('Pesca registrada com sucesso!')
      setMessageType('success')
      
      // Reset form
      setFormData({
        species: '',
        weight: '',
        tournamentId: '',
        photo: null,
        notes: ''
      })
      
      // Update stats
      const newStats = calculateUserStats()
      setUserStats(newStats)
      
    } catch (error) {
      setMessage('Erro ao registrar pesca: ' + error.message)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        setMessage('📸 Processando imagem...')
        setMessageType('info')
        
        // Validar arquivo
        validateImageFile(file)
        
        // Comprimir imagem para máximo 5MB
        console.log('🔄 Iniciando compressão da imagem...')
        const compressedFile = await compressImage(file)
        
        // Armazenar arquivo comprimido
        setFormData({ ...formData, photo: compressedFile })
        
        setMessage(`✅ Imagem processada com sucesso! Tamanho final: ${formatFileSize(compressedFile.size)}`)
        setMessageType('success')
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setMessage('')
          setMessageType('')
        }, 3000)
        
      } catch (error) {
        console.error('❌ Erro ao processar imagem:', error)
        setMessage('Erro ao processar imagem: ' + error.message)
        setMessageType('error')
        
        // Limpar seleção de arquivo em caso de erro
        e.target.value = ''
        setFormData({ ...formData, photo: null })
      }
    }
  }

  // Função auxiliar para formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="catch-registration">
      <div className="container">
        <div className="header">
          <h1><Fish size={24} /> Registrar Pesca</h1>
          <p>Registre suas capturas e acompanhe seu progresso</p>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {messageType === 'success' ? '✅ ' : '❌ '}{message}
          </div>
        )}

        <div className="content-grid">
            <div className="content-card">
              <div className="card-title">
                <Fish size={20} /> Formulário de Registro
              </div>
              <form onSubmit={handleSubmit} className="catch-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Fish size={16} />
                    Espécie do Peixe *
                  </label>
                  <select
                    className="form-select"
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    required
                  >
                    <option value="">Selecione a espécie</option>
                    {fishSpecies.map(species => (
                      <option key={species} value={species}>{species}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Weight size={16} />
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Ex: 2.5"
                    required
                  />
                </div>
              </div>

              {/* Campos de Comprimento e Local da Pesca removidos conforme solicitado */}

              <div className="form-group">
                <label className="form-label">
                  <Trophy size={16} />
                  Campeonato (opcional)
                </label>
                <select
                  className="form-select"
                  value={formData.tournamentId}
                  onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                >
                  <option value="">Pesca livre (não vinculada a campeonato)</option>
                  {userTournaments.map(tournament => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Camera size={16} />
                  Foto da Pesca
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input file-input"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Adicione observações sobre a pesca..."
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Pesca'} <Trophy size={20} />
              </button>
            </form>
          </div>


        </div>
      </div>
    </div>
  )
}

export default CatchRegistration