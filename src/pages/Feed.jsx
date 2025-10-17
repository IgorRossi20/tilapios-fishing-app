import React, { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Share2, Camera, MapPin, Clock, Fish, Trophy, User, Send, Image, Calendar, Award, ThumbsUp, Bookmark, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFishing } from '../contexts/FishingContext'
import './Feed.css'
import { formatPostForUI, formatTimeAgo } from '../utils/postFormat'

const Feed = () => {
  const { user } = useAuth()
  const { createPost, allPosts, likePost, addComment, sharePost, registerCatch, isOnline } = useFishing()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
 
  const [commentSubmitting, setCommentSubmitting] = useState({})
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
  }, [allPosts])

 

 

  const loadPostsData = async () => {
    try {
      setLoading(true)
      const postsData = allPosts || []
      const formatted = postsData.map(p => formatPostForUI(p, user))
      setPosts(formatted)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPost.fishSpecies || !newPost.weight || !newPost.location) {
      alert('Por favor, preencha todos os campos obrigatórios: espécie, peso e local.')
      return
    }
    if (loading) {
      return
    }
    try {
      setLoading(true)
      const captureData = {
        species: newPost.fishSpecies,
        weight: parseFloat(newPost.weight),
        location: newPost.location,
        date: newPost.date || new Date().toISOString().split('T')[0],
        description: newPost.description,
        photo: newPost.image
      }
      const registeredCatch = await registerCatch(captureData)
      const imageUrl = registeredCatch?.photo || null
      const postData = {
        description: newPost.description,
        fishSpecies: newPost.fishSpecies,
        weight: parseFloat(newPost.weight),
        location: newPost.location,
        date: newPost.date,
        image: imageUrl,
        photo: imageUrl
      }
      const createdPost = await createPost(postData)
      setPosts([formatPostForUI(createdPost, user), ...posts])
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
      alert('Erro ao registrar captura. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    try {
      const isLiked = await likePost(postId)
      // Atualização otimista apenas no estado local; watchers sincronizam em seguida
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const nextLiked = (typeof isLiked === 'boolean') ? isLiked : !post.isLiked
          const delta = nextLiked ? 1 : -1
          return {
            ...post,
            isLiked: nextLiked,
            likesCount: Math.max(0, (post.likesCount || 0) + delta)
          }
        }
        return post
      }))
    } catch (error) {
    }
  }
  
  const handleComment = async (postId) => {
    const commentText = newComment[postId]
    if (!commentText?.trim()) return
    if (commentSubmitting[postId]) return
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }))
    
    try {
      const comment = await addComment(postId, commentText)
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            commentsList: [...(post.commentsList || []), comment]
          }
        }
        return post
      }))
      
      setNewComment({ ...newComment, [postId]: '' })
    } catch (error) {
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }))
    }
  }
  
  const handleShare = async (postId) => {
    try {
      await sharePost(postId)
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            shares: (post.shares || 0) + 1
          }
        }
        return post
      }))
      
      const postToShare = posts.find(p => p.id === postId)
      if (navigator.share) {
        navigator.share({
          title: 'Pescaria incrível!',
          text: `Confira esta captura: ${postToShare?.fishSpecies} de ${postToShare?.weight}kg`,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(window.location.href)
        alert('Link copiado para a área de transferência!')
      }
    } catch (error) {
    }
  }
  
  const toggleComments = (postId) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId]
    })
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="feed">
      <div className="feed-header">
        <h1 className="feed-title">
          <Fish size={40} className="feed-icon" />
          Feed da Comunidade
        </h1>
        <p className="feed-subtitle">
          Compartilhe suas capturas e veja as pescarias dos amigos! 🎣
        </p>
      </div>

      {/* Botão Criar Post */}
      <div className="create-post-container">
        <button 
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="create-post-button"
        >
          <div className="button-icon">
            <Camera size={22} />
          </div>
          <span>Compartilhar Nova Captura</span>
        </button>
      </div>

      {/* Formulário de Criação de Post */}
      {showCreatePost && (
        <div className="create-post-form">
          <h2 className="form-title">
            <Camera size={22} style={{ marginRight: '8px' }} />
            Nova Captura
          </h2>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label className="form-label">
                <MessageCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Conte sobre sua pescaria
              </label>
              <textarea
                className="form-textarea"
                value={newPost.description}
                onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                placeholder="Descreva sua pescaria, como foi a experiência..."
                rows="3"
                maxLength={300}
              />
              <small className="form-hint">{newPost.description.length}/300 caracteres</small>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  <Fish size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Espécie do Peixe
                </label>
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
                <label className="form-label">
                  <Trophy size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-input"
                  value={newPost.weight}
                  onChange={(e) => setNewPost({...newPost, weight: e.target.value})}
                  placeholder="Ex: 2.5"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <MapPin size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Local da Pescaria
              </label>
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
              <label className="form-label">
                <Image size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Foto do Peixe
              </label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="fish-photo"
                  className="file-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label htmlFor="fish-photo" className="file-input-label">
                  <Camera size={18} />
                  {imagePreview ? 'Trocar foto' : 'Escolher foto'}
                </label>
                <small className="form-hint">Adicione uma foto para mostrar sua captura!</small>
              </div>
              {imagePreview && (
                <div className="image-preview">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    loading="lazy"
                  />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => {
                      setImagePreview(null);
                      setNewPost({...newPost, image: null});
                    }}
                  >
                    <AlertCircle size={16} />
                    Remover
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="submit" className="form-btn form-btn-primary">
                <Send size={18} style={{ marginRight: '8px' }} />
                Publicar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCreatePost(false);
                  setNewPost({
                    description: '',
                    fishSpecies: '',
                    weight: '',
                    location: '',
                    date: new Date().toISOString().split('T')[0],
                    image: null
                  });
                  setImagePreview(null);
                }}
                className="form-btn form-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Posts */}
      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Fish size={80} />
            </div>
            <h3 className="empty-text">Nenhuma captura ainda</h3>
            <p className="empty-subtext">Seja o primeiro a compartilhar sua pescaria e inspire outros pescadores!</p>
            <button 
              onClick={() => setShowCreatePost(true)}
              className="empty-button"
            >
              <div className="empty-button-icon">
                <Camera size={24} />
              </div>
              <span>Compartilhar Primeira Captura</span>
            </button>
          </div>
        ) : posts.map(post => (
          <div key={post.id} className="post-card">
            {/* Header do Post */}
            <div className="post-header">
              <div className="post-avatar">
                {post.authorAvatar || '👤'}
              </div>
              <div className="post-user-info">
                <h3 className="post-username">
                  {post.authorName}
                  {post.verified && <span className="verified">✓</span>}
                </h3>
                <div className="post-time">
                  <Clock size={14} />
                  {formatTimeAgo(post.createdAt)}
                </div>
              </div>
              <div className="post-badge">
                Pescador Pro
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
                  <Fish size={18} className="post-detail-icon" />
                  <div>
                    <div className="post-detail-value">{post.fishSpecies}</div>
                    <div className="post-detail-label">Espécie</div>
                  </div>
                </div>
                <div className="post-detail">
                  <Trophy size={18} className="post-detail-icon" />
                  <div>
                    <div className="post-detail-value">{post.weight}kg</div>
                    <div className="post-detail-label">Peso</div>
                  </div>
                </div>
                <div className="post-detail">
                  <MapPin size={18} className="post-detail-icon" />
                  <div>
                    <div className="post-detail-value">{post.location}</div>
                    <div className="post-detail-label">Local</div>
                  </div>
                </div>
              </div>
              
              {/* Imagem do Peixe */}
              <div className="post-image-container">
                {(() => {
                  // Verificar se há imagem válida (tanto image quanto photo)
                  const imageUrl = post.image || post.photo
                  const hasValidImage = imageUrl && 
                    imageUrl !== '🐟' && 
                    imageUrl !== 'null' && 
                    imageUrl !== null && 
                    imageUrl !== 'undefined' &&
                    typeof imageUrl === 'string' &&
                    imageUrl.trim() !== ''
                  
                  if (hasValidImage) {
                    return (
                      <img 
                        src={imageUrl} 
                        alt="Captura de peixe" 
                        className="post-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    )
                  } else {
                    return (
                      <div className="post-image-placeholder">
                        <Fish size={64} className="placeholder-icon" />
                        <span>Sem imagem</span>
                      </div>
                    )
                  }
                })()}
                <div className="post-image-badge">
                  <Camera size={14} style={{ marginRight: '4px' }} /> Captura
                </div>
              </div>
            </div>

            {/* Ações do Post - Estilo Instagram */}
            <div className="post-actions">
              {/* Botões de ação principais */}
              <div className="action-buttons">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`action-btn like-btn ${post.isLiked ? 'liked' : ''}`}
                  disabled={!isOnline}
                >
                  <Heart 
                    size={24} 
                    fill={post.isLiked ? '#ed4956' : 'none'}
                    color={post.isLiked ? '#ed4956' : '#262626'}
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
                  disabled={!isOnline}
                >
                  <Send size={24} color="#262626" />
                </button>
              </div>
              
              {/* Contadores de interação - Estilo Instagram */}
              <div className="interaction-counts">
                {/* Contador de curtidas */}
                <div className="likes-count">
                  {(() => {
                    const total = (post.likesCount || 0)
                    return total > 0 
                      ? `${total} curtida${total !== 1 ? 's' : ''}`
                      : '0 curtidas'
                  })()}
                </div>
                {(() => {
                  const totalShares = post.shares || 0
                  return totalShares > 0 ? (
                    <div className="shares-count">
                      {totalShares} compartilhamento{totalShares !== 1 ? 's' : ''}
                    </div>
                  ) : null
                })()}
              </div>
              
              {/* Link para ver comentários */}
              <button
                onClick={() => toggleComments(post.id)}
                className="comments-toggle"
              >
                {(() => {
                  const total = (post.commentsList || []).length
                  return total > 0 
                    ? `Ver todos os ${total} comentário${total !== 1 ? 's' : ''}`
                    : '0 comentários'
                })()}
              </button>
              {showComments[post.id] && (
                <div className="comments-section">
                  <div style={{ marginBottom: '12px' }}>
                    {(post.commentsList || []).map((comment, index) => (
                      <div key={index} className="comment-item">
                        <span className="comment-author">{comment.authorName || comment.user}</span>
                        {comment.text}
                      </div>
                    ))}
                  </div>
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
                      disabled={!!commentSubmitting[post.id]}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !commentSubmitting[post.id]) {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!!commentSubmitting[post.id] || !newComment[post.id]?.trim()}
                      className="comment-submit"
                    >
                      {commentSubmitting[post.id] ? 'Publicando...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Removido estado vazio duplicado */}
      </div>
    </div>
  )
}

export default Feed