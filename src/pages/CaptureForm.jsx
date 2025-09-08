import React, { useState } from 'react'
import { Fish, MapPin, Calendar, Camera, Weight, Save, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const CaptureForm = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    image: null
  })

  const fishSpecies = [
    'Tucunaré',
    'Dourado',
    'Pintado',
    'Tilápia',
    'Pacu',
    'Tambaqui',
    'Pirarucu',
    'Traíra',
    'Corvina',
    'Robalo',
    'Outro'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }))
      
      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevenir dupla submissão
    if (loading) {
      return
    }
    
    setLoading(true)

    try {
      // Simular salvamento da captura
      const captureData = {
        id: `capture_${performance.now()}_${Math.random().toString(36).substring(2, 9)}_${crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Date.now()}`,
        userId: user.uid,
        userName: user.displayName,
        species: formData.species,
        weight: parseFloat(formData.weight),
        location: formData.location,
        date: formData.date,
        description: formData.description,
        image: imagePreview || '🐟',
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: []
      }

      // Salvar no localStorage (mock)
      const existingCaptures = JSON.parse(localStorage.getItem('userCaptures') || '[]')
      existingCaptures.push(captureData)
      localStorage.setItem('userCaptures', JSON.stringify(existingCaptures))

      // Atualizar estatísticas do usuário
      const userStats = JSON.parse(localStorage.getItem('userStats') || '{}')
      userStats.totalFish = (userStats.totalFish || 0) + 1
      userStats.totalWeight = (userStats.totalWeight || 0) + parseFloat(formData.weight)
      localStorage.setItem('userStats', JSON.stringify(userStats))

      alert('Captura registrada com sucesso! 🎣')
      navigate('/profile')
    } catch (error) {
      console.error('Erro ao registrar captura:', error)
      alert('Erro ao registrar captura. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px',
              padding: '5px'
            }}
          >
            <ArrowLeft size={24} color="#666" />
          </button>
          <h1 style={{ margin: 0, color: '#333' }}>
            <Fish size={28} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#2196F3' }} />
            Registrar Captura
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Upload de Imagem */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">
              <Camera size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Foto da Captura
            </label>
            <div style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div>
                    <Camera size={48} color="#ccc" style={{ marginBottom: '10px' }} />
                    <p style={{ color: '#666', margin: 0 }}>Clique para adicionar uma foto</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Espécie */}
          <div className="form-group">
            <label className="form-label">
              <Fish size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Espécie do Peixe
            </label>
            <select
              name="species"
              value={formData.species}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Selecione a espécie</option>
              {fishSpecies.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {/* Peso */}
          <div className="form-group">
            <label className="form-label">
              <Weight size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Peso (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ex: 2.5"
              step="0.1"
              min="0"
              required
            />
          </div>

          {/* Local */}
          <div className="form-group">
            <label className="form-label">
              <MapPin size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Local da Pesca
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ex: Lago Azul, SP"
              required
            />
          </div>

          {/* Data */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Data da Captura
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label className="form-label">Descrição (opcional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Conte como foi essa pescaria..."
              rows="3"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#ccc' : '#4CAF50',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Save size={18} />
            {loading ? 'Salvando...' : 'Registrar Captura'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CaptureForm