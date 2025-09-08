// Script de Teste Automatizado para Capturas
// Execute este script no console do navegador (F12)

console.log('🚀 Iniciando teste automatizado das capturas...');

// 1. Limpar dados antigos
localStorage.clear();
console.log('🧹 localStorage limpo');

// 2. Simular usuário logado
const testUser = {
  uid: 'user-123',
  displayName: 'João Pescador',
  email: 'joao@pescador.com'
};
localStorage.setItem('user', JSON.stringify(testUser));
console.log('👤 Usuário simulado:', testUser);

// 3. Criar múltiplas capturas de teste
const testCatches = [
  {
    id: 'catch-1',
    userId: testUser.uid,
    userName: testUser.displayName,
    fishType: 'Tucunaré',
    weight: 3.2,
    length: 50,
    location: 'Lago Principal',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    registeredAt: new Date().toISOString()
  },
  {
    id: 'catch-2',
    userId: testUser.uid,
    userName: testUser.displayName,
    fishType: 'Pirarucu',
    weight: 5.8,
    length: 80,
    location: 'Rio Amazonas',
    date: new Date(Date.now() - 86400000).toISOString(), // ontem
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    registeredAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'catch-3',
    userId: 'other-user',
    userName: 'Pedro Rival',
    fishType: 'Dourado',
    weight: 2.1,
    length: 40,
    location: 'Rio Paraná',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    registeredAt: new Date().toISOString()
  },
  {
    id: 'catch-4',
    userId: 'other-user-2',
    userName: 'Maria Pescadora',
    fishType: 'Pintado',
    weight: 4.5,
    length: 65,
    location: 'Rio São Francisco',
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    registeredAt: new Date().toISOString()
  }
];

// 4. Salvar capturas em todos os formatos
localStorage.setItem('fishing_catches', JSON.stringify(testCatches));
localStorage.setItem('capturas', JSON.stringify(testCatches));
localStorage.setItem('user_catches_' + testUser.uid, JSON.stringify(testCatches.filter(c => c.userId === testUser.uid)));

console.log('🎣 Capturas de teste criadas:', testCatches);

// 5. Verificar dados salvos
console.log('\n=== VERIFICAÇÃO DOS DADOS SALVOS ===');
console.log('Usuário logado:', JSON.parse(localStorage.getItem('user')));
console.log('Todas as capturas:', JSON.parse(localStorage.getItem('fishing_catches')));
console.log('Capturas do usuário atual:', JSON.parse(localStorage.getItem('user_catches_' + testUser.uid)));

// 6. Calcular estatísticas esperadas
const userCatches = testCatches.filter(c => c.userId === testUser.uid);
const totalWeight = userCatches.reduce((sum, c) => sum + c.weight, 0);
const totalFish = userCatches.length;

console.log('\n=== ESTATÍSTICAS ESPERADAS ===');
console.log('Total de peixes do usuário:', totalFish);
console.log('Peso total do usuário:', totalWeight + 'kg');
console.log('Capturas recentes esperadas:', userCatches.length);

// 7. Verificar ranking mensal
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();
const monthlyCaptures = testCatches.filter(c => {
  const date = new Date(c.date);
  return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
});

const monthlyStats = {};
monthlyCaptures.forEach(c => {
  if (!monthlyStats[c.userId]) {
    monthlyStats[c.userId] = {
      userId: c.userId,
      name: c.userName,
      totalWeight: 0,
      totalFish: 0
    };
  }
  monthlyStats[c.userId].totalWeight += c.weight;
  monthlyStats[c.userId].totalFish++;
});

const ranking = Object.values(monthlyStats).sort((a, b) => b.totalWeight - a.totalWeight);

console.log('\n=== RANKING MENSAL ESPERADO ===');
ranking.forEach((player, index) => {
  console.log(`${index + 1}º lugar: ${player.name} - ${player.totalWeight}kg (${player.totalFish} peixes)`);
});

if (ranking.length > 0) {
  console.log('\n👑 REI DO LAGO ESPERADO:', ranking[0].name, '-', ranking[0].totalWeight + 'kg');
}

console.log('\n✅ Dados de teste configurados!');
console.log('🔄 Recarregando página em 3 segundos...');

// 8. Recarregar página automaticamente
setTimeout(() => {
  console.log('🔄 Recarregando página agora...');
  window.location.reload();
}, 3000);

console.log('\n=== INSTRUÇÕES ===');
console.log('1. Aguarde o reload automático da página');
console.log('2. Após o reload, verifique se aparecem:');
console.log('   - Capturas Recentes: 2 capturas do João Pescador');
console.log('   - Rei do Lago: João Pescador (9.0kg total)');
console.log('   - Estatísticas: 2 peixes, 9.0kg total');
console.log('3. Se não aparecer, verifique os logs do console da página Home');