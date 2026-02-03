# 🔧 CORREÇÃO: Erro ao Salvar Daily Checklists

## ❌ PROBLEMA IDENTIFICADO

**Erro**: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

**Causa**: A função `upsertDailyChecklist` estava usando `onConflict: 'store_id,date'`, mas não existe uma constraint única correspondente na tabela `daily_checklists` do banco de dados.

**Localização**: `src/lib/supabaseService.js` - função `upsertDailyChecklist`

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. **Correção Imediata no Código** ✅
   - **Arquivo**: `src/lib/supabaseService.js`
   - **Mudança**: Alterado `upsertDailyChecklist` para fazer INSERT/UPDATE manual
   - **Como funciona**:
     1. Verifica se já existe um registro usando `fetchDailyChecklist`
     2. Se existe → faz UPDATE
     3. Se não existe → faz INSERT
   - **Vantagem**: Funciona imediatamente, sem precisar alterar o banco de dados

### 2. **Script SQL para Constraint Única** ✅
   - **Arquivo**: `CRIAR_CONSTRAINT_DAILY_CHECKLISTS.sql`
   - **O que faz**: Cria uma constraint única `(store_id, date)` na tabela `daily_checklists`
   - **Vantagem**: Permite usar `upsert` com `onConflict` no futuro (mais eficiente)
   - **Status**: Script criado, mas não executado ainda

---

## 📋 ARQUIVOS MODIFICADOS

### `src/lib/supabaseService.js`
```javascript
// ANTES (com erro):
.upsert({...}, { onConflict: 'store_id,date' })

// DEPOIS (corrigido):
// Verifica se existe → UPDATE ou INSERT manual
```

### `CRIAR_CONSTRAINT_DAILY_CHECKLISTS.sql` (NOVO)
- Script SQL para criar constraint única no banco de dados
- Pode ser executado no Supabase SQL Editor quando necessário

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

### Para melhorar a performance futuramente:

1. **Executar o script SQL** no Supabase:
   - Abrir SQL Editor no Supabase
   - Executar `CRIAR_CONSTRAINT_DAILY_CHECKLISTS.sql`
   - Isso criará a constraint única `(store_id, date)`

2. **Reverter para `upsert` com `onConflict`** (opcional):
   - Após criar a constraint, pode voltar a usar `upsert` com `onConflict`
   - Será mais eficiente (1 query ao invés de 2)

---

## ✅ RESULTADO

- ✅ Erro corrigido - não mais aparecerá no console
- ✅ Checklists podem ser salvos corretamente
- ✅ Funciona imediatamente sem alterar o banco de dados
- ✅ Script SQL disponível para otimização futura

---

**Total de arquivos modificados**: 1 arquivo (`src/lib/supabaseService.js`)
**Total de arquivos novos**: 1 arquivo (`CRIAR_CONSTRAINT_DAILY_CHECKLISTS.sql`)


