# 🚀 Guia de Deploy - Tilapios

## Deploy no Vercel (Recomendado)

### Passo 1: Preparação
```bash
# 1. Certifique-se que o build funciona
npm run build

# 2. Teste localmente
npm run preview
```

### Passo 2: Deploy via CLI
```bash
# 1. Login no Vercel
vercel login

# 2. Deploy do projeto
vercel

# 3. Para deploy de produção
vercel --prod
```

### Passo 3: Configurar Variáveis de Ambiente
No painel do Vercel, adicione as seguintes variáveis:

```
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_NODE_ENV=production
```

### Passo 4: Deploy via GitHub (Alternativo)
1. Faça push do código para o GitHub
2. Conecte o repositório no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático a cada push!

## Deploy no Netlify (Alternativo)

### Via Drag & Drop
1. Execute `npm run build`
2. Acesse [Netlify](https://netlify.com)
3. Arraste a pasta `dist` para o painel
4. Configure as variáveis de ambiente

### Via CLI
```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod --dir=dist
```

## Configurações Importantes

### Firebase Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firebase Rules (Storage)
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

## Checklist de Deploy

- [ ] Build funciona localmente (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Firebase configurado e ativo
- [ ] Regras de segurança do Firebase configuradas
- [ ] Domain customizado configurado (opcional)
- [ ] SSL/HTTPS ativo (automático no Vercel/Netlify)
- [ ] Analytics configurado (opcional)

## URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com
- **Netlify Dashboard**: https://app.netlify.com

## Troubleshooting

### Erro 404 em rotas
- ✅ Já configurado no `vercel.json`
- Para Netlify: criar `_redirects` na pasta `public`

### Variáveis de ambiente não funcionam
- Certifique-se que começam com `VITE_`
- Redeploy após adicionar variáveis

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Execute `npm ci` para limpar node_modules

## Performance

- ✅ Build otimizado com Vite
- ✅ Code splitting automático
- ✅ Assets minificados
- ✅ Lazy loading de rotas

**Seu MVP está pronto para produção! 🎉**