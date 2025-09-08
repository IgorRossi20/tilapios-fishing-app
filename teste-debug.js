// Script de Debug para Capturas
// Execute este script no console do navegador para diagnosticar problemas

console.log('🔍 Iniciando diagnóstico de capturas...');

// 1. Verificar dados existentes
console.log('\n=== DADOS ATUAIS NO LOCALSTORAGE ===');
console.log('user:', localStorage.getItem('user'));
console.log('fishing_catches:', localStorage.getItem('fishing_catches'));
console.log('capturas:', localStorage.getItem('capturas'));
console.log('user_catches_*:', Object.keys(localStorage).filter(k => k.startsWith('user_catches_')));

// 2. Verificar se há usuário logado
const currentUser = localStorage.getItem('user');
if (currentUser) {
  const user = JSON.parse(currentUser);
  console.log('\n👤 USUÁRIO LOGADO:', user);
  
  // Verificar capturas específicas do usuário
  const userCatchesKey = `user_catches_${user.uid}`;
  const userCatches = localStorage.getItem(userCatchesKey);
  console.log(`Capturas do usuário (${userCatchesKey}):`, userCatches);
} else {
  console.log('\n❌ NENHUM USUÁRIO LOGADO');
}

// 3. Verificar todas as capturas
const allCatches = localStorage.getItem('fishing_catches');
if (allCatches) {
  const catches = JSON.parse(allCatches);
  console.log('\n🎣 TODAS AS CAPTURAS:', catches);
  console.log('Total de capturas:', catches.length);
  
  // Agrupar por usuário
  const byUser = {};
  catches.forEach(c => {
    if (!byUser[c.userId]) {
      byUser[c.userId] = [];
    }
    byUser[c.userId].push(c);
  });
  
  console.log('\n👥 CAPTURAS POR USUÁRIO:');
  Object.keys(byUser).forEach(userId => {
    console.log(`${userId}: ${byUser[userId].length} capturas`);
    byUser[userId].forEach(c => {
      console.log(`  - ${c.fishType}: ${c.weight}kg (${new Date(c.date).toLocaleDateString()})`);
    });
  });
} else {
  console.log('\n❌ NENHUMA CAPTURA ENCONTRADA');
}

// 4. Verificar dados do contexto React (se disponível)
if (window.React && window.React.version) {
  console.log('\n⚛️ REACT DETECTADO:', window.React.version);
  
  // Tentar acessar o estado do contexto
  const reactFiberNode = document.querySelector('#root')._reactInternalFiber || document.querySelector('#root')._reactInternals;
  if (reactFiberNode) {
    console.log('🔗 React Fiber encontrado');
  }
}

// 5. Verificar se há erros no console
console.log('\n🚨 VERIFICANDO ERROS...');
const originalError = console.error;
console.error = function(...args) {
  console.log('❌ ERRO DETECTADO:', ...args);
  originalError.apply(console, args);
};

// 6. Simular dados mínimos para teste
console.log('\n🧪 CRIANDO DADOS MÍNIMOS PARA TESTE...');

const minimalUser = {
  uid: 'test-user-123',
  displayName: 'Usuário Teste',
  email: 'teste@email.com'
};

const minimalCatch = {
  id: 'test-catch-1',
  userId: minimalUser.uid,
  userName: minimalUser.displayName,
  fishType: 'Peixe Teste',
  weight: 1.5,
  length: 30,
  location: 'Local Teste',
  date: new Date().toISOString(),
  timestamp: new Date().toISOString(),
  registeredAt: new Date().toISOString()
};

// Salvar dados mínimos
localStorage.setItem('user', JSON.stringify(minimalUser));
localStorage.setItem('fishing_catches', JSON.stringify([minimalCatch]));
localStorage.setItem('capturas', JSON.stringify([minimalCatch]));
localStorage.setItem(`user_catches_${minimalUser.uid}`, JSON.stringify([minimalCatch]));

console.log('✅ Dados mínimos salvos');
console.log('📊 Dados para verificação:', {
  user: minimalUser,
  catch: minimalCatch
});

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Recarregue a página');
console.log('2. Verifique se aparece pelo menos 1 captura');
console.log('3. Se não aparecer, há problema na lógica de exibição');
console.log('4. Se aparecer, o problema era na estrutura dos dados');

console.log('\n🔄 Para recarregar automaticamente, execute: window.location.reload()');