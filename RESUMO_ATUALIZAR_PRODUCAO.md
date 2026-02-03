# 🚀 RESUMO: O que atualizar para funcionar online

## ⚡ AÇÕES IMEDIATAS (30 minutos)

### 1. 🔴 SUPABASE - Executar Scripts SQL (CRÍTICO)

**Acesse:** https://app.supabase.com → Seu Projeto → SQL Editor

**Execute estes 3 scripts (copie e cole cada um):**

#### Script 1: `ADICIONAR_COLUNA_GERENCIAL_TASKS.sql`
```sql
-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_checklists' 
        AND column_name = 'gerencialTasks'
    ) THEN
        ALTER TABLE public.daily_checklists 
        ADD COLUMN "gerencialTasks" JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Coluna gerencialTasks adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna gerencialTasks já existe';
    END IF;
END $$;
```

#### Script 2: `CORRIGIR_RLS_DELETE_COMPLETO.sql`
- Abra o arquivo `CORRIGIR_RLS_DELETE_COMPLETO.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Execute

#### Script 3: `CORRIGIR_RELACIONAMENTO_APP_USERS_STORES.sql`
- Abra o arquivo `CORRIGIR_RELACIONAMENTO_APP_USERS_STORES.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor do Supabase
- Execute

---

### 2. 🔐 CONFIGURAR VARIÁVEIS DE AMBIENTE

#### No Vercel:
1. Acesse: https://vercel.com → Seu Projeto → Settings → Environment Variables
2. Adicione:
   - **Nome:** `VITE_SUPABASE_URL`
   - **Valor:** `https://hzwmacltgiyanukgvfvn.supabase.co`
   - **Ambientes:** Production, Preview, Development
3. Adicione:
   - **Nome:** `VITE_SUPABASE_ANON_KEY`
   - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE`
   - **Ambientes:** Production, Preview, Development
4. Clique em **Save**

#### No Netlify:
1. Acesse: https://app.netlify.com → Seu Site → Site settings → Environment variables
2. Adicione as mesmas variáveis acima
3. Clique em **Save**

---

### 3. ✅ VERIFICAR CONFIGURAÇÕES NO SUPABASE

#### Authentication Settings:
1. Acesse: Supabase Dashboard → Authentication → Settings
2. Verifique:
   - ✅ **Email confirmations:** DESABILITADO (para criação rápida)
   - ✅ **Site URL:** Configurar com sua URL de produção
   - ✅ **Redirect URLs:** Adicionar `https://seu-dominio.com/**`

#### Realtime (para atualizações em tempo real):
1. Acesse: Supabase Dashboard → Database → Replication
2. Habilite Realtime para:
   - ✅ `daily_checklists`
   - ✅ `evaluations`
   - ✅ `stores`

---

### 4. 🚀 FAZER DEPLOY

#### Vercel:
1. Conecte seu repositório GitHub ao Vercel (se ainda não conectou)
2. O deploy será automático após configurar variáveis de ambiente
3. Ou faça deploy manual: Vercel Dashboard → Deployments → Redeploy

#### Netlify:
1. Conecte seu repositório GitHub ao Netlify (se ainda não conectou)
2. O deploy será automático após configurar variáveis de ambiente
3. Ou faça deploy manual: Netlify Dashboard → Deploys → Trigger deploy

---

## ✅ CHECKLIST RÁPIDO

- [ ] Executar 3 scripts SQL no Supabase
- [ ] Configurar variáveis de ambiente no Vercel/Netlify
- [ ] Verificar Realtime habilitado no Supabase
- [ ] Verificar Authentication settings no Supabase
- [ ] Fazer deploy
- [ ] Testar aplicação online

---

## 🐛 PROBLEMAS COMUNS

### Erro: "Column gerencialTasks not found"
**Solução:** Execute o Script 1 acima

### Erro: "Cannot delete record"
**Solução:** Execute o Script 2 acima

### Erro: "Supabase credentials missing"
**Solução:** Configure as variáveis de ambiente (passo 2)

### Build falha
**Solução:** Verifique se Node version é 18+ e se todas as dependências estão instaladas

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Execute os scripts SQL
2. ✅ Configure variáveis de ambiente
3. ✅ Faça deploy
4. ✅ Teste todas as funcionalidades:
   - Login/Logout
   - Checklists (diário e gerencial)
   - Avaliações (criar, aprovar, visualizar)
   - Gestão de Resultados
   - Todas as outras funcionalidades

---

**Tempo estimado total:** 30-45 minutos

**Status atual do código:** ✅ Pronto para produção (após executar scripts SQL)








