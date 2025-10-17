/**
 * Utilitários para verificar e corrigir problemas de compatibilidade em dispositivos móveis
 * Especialmente focado em resolver problemas de tela branca no navegador móvel
 */

/**
 * Verifica se o dispositivo atual é um dispositivo móvel
 * @returns {boolean} Verdadeiro se for um dispositivo móvel
 */
export const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent.toLowerCase());
};

/**
 * Verifica se o navegador atual é compatível com o aplicativo
 * @returns {Object} Objeto com informações de compatibilidade
 */
export const checkBrowserCompatibility = () => {
  const ua = navigator.userAgent;
  let browserName = "Desconhecido";
  let browserVersion = "";
  let isCompatible = false;
  
  if (ua.indexOf("Chrome") > -1) {
    browserName = "Chrome";
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
    isCompatible = parseFloat(browserVersion) >= 90;
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "Safari";
    const match = ua.match(/Version\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
    isCompatible = parseFloat(browserVersion) >= 14;
  } else if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
    isCompatible = parseFloat(browserVersion) >= 88;
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "Edge";
    const match = ua.match(/Edge\/(\d+\.\d+)/) || ua.match(/Edg\/(\d+\.\d+)/);
    browserVersion = match ? match[1] : "";
    isCompatible = parseFloat(browserVersion) >= 90;
  }
  
  return {
    browserName,
    browserVersion,
    isCompatible,
    userAgent: ua
  };
};

/**
 * Verifica se o viewport atual é adequado para o aplicativo
 * @returns {Object} Objeto com informações do viewport
 */
export const checkViewport = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  return {
    width,
    height,
    pixelRatio,
    isSmall: width < 375,
    isTooSmall: width < 320
  };
};

/**
 * Verifica se o armazenamento local está disponível
 * @returns {boolean} Verdadeiro se o armazenamento local estiver disponível
 */
export const isLocalStorageAvailable = () => {
  try {
    localStorage.setItem('tilapios_test', 'test');
    localStorage.removeItem('tilapios_test');
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Verifica se os cookies estão habilitados
 * @returns {boolean} Verdadeiro se os cookies estiverem habilitados
 */
export const areCookiesEnabled = () => {
  return navigator.cookieEnabled;
};

/**
 * Verifica se o domínio atual é válido para o Firebase
 * @returns {boolean} Verdadeiro se o domínio for válido
 */
export const isValidFirebaseDomain = () => {
  const hostname = window.location.hostname;
  const isLocalIp = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    isLocalIp ||
    hostname === 'tilapios.vercel.app' ||
    hostname.endsWith('.firebaseapp.com')
  );
};

/**
 * Coleta informações de diagnóstico do dispositivo
 * @returns {Object} Objeto com informações de diagnóstico
 */
export const collectDiagnosticInfo = () => {
  return {
    device: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      isMobile: isMobileDevice(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    browser: checkBrowserCompatibility(),
    storage: {
      localStorageAvailable: isLocalStorageAvailable(),
      cookiesEnabled: areCookiesEnabled()
    },
    network: {
      online: navigator.onLine
    },
    firebase: {
      validDomain: isValidFirebaseDomain()
    }
  };
};

/**
 * Aplica correções para problemas comuns em dispositivos móveis
 * @returns {Object} Objeto com resultados das correções aplicadas
 */
export const applyMobileFixes = () => {
  const fixes = {
    viewportMeta: false,
    forcedReload: false,
    storageCleared: false
  };
  
  // Verificar e corrigir meta tag de viewport
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.head.appendChild(meta);
    fixes.viewportMeta = true;
  } else if (!viewportMeta.content.includes('width=device-width')) {
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    fixes.viewportMeta = true;
  }
  
  // Limpar cache de armazenamento local se necessário
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem('tilapios_cache');
      fixes.storageCleared = true;
    } catch (e) {
    }
  }
  
  return fixes;
};

/**
 * Gera recomendações com base nas informações de diagnóstico
 * @param {Object} diagnosticInfo Informações de diagnóstico
 * @returns {Array} Lista de recomendações
 */
export const generateRecommendations = (diagnosticInfo) => {
  const recommendations = [];
  
  // Verificar problemas de navegador
  if (!diagnosticInfo.browser.isCompatible) {
    recommendations.push(`Atualize seu navegador ${diagnosticInfo.browser.browserName} para a versão mais recente.`);
  }
  
  // Verificar problemas de viewport
  if (diagnosticInfo.viewport.width < 320) {
    recommendations.push('Sua tela é muito pequena. Tente girar o dispositivo para o modo paisagem.');
  } else if (diagnosticInfo.viewport.width < 375) {
    recommendations.push('Sua tela é pequena, pode haver problemas de layout. Tente girar o dispositivo.');
  }
  
  // Verificar problemas de armazenamento
  if (!diagnosticInfo.storage.localStorageAvailable) {
    recommendations.push('O armazenamento local não está disponível. Verifique se o modo privado/anônimo está desativado.');
  }
  
  if (!diagnosticInfo.storage.cookiesEnabled) {
    recommendations.push('Os cookies estão desativados. Ative os cookies para o site funcionar corretamente.');
  }
  
  // Verificar problemas de rede
  if (!diagnosticInfo.network.online) {
    recommendations.push('Você está offline. Conecte-se à internet para usar o aplicativo.');
  }
  
  // Verificar problemas de domínio do Firebase
  if (!diagnosticInfo.firebase.validDomain) {
    recommendations.push(`O domínio atual (${window.location.hostname}) pode não estar autorizado no Firebase Authentication.`);
  }
  
  // Recomendações gerais
  recommendations.push('Limpe o cache e os cookies do navegador.');
  recommendations.push('Tente acessar o site em um navegador diferente.');
  recommendations.push('Verifique se o domínio tilapios.vercel.app está autorizado no Firebase Authentication.');
  
  return recommendations;
};

/**
 * Inicializa verificações de compatibilidade móvel e aplica correções
 * Deve ser chamado no início da aplicação
 */
export const initMobileCompatibility = () => {
  // Verificar se é um dispositivo móvel
  if (isMobileDevice()) {
    // console.log('Dispositivo móvel detectado, iniciando verificações de compatibilidade...');
    
    // Aplicar correções automáticas
    const fixes = applyMobileFixes();
    // console.log('Correções aplicadas:', fixes);
    
    // Coletar informações de diagnóstico
    const diagnosticInfo = collectDiagnosticInfo();
    // console.log('Informações de diagnóstico:', diagnosticInfo);
    
    // Armazenamento de diagnóstico desativado no modo somente online.
    
    // Verificar problemas críticos
    if (!diagnosticInfo.firebase.validDomain || !diagnosticInfo.browser.isCompatible) {
      // console.warn('Problemas críticos detectados que podem afetar o funcionamento do aplicativo.');
    }
  }
};