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
    image: null
  })

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
    
    // Prevenir dupla submissão
    if (loading) {
      return
    }
    
    try {
      setLoading(true)
      
      const postData = {
        description: newPost.description,
        fishSpecies: newPost.fishSpecies,
        weight: parseFloat(newPost.weight),
        location: newPost.location,
        image: '🐟' // Por enquanto emoji, depois implementar upload
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
        image: null
      })
      setShowCreatePost(false)
    } catch (error) {
      console.error('Erro ao criar post:', error)
      alert('Erro ao criar post. Tente novamente.')
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
    const now = new Date()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h atrás`
    } else if (minutes > 0) {
      return `${minutes}min atrás`
    } else {
      return 'Agora'
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
                <input
                  type="text"
                  className="form-input"
                  value={newPost.fishSpecies}
                  onChange={(e) => setNewPost({...newPost, fishSpecies: e.target.value})}
                  placeholder="Ex: Tucunaré, Dourado..."
                  required
                />
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
                onChange={(e) => setNewPost({...newPost, image: e.target.files[0]})}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>Adicione uma foto para mostrar sua captura!</small>
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
      <div>
        {posts.map(post => (
          <div key={post.id} className="card mb-3">
            {/* Header do Post */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                borderRadius: '50%', 
                background: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '15px'
              }}>
                {post.authorAvatar || '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>{post.authorName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-success" style={{ fontSize: '12px' }}>Pescador</span>
                  <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center' }}>
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo do Post */}
            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#333', marginBottom: '15px', lineHeight: '1.5' }}>
                {post.description}
              </p>
              
              {/* Informações do Peixe */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Fish size={16} style={{ marginRight: '8px', color: '#2196F3' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{post.fishSpecies}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Trophy size={16} style={{ marginRight: '8px', color: '#FF9800' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{post.weight}kg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MapPin size={16} style={{ marginRight: '8px', color: '#4CAF50' }} />
                    <span style={{ fontSize: '14px' }}>{post.location}</span>
                  </div>
                </div>
              </div>
              
              {/* Imagem do Peixe */}
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                background: '#f0f8ff',
                borderRadius: '8px',
                border: '2px dashed #2196F3'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>{post.image}</div>
                <p style={{ color: '#666', margin: 0 }}>Foto da captura</p>
              </div>
            </div>

            {/* Ações do Post - Estilo Instagram */}
            <div style={{ 
              padding: '10px 0',
              borderTop: '1px solid #eee',
              marginTop: '15px'
            }}>
              {/* Botões de ação principais */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    onClick={() => handleLike(post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      transition: 'transform 0.1s ease'
                    }}
                    onMouseDown={(e) => e.target.style.transform = 'scale(0.9)'}
                    onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <Heart 
                      size={24} 
                      fill={(post.likes || []).includes(user?.uid) ? '#e74c3c' : 'none'}
                      color={(post.likes || []).includes(user?.uid) ? '#e74c3c' : '#262626'}
                    />
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                  >
                    <MessageCircle size={24} color="#262626" />
                  </button>
                  
                  <button 
                    onClick={() => handleShare(post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px'
                    }}
                  >
                    <Send size={24} color="#262626" />
                  </button>
                </div>
              </div>
              
              {/* Contador de curtidas */}
              {(post.likes || []).length > 0 && (
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#262626',
                  marginBottom: '8px'
                }}>
                  {(post.likes || []).length} curtida{(post.likes || []).length !== 1 ? 's' : ''}
                </div>
              )}
              
              {/* Link para ver comentários */}
              {(post.comments || []).length > 0 && (
                <button
                  onClick={() => toggleComments(post.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8e8e8e',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '0',
                    marginBottom: '8px'
                  }}
                >
                  Ver todos os {(post.comments || []).length} comentário{(post.comments || []).length !== 1 ? 's' : ''}
                </button>
              )}
              
              {/* Seção de comentários */}
              {showComments[post.id] && (
                <div style={{ marginTop: '15px' }}>
                  {/* Lista de comentários */}
                  <div style={{ marginBottom: '15px' }}>
                    {(post.comments || []).map((comment, index) => (
                      <div key={index} style={{ 
                        marginBottom: '8px',
                        fontSize: '14px',
                        color: '#262626',
                        lineHeight: '1.4'
                      }}>
                        <strong>{comment.authorName}</strong> {comment.text}
                      </div>
                    ))}
                  </div>
                  
                  {/* Campo para novo comentário */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '10px',
                    borderTop: '1px solid #eee',
                    paddingTop: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment({
                        ...newComment,
                        [post.id]: e.target.value
                      })}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px',
                        padding: '8px 0'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: newComment[post.id]?.trim() ? '#0095f6' : '#c7c7c7',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: newComment[post.id]?.trim() ? 'pointer' : 'default',
                        padding: '0'
                      }}
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