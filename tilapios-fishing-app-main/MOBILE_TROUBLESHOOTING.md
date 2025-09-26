# Solução de Problemas para Dispositivos Móveis

## Problema: Tela Branca no Navegador do Celular

Se você está enfrentando uma tela branca ao acessar `tilapios.vercel.app` no navegador do seu celular, siga estas etapas para resolver o problema:

### 1. Verificar Configuração do Firebase Authentication

O problema mais comum é que o domínio `tilapios.vercel.app` não está autorizado no Firebase Authentication:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `tilapios-app-293fd`
3. Vá para **Authentication** > **Settings** > **Authorized domains**
4. Verifique se `tilapios.vercel.app` está na lista de domínios autorizados
5. Se não estiver, clique em **Add domain** e adicione `tilapios.vercel.app`

### 2. Limpar Cache do Navegador

Problemas de cache podem causar telas brancas:

1. Abra as configurações do navegador no seu celular
2. Vá para a seção de privacidade ou histórico
3. Selecione "Limpar dados de navegação" ou opção similar
4. Marque "Cache" e "Cookies"
5. Limpe os dados e tente acessar o site novamente

### 3. Verificar Conexão com a Internet

Certifique-se de que sua conexão móvel está funcionando corretamente:

1. Tente acessar outros sites para confirmar que sua internet está funcionando
2. Se possível, alterne entre dados móveis e Wi-Fi para testar

### 4. Testar em Modo Anônimo/Privado

Abra uma janela anônima/privada no navegador do seu celular e tente acessar o site novamente.

### 5. Verificar Compatibilidade do Navegador

Certifique-se de que seu navegador móvel está atualizado. O aplicativo foi testado e funciona nos seguintes navegadores:

- Chrome (versão 90+)
- Safari (versão 14+)
- Firefox (versão 88+)

### 6. Verificar Console de Erros

Se você tiver conhecimentos técnicos, pode conectar seu celular a um computador e usar as ferramentas de desenvolvedor para verificar erros no console:

1. No Chrome: [Instruções para depuração remota](https://developer.chrome.com/docs/devtools/remote-debugging/)
2. No Safari: [Instruções para depuração remota](https://webkit.org/web-inspector/)

### 7. Solução Alternativa: Versão Desktop

Como solução temporária, você pode:

1. Acessar o site em um computador desktop
2. No navegador móvel, solicitar a "versão para desktop" do site

## Contato para Suporte

Se você seguiu todas as etapas acima e ainda está enfrentando problemas, entre em contato com o suporte técnico fornecendo as seguintes informações:

- Modelo do celular
- Sistema operacional (Android/iOS) e versão
- Navegador e versão
- Descrição detalhada do problema
- Capturas de tela, se possível

---

## Problemas Conhecidos e Soluções

### Erro de API Key Inválida

Se você vir um erro relacionado a "invalid-api-key" no console:

1. Verifique se as variáveis de ambiente estão configuradas corretamente na Vercel
2. Certifique-se de que o domínio está autorizado no Firebase Authentication

### Problemas de Renderização em Telas Pequenas

Se o site carregar, mas a interface estiver quebrada em telas pequenas:

1. Tente girar o dispositivo para o modo paisagem
2. Atualize a página após carregar completamente
3. Verifique se o zoom do navegador está em 100%