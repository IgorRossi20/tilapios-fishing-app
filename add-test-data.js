// Script para adicionar dados de teste no localStorage
const testCatches = [
  {
    id: 'test_1',
    species: 'Dourado',
    weight: 4.5,
    location: 'Rio Paraná',
    userName: 'João Silva',
    registeredAt: new Date().toISOString(),
    photo: null
  },
  {
    id: 'test_2', 
    species: 'Pintado',
    weight: 8.2,
    location: 'Rio Tietê',
    userName: 'Maria Santos',
    registeredAt: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    photo: null
  },
  {
    id: 'test_3',
    species: 'Pacu',
    weight: 2.1,
    location: 'Lago dos Patos',
    userName: 'Pedro Costa',
    registeredAt: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
    photo: null
  }
];

// Adicionar ao localStorage
localStorage.setItem('fishing_catches', JSON.stringify(testCatches));
console.log('✅ Dados de teste adicionados ao localStorage!');
console.log('Total de capturas:', testCatches.length);