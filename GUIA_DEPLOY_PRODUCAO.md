# 🚀 GUIA DE DEPLOY - PRODUÇÃO

## 📋 Pré-requisitos

1. ✅ Projeto funcionando localmente
2. ✅ Conta no Supabase (produção)
3. ✅ Conta em plataforma de deploy (Vercel, Netlify, etc.)

---

## 🔧 PASSO 1: PREPARAR VARIÁVEIS DE AMBIENTE

### Opção A: Usar Variáveis de Ambiente (Recomendado)

**1.1. Atualizar `customSupabaseClient.js` para usar variáveis de ambiente:**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**1.2. Criar arquivo `.env.local` (não commitar no Git):**

```env
VITE_SUPABASE_URL=https://hzwmacltgiyanukgvfvn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE
```

**1.3. Adicionar `.env.local` ao `.gitignore`:**

```gitignore
# Variáveis de ambiente
.env
.env.local
.env.production
```

### Opção B: Manter Hardcoded (Atual)

Se preferir manter as credenciais no código (não recomendado para produção), pode continuar usando o arquivo atual.

---

## 📦 PASSO 2: BUILD DO PROJETO

**2.1. Instalar dependências:**

```bash
npm install
```

**2.2. Gerar build de produção:**

```bash
npm run build
```

Isso criará uma pasta `dist/` com os arquivos otimizados para produção.

**2.3. Testar build localmente (opcional):**

```bash
npm run preview
```

Acesse `http://localhost:3000` para verificar se tudo está funcionando.

---

## 🌐 PASSO 3: DEPLOY EM PLATAFORMAS

### Opção 1: Vercel (Recomendado) ⚡

**3.1.1. Instalar Vercel CLI (opcional):**

```bash
npm i -g vercel
```

**3.1.2. Deploy via CLI:**

```bash
vercel
```

**3.1.3. Ou conectar via Dashboard:**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Conecte seu repositório Git (GitHub, GitLab, etc.)
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL` = `https://hzwmacltgiyanukgvfvn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE`
5. Deploy automático!

**Configurações Vercel:**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

---

### Opção 2: Netlify

**3.2.1. Criar arquivo `netlify.toml` na raiz:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**3.2.2. Deploy via CLI:**

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

**3.2.3. Ou conectar via Dashboard:**

1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `dist/` ou conecte Git
3. Configure as variáveis de ambiente nas configurações do site:
   - `VITE_SUPABASE_URL` = `https://hzwmacltgiyanukgvfvn.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE`

---

### Opção 3: GitHub Pages

**3.3.1. Adicionar script no `package.json`:**

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**3.3.2. Instalar gh-pages:**

```bash
npm install --save-dev gh-pages
```

**3.3.3. Atualizar `vite.config.js`:**

```javascript
export default defineConfig({
  base: '/seu-repositorio/', // Nome do repositório
  // ... resto da configuração
});
```

**3.3.4. Deploy:**

```bash
npm run deploy
```

---

### Opção 4: Hospedagem Própria (Cpanel, FTP, etc.)

**3.4.1. Gerar build:**

```bash
npm run build
```

**3.4.2. Upload da pasta `dist/`:**

- Faça upload de todos os arquivos da pasta `dist/` para o servidor
- Certifique-se de que o servidor está configurado para servir arquivos estáticos
- Configure o servidor para redirecionar todas as rotas para `index.html` (SPA routing)

**3.4.3. Configuração do servidor (exemplo Apache `.htaccess`):**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**3.4.4. Configuração Nginx:**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## ✅ PASSO 4: VERIFICAÇÕES PÓS-DEPLOY

### 4.1. Verificar Funcionalidades:

- ✅ Login funciona
- ✅ Navegação entre páginas funciona
- ✅ Criar usuários funciona
- ✅ Checklist funciona
- ✅ Avaliações funcionam
- ✅ Feedbacks funcionam
- ✅ Metas funcionam
- ✅ Atualização em tempo real funciona

### 4.2. Verificar Console do Navegador:

- Abrir DevTools (F12)
- Verificar se há erros no Console
- Verificar se há erros no Network

### 4.3. Testar em Diferentes Dispositivos:

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

---

## 🔒 PASSO 5: SEGURANÇA

### 5.1. Configurar RLS no Supabase:

Certifique-se de que as políticas de Row Level Security (RLS) estão configuradas corretamente no Supabase para proteger os dados.

### 5.2. Configurar CORS:

No Supabase Dashboard:
1. Vá em **Settings** > **API**
2. Adicione sua URL de produção em **Allowed Origins**
   - Exemplo: `https://seu-dominio.vercel.app`

### 5.3. Variáveis de Ambiente:

- ✅ Use variáveis de ambiente para credenciais
- ✅ Nunca commite credenciais no Git
- ✅ Use diferentes credenciais para desenvolvimento e produção

---

## 📊 PASSO 6: MONITORAMENTO

### 6.1. Logs de Erro:

- Configure logging de erros (Sentry, LogRocket, etc.)
- Monitore erros em produção

### 6.2. Performance:

- Use ferramentas como Lighthouse para medir performance
- Otimize imagens e assets

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "Missing Supabase environment variables"

**Solução:** Configure as variáveis de ambiente na plataforma de deploy.

### Erro: "CORS policy"

**Solução:** Adicione sua URL de produção nas configurações de CORS do Supabase.

### Erro: Páginas não carregam (404)

**Solução:** Configure o servidor para redirecionar todas as rotas para `index.html` (SPA routing).

### Build falha

**Solução:** 
- Limpar cache: `rm -rf node_modules dist package-lock.json && npm install`
- Verificar logs de erro
- Verificar se todas as dependências estão instaladas

---

## 📝 CHECKLIST FINAL

- [ ] Build gerado com sucesso (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado
- [ ] URL de produção adicionada ao CORS do Supabase
- [ ] Testes funcionais realizados
- [ ] Testes em diferentes dispositivos realizados
- [ ] Console sem erros
- [ ] Performance verificada
- [ ] Backup dos dados realizado

---

## 🎉 PRONTO!

Seu sistema está em produção! 🚀

**URL de Produção:** [insira aqui]

**Próximos passos:**
- Monitorar logs de erro
- Coletar feedback dos usuários
- Implementar melhorias baseadas no uso


