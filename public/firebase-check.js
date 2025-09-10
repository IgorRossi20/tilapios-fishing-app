/**
 * Script de diagnóstico do Firebase para o Tilapios
 * 
 * Este script pode ser executado diretamente no console do navegador
 * para verificar problemas de configuração do Firebase.
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12 ou Ctrl+Shift+I)
 * 2. Cole este script completo
 * 3. Pressione Enter para executar
 * 4. Analise os resultados exibidos
 */

(function() {
  console.clear();
  console.log('%c🔍 Diagnóstico do Firebase - Tilapios', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
  console.log('Iniciando verificações...');
  
  // Verificar se o Firebase está carregado
  if (typeof firebase === 'undefined') {
    console.error('%c❌ Firebase não está carregado!', 'color: #ef4444; font-weight: bold;');
    console.log('Possíveis causas:');
    console.log('1. O script do Firebase não foi carregado corretamente');
    console.log('2. Há um bloqueador de scripts impedindo o carregamento');
    console.log('3. Erro de rede ao carregar o Firebase');
    return;
  }
  
  console.log('%c✅ Firebase está carregado', 'color: #10b981;');
  
  // Verificar configuração do Firebase
  try {
    const apps = firebase.apps;
    if (!apps || apps.length === 0) {
      console.error('%c❌ Nenhum app Firebase inicializado!', 'color: #ef4444; font-weight: bold;');
      return;
    }
    
    console.log('%c✅ Firebase App inicializado', 'color: #10b981;');
    
    // Verificar serviços
    const services = {
      auth: typeof firebase.auth !== 'undefined',
      firestore: typeof firebase.firestore !== 'undefined',
      storage: typeof firebase.storage !== 'undefined'
    };
    
    console.log('Serviços disponíveis:');
    Object.keys(services).forEach(service => {
      console.log(`${services[service] ? '✅' : '❌'} ${service}`);
    });
    
    // Verificar domínio atual
    const currentDomain = window.location.hostname;
    console.log(`Domínio atual: ${currentDomain}`);
    
    const knownDomains = [
      'localhost',
      '127.0.0.1',
      'tilapios.vercel.app',
      'tilapios.firebaseapp.com',
      'tilapios.web.app'
    ];
    
    const isDomainKnown = knownDomains.includes(currentDomain);
    
    if (isDomainKnown) {
      console.log('%c✅ Domínio reconhecido', 'color: #10b981;');
    } else {
      console.warn('%c⚠️ Domínio não reconhecido. Pode não estar autorizado no Firebase.', 'color: #f59e0b; font-weight: bold;');
    }
    
    // Verificar estado de autenticação
    if (services.auth) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          console.log('%c✅ Usuário autenticado', 'color: #10b981;');
          console.log('UID:', user.uid);
          console.log('Email:', user.email);
          console.log('Nome:', user.displayName);
        } else {
          console.log('%c⚠️ Nenhum usuário autenticado', 'color: #f59e0b;');
        }
      });
      
      // Testar conexão com o Firebase Auth
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE)
        .then(() => {
          console.log('%c✅ Conexão com Firebase Auth funcionando', 'color: #10b981;');
        })
        .catch(error => {
          console.error('%c❌ Erro ao conectar com Firebase Auth', 'color: #ef4444; font-weight: bold;');
          console.error('Código:', error.code);
          console.error('Mensagem:', error.message);
          
          if (error.code === 'auth/unauthorized-domain') {
            console.error('%c❌ DOMÍNIO NÃO AUTORIZADO NO FIREBASE!', 'color: #ef4444; font-weight: bold; font-size: 14px;');
            console.log('Solução: Adicione o domínio atual ao Firebase Authentication > Settings > Authorized Domains');
          }
        });
    }
    
    // Verificar conexão com Firestore
    if (services.firestore) {
      firebase.firestore().collection('_diagnostics_test').limit(1).get()
        .then(() => {
          console.log('%c✅ Conexão com Firestore funcionando', 'color: #10b981;');
        })
        .catch(error => {
          console.error('%c❌ Erro ao conectar com Firestore', 'color: #ef4444; font-weight: bold;');
          console.error('Código:', error.code);
          console.error('Mensagem:', error.message);
        });
    }
    
    // Verificar variáveis de ambiente
    console.log('Verificando variáveis de ambiente:');
    const envVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];
    
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      envVars.forEach(varName => {
        const value = import.meta.env[varName];
        if (value) {
          const maskedValue = varName.includes('KEY') || varName.includes('ID') 
            ? value.substring(0, 3) + '...' + value.substring(value.length - 3)
            : value;
          console.log(`✅ ${varName}: ${maskedValue}`);
        } else {
          console.error(`❌ ${varName} não definido!`);
        }
      });
    } else {
      console.warn('⚠️ Não foi possível acessar variáveis de ambiente via import.meta.env');
    }
    
    // Verificar erros no console
    const consoleErrors = window.consoleErrors || [];
    if (consoleErrors.length > 0) {
      console.log('Erros detectados anteriormente:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Verificar localStorage
    try {
      localStorage.setItem('firebase_test', 'test');
      localStorage.removeItem('firebase_test');
      console.log('%c✅ localStorage funcionando', 'color: #10b981;');
    } catch (e) {
      console.error('%c❌ localStorage não disponível!', 'color: #ef4444; font-weight: bold;');
      console.log('Isso pode impedir o funcionamento correto da autenticação persistente.');
    }
    
    // Verificar cookies
    if (navigator.cookieEnabled) {
      console.log('%c✅ Cookies habilitados', 'color: #10b981;');
    } else {
      console.error('%c❌ Cookies desabilitados!', 'color: #ef4444; font-weight: bold;');
      console.log('Isso pode impedir o funcionamento correto da autenticação.');
    }
    
    // Verificar conexão com a internet
    if (navigator.onLine) {
      console.log('%c✅ Conectado à internet', 'color: #10b981;');
    } else {
      console.error('%c❌ Sem conexão com a internet!', 'color: #ef4444; font-weight: bold;');
    }
    
    // Resumo
    console.log('%c📋 Resumo do Diagnóstico', 'font-size: 14px; font-weight: bold; color: #3b82f6;');
    console.log(`Firebase carregado: ${typeof firebase !== 'undefined' ? '✅' : '❌'}`);
    console.log(`App inicializado: ${apps && apps.length > 0 ? '✅' : '❌'}`);
    console.log(`Auth disponível: ${services.auth ? '✅' : '❌'}`);
    console.log(`Firestore disponível: ${services.firestore ? '✅' : '❌'}`);
    console.log(`Storage disponível: ${services.storage ? '✅' : '❌'}`);
    console.log(`Domínio reconhecido: ${isDomainKnown ? '✅' : '⚠️'}`);
    console.log(`localStorage disponível: ${(() => { try { localStorage.setItem('test', 'test'); localStorage.removeItem('test'); return true; } catch (e) { return false; } })() ? '✅' : '❌'}`);
    console.log(`Cookies habilitados: ${navigator.cookieEnabled ? '✅' : '❌'}`);
    console.log(`Conectado à internet: ${navigator.onLine ? '✅' : '❌'}`);
    
    console.log('%c🔍 Diagnóstico concluído', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
    console.log('Para mais informações, acesse: https://tilapios.vercel.app/mobile-debug.html');
  } catch (error) {
    console.error('%c❌ Erro durante o diagnóstico', 'color: #ef4444; font-weight: bold;');
    console.error(error);
  }
})();