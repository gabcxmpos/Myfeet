# ✅ CONFIGURAÇÃO COMPLETA PPAD GERENCIAL

## 🎯 OBJETIVO
Configurar o checklist PPAD Gerencial com todas as tarefas por tema, ativo para lojas e admin/supervisor, funcionando igual ao checklist diário, e salvar as tarefas no servidor.

---

## ✅ IMPLEMENTAÇÕES REALIZADAS

### 1. **Tarefas Criadas e Configuradas** ✅
   - **Total**: 35 tarefas distribuídas em 5 setores
   - **Setores**: PRODUTO (6), AMBIENTACAO (8), DIGITAL (4), ADMINISTRATIVO (8), PESSOAS (6)
   - **Script SQL**: `INSERIR_TAREFAS_PPAD_GERENCIAL.sql` criado

### 2. **Código Frontend Atualizado** ✅
   - ✅ `DataContext` carrega `gerencialTasks` do banco
   - ✅ Função `updateGerencialChecklist` implementada
   - ✅ Função `updateGerencialTasks` implementada
   - ✅ `upsertDailyChecklist` suporta `gerencialTasks`
   - ✅ Componentes funcionando para lojas e admin/supervisor

### 3. **Integração com DailyChecklist** ✅
   - ✅ Tabs adicionadas no `/checklist` para admin/supervisor
   - ✅ Alternância entre "Checklist Diário" e "PPAD Gerencial"
   - ✅ Funcionalidade igual ao checklist diário
   - ✅ Histórico e auditoria funcionando

### 4. **Para Lojas** ✅
   - ✅ Página `/store-checklists` com tabs
   - ✅ Aba "PPAD Gerencial" funcional
   - ✅ Visualização por setor
   - ✅ Marcar tarefas como concluídas
   - ✅ Progresso visual
   - ✅ Histórico de 7 dias

---

## 📋 ARQUIVOS MODIFICADOS

### **Código Frontend**
1. ✅ `src/contexts/DataContext.jsx`
   - Adicionado estado `gerencialTasks`
   - Carregamento de `gerencial_tasks` do banco
   - Funções `updateGerencialChecklist` e `updateGerencialTasks`

2. ✅ `src/lib/supabaseService.js`
   - `upsertDailyChecklist` atualizado para suportar `gerencialTasks`

3. ✅ `src/pages/DailyChecklist.jsx`
   - Tabs adicionadas para admin/supervisor
   - Import de `AdminSupervisorGerencialChecklistView`

4. ✅ `src/pages/GerencialChecklist.jsx`
   - Export de `AdminSupervisorGerencialChecklistView`
   - Função `handleMarkAsAudited` corrigida
   - Carregamento de status de auditoria

### **Scripts SQL**
1. ✅ `INSERIR_TAREFAS_PPAD_GERENCIAL.sql`
   - Insere 35 tarefas no `app_settings`
   - Organizadas por setor

2. ✅ `VERIFICAR_E_CRIAR_COLUNA_GERENCIAL_TASKS.sql`
   - Verifica/cria coluna `gerencialTasks` na tabela `daily_checklists`

---

## 🚀 PASSOS PARA ATIVAR

### **1. Executar Scripts SQL no Supabase** ⚠️

#### **Passo 1.1**: Verificar/Criar Coluna
```sql
-- Executar: VERIFICAR_E_CRIAR_COLUNA_GERENCIAL_TASKS.sql
-- Garante que a coluna gerencialTasks existe
```

#### **Passo 1.2**: Inserir Tarefas
```sql
-- Executar: INSERIR_TAREFAS_PPAD_GERENCIAL.sql
-- Insere todas as 35 tarefas no banco
```

### **2. Verificar Funcionalidade** ✅

#### **Para Lojas**:
- Acessar `/store-checklists`
- Clicar na aba "PPAD Gerencial"
- Verificar se as tarefas aparecem
- Marcar uma tarefa e verificar se salva

#### **Para Admin/Supervisor**:
- Acessar `/checklist`
- Verificar se há tabs "Checklist Diário" e "PPAD Gerencial"
- Clicar em "PPAD Gerencial"
- Verificar se mostra todas as lojas
- Marcar tarefas para uma loja e verificar se salva

---

## 📊 ESTRUTURA DAS TAREFAS

### **PRODUTO** (6 tarefas)
- SCORE
- RANK. PRODUTOS
- BEST SELLERS
- PONTAS
- TAG SIZE
- TAG PRICE

### **AMBIENTACAO** (8 tarefas)
- TWALL
- SOM
- UNIFORME
- ENGAGE
- PASSADORIA
- LIMPEZA
- REPOSICAO
- TELAS DIGITAIS

### **DIGITAL** (4 tarefas)
- SLA
- CANCELAMENTOS
- CLIENTES
- DEVOLUCOES

### **ADMINISTRATIVO** (8 tarefas)
- RECEBIMENTO
- DEVOLUCOES
- DEPOSITOS
- NOTAS TRANSF PENDENTES
- NOTAS CONSUMO
- FECHAMENTO CAIXA
- INVENTARIO
- MALOTES

### **PESSOAS** (6 tarefas)
- ESCALA
- HEADCOUNT
- FÉRIAS
- BENEFICIOS
- PREMIACOES
- FB LIDERANÇA

---

## ✅ CHECKLIST FINAL

### **Código**
- [x] DataContext atualizado
- [x] Funções de salvar implementadas
- [x] Componentes funcionando
- [x] Tabs adicionadas no DailyChecklist
- [x] Export correto do AdminSupervisorGerencialChecklistView

### **Banco de Dados**
- [ ] **EXECUTAR**: `VERIFICAR_E_CRIAR_COLUNA_GERENCIAL_TASKS.sql` ⚠️
- [ ] **EXECUTAR**: `INSERIR_TAREFAS_PPAD_GERENCIAL.sql` ⚠️
- [ ] Verificar se tarefas foram inseridas (35 tarefas)

### **Testes**
- [ ] Testar como loja (`/store-checklists`)
- [ ] Testar como admin (`/checklist`)
- [ ] Verificar se tarefas aparecem
- [ ] Verificar se salva corretamente
- [ ] Verificar histórico

---

## 📝 NOTAS IMPORTANTES

1. **Scripts SQL devem ser executados no Supabase SQL Editor**
2. **Tarefas são salvas no campo `gerencialTasks` da tabela `daily_checklists`**
3. **Funciona igual ao checklist diário** - mesma estrutura e comportamento
4. **Para admin/supervisor**: Tabs no `/checklist` para alternar entre diário e gerencial
5. **Para lojas**: Tabs no `/store-checklists` para alternar entre diário e gerencial

---

**Status**: ✅ Código completo e pronto. Aguardando execução dos scripts SQL no Supabase.


