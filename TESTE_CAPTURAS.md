# Como Testar e Resolver Problemas com Capturas

## Problema Identificado
As capturas registradas não estão aparecendo como "Capturas Recentes" ou "Rei do Lago" devido a problemas na lógica de carregamento de dados.

## Correções Implementadas

### 1. Correção na Página Home
- **Problema**: O cálculo do "Rei do Mês" estava usando apenas capturas do localStorage antigo
- **Solução**: Agora usa todas as capturas de todos os usuários para calcular o ranking mensal
- **Arquivo**: `src/pages/Home.jsx` (linha 84)

### 2. Correção nas Capturas Recentes
- **Problema**: Mostrava capturas de todos os usuários
- **Solução**: Agora mostra apenas as capturas do usuário logado
- **Arquivo**: `src/pages/Home.jsx` (linha 74)

## Como Testar

### Opção 1: Teste Manual no Console
1. Abra o navegador e vá para http://localhost:3000
2. Pressione F12 para abrir o console
3. Execute o seguinte código:

```javascript
// Limpar dados antigos
localStorage.clear();

// Simular usuário logado
const testUser = {
  uid: 'user-123',
  displayName: 'João Pescador',
  email: 'joao@pescador.com'
};
localStorage.setItem('user', JSON.stringify(testUser));

// Criar capturas de teste
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
    date: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    registeredAt: new Date().toISOString()
  }
];

// Salvar em todos os formatos
localStorage.setItem('fishing_catches', JSON.stringify(testCatches));
localStorage.setItem('capturas', JSON.stringify(testCatches));
localStorage.setItem('user_catches_' + testUser.uid, JSON.stringify(testCatches));

console.log('✅ Dados de teste criados!');

// Recarregar página
window.location.reload();
```

### Opção 2: Registrar Captura Real
1. Faça login na aplicação
2. Vá para "Registrar Captura"
3. Preencha os dados e registre uma captura
4. Volte para a página inicial
5. Verifique se a captura aparece em "Capturas Recentes"

## Verificação de Dados

Para verificar se os dados estão sendo salvos corretamente:

```javascript
// No console do navegador
console.log('=== DADOS SALVOS ===');
console.log('Usuário:', JSON.parse(localStorage.getItem('user') || '{}'));
console.log('Capturas:', JSON.parse(localStorage.getItem('fishing_catches') || '[]'));
console.log('Cache do usuário:', JSON.parse(localStorage.getItem('user_catches_' + JSON.parse(localStorage.getItem('user') || '{}').uid) || '[]'));
```

## Problemas Conhecidos

### Erros de Permissão do Firestore
- **Sintoma**: Erros "Missing or insufficient permissions" no console
- **Solução**: Configurar regras de segurança do Firestore (ver `FIRESTORE_PERMISSIONS_FIX.md`)
- **Impacto**: Não impede o funcionamento offline, mas impede sincronização online

### Dados Não Aparecem
- **Causa**: Problemas na lógica de carregamento ou dados não salvos corretamente
- **Solução**: Usar o script de teste acima para verificar
- **Debug**: Verificar logs no console da página Home

## Logs de Debug

A página Home agora inclui logs detalhados no console:
- 🔄 Carregamento de dados
- 👤 Informações do usuário
- 🎣 Capturas carregadas
- 📊 Estatísticas calculadas
- 📅 Capturas recentes
- 👑 Cálculo do rei do mês

Verifique estes logs para identificar onde pode estar o problema.

## Próximos Passos

1. **Teste imediato**: Execute o script de teste no console
2. **Configuração do Firestore**: Siga as instruções em `FIRESTORE_PERMISSIONS_FIX.md`
3. **Teste real**: Registre uma captura real e verifique se aparece
4. **Monitoramento**: Observe os logs do console para identificar problemas

## Suporte

Se o problema persistir:
1. Verifique os logs do console (F12)
2. Confirme se o usuário está logado
3. Verifique se os dados estão sendo salvos no localStorage
4. Teste com dados de exemplo usando o script fornecido