# 📋 Checklist Completo para Deploy em Produção

## 🔍 Verificações Necessárias

### 1. ✅ SUPABASE - Scripts SQL Pendentes

#### Scripts CRÍTICOS que DEVEM ser executados no Supabase:

1. **`ADICIONAR_COLUNA_GERENCIAL_TASKS.sql`**
   - **O que faz:** Adiciona coluna `gerencialTasks` na tabela `daily_checklists`
   - **Status:** ⚠️ CRÍTICO - Necessário para checklists funcionarem
   - **Como executar:**
     - Acesse: https://app.supabase.com → Seu Projeto → SQL Editor
     - Cole o conteúdo do arquivo
     - Execute (Run)

2. **`CORRIGIR_RLS_DELETE_COMPLETO.sql`**
   - **O que faz:** Adiciona políticas RLS para DELETE em `returns` e `physical_missing`
   - **Status:** ⚠️ CRÍTICO - Necessário para deletar registros
   - **Como executar:** Mesmo processo acima

3. **`CORRIGIR_RELACIONAMENTO_APP_USERS_STORES.sql`**
   - **O que faz:** Corrige relacionamento entre `app_users` e `stores`
   - **Status:** ⚠️ IMPORTANTE - Melhora integridade dos dados
   - **Como executar:** Mesmo processo acima

#### Scripts RECOMENDADOS (verificar se já foram executados):

- `HABILITAR_REALTIME_STORES.sql` - Para atualizações em tempo real
- `CRIAR_TABELA_CHECKLIST_AUDITORIA.sql` - Para funcionalidade de auditoria
- Verificar se todas as políticas RLS estão criadas

---

### 2. 🔐 VARIÁVEIS DE AMBIENTE

#### Configuração no Supabase:
- ✅ URL do Supabase: `https://hzwmacltgiyanukgvfvn.supabase.co`
- ✅ Anon Key: Já configurada no código (fallback)

#### Configuração no Vercel/Netlify/GitHub Pages:

**Variáveis de Ambiente OBRIGATÓRIAS:**

```env
VITE_SUPABASE_URL=https://hzwmacltgiyanukgvfvn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE
```

**Como configurar:**

**Vercel:**
1. Acesse: https://vercel.com → Seu Projeto → Settings → Environment Variables
2. Adicione as duas variáveis acima
3. Selecione: Production, Preview, Development
4. Clique em Save

**Netlify:**
1. Acesse: https://app.netlify.com → Seu Site → Site settings → Environment variables
2. Adicione as duas variáveis acima
3. Clique em Save

**GitHub Pages (via GitHub Actions):**
- Adicione as variáveis em: Settings → Secrets and variables → Actions → New repository secret

---

### 3. 🚀 CONFIGURAÇÃO DE DEPLOY

#### Vercel (Recomendado):

**Arquivo `vercel.json` já existe?** ✅ SIM

**Configuração necessária:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Passos para deploy:**
1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis de ambiente (veja seção 2)
3. Deploy automático será feito a cada push

#### Netlify:

**Arquivo `netlify.toml` já existe?** ✅ SIM

**Configuração atual:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

**Passos para deploy:**
1. Conecte o repositório GitHub ao Netlify
2. Configure as variáveis de ambiente
3. Deploy automático será feito a cada push

---

### 4. 📦 BUILD E DEPENDÊNCIAS

#### Verificações:

- ✅ `package.json` configurado corretamente
- ✅ Scripts de build: `npm run build`
- ✅ Dependências atualizadas
- ✅ Node version: 18+ (configurado no netlify.toml)

#### Comandos para testar localmente:

```bash
# Instalar dependências
npm install

# Testar build
npm run build

# Testar preview
npm run preview
```

---

### 5. 🔒 SUPABASE - Configurações de Segurança

#### Verificações no Supabase Dashboard:

1. **Authentication → Settings:**
   - ✅ Email confirmations: **DESABILITADO** (para criação rápida de usuários)
   - ✅ Site URL: Configurar com URL de produção
   - ✅ Redirect URLs: Adicionar URL de produção

2. **Database → Replication:**
   - ✅ Habilitar Realtime para:
     - `daily_checklists`
     - `evaluations`
     - `stores`

3. **Database → Row Level Security (RLS):**
   - ✅ Verificar se todas as tabelas têm RLS habilitado
   - ✅ Verificar se todas as políticas estão criadas

---

### 6. 🌐 CONFIGURAÇÃO DE DOMÍNIO

#### URLs que precisam ser configuradas:

1. **Supabase Dashboard → Authentication → URL Configuration:**
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs: `https://seu-dominio.com/**`

2. **Vercel/Netlify:**
   - Configurar domínio customizado (opcional)
   - Verificar HTTPS habilitado

---

### 7. 📝 CHECKLIST FINAL ANTES DO DEPLOY

#### Supabase:
- [ ] Executar `ADICIONAR_COLUNA_GERENCIAL_TASKS.sql`
- [ ] Executar `CORRIGIR_RLS_DELETE_COMPLETO.sql`
- [ ] Executar `CORRIGIR_RELACIONAMENTO_APP_USERS_STORES.sql`
- [ ] Verificar Realtime habilitado para tabelas críticas
- [ ] Verificar RLS habilitado em todas as tabelas
- [ ] Desabilitar confirmação de email (se necessário)

#### Variáveis de Ambiente:
- [ ] Configurar `VITE_SUPABASE_URL` no Vercel/Netlify
- [ ] Configurar `VITE_SUPABASE_ANON_KEY` no Vercel/Netlify

#### Build:
- [ ] Testar build local: `npm run build`
- [ ] Verificar se não há erros no console
- [ ] Testar preview: `npm run preview`

#### Deploy:
- [ ] Conectar repositório ao Vercel/Netlify
- [ ] Configurar variáveis de ambiente
- [ ] Fazer primeiro deploy
- [ ] Testar aplicação em produção
- [ ] Verificar autenticação funcionando
- [ ] Verificar checklists funcionando
- [ ] Verificar avaliações funcionando
- [ ] Verificar gestão de resultados funcionando

---

### 8. 🐛 TROUBLESHOOTING

#### Erro: "Supabase credentials missing"
- **Solução:** Verificar se variáveis de ambiente estão configuradas no Vercel/Netlify

#### Erro: "Column gerencialTasks not found"
- **Solução:** Executar `ADICIONAR_COLUNA_GERENCIAL_TASKS.sql` no Supabase

#### Erro: "RLS policy violation"
- **Solução:** Executar scripts de correção de RLS no Supabase

#### Erro: "Cannot delete record"
- **Solução:** Executar `CORRIGIR_RLS_DELETE_COMPLETO.sql` no Supabase

#### Build falha no Vercel/Netlify
- **Solução:** Verificar logs de build, verificar Node version (deve ser 18+)

---

### 9. 📚 DOCUMENTAÇÃO ADICIONAL

#### Arquivos úteis no projeto:
- `README.md` - Documentação geral
- `README_SUPABASE_FIX.md` - Correções do Supabase
- `GUIA_DEPLOY_PRODUCAO.md` - Guia de deploy (se existir)
- `INSTRUCOES_CORRECAO.md` - Instruções de correção

---

### 10. ✅ PRÓXIMOS PASSOS

1. **Execute os scripts SQL críticos no Supabase**
2. **Configure as variáveis de ambiente no Vercel/Netlify**
3. **Faça o primeiro deploy**
4. **Teste todas as funcionalidades**
5. **Configure domínio customizado (opcional)**

---

## 🎯 RESUMO RÁPIDO

### O que fazer AGORA:

1. ✅ Executar 3 scripts SQL no Supabase (veja seção 1)
2. ✅ Configurar variáveis de ambiente no Vercel/Netlify (veja seção 2)
3. ✅ Fazer deploy
4. ✅ Testar

### Tempo estimado: 30-45 minutos

---

**Última atualização:** $(date)
**Versão do projeto:** 1.0.0








