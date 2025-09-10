# Configuração da Vercel

## Variáveis de Ambiente Necessárias

Para fazer o deploy na Vercel, você precisa configurar as seguintes variáveis de ambiente no painel da Vercel:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=AIzaSyC1V5ZxBZcP250p80ZHOZ5iNYz_rk7twR4
VITE_FIREBASE_AUTH_DOMAIN=tilapios-app-293fd.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tilapios-app-293fd
VITE_FIREBASE_STORAGE_BUCKET=tilapios-app-293fd.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=437700591817
VITE_FIREBASE_APP_ID=1:437700591817:web:094f4cd27c4c9af7918d18
```

### App Configuration
```
VITE_NODE_ENV=production
VITE_APP_NAME=Tilapios
VITE_APP_VERSION=1.0.0
```

## Como Configurar na Vercel

1. Acesse o painel da Vercel
2. Vá para o seu projeto
3. Clique em "Settings"
4. Vá para "Environment Variables"
5. Adicione cada variável listada acima
6. Faça um novo deploy

## Configuração de Domínios Autorizados no Firebase

**IMPORTANTE**: Para o domínio `https://tilapios.vercel.app/`, você precisa autorizar este domínio no Firebase Console:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `tilapios-app-293fd`
3. Vá para **Authentication** > **Settings** > **Authorized domains**
4. Clique em **Add domain**
5. Adicione: `tilapios.vercel.app`
6. Salve as alterações

## Resolução do Erro

O erro `FirebaseError: Firebase: Error (auth/invalid-api-key)` acontece quando:
- As variáveis de ambiente não estão configuradas na Vercel
- As chaves do Firebase estão incorretas
- O projeto Firebase não está configurado corretamente
- **O domínio não está autorizado no Firebase Authentication**

Após configurar as variáveis de ambiente na Vercel E autorizar o domínio no Firebase, o erro será resolvido.

## Verificação Local

Para testar localmente, certifique-se de que o arquivo `.env` existe na raiz do projeto com as variáveis corretas.

## Problemas em Dispositivos Móveis

Se você estiver enfrentando uma tela branca ao acessar `tilapios.vercel.app` em dispositivos móveis:

1. Verifique se o domínio `tilapios.vercel.app` está autorizado no Firebase Authentication
2. Acesse a página de diagnóstico em `https://tilapios.vercel.app/mobile-check.html`
3. Consulte o guia completo de solução de problemas em `MOBILE_TROUBLESHOOTING.md`

A página de diagnóstico ajudará a identificar problemas específicos com seu dispositivo móvel e fornecerá recomendações para resolvê-los.