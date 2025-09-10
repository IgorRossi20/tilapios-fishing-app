// Script para limpar todos os dados do Firebase (produção e homologação)
// Este script deve ser executado no console do navegador quando estiver logado como administrador

/**
 * Função para limpar todos os dados do Firestore
 * ATENÇÃO: Esta operação é irreversível e removerá TODOS os dados!
 */
async function limparTodosDados() {
  // Verificar se o Firebase está disponível
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase não está disponível. Execute este script em uma página com Firebase inicializado.');
    return;
  }

  // Verificar se o usuário está autenticado
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ Usuário não está autenticado. Faça login como administrador primeiro.');
    return;
  }

  console.log('🔄 Iniciando limpeza de dados...');
  console.log('👤 Usuário autenticado:', user.email);

  // Confirmar antes de prosseguir
  if (!confirm('⚠️ ATENÇÃO: Esta operação irá APAGAR TODOS OS DADOS do Firebase. Esta ação é IRREVERSÍVEL! Deseja continuar?')) {
    console.log('❌ Operação cancelada pelo usuário.');
    return;
  }

  // Segunda confirmação com o ambiente
  const ambiente = prompt('Digite o ambiente que deseja limpar (PRODUÇÃO ou HOMOLOGAÇÃO):').toUpperCase();
  
  if (ambiente !== 'PRODUÇÃO' && ambiente !== 'HOMOLOGACAO' && ambiente !== 'HOMOLOGAÇÃO') {
    console.log('❌ Ambiente inválido. Operação cancelada.');
    return;
  }

  // Terceira confirmação com palavra-chave
  const confirmacao = prompt(`Digite CONFIRMAR-${ambiente} para prosseguir com a limpeza de TODOS os dados:`);
  
  if (confirmacao !== `CONFIRMAR-${ambiente}`) {
    console.log('❌ Confirmação inválida. Operação cancelada.');
    return;
  }

  try {
    const db = firebase.firestore();
    console.log('🔄 Conectado ao Firestore. Iniciando limpeza de coleções...');

    // Lista de coleções para limpar
    const colecoes = [
      'users',
      'posts',
      'tournaments',
      'fishing_tournaments',
      'fishing_catches',
      'catches',
      'rankings',
      'comments',
      'likes'
    ];

    // Limpar cada coleção
    for (const colecao of colecoes) {
      console.log(`🔄 Limpando coleção: ${colecao}...`);
      
      try {
        const snapshot = await db.collection(colecao).limit(500).get();
        
        if (snapshot.empty) {
          console.log(`ℹ️ Coleção ${colecao} está vazia.`);
          continue;
        }

        // Criar lote para operações em massa
        let batch = db.batch();
        let contador = 0;
        let totalDeletado = 0;

        // Adicionar cada documento ao lote para exclusão
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          contador++;
          totalDeletado++;

          // Firestore tem limite de 500 operações por lote
          if (contador >= 499) {
            console.log(`🔄 Executando lote de ${contador} exclusões...`);
            batch.commit();
            batch = db.batch();
            contador = 0;
          }
        });

        // Executar o lote final se houver operações pendentes
        if (contador > 0) {
          console.log(`🔄 Executando lote final de ${contador} exclusões...`);
          await batch.commit();
        }

        console.log(`✅ Coleção ${colecao}: ${totalDeletado} documentos removidos.`);

        // Verificar se há mais documentos para excluir (recursivamente)
        if (totalDeletado >= 500) {
          console.log(`ℹ️ Possíveis documentos restantes em ${colecao}. Continuando limpeza...`);
          // Chamar recursivamente para continuar a limpeza
          await limparColecao(db, colecao);
        }
      } catch (erro) {
        console.error(`❌ Erro ao limpar coleção ${colecao}:`, erro);
      }
    }

    // Limpar também o Storage
    console.log('🔄 Iniciando limpeza do Storage...');
    try {
      const storage = firebase.storage();
      const storageRef = storage.ref();
      
      // Listar todos os itens no storage
      const resultado = await storageRef.listAll();
      
      // Excluir todos os arquivos
      const promessasArquivos = resultado.items.map(item => {
        console.log(`🔄 Excluindo arquivo: ${item.fullPath}`);
        return item.delete();
      });
      
      // Processar recursivamente todas as pastas
      const promessasPastas = resultado.prefixes.map(pasta => limparPastaStorage(pasta));
      
      // Aguardar todas as exclusões
      await Promise.all([...promessasArquivos, ...promessasPastas]);
      
      console.log('✅ Limpeza do Storage concluída.');
    } catch (erro) {
      console.error('❌ Erro ao limpar Storage:', erro);
    }

    // Limpar localStorage do navegador
    console.log('🔄 Limpando localStorage do navegador...');
    localStorage.clear();
    console.log('✅ localStorage limpo.');

    console.log('✅ LIMPEZA DE DADOS CONCLUÍDA COM SUCESSO!');
    console.log('ℹ️ Recomendamos fazer logout e login novamente para atualizar o estado da aplicação.');
  } catch (erro) {
    console.error('❌ Erro durante a limpeza de dados:', erro);
  }
}

/**
 * Função auxiliar para limpar uma coleção recursivamente
 */
async function limparColecao(db, nomeColecao) {
  const snapshot = await db.collection(nomeColecao).limit(500).get();
  
  if (snapshot.empty) {
    console.log(`✅ Coleção ${nomeColecao} completamente limpa.`);
    return;
  }

  let batch = db.batch();
  let contador = 0;
  let totalDeletado = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    contador++;
    totalDeletado++;

    if (contador >= 499) {
      batch.commit();
      batch = db.batch();
      contador = 0;
    }
  });

  if (contador > 0) {
    await batch.commit();
  }

  console.log(`🔄 Coleção ${nomeColecao}: mais ${totalDeletado} documentos removidos.`);

  // Continuar limpando se ainda houver documentos
  if (totalDeletado > 0) {
    await limparColecao(db, nomeColecao);
  }
}

/**
 * Função auxiliar para limpar uma pasta do Storage recursivamente
 */
async function limparPastaStorage(pastaRef) {
  try {
    // Listar conteúdo da pasta
    const resultado = await pastaRef.listAll();
    
    // Excluir todos os arquivos na pasta
    const promessasArquivos = resultado.items.map(item => {
      console.log(`🔄 Excluindo arquivo: ${item.fullPath}`);
      return item.delete();
    });
    
    // Processar recursivamente todas as subpastas
    const promessasPastas = resultado.prefixes.map(subpasta => limparPastaStorage(subpasta));
    
    // Aguardar todas as exclusões
    await Promise.all([...promessasArquivos, ...promessasPastas]);
    
    console.log(`✅ Pasta ${pastaRef.fullPath} limpa.`);
  } catch (erro) {
    console.error(`❌ Erro ao limpar pasta ${pastaRef.fullPath}:`, erro);
  }
}

// Executar a função principal
// limparTodosDados();

console.log('ℹ️ Script de limpeza carregado. Para executar, digite: limparTodosDados()');
console.log('⚠️ ATENÇÃO: Esta operação irá APAGAR TODOS OS DADOS. Use com extrema cautela!');