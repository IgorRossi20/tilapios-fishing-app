// Script para limpar dados pendentes e forçar sincronização
console.log('=== LIMPEZA DE DADOS PENDENTES ===')

// Simular verificação de localStorage
const pendingKeys = [
  'pending_catches',
  'pending_tournaments',
  'pending_data'
]

console.log('1. Verificando dados pendentes:')
pendingKeys.forEach(key => {
  console.log(`   - ${key}: Verificar no navegador`)
})

console.log('\n2. Instruções para limpeza manual:')
console.log('   - Abrir DevTools (F12)')
console.log('   - Ir para Application > Local Storage')
console.log('   - Localizar chave "pending_catches"')
console.log('   - Deletar ou limpar o valor')

console.log('\n3. Forçar sincronização:')
console.log('   - Usar botão "Forçar Sincronização" na aplicação')
console.log('   - Ou executar: syncLocalDataToFirestore() no console')

console.log('\n4. Comandos úteis para o console do navegador:')
console.log('   localStorage.removeItem("pending_catches")')
console.log('   localStorage.setItem("pending_catches", "[]")')
console.log('   console.log(localStorage.getItem("pending_catches"))')

console.log('\n=== SCRIPT CONCLUÍDO ===')