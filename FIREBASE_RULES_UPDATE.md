# Atualização de Regras de Segurança do Firestore

Identificamos que o erro `FirebaseError: Missing or insufficient permissions` ocorre porque as regras de segurança atuais impedem que usuários curtam, comentem ou compartilhem posts de outras pessoas.

Para corrigir isso, você precisa atualizar as regras no Console do Firebase.

## Passo a Passo

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o seu projeto.
3. No menu lateral esquerdo, clique em **Criação** > **Firestore Database**.
4. Clique na aba **Regras**.
5. Substitua **TODO** o conteúdo do editor pelo código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler e escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts são públicos para leitura
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      
      // CORREÇÃO AQUI:
      // Permitir que outros usuários atualizem APENAS likes, comments e shares
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.authorId ||
        request.resource.data.diff(resource.data).changedKeys().hasOnly(['likes', 'comments', 'shares'])
      );
      
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Campeonatos são públicos para leitura, apenas criador pode editar
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
    }
    
    // Campeonatos de pesca
    match /fishing_tournaments/{tournamentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.createdBy ||
        request.resource.data.diff(resource.data).changedKeys().hasOnly(['participants', 'participantCount'])
      );
      allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
    
    // Capturas
    match /fishing_catches/{catchId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Capturas antigas (compatibilidade)
    match /catches/{catchId} {
      allow read: if true;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Rankings (apenas leitura)
    match /rankings/{rankingId} {
      allow read: if request.auth != null;
      allow write: if false; 
    }
    
    // Comentários (coleção separada, mantida por compatibilidade)
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Likes (coleção separada, mantida por compatibilidade)
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Convites de campeonatos
    match /tournament_invites/{inviteId} {
      allow read: if request.auth != null && 
        (
          request.auth.uid == resource.data.inviterId ||
          request.auth.uid == resource.data.inviteeId ||
          request.auth.token.email == resource.data.inviteeEmail
        );
      allow create: if request.auth != null && request.auth.uid == request.resource.data.inviterId;
      allow update: if request.auth != null && 
        (
          request.auth.uid == resource.data.inviterId || 
          request.auth.uid == resource.data.inviteeId ||
          request.auth.token.email == resource.data.inviteeEmail
        );
      allow delete: if request.auth != null && request.auth.uid == resource.data.inviterId;
    }
    
    // Notificações
    match /notifications/{notificationId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.actorId;
      allow read: if request.auth != null && request.auth.uid == resource.data.recipientId;
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.recipientId
                    && request.resource.data.diff(resource.data).changedKeys().hasOnly(['read']);
      allow delete: if false;
    }
  }
}
```

6. Clique em **Publicar**.

Após publicar, aguarde alguns segundos e tente interagir novamente no aplicativo.
