# ✅ GARANTIA: CHECKLIST DIÁRIO E PPAD GERENCIAL SEPARADOS

## 🎯 CONFIRMAÇÃO

O sistema está configurado para manter **DOIS CHECKLISTS SEPARADOS**:

### 1. **Checklist Diário** (`daily_tasks`)
   - **Localização**: `app_settings` com chave `daily_tasks`
   - **Salvo em**: Campo `tasks` (JSONB) na tabela `daily_checklists`
   - **Uso**: Tarefas operacionais diárias
   - **Componente**: `StoreDailyChecklist` / `DailyChecklist`

### 2. **PPAD Gerencial** (`gerencial_tasks`)
   - **Localização**: `app_settings` com chave `gerencial_tasks`
   - **Salvo em**: Campo `gerencialTasks` (JSONB) na tabela `daily_checklists`
   - **Uso**: Tarefas gerenciais do PPAD
   - **Componente**: `StoreGerencialChecklist` / `GerencialChecklist`

---

## 📊 ESTRUTURA NO BANCO DE DADOS

### Tabela: `daily_checklists`
```sql
- id (uuid)
- store_id (uuid)
- date (date)
- tasks (jsonb)          ← Checklist Diário
- gerencialTasks (jsonb) ← PPAD Gerencial
- created_at (timestamp)
- updated_at (timestamp)
- checklist_type (text)
```

### Tabela: `app_settings`
```sql
- key: 'daily_tasks'      → Array de tarefas do checklist diário
- key: 'gerencial_tasks'  → Array de tarefas do PPAD gerencial
```

---

## ✅ FUNCIONAMENTO INDEPENDENTE

### **Checklist Diário**
- ✅ Carregado de `app_settings` com chave `daily_tasks`
- ✅ Salvo no campo `tasks` da tabela `daily_checklists`
- ✅ Função: `updateChecklist(storeId, taskId, isChecked)`
- ✅ Context: `dailyTasks` e `checklist[storeId].tasks`

### **PPAD Gerencial**
- ✅ Carregado de `app_settings` com chave `gerencial_tasks`
- ✅ Salvo no campo `gerencialTasks` da tabela `daily_checklists`
- ✅ Função: `updateGerencialChecklist(storeId, taskId, isChecked)`
- ✅ Context: `gerencialTasks` e `checklist[storeId].gerencialTasks`

---

## 🔧 FUNÇÕES DE SALVAR

### `updateChecklist` (Diário)
```javascript
// Salva apenas no campo 'tasks'
await api.upsertDailyChecklist(storeId, todayStr, newTasks);
// Não afeta gerencialTasks
```

### `updateGerencialChecklist` (Gerencial)
```javascript
// Salva apenas no campo 'gerencialTasks'
await api.upsertDailyChecklist(storeId, todayStr, existingTasks, newGerencialTasks);
// Preserva 'tasks' existente
```

---

## 📋 VERIFICAÇÃO

### **No Banco de Dados**
```sql
-- Verificar checklist diário
SELECT tasks FROM daily_checklists WHERE store_id = '...' AND date = '2025-12-23';

-- Verificar PPAD gerencial
SELECT "gerencialTasks" FROM daily_checklists WHERE store_id = '...' AND date = '2025-12-23';

-- Ambos podem existir no mesmo registro, mas são campos separados
```

### **No Frontend**
- ✅ Lojas: `/store-checklists` tem tabs separadas
- ✅ Admin: `/checklist` tem tabs separadas
- ✅ Cada checklist funciona independentemente
- ✅ Histórico mostra ambos separadamente

---

## ✅ CONFIRMAÇÃO FINAL

- [x] **Checklist Diário**: Funciona independentemente
- [x] **PPAD Gerencial**: Funciona independentemente
- [x] **Campos separados**: `tasks` e `gerencialTasks`
- [x] **Configurações separadas**: `daily_tasks` e `gerencial_tasks`
- [x] **Funções separadas**: `updateChecklist` e `updateGerencialChecklist`
- [x] **Componentes separados**: Cada um tem seu próprio componente
- [x] **Tabs separadas**: Interface permite alternar entre eles

---

**Status**: ✅ Ambos os checklists estão completamente separados e funcionando independentemente!


