# ✅ ATUALIZAÇÃO: Checklist Diário com Setores

## 🎯 OBJETIVO
Organizar o checklist diário pelos mesmos setores do PPAD Gerencial: PRODUTO, AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS, OUTROS

---

## ✅ ALTERAÇÕES REALIZADAS

### 1. **Tarefas Atualizadas com Setores** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Mudança**: Tarefas hardcoded agora incluem campo `sector`
   - **Setores usados**: PRODUTO, AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS, OUTROS

### 2. **Cores Padronizadas** ✅
   - **Arquivos**: 
     - `src/pages/StoreDailyChecklist.jsx`
     - `src/pages/DailyChecklist.jsx`
   - **Mudança**: `sectorColors` atualizado para usar os mesmos setores do PPAD Gerencial
   - **Cores**:
     - PRODUTO: cyan
     - AMBIENTACAO: blue
     - DIGITAL: purple
     - ADMINISTRATIVO: green
     - PESSOAS: orange
     - OUTROS: gray

### 3. **Carregamento do Banco** ✅
   - **Arquivo**: `src/contexts/DataContext.jsx`
   - **Mudança**: Agora carrega `daily_tasks` do banco e usa se disponível
   - **Fallback**: Usa tarefas padrão se não houver no banco

### 4. **Script SQL Criado** ✅
   - **Arquivo**: `ATUALIZAR_TAREFAS_DIARIAS_COM_SETORES.sql`
   - **Função**: Atualiza tarefas no banco com setores

---

## 📊 MAPEAMENTO DAS TAREFAS POR SETOR

### **PRODUTO** (1 tarefa)
- Relatório de Performance Produto

### **AMBIENTACAO** (3 tarefas)
- Limpeza da loja
- Organização de Loja Operacional durante dia
- Organização de Loja Visual Merchandising

### **DIGITAL** (5 tarefas)
- Ativações CRM
- Pedidos Digital Haass noite
- Pedidos Digital Haass fechamento
- Virtual Gate
- SLA/NPS Digital

### **ADMINISTRATIVO** (7 tarefas)
- Abertura Operacional
- Five Minutes - KPIs
- Caixa dia anterior e Depósito
- Relatório de Performance KPIs
- Acompanhamento Planilha Chegada de Pedidos
- Perdas e Danos
- Tom Ticket

### **PESSOAS** (1 tarefa)
- Jornada de atendimento

### **OUTROS** (2 tarefas)
- Pedidos SFS - Manhã
- Pedidos SFS - Tarde

**Total**: 19 tarefas

---

## 🚀 PASSOS PARA ATIVAR

### **1. Executar Script SQL** ⚠️
```sql
-- Executar: ATUALIZAR_TAREFAS_DIARIAS_COM_SETORES.sql
-- No Supabase SQL Editor
```

### **2. Verificar Funcionalidade** ✅
- Acessar `/store-checklists` como loja
- Clicar na aba "Checklist Diário"
- Verificar se tarefas aparecem organizadas por setor
- Verificar se cores estão corretas

---

## 📋 ARQUIVOS MODIFICADOS

### `src/contexts/DataContext.jsx`
- ✅ Tarefas padrão atualizadas com setores
- ✅ Estado `dailyTasks` adicionado
- ✅ Carregamento de `daily_tasks` do banco
- ✅ Função `updateDailyTasks` implementada

### `src/pages/StoreDailyChecklist.jsx`
- ✅ `sectorColors` atualizado para mesmos setores do PPAD Gerencial

### `src/pages/DailyChecklist.jsx`
- ✅ `sectorColors` atualizado para mesmos setores do PPAD Gerencial

### `ATUALIZAR_TAREFAS_DIARIAS_COM_SETORES.sql` (NOVO)
- ✅ Script SQL para atualizar tarefas no banco com setores

---

## ✅ RESULTADO

- ✅ Checklist diário organizado por setores
- ✅ Mesmos setores do PPAD Gerencial
- ✅ Cores padronizadas
- ✅ Funciona com tarefas do banco ou padrão
- ✅ Interface consistente entre diário e gerencial

---

**Status**: ✅ Código atualizado. Execute o script SQL para atualizar as tarefas no banco.


