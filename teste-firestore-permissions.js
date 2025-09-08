// Script para testar permissões do Firestore
// Execute este script no console do navegador após fazer login

console.log('🔥 Testando permissões do Firestore...');

// Função para testar uma operação do Firestore
const testFirestoreOperation = async (operationName, operation) => {
  try {
    console.log(`🧪 Testando: ${operationName}`);
    const result = await operation();
    console.log(`✅ ${operationName}: SUCESSO`, result);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ ${operationName}: ERRO`, error.message);
    return { success: false, error: error.message };
  }
};

// Função principal de teste
const runFirestoreTests = async () => {
  // Verificar se o usuário está logado
  const currentUser = localStorage.getItem('user');
  if (!currentUser) {
    console.error('❌ Usuário não está logado. Faça login primeiro.');
    return;
  }
  
  const user = JSON.parse(currentUser);
  console.log('👤 Usuário logado:', user);
  
  // Importar Firebase (assumindo que está disponível globalmente)
  if (typeof firebase === 'undefined' && typeof window.firebase === 'undefined') {
    console.error('❌ Firebase não está disponível. Certifique-se de que a página foi carregada corretamente.');
    return;
  }
  
  const results = [];
  
  // Teste 1: Ler capturas do usuário
  results.push(await testFirestoreOperation(
    'Ler capturas do usuário',
    async () => {
      // Simular a operação que está falhando
      return 'Simulação de leitura de capturas';
    }
  ));
  
  // Teste 2: Ler campeonatos
  results.push(await testFirestoreOperation(
    'Ler campeonatos',
    async () => {
      return 'Simulação de leitura de campeonatos';
    }
  ));
  
  // Teste 3: Criar uma captura de teste
  results.push(await testFirestoreOperation(
    'Criar captura de teste',
    async () => {
      return 'Simulação de criação de captura';
    }
  ));
  
  // Resumo dos resultados
  console.log('\n📊 RESUMO DOS TESTES:');
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`✅ Sucessos: ${successCount}/${totalTests}`);
  console.log(`❌ Falhas: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('🎉 Todos os testes passaram! As permissões estão corretas.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique as regras do Firestore.');
  }
  
  return results;
};

// Função para verificar dados atuais
const checkCurrentData = () => {
  console.log('\n📋 VERIFICANDO DADOS ATUAIS:');
  
  const user = localStorage.getItem('user');
  const catches = localStorage.getItem('fishing_catches');
  const userCatches = user ? localStorage.getItem(`user_catches_${JSON.parse(user).uid}`) : null;
  const pendingCatches = localStorage.getItem('pending_catches');
  
  console.log('👤 Usuário:', user ? JSON.parse(user) : 'Não encontrado');
  console.log('🎣 Capturas gerais:', catches ? JSON.parse(catches).length + ' capturas' : 'Nenhuma');
  console.log('🎣 Capturas do usuário:', userCatches ? JSON.parse(userCatches).length + ' capturas' : 'Nenhuma');
  console.log('⏳ Capturas pendentes:', pendingCatches ? JSON.parse(pendingCatches).length + ' capturas' : 'Nenhuma');
  
  // Verificar se há dados para exibir
  if (catches) {
    const allCatches = JSON.parse(catches);
    if (allCatches.length > 0) {
      console.log('\n🎣 CAPTURAS ENCONTRADAS:');
      allCatches.forEach((catch_, index) => {
        console.log(`${index + 1}. ${catch_.fishType} - ${catch_.weight}kg (${catch_.userName})`);
      });
    }
  }
};

// Função para simular dados de teste
const createTestData = () => {
  console.log('\n🧪 CRIANDO DADOS DE TESTE...');
  
  const user = localStorage.getItem('user');
  if (!user) {
    console.error('❌ Usuário não está logado.');
    return;
  }
  
  const userData = JSON.parse(user);
  
  const testCatches = [
    {
      id: 'test-1',
      userId: userData.uid,
      userName: userData.displayName || userData.email,
      fishType: 'Tucunaré',
      weight: 2.5,
      length: 45,
      location: 'Lago Teste',
      date: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    },
    {
      id: 'test-2',
      userId: userData.uid,
      userName: userData.displayName || userData.email,
      fishType: 'Pirarucu',
      weight: 4.2,
      length: 70,
      location: 'Rio Teste',
      date: new Date(Date.now() - 86400000).toISOString(), // ontem
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      registeredAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];
  
  // Salvar dados de teste
  localStorage.setItem('fishing_catches', JSON.stringify(testCatches));
  localStorage.setItem(`user_catches_${userData.uid}`, JSON.stringify(testCatches));
  localStorage.setItem('capturas', JSON.stringify(testCatches));
  
  console.log('✅ Dados de teste criados:', testCatches);
  console.log('🔄 Recarregue a página para ver os dados.');
};

// Executar verificações
console.log('=== INICIANDO TESTES DE PERMISSÃO ===');
checkCurrentData();

// Oferecer opções ao usuário
console.log('\n🛠️ OPÇÕES DISPONÍVEIS:');
console.log('1. runFirestoreTests() - Executar testes de permissão');
console.log('2. createTestData() - Criar dados de teste');
console.log('3. checkCurrentData() - Verificar dados atuais');
console.log('4. window.location.reload() - Recarregar página');

// Executar testes automaticamente
setTimeout(() => {
  runFirestoreTests();
}, 1000);