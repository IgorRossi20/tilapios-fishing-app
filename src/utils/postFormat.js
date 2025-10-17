// Helper para formatação padronizada de posts para UI (Home e Feed)

// Conversão robusta de timestamps variados para Date
export const toDateSafe = (ts) => {
  try {
    if (!ts) return null
    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts
    if (typeof ts === 'string') {
      const d = new Date(ts)
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof ts === 'number') {
      const d = new Date(ts)
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof ts === 'object' && typeof ts.seconds === 'number') {
      const d = new Date(ts.seconds * 1000)
      return isNaN(d.getTime()) ? null : d
    }
    return null
  } catch {
    return null
  }
}

// Formatação de tempo relativo (ex: "3h atrás", "12min atrás", "Agora")
export const formatTimeAgo = (ts, now = new Date()) => {
  try {
    const date = toDateSafe(ts)
    if (!date) return 'Data não disponível'
    const diffMs = now - date
    if (diffMs < 0) return 'Agora'
    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}min atrás`
    return 'Agora'
  } catch {
    return 'Data não disponível'
  }
}

// Formata um documento de post para o shape consumido pelas telas
export const formatPostForUI = (p, user) => {
  const authorName = p.authorName || p.userName || (p.user && p.user.name) || 'Pescador'
  const authorAvatar = p.authorAvatar || (p.user && p.user.avatar) || '👤'

  const description = p.description || (p.content && p.content.description) || ''
  const fishSpecies = p.fishSpecies || p.species || (p.content && p.content.species) || 'Peixe'
  const weight = p.weight || (p.content && p.content.weight) || 0
  const location = p.location || (p.content && p.content.location) || 'Local não informado'
  const image = p.image || p.imageUrl || (p.content && p.content.image) || p.photo || null

  const createdAt = toDateSafe(p.createdAt) || toDateSafe(p.date) || new Date()

  const likesArray = Array.isArray(p.likes) ? p.likes : null
  const likesCount = likesArray ? likesArray.length : (typeof p.likes === 'number' ? p.likes : 0)
  const isLiked = likesArray ? likesArray.includes(user?.uid) : false

  const commentsList = Array.isArray(p.comments)
    ? p.comments
    : Array.isArray(p.commentsList)
    ? p.commentsList
    : []

  return {
    // Identidade
    id: p.id || `post_${Math.random().toString(36).slice(2)}`,
    type: 'post',

    // Campos usados na Home.jsx
    user: {
      name: authorName,
      avatar: authorAvatar,
      level: 'Pescador'
    },
    content: {
      species: fishSpecies,
      weight,
      location,
      description,
      image
    },
    timestamp: createdAt,
    likesCount,
    isLiked,
    commentsList,
    shares: typeof p.shares === 'number' ? p.shares : 0,

    // Campos usados na Feed.jsx
    authorName,
    authorAvatar,
    description,
    fishSpecies,
    weight,
    location,
    image,
    photo: image,
    createdAt
  }
}