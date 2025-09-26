# Configuração de Domínios Autorizados no Firebase

## Problema

Se você está enfrentando uma tela branca ao acessar o site **tilapios.vercel.app** em dispositivos móveis, uma das causas mais comuns é que o domínio não está autorizado no Firebase Authentication.

## Como Autorizar o Domínio no Firebase

Siga estas etapas para adicionar `tilapios.vercel.app` como um domínio autorizado no Firebase:

### 1. Acesse o Console do Firebase

1. Vá para [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Faça login com a conta Google associada ao projeto
3. Selecione o projeto Tilapios na lista de projetos

### 2. Configure a Autenticação

1. No menu lateral esquerdo, clique em **Authentication**
2. Na parte superior, clique na aba **Settings** (Configurações)
3. Role para baixo até a seção **Authorized domains** (Domínios autorizados)

### 3. Adicione o Domínio do Vercel

1. Clique no botão **Add domain** (Adicionar domínio)
2. Digite `tilapios.vercel.app` no campo de texto
3. Clique em **Add** (Adicionar)

![Exemplo de configuração de domínios autorizados](https://firebasestorage.googleapis.com/v0/b/tilapios.appspot.com/o/docs%2Fauthorized-domains.png?alt=media)

### 4. Verifique a Lista de Domínios

Certifique-se de que os seguintes domínios estão na lista de domínios autorizados:

- `tilapios.web.app` (domínio padrão do Firebase Hosting)
- `tilapios.firebaseapp.com` (domínio padrão do Firebase Hosting)
- `localhost` (para desenvolvimento local)
- `tilapios.vercel.app` (domínio do Vercel)

## Verificação

Após adicionar o domínio, siga estas etapas para verificar se a configuração foi aplicada corretamente:

1. Aguarde alguns minutos para que as alterações sejam propagadas
2. Limpe o cache do seu navegador móvel
3. Acesse novamente [https://tilapios.vercel.app](https://tilapios.vercel.app)

## Erros Comuns

### Erro: "auth/unauthorized-domain"

Se você vir este erro no console do navegador ou na página de diagnóstico, significa que o domínio ainda não está autorizado ou que as alterações ainda não foram propagadas.

**Solução:**
- Verifique se digitou o domínio corretamente
- Aguarde mais tempo para a propagação (pode levar até 30 minutos)
- Tente acessar usando um navegador diferente

### Erro: "auth/invalid-api-key"

Este erro pode ocorrer se a chave de API do Firebase não estiver configurada corretamente nas variáveis de ambiente do Vercel.

**Solução:**
1. Acesse o painel do Vercel
2. Vá para as configurações do projeto
3. Verifique se a variável de ambiente `VITE_FIREBASE_API_KEY` está configurada corretamente

## Configuração Adicional para Múltiplos Domínios

Se você estiver usando múltiplos domínios ou subdomínios para o seu aplicativo, todos eles precisam ser adicionados à lista de domínios autorizados no Firebase Authentication.

Exemplos de domínios adicionais que podem precisar ser autorizados:
- `www.tilapios.com.br`
- `app.tilapios.com.br`
- `staging-tilapios.vercel.app`

## Suporte

Se você seguiu todas as etapas acima e ainda está enfrentando problemas, entre em contato com o suporte:

- **Email**: suporte@tilapios.com.br
- **WhatsApp**: (XX) XXXXX-XXXX

---

*Última atualização: Novembro de 2023*