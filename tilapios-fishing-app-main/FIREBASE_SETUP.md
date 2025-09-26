# 🔥 Configuração do Firebase - Guia Completo

## ⚠️ Problema Atual

O aplicativo está usando um **sistema de autenticação mock** (simulado) porque as credenciais do Firebase não estão configuradas corretamente. Para ter autenticação real, você precisa configurar um projeto Firebase.

## 🚀 Como Configurar o Firebase (GRATUITO)

### Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto: `tilapios`
4. Desabilite o Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Configurar Authentication

1. No painel do Firebase, vá em **Authentication**
2. Clique em "Começar"
3. Na aba **Sign-in method**, ative:
   - **Email/Password** (clique e ative)

### Passo 3: Configurar Firestore Database

1. No painel do Firebase, vá em **Firestore Database**
2. Clique em "Criar banco de dados"
3. Escolha **"Iniciar no modo de teste"**
4. Selecione uma localização (ex: `southamerica-east1`)

### Passo 4: Configurar Storage

1. No painel do Firebase, vá em **Storage**
2. Clique em "Começar"
3. Aceite as regras padrão
4. Selecione a mesma localização do Firestore

### Passo 5: Obter Credenciais

1. No painel do Firebase, clique no ícone de **engrenagem** ⚙️
2. Vá em **Configurações do projeto**
3. Role para baixo até **"Seus aplicativos"**
4. Clique em **"</> Web"**
5.7. Digite o nome do app: `tilapios`
6. **NÃO** marque "Firebase Hosting"
7. Clique em "Registrar app"
8. **COPIE** o objeto `firebaseConfig`

### Passo 6: Atualizar o Código

1. Abra o arquivo `src/firebase/config.js`
2. Substitua as credenciais mock pelas suas credenciais reais:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-real",
  authDomain: "tilapios-xxxxx.firebaseapp.com",
  projectId: "tilapios-xxxxx",
  storageBucket: "tilapios-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

3. Atualize os imports nos arquivos para usar o Firebase real:

**Em todos os arquivos, substitua:**
```javascript
// DE:
import { useAuth } from '../contexts/MockAuthContext'

// PARA:
import { useAuth } from '../contexts/AuthContext'
```

**Arquivos que precisam ser atualizados:**
- `src/App.jsx`
- `src/components/Header.jsx`
- `src/pages/Login.jsx`
- `src/pages/Home.jsx`
- `src/pages/Feed.jsx`
- `src/pages/Profile.jsx`

### Passo 7: Configurar Regras de Segurança

**Firestore Rules** (vá em Firestore Database > Rules):
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
  }
}
```

**Storage Rules** (vá em Storage > Rules):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔄 Sistema Atual (Mock)

Enquanto você não configura o Firebase, o app está usando um sistema simulado que:

✅ **Funciona para demonstração**
- Permite criar contas
- Permite fazer login
- Salva dados no localStorage
- Todas as funcionalidades visuais funcionam

❌ **Limitações**
- Dados não são persistentes entre dispositivos
- Não há sincronização em tempo real
- Não há backup dos dados
- Funciona apenas localmente

## 🎯 Testando o Sistema Mock

Para testar agora mesmo:

1. Vá para a página de login
2. Clique em "Criar Conta"
3. Preencha:
   - **Nome**: Seu nome
   - **Email**: qualquer@email.com
   - **Senha**: qualquer senha
4. Clique em "Criar Conta"

O sistema vai simular a criação da conta e fazer login automaticamente!

## 🚨 Importante

Após configurar o Firebase real:
1. Remova o arquivo `src/contexts/MockAuthContext.jsx`
2. Atualize todos os imports para usar `AuthContext`
3. Teste a criação de conta novamente

## 💰 Custos

O Firebase é **100% GRATUITO** para projetos pequenos:
- **Authentication**: 50.000 usuários/mês grátis
- **Firestore**: 50.000 leituras/dia grátis
- **Storage**: 5GB grátis

Para um app de pescadores, isso é mais que suficiente!

---

**Precisa de ajuda?** O sistema mock já permite testar todas as funcionalidades! 🎣