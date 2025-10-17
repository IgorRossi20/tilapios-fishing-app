// Configuração do Firebase
// Para usar em produção, substitua pelas suas credenciais do Firebase

import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { initializeFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

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

const app = initializeApp(firebaseConfig)

// Inicializar serviços
export const auth = getAuth(app)
// Mitigar erros de rede (net::ERR_ABORTED) em ambientes com proxies/firewalls
// Forçar long polling e desabilitar streams para mitigar abortos em ambientes restritos
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
})

// Habilitar persistência offline para enfileirar writes quando a conexão falhar
try {
  await enableIndexedDbPersistence(db)
} catch (err) {
  // Em ambientes com múltiplas abas, pode ocorrer failed-precondition
  console.warn('⚠️ Firestore persistence not available:', err?.code || err)
}
export const storage = getStorage(app)

// Conectar emuladores localmente (opcional) se a flag estiver habilitada
try {
  const useEmulator = String(import.meta.env.VITE_FIREBASE_EMULATOR).toLowerCase() === 'true'
  if (useEmulator) {
    // Endpoints padrão dos emuladores
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectStorageEmulator(storage, 'localhost', 9199)
    console.info('🔥 Conectado aos emuladores do Firebase (Firestore/Auth/Storage).')
  }
} catch (err) {
  console.warn('Não foi possível conectar emuladores Firebase:', err?.message || err)
}


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