import React, { useState, useEffect } from 'react'
import { Fish, MapPin, Calendar, Weight, Ruler, Camera, Trophy } from 'lucide-react'
import { useFishing } from '../contexts/FishingContext'
import './CatchRegistration.css'

const CatchRegistration = () => {
  const { userTournaments, registerCatch, calculateUserStats } = useFishing()
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    length: '',
    location: '',
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
    'Tucunaré',
    'Dourado',
    'Pintado',
    'Pacu',
    'Traíra',
    'Lambari',
    'Tilápia',
    'Bagre',
    'Piau',
    'Corvina',
    'Robalo',
    'Outro'
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
        length: formData.length ? parseFloat(formData.length) : null,
        caughtAt: new Date().toISOString()
      })
      
      setMessage('Pesca registrada com sucesso!')
      setMessageType('success')
      
      // Reset form
      setFormData({
        species: '',
        weight: '',
        length: '',
        location: '',
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, photo: file })
    }
  }

  return (
    <div className="catch-registration">
      <div className="container">
        <div className="header">
          <h1>
            <Fish size={32} className="text-primary" />
            Registrar Pesca
          </h1>
          <p>Registre sua pesca e acompanhe suas estatísticas!</p>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="content">
          <div className="form-section">
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

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Ruler size={16} />
                    Comprimento (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    placeholder="Ex: 45"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={16} />
                    Local da Pesca
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Lago das Garças"
                  />
                </div>
              </div>

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
                  className="form-input"
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
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Pesca'}
              </button>
            </form>
          </div>

          {userStats && (
            <div className="stats-section">
              <h3>Suas Estatísticas</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Fish size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.totalCatches}</span>
                    <span className="stat-label">Total de Pescas</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Weight size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.totalWeight.toFixed(2)} kg</span>
                    <span className="stat-label">Peso Total</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Trophy size={24} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{userStats.averageWeight.toFixed(2)} kg</span>
                    <span className="stat-label">Peso Médio</span>
                  </div>
                </div>

                {userStats.biggestFish.weight > 0 && (
                  <div className="stat-card highlight">
                    <div className="stat-icon">
                      <Fish size={24} />
                    </div>
                    <div className="stat-info">
                      <span className="stat-value">{userStats.biggestFish.weight} kg</span>
                      <span className="stat-label">Maior Peixe</span>
                      <span className="stat-detail">{userStats.biggestFish.species}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CatchRegistration