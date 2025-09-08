// Execute este código no console do navegador para adicionar dados de teste

// Dados de exemplo para testar
const testCatches = [
  {
    id: 'catch1',
    userId: 'user123',
    userName: 'João Silva',
    fishType: 'Tilápia',
    weight: 2.5,
    length: 35,
    location: 'Lago Azul',
    date: new Date().toISOString(),
    timestamp: Date.now(),
    photo: null
  },
  {
    id: 'catch2',
    userId: 'user456',
    userName: 'Maria Santos',
    fishType: 'Carpa',
    weight: 3.2,
    length: 42,
    location: 'Represa Grande',
    date: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    timestamp: Date.now() - 86400000,
    photo: null
  },
  {
    id: 'catch3',
    userId: 'user123',
    userName: 'João Silva',
    fishType: 'Tucunaré',
    weight: 1.8,
    length: 28,
    location: 'Rio Verde',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    timestamp: Date.now() - 172800000,
    photo: null
  },
  {
    id: 'catch4',
    userId: 'user789',
    userName: 'Pedro Costa',
    fishType: 'Pintado',
    weight: 4.1,
    length: 55,
    location: 'Lago dos Patos',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 dias atrás
    timestamp: Date.now() - 259200000,
    photo: null
  },
  {
    id: 'catch5',
    userId: 'user456',
    userName: 'Maria Santos',
    fishType: 'Dourado',
    weight: 2.9,
    length: 38,
    location: 'Rio Claro',
    date: new Date(Date.now() - 345600000).toISOString(), // 4 dias atrás
    timestamp: Date.now() - 345600000,
    photo: null
  }
]

// Adicionar ao localStorage
localStorage.setItem('fishing_catches', JSON.stringify(testCatches))
localStorage.setItem('capturas', JSON.stringify(testCatches))

console.log('✅ Dados de teste adicionados ao localStorage!')
console.log('📊 Total de capturas:', testCatches.length)
console.log('🎣 Capturas:', testCatches)

// Recarregar a página para aplicar os dados
window.location.reload()