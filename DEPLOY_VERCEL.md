# Instruções para Deploy no Vercel

## 1. Preparação

Antes de fazer o deploy, certifique-se de que:

- [x] As correções do Supabase foram implementadas
- [x] A aplicação está funcionando localmente

## 2. Deploy no Vercel

### Opção 1: Deploy Automático via GitHub

1. Faça commit das alterações:
   ```bash
   git add .
   git commit -m "Corrige erro do Supabase na produção"
   git push
   ```

2. O Vercel detectará automaticamente as alterações e fará o deploy

### Opção 2: Deploy Manual

1. Faça build da aplicação:
   ```bash
   npm run build
   ```

2. Instale a CLI do Vercel (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

3. Faça login e deploy:
   ```bash
   vercel login
   vercel --prod
   ```

## 3. Verificação

Após o deploy, acesse [tilapios.vercel.app](https://tilapios.vercel.app) e verifique:

- [ ] A aplicação carrega sem tela branca
- [ ] O login funciona corretamente
- [ ] As funcionalidades principais estão operando

## 4. Solução de Problemas

Se ainda houver problemas:

1. Verifique os logs no dashboard do Vercel
2. Confirme que as variáveis de ambiente estão configuradas corretamente no Vercel
3. Se necessário, adicione a seguinte configuração no arquivo `vercel.json`:

```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

## 5. Configuração do Supabase (Opcional)

Se desejar habilitar o storage de imagens:

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Configure as variáveis de ambiente no Vercel:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase