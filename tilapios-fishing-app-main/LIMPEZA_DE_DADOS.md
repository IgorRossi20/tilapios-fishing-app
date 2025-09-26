# Ferramenta de Limpeza de Dados - Tilapios

## Descrição

Esta ferramenta foi desenvolvida para facilitar a limpeza de dados do Firebase (Firestore e Storage) nos ambientes de produção e homologação do aplicativo Tilapios. Ela permite apagar todos os dados de forma segura e controlada, com confirmações para evitar exclusões acidentais.

## ⚠️ ATENÇÃO: OPERAÇÃO DE ALTO RISCO

**Esta ferramenta irá APAGAR PERMANENTEMENTE todos os dados do Firebase. Esta ação é IRREVERSÍVEL e deve ser usada com extrema cautela.**

## Como Usar

Execute o arquivo `executar-limpeza.bat` e escolha uma das opções disponíveis:

### Opção 1: Ferramenta de Limpeza de Dados

Esta opção abre a ferramenta principal para limpar dados do Firebase.

### Opção 2: Teste de Conexão com Firebase

Esta opção abre uma ferramenta de diagnóstico para testar a conexão com o Firebase e verificar a autenticação. Use esta opção se estiver tendo problemas com a ferramenta principal.

## Autenticação

Para utilizar a ferramenta, você precisa estar autenticado com uma conta que tenha permissões de administrador no Firebase.

**Novo**: A ferramenta agora inclui um formulário de login manual diretamente na interface, facilitando a autenticação sem precisar navegar para outra página.

## Seleção de Ambiente

A ferramenta permite selecionar qual ambiente você deseja limpar:

- **Produção**: Ambiente de produção (dados reais)
- **Homologação**: Ambiente de testes/homologação

## O que será limpo

A ferramenta irá limpar:

1. **Coleções do Firestore**:
   - users
   - posts
   - tournaments
   - fishing_tournaments
   - fishing_catches
   - catches
   - rankings
   - comments
   - likes

2. **Firebase Storage**: Todos os arquivos armazenados

3. **Dados Locais**: localStorage do navegador

## Confirmação de Segurança

Para evitar exclusões acidentais, a ferramenta exige uma confirmação digitando uma frase específica antes de executar a limpeza.

## Solução de Problemas

Se a ferramenta não estiver funcionando corretamente:

1. Use a opção "Testar conexão com Firebase" no menu inicial para verificar se a conexão está funcionando
2. Verifique se as credenciais do Firebase estão corretas
3. Tente fazer login manualmente usando o formulário na interface
4. Limpe o cache do navegador e tente novamente

## Após a Limpeza

Após a conclusão da limpeza, recomenda-se:

1. Fazer logout e login novamente para atualizar o estado da aplicação
2. Verificar se todos os dados foram realmente removidos
3. Reiniciar a aplicação, se necessário

## Suporte

Em caso de problemas ou dúvidas, entre em contato com a equipe de desenvolvimento.