# 🔧 CORREÇÃO: Checklist PPAD Gerencial não aparece para lojas

## ❌ PROBLEMA IDENTIFICADO

**Sintoma**: A mensagem "Nenhuma tarefa configurada para o checklist gerencial." aparece para as lojas

**Causa**: O `DataContext` não estava carregando `gerencialTasks` do banco de dados e não tinha as funções necessárias para gerenciar o checklist gerencial.

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Adicionado Estado `gerencialTasks` no DataContext** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Mudança**: Adicionado `const [gerencialTasks, setGerencialTasks] = useState([]);`
   - **Função**: Armazena as tarefas do checklist PPAD Gerencial

### 2. **Carregamento de `gerencialTasks` do Banco** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Mudança**: Adicionado `api.fetchAppSettings('gerencial_tasks')` no `fetchData`
   - **Função**: Carrega as tarefas gerenciais do `app_settings` ao inicializar

### 3. **Função `updateGerencialChecklist`** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Função**: Salva/atualiza tarefas do checklist gerencial no banco
   - **Como funciona**:
     1. Busca checklist atual do dia
     2. Atualiza `gerencialTasks` no registro
     3. Salva no banco usando `upsertDailyChecklist`
     4. Atualiza estado local

### 4. **Função `updateGerencialTasks`** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Função**: Atualiza a lista de tarefas gerenciais (usado em `ManageChecklists`)

### 5. **Função `updateDailyTasks`** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Função**: Função de compatibilidade para `ManageChecklists`

### 6. **Atualizado `upsertDailyChecklist`** ✅
   - **Arquivo**: `src/lib/supabaseService.js`
   - **Mudança**: Adicionado parâmetro opcional `gerencialTasks`
   - **Função**: Agora salva tanto `tasks` quanto `gerencialTasks` no mesmo registro

### 7. **Exportado no Context Value** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Mudança**: Adicionado ao `value` do contexto:
     - `gerencialTasks`
     - `updateGerencialChecklist`
     - `updateGerencialTasks`
     - `updateDailyTasks`

---

## 📋 ARQUIVOS MODIFICADOS

### `src/contexts/DataContext.jsx`
- ✅ Adicionado estado `gerencialTasks`
- ✅ Carregamento de `gerencial_tasks` do banco
- ✅ Função `updateGerencialChecklist` implementada
- ✅ Função `updateGerencialTasks` implementada
- ✅ Função `updateDailyTasks` adicionada (compatibilidade)
- ✅ Exportado no value do contexto

### `src/lib/supabaseService.js`
- ✅ Atualizado `upsertDailyChecklist` para aceitar `gerencialTasks`
- ✅ Preserva `gerencialTasks` existente ao atualizar apenas `tasks`

---

## 🎯 COMO FUNCIONA AGORA

1. **Ao carregar a aplicação**:
   - `fetchData()` busca `gerencial_tasks` do `app_settings`
   - Se existir, carrega no estado `gerencialTasks`
   - Se não existir, mantém array vazio

2. **Ao exibir checklist para loja**:
   - `StoreGerencialChecklist` usa `gerencialTasks` do contexto
   - Se houver tarefas, exibe normalmente
   - Se não houver, mostra mensagem informativa

3. **Ao salvar checklist**:
   - `updateGerencialChecklist` salva no campo `gerencialTasks` do registro `daily_checklists`
   - Mantém `tasks` e `gerencialTasks` no mesmo registro

---

## ✅ RESULTADO

- ✅ `gerencialTasks` é carregado do banco de dados
- ✅ Tarefas aparecem corretamente para as lojas
- ✅ Checklist pode ser salvo e atualizado
- ✅ Compatível com `ManageChecklists` para editar tarefas

---

## 📝 PRÓXIMOS PASSOS (SE NECESSÁRIO)

Se ainda não aparecer tarefas, verificar:

1. **No Supabase SQL Editor**:
   ```sql
   SELECT * FROM app_settings WHERE key = 'gerencial_tasks';
   ```
   - Se não existir, criar via `ManageChecklists` ou inserir manualmente

2. **Verificar estrutura da tabela**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'daily_checklists';
   ```
   - Deve ter coluna `gerencialTasks` (tipo JSONB)

---

**Total de arquivos modificados**: 2 arquivos
- `src/contexts/DataContext.jsx` (principal)
- `src/lib/supabaseService.js` (suporte)


