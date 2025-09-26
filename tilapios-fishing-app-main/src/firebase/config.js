// Configuração do Firebase
// Para usar em produção, substitua pelas suas credenciais do Firebase

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Configuração do Firebase usando variáveis de ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializar Firebase
console.log('🔧 Inicializando Firebase com config:', {
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  authDomain: firebaseConfig.authDomain
})

const app = initializeApp(firebaseConfig)

// Inicializar serviços
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

console.log('✅ Firebase inicializado:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage
})

export default app

// Coleções do Firestore
export const COLLECTIONS = {
  USERS: 'users',
  POSTS: 'posts',
  TOURNAMENTS: 'tournaments',
  FISHING_TOURNAMENTS: 'fishing_tournaments',
  CATCHES: 'catches',
  FISHING_CATCHES: 'fishing_catches',
  RANKINGS: 'rankings',
  COMMENTS: 'comments',
  LIKES: 'likes',
  TOURNAMENT_INVITES: 'tournament_invites',
  NOTIFICATIONS: 'notifications'
}

// Funções utilitárias para Firestore
export const createUserDocument = async (user, additionalData) => {
  if (!user) return
  
  const userRef = doc(db, COLLECTIONS.USERS, user.uid)
  const snapshot = await getDoc(userRef)
  
  if (!snapshot.exists()) {
    const { displayName, email } = user
    const createdAt = new Date()
    
    try {
      await setDoc(userRef, {
        displayName,
        email,
        createdAt,
        totalFish: 0,
        totalWeight: 0,
        level: 'Iniciante',
        ...additionalData
      })
    } catch (error) {
      console.error('Erro ao criar documento do usuário:', error)
    }
  }
  
  return userRef
}

// Configurações de regras de segurança recomendadas para o Firestore:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler e escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts são públicos para leitura, mas apenas o autor pode editar
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Campeonatos são públicos para leitura, apenas criador pode editar
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
    }
    
    // Capturas são públicas para leitura, apenas o autor pode editar
    match /catches/{catchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Rankings são apenas para leitura (atualizados por Cloud Functions)
    match /rankings/{rankingId} {
      allow read: if request.auth != null;
    }
    
    // Comentários e curtidas
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    match /likes/{likeId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
*/