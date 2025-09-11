import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Camera, MapPin, Clock, Fish, Trophy, User, Send } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFishing } from '../contexts/FishingContext'
import './Feed.css'

const Feed = () => {
  const { user } = useAuth()
  const { createPost, loadPosts, likePost, addComment, sharePost } = useFishing()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [newPost, setNewPost] = useState({
    description: '',
    fishSpecies: '',
    weight: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    image: null
  })
  
  const [imagePreview, setImagePreview] = useState(null)
  
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewPost(prev => ({
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

  useEffect(() => {
    loadPostsData()
  }, [])

  const loadPostsData = async () => {
    try {
      setLoading(true)
      const postsData = await loadPosts()
      setPosts(postsData)
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    
    // Validar formulário
    if (!newPost.fishSpecies || !newPost.weight || !newPost.location) {
      alert('Por favor, preencha todos os campos obrigatórios: espécie, peso e local.')
      return
    }
    
    // Prevenir dupla submissão
    if (loading) {
      return
    }
    
    try {
      setLoading(true)
      
      // Processar imagem se existir
      let imageUrl = '🐟' // Emoji padrão se não tiver imagem
      if (newPost.image && typeof newPost.image !== 'string') {
        // Em um app real, aqui faria upload da imagem para um servidor
        // e obteria a URL. Por enquanto, usamos o preview como URL
        imageUrl = imagePreview
      }
      
      // Criar dados da captura no formato esperado pelo registerCatch
      const captureData = {
        species: newPost.fishSpecies,
        weight: parseFloat(newPost.weight),
        location: newPost.location,
        date: newPost.date || new Date().toISOString().split('T')[0],
        description: newPost.description,
        image: imageUrl
      }
      
      // Registrar a captura usando a função do contexto
      const { registerCatch } = useFishing()
      await registerCatch(captureData)
      
      // Criar post para o feed com os mesmos dados
      const postData = {
        description: newPost.description,
        fishSpecies: newPost.fishSpecies,
        weight: parseFloat(newPost.weight),
        location: newPost.location,
        image: imageUrl
      }
      
      const createdPost = await createPost(postData)
      
      // Atualizar lista de posts
      setPosts([createdPost, ...posts])
      
      // Reset form
      setNewPost({
        description: '',
        fishSpecies: '',
        weight: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        image: null
      })
      setImagePreview(null)
      setShowCreatePost(false)
      
      alert('Captura registrada com sucesso! 🎣')
    } catch (error) {
      console.error('Erro ao criar post:', error)
      alert('Erro ao registrar captura. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      const isLiked = await likePost(postId)
      
      // Atualizar estado local
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const likes = post.likes || []
          const userLiked = likes.includes(user.uid)
          
          return {
            ...post,
            likes: userLiked 
              ? likes.filter(uid => uid !== user.uid)
              : [...likes, user.uid]
          }
        }
        return post
      }))
    } catch (error) {
      console.error('Erro ao curtir post:', error)
    }
  }
  
  const handleComment = async (postId) => {
    const commentText = newComment[postId]
    if (!commentText?.trim()) return
    
    try {
      const comment = await addComment(postId, commentText)
      
      // Atualizar estado local
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), comment]
          }
        }
        return post
      }))
      
      // Limpar campo de comentário
      setNewComment({ ...newComment, [postId]: '' })
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
    }
  }
  
  const handleShare = async (postId) => {
    try {
      await sharePost(postId)
      
      // Atualizar contador local
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            shares: (post.shares || 0) + 1
          }
        }
        return post
      }))
      
      // Simular compartilhamento nativo
       const postToShare = posts.find(p => p.id === postId)
       if (navigator.share) {
         navigator.share({
           title: 'Pescaria incrível!',
           text: `Confira esta captura: ${postToShare?.fishSpecies} de ${postToShare?.weight}kg`,
           url: window.location.href
         })
       } else {
         // Fallback: copiar para clipboard
         navigator.clipboard.writeText(window.location.href)
         alert('Link copiado para a área de transferência!')
       }
    } catch (error) {
      console.error('Erro ao compartilhar post:', error)
    }
  }
  
  const toggleComments = (postId) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId]
    })
  }

  const formatTimeAgo = (timestamp) => {
    try {
      // Verificar se o timestamp é válido
      if (!timestamp) {
        return 'Data não disponível'
      }
      
      // Converter para Date se necessário
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data não disponível'
      }
      
      const now = new Date()
      const diff = now - date
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor(diff / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}h atrás`
      } else if (minutes > 0) {
        return `${minutes}min atrás`
      } else {
        return 'Agora'
      }
    } catch (error) {
      console.error('Erro ao formatar timestamp:', error)
      return 'Data não disponível'
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
    <div className="container" style={{ paddingTop: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="mb-3">
        <h1 style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <Fish size={32} className="text-primary" style={{ marginRight: '15px' }} />
          Feed da Comunidade
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Compartilhe suas capturas e veja as pescarias dos amigos! 🎣
        </p>
      </div>

      {/* Botão Criar Post */}
      <div className="card mb-3">
        <button 
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="btn"
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '15px'
          }}
        >
          <Camera size={20} style={{ marginRight: '10px' }} />
          Compartilhar Nova Captura
        </button>
      </div>

      {/* Formulário de Criação de Post */}
      {showCreatePost && (
        <div className="card mb-3">
          <h2 style={{ marginBottom: '20px' }}>Nova Captura</h2>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label className="form-label">Conte sobre sua pescaria</label>
              <textarea
                className="form-textarea"
                value={newPost.description}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                placeholder="Descreva sua pescaria, como foi a experiência..."
                rows="3"
                required
              />
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
              <label className="form-label">Espécie do Peixe</label>
              <select
                className="form-input"
                value={newPost.fishSpecies}
                onChange={(e) => setNewPost({...newPost, fishSpecies: e.target.value})}
                required
              >
                <option value="">Selecione a espécie</option>
                {fishSpecies.map((species, index) => (
                  <option key={index} value={species}>{species}</option>
                ))}
              </select>
            </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={newPost.weight}
                  onChange={(e) => setNewPost({...newPost, weight: e.target.value})}
                  placeholder="Ex: 2.5"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Local da Pescaria</label>
              <input
                type="text"
                className="form-input"
                value={newPost.location}
                onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                placeholder="Ex: Lago Azul, São Paulo"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Foto do Peixe</label>
              <input
                type="file"
                className="form-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>Adicione uma foto para mostrar sua captura!</small>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px', borderRadius: '8px' }} />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>Publicar</button>
              <button 
                type="button" 
                onClick={() => setShowCreatePost(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Posts */}
      <div className="posts-container">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            {/* Header do Post - Estilo Instagram */}
            <div className="post-header">
              <div className="post-avatar">
                {post.authorAvatar || '👤'}
              </div>
              <div className="post-user-info">
                <h3 className="post-user-name">{post.authorName}</h3>
                <div className="post-timestamp">
                  <Clock size={12} />
                  {formatTimeAgo(post.createdAt)}
                </div>
              </div>
              <div className="post-user-level">
                Pescador
              </div>
            </div>

            {/* Conteúdo do Post */}
            <div className="post-content">
              <p className="post-description">
                {post.description}
              </p>
              
              {/* Informações do Peixe */}
              <div className="post-details">
                <div className="post-detail">
                  <Fish size={16} />
                  <div>
                    <div className="detail-value">{post.fishSpecies}</div>
                    <div className="detail-label">Espécie</div>
                  </div>
                </div>
                <div className="post-detail">
                  <Trophy size={16} />
                  <div>
                    <div className="detail-value">{post.weight}kg</div>
                    <div className="detail-label">Peso</div>
                  </div>
                </div>
                <div className="post-detail">
                  <MapPin size={16} />
                  <div>
                    <div className="detail-value">{post.location}</div>
                    <div className="detail-label">Local</div>
                  </div>
                </div>
              </div>
              
              {/* Imagem do Peixe - Estilo Instagram */}
              <div style={{ 
                width: '100%',
                aspectRatio: '1/1',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{ 
                  fontSize: '64px', 
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  {post.image}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  📸 Captura
                </div>
              </div>
            </div>

            {/* Ações do Post - Estilo Instagram */}
            <div className="post-actions">
              {/* Botões de ação principais */}
              <div className="action-buttons">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`action-btn like-btn ${(post.likes || []).includes(user?.uid) ? 'liked' : ''}`}
                >
                  <Heart 
                    size={24} 
                    fill={(post.likes || []).includes(user?.uid) ? '#ed4956' : 'none'}
                    color={(post.likes || []).includes(user?.uid) ? '#ed4956' : '#262626'}
                  />
                </button>
                
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="action-btn"
                >
                  <MessageCircle size={24} color="#262626" />
                </button>
                
                <button 
                  onClick={() => handleShare(post.id)}
                  className="action-btn"
                >
                  <Send size={24} color="#262626" />
                </button>
              </div>
              
              {/* Contadores de interação - Estilo Instagram */}
              <div className="interaction-counts">
                {/* Contador de curtidas */}
                <div className="likes-count">
                  {(post.likes || []).length > 0 ? (
                    `${(post.likes || []).length} curtida${(post.likes || []).length !== 1 ? 's' : ''}`
                  ) : (
                    '0 curtidas'
                  )}
                </div>
                
                {/* Contador de compartilhamentos */}
                {(post.shares || 0) > 0 && (
                  <div className="shares-count">
                    {post.shares} compartilhamento{post.shares !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              {/* Link para ver comentários */}
              <button
                onClick={() => toggleComments(post.id)}
                className="comments-toggle"
              >
                {(post.comments || []).length > 0 ? (
                  `Ver todos os ${(post.comments || []).length} comentário${(post.comments || []).length !== 1 ? 's' : ''}`
                ) : (
                  '0 comentários'
                )}
              </button>
              
              {/* Seção de comentários */}
              {showComments[post.id] && (
                <div className="comments-section">
                  {/* Lista de comentários */}
                  <div style={{ marginBottom: '12px' }}>
                    {(post.comments || []).map((comment, index) => (
                      <div key={index} className="comment-item">
                        <span className="comment-author">{comment.authorName}</span>
                        {comment.text}
                      </div>
                    ))}
                  </div>
                  
                  {/* Campo para novo comentário */}
                  <div className="comment-input-container">
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({
                        ...newComment,
                        [post.id]: e.target.value
                      })}
                      className="comment-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="comment-submit"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Fish size={48} style={{ color: '#ddd', marginBottom: '15px' }} />
            <p style={{ color: '#666', marginBottom: '20px' }}>Nenhuma captura compartilhada ainda.</p>
            <button 
              onClick={() => setShowCreatePost(true)}
              className="btn"
            >
              Compartilhar Primeira Captura
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Feed