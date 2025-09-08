# 🔧 Correção dos Erros de Permissão do Firestore

## 🚨 Problema Identificado

Os logs mostram erros de permissão do Firestore:
- `FirebaseError: Missing or insufficient permissions`
- `net::ERR_ABORTED` nas conexões com o Firestore

Isso acontece porque as **regras de segurança do Firestore** não estão configuradas corretamente no console do Firebase.

## 🛠️ Solução Passo a Passo

### 1. Acesse o Console do Firebase

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: **tilapios-app-293fd**
3. No menu lateral, clique em **"Firestore Database"**

### 2. Configure as Regras de Segurança

1. Na página do Firestore, clique na aba **"Rules"** (Regras)
2. Você verá um editor de código com as regras atuais
3. **SUBSTITUA** todo o conteúdo pelas regras corretas:

```javascript
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
    match /fishing_catches/{catchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Capturas antigas (compatibilidade)
    match /catches/{catchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Rankings são apenas para leitura
    match /rankings/{rankingId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Comentários são públicos para leitura, apenas autor pode editar
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
    
    // Likes são públicos para leitura, apenas autor pode editar
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

4. Clique em **"Publish"** (Publicar) para aplicar as regras

### 3. Verificar Authentication

1. No menu lateral do Firebase, clique em **"Authentication"**
2. Verifique se o método **"Email/Password"** está ativado
3. Se não estiver, clique na aba **"Sign-in method"** e ative

### 4. Testar a Aplicação

1. Volte para sua aplicação em `http://localhost:3000`
2. Faça login com uma conta existente ou crie uma nova
3. Os erros de permissão devem desaparecer

## 🔍 Verificação dos Logs

Após aplicar as regras, você deve ver:
- ✅ Dados carregando corretamente
- ✅ Capturas sendo salvas
- ✅ Rankings funcionando
- ❌ Fim dos erros `Missing or insufficient permissions`

## 🚨 Regras Temporárias (Apenas para Teste)

Se você quiser testar rapidamente, pode usar regras mais permissivas temporariamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **ATENÇÃO**: Essas regras são menos seguras e devem ser usadas apenas para teste!

## 📋 Checklist de Verificação

- [ ] Regras do Firestore aplicadas
- [ ] Authentication Email/Password ativado
- [ ] Usuário logado na aplicação
- [ ] Erros de permissão resolvidos
- [ ] Dados carregando corretamente

## 🆘 Se Ainda Houver Problemas

1. **Limpe o cache do navegador** (Ctrl+Shift+R)
2. **Verifique se está logado** na aplicação
3. **Aguarde alguns minutos** para as regras se propagarem
4. **Verifique o console do navegador** para novos erros

---

**Após aplicar essas correções, sua aplicação deve funcionar perfeitamente! 🎣**