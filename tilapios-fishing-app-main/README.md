# 🎣 Tilapios - Aplicativo para Pescadores Esportivos

Um aplicativo completo para pescadores esportivos focado em competições amigáveis e comunidade vibrante, desenvolvido com tecnologias 100% gratuitas!

## 🚀 Funcionalidades

### 🏆 Sistema de Rankings
- **Ranking Geral**: Classificação por quantidade de peixes, peso total e por espécie
- **Rei do Lago do Mês**: Destaque mensal para o pescador mais bem-sucedido
- **Estatísticas Detalhadas**: Acompanhe seu progresso e evolução

### 🎯 Campeonatos Personalizáveis
- **Estilo Cartola FC**: Crie competições privadas e convide amigos
- **Campeonatos Públicos**: Participe de torneios abertos da comunidade
- **Sistema de Convites**: Receba e envie convites para competições
- **Gerenciamento Completo**: Controle total sobre seus campeonatos

### 📱 Feed Social
- **Compartilhamento de Capturas**: Poste fotos e detalhes dos seus peixes
- **Interação Social**: Curta e comente nas capturas dos amigos
- **Comunidade Ativa**: Conecte-se com outros pescadores

### 👤 Perfil Completo
- **Estatísticas Pessoais**: Acompanhe todas as suas métricas
- **Sistema de Conquistas**: Desbloqueie badges e troféus
- **Histórico de Capturas**: Veja todas as suas pescarias
- **Customização**: Personalize seu perfil

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal
- **Vite** - Build tool e dev server
- **React Router DOM** - Navegação
- **Lucide React** - Ícones modernos
- **CSS3** - Estilização responsiva

### Backend & Infraestrutura
- **Firebase Authentication** - Sistema de login
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Storage** - Armazenamento de imagens
- **Firebase Hosting** - Hospedagem (opcional)

### Deploy
- **Vercel** - Hospedagem gratuita do frontend
- **Netlify** - Alternativa de hospedagem

## 📋 Pré-requisitos

- Node.js 16+ instalado
- Conta no Firebase (gratuita)
- Conta no Vercel (gratuita)

## 🚀 Deploy para Produção

### 1. Configuração do Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative Authentication e Firestore Database
4. Copie as configurações do projeto

### 2. Variáveis de Ambiente
1. Copie o arquivo `.env.example` para `.env`
2. Preencha com suas configurações do Firebase:
```bash
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 3. Deploy no Vercel
1. Instale a CLI do Vercel: `npm i -g vercel`
2. Execute: `vercel`
3. Siga as instruções e configure as variáveis de ambiente
4. Seu app estará disponível em: `https://seu-projeto.vercel.app`

### 4. Configuração Automática
O projeto já inclui:
- ✅ `vercel.json` configurado para SPA
- ✅ Scripts de build otimizados
- ✅ Roteamento configurado
- ✅ Variáveis de ambiente documentadas
- Conta no Firebase (gratuita)
- Conta no Vercel ou Netlify (gratuita)

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone <url-do-repositorio>
cd tilapios
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative os seguintes serviços:
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**

4. Copie as credenciais do Firebase e substitua em `src/firebase/config.js`:
```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
}
```

### 4. Configurar Regras do Firestore

No Firebase Console, vá em Firestore Database > Rules e cole as regras que estão comentadas no arquivo `src/firebase/config.js`.

### 5. Executar Localmente
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🌐 Deploy

### Deploy no Vercel

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. Faça o deploy:
```bash
vercel
```

3. Siga as instruções no terminal

### Deploy no Netlify

1. Build do projeto:
```bash
npm run build
```

2. Arraste a pasta `dist` para o Netlify ou conecte seu repositório Git

## 📱 Como Usar

### 1. Primeiro Acesso
- Crie sua conta com email e senha
- Complete seu perfil com informações básicas
- Explore as funcionalidades

### 2. Compartilhar Capturas
- Vá no Feed e clique em "Compartilhar Nova Captura"
- Adicione foto, descrição, espécie, peso e local
- Publique para a comunidade

### 3. Criar Campeonatos
- Acesse a aba "Campeonatos"
- Clique em "Criar Novo Campeonato"
- Configure as regras e convide amigos

### 4. Acompanhar Rankings
- Veja sua posição nos rankings gerais
- Acompanhe o "Rei do Lago do Mês"
- Compare estatísticas com outros pescadores

## 🎨 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   └── Header.jsx      # Cabeçalho e navegação
├── contexts/           # Contextos React
│   ├── AuthContext.jsx # Gerenciamento de autenticação
│   └── FirebaseContext.jsx # Configuração Firebase
├── firebase/           # Configuração Firebase
│   └── config.js       # Credenciais e configurações
├── pages/              # Páginas da aplicação
│   ├── Home.jsx        # Dashboard principal
│   ├── Login.jsx       # Login e registro
│   ├── Ranking.jsx     # Rankings e estatísticas
│   ├── Tournaments.jsx # Campeonatos
│   ├── Feed.jsx        # Feed social
│   └── Profile.jsx     # Perfil do usuário
├── App.jsx             # Componente principal
├── main.jsx            # Ponto de entrada
└── index.css           # Estilos globais
```

## 🔧 Customização

### Cores e Tema
Edite o arquivo `src/index.css` para personalizar:
- Cores primárias e secundárias
- Tipografia
- Espaçamentos
- Responsividade

### Funcionalidades
Adicione novas funcionalidades criando:
- Novos componentes em `src/components/`
- Novas páginas em `src/pages/`
- Novos contextos em `src/contexts/`

## 🐛 Solução de Problemas

### Erro de Autenticação
- Verifique se as credenciais do Firebase estão corretas
- Confirme se o Authentication está ativado no Firebase

### Erro de Banco de Dados
- Verifique se o Firestore está ativado
- Confirme se as regras de segurança estão configuradas

### Erro de Build
- Execute `npm install` novamente
- Verifique se todas as dependências estão instaladas

## 📈 Próximas Funcionalidades

- [ ] Notificações push
- [ ] Chat entre pescadores
- [ ] Mapa de pesqueiros
- [ ] Previsão do tempo
- [ ] Sistema de badges avançado
- [ ] Integração com redes sociais
- [ ] App mobile nativo

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🎣 Sobre

Desenvolvido com ❤️ para a comunidade de pescadores esportivos. O objetivo é criar uma plataforma gratuita e acessível para todos os amantes da pesca!

---

**Boas pescarias! 🐟**