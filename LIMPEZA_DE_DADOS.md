# Ferramenta de Limpeza de Dados - Tilapios

## Descrição

Esta ferramenta foi criada para facilitar a limpeza completa de dados do Firebase (Firestore e Storage) nos ambientes de produção e homologação do Tilapios. Ela permite apagar todos os dados de forma segura e controlada para realizar novos testes.

## ⚠️ ATENÇÃO: OPERAÇÃO DE ALTO RISCO

**Esta ferramenta irá APAGAR PERMANENTEMENTE todos os dados do Firebase. Esta ação é IRREVERSÍVEL e deve ser usada com extrema cautela.**

## Como Usar

### Método 1: Executar o arquivo BAT

1. Dê um duplo clique no arquivo `executar-limpeza.bat`
2. O navegador será aberto automaticamente com a ferramenta

### Método 2: Abrir diretamente o arquivo HTML

1. Abra o arquivo `limpar-dados.html` em seu navegador

## Instruções de Uso

1. **Autenticação**: Você deve estar autenticado no sistema Tilapios para usar a ferramenta
2. **Selecione o Ambiente**: Escolha entre PRODUÇÃO ou HOMOLOGAÇÃO
3. **Limpar Dados**: Clique no botão "Limpar Dados" e siga as instruções de confirmação
4. **Limpar Cache Local**: Use esta opção para limpar apenas o cache local do navegador

## O que será limpo

### Dados do Firestore
Todas as coleções serão limpas, incluindo:
- users
- posts
- tournaments
- fishing_tournaments
- fishing_catches
- catches
- rankings
- comments
- likes

### Firebase Storage
Todos os arquivos e pastas armazenados no Storage serão removidos.

### Dados Locais
- localStorage do navegador
- Cookies relacionados à aplicação

## Após a Limpeza

Recomendamos fazer logout e login novamente para atualizar o estado da aplicação após a limpeza de dados.

## Suporte

Em caso de problemas ou dúvidas, entre em contato com a equipe de desenvolvimento.