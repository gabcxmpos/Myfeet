# Teste Completo de Checklists - Criação, Atualização e Comunicação

## 📋 Objetivo
Verificar e testar todo o sistema de checklists, incluindo:
1. Criação de tarefas (admin)
2. Atualização de checklists (lojas)
3. Comunicação de atualizações para admin
4. Checklists específicos (Comunicação, Devoluções, Motorista)

---

## ✅ Checklist de Verificação

### 1. Checklist Diário (Operacional e Gerencial)

#### 1.1. Criação/Ativação de Tarefas (Admin)
- [ ] **Acesso**: Login como admin → Checklists → Gerenciar Checklists
- [ ] **Teste**: Adicionar nova tarefa ao Checklist Operacional
- [ ] **Verificação**: 
  - Tarefa aparece imediatamente na lista?
  - Tarefa aparece para todas as lojas?
  - Tarefa é salva em `app_settings` com key `daily_checklist_tasks`?
- [ ] **Teste**: Adicionar nova tarefa ao Checklist Gerencial
- [ ] **Verificação**:
  - Tarefa aparece imediatamente na lista?
  - Tarefa é salva em `app_settings` com key `daily_checklist_gerencial_tasks`?

#### 1.2. Atualização de Checklist (Loja)
- [ ] **Acesso**: Login como loja → Checklists → Checklist Diário
- [ ] **Teste**: Marcar tarefa como concluída
- [ ] **Verificação**:
  - Status é salvo imediatamente?
  - Dados aparecem em `daily_checklists`?
  - Admin pode ver a atualização?
- [ ] **Teste**: Desmarcar tarefa
- [ ] **Verificação**: Status é atualizado corretamente?

#### 1.3. Comunicação para Admin
- [ ] **Verificação**: Admin consegue ver checklists atualizados?
  - Acessar: Checklists → Checklist Diário → Selecionar loja
- [ ] **Verificação**: Histórico de checklists está disponível?
  - Últimos 7 dias aparecem corretamente?
- [ ] **Verificação**: Auditoria funciona?
  - Admin pode marcar checklist como auditado?
  - Informação de auditoria é salva em `checklist_audits`?

---

### 2. Checklist de Comunicação

#### 2.1. Criação de Tarefas (Usuário Comunicação)
- [ ] **Acesso**: Login como comunicação → Checklists → Gerenciar Comunicação
- [ ] **Teste**: Criar nova tarefa
- [ ] **Verificação**:
  - Tarefa é salva em `checklist_comunicacao_tasks`?
  - Tarefa aparece na lista de tarefas ativas?
  - Admin consegue ver a tarefa criada?

#### 2.2. Atualização de Checklist (Usuário Comunicação)
- [ ] **Acesso**: Login como comunicação → Checklists → Executar Comunicação
- [ ] **Teste**: Marcar tarefas como concluídas
- [ ] **Verificação**:
  - Status é salvo em `checklist_comunicacao_execution`?
  - Progresso é calculado corretamente?
  - Admin consegue ver a execução?

#### 2.3. Comunicação para Admin
- [ ] **Verificação**: Admin consegue ver tarefas criadas?
  - Acessar: Checklists → Gerenciar Comunicação (como admin)
- [ ] **Verificação**: Admin consegue ver execuções?
  - Verificar tabela `checklist_comunicacao_execution`

---

### 3. Checklist de Devoluções

#### 3.1. Criação de Tarefas (Admin/Devoluções)
- [ ] **Acesso**: Login como devoluções → Checklists → Gerenciar Devoluções
- [ ] **Teste**: Criar nova tarefa
- [ ] **Verificação**:
  - Tarefa é salva em `checklist_devolucoes_tasks`?
  - Tarefa aparece na lista?
  - Admin consegue ver a tarefa?

#### 3.2. Atualização de Checklist (Usuário Devoluções)
- [ ] **Acesso**: Login como devoluções → Checklists → Executar Devoluções
- [ ] **Teste**: Marcar tarefas como concluídas
- [ ] **Verificação**:
  - Status é salvo em `checklist_devolucoes_execution`?
  - Admin consegue ver a execução?

---

### 4. Checklist de Motorista

#### 4.1. Criação de Rotas (Admin/Motorista)
- [ ] **Acesso**: Login como motorista → Checklists → Gerenciar Motorista
- [ ] **Teste**: Criar nova rota
- [ ] **Verificação**:
  - Rota é salva em `checklist_motorista_routes`?
  - Rota aparece na lista?
  - Admin consegue ver a rota?

#### 4.2. Atualização de Checklist (Usuário Motorista)
- [ ] **Acesso**: Login como motorista → Checklists → Executar Motorista
- [ ] **Teste**: Marcar rotas como concluídas
- [ ] **Verificação**:
  - Status é salvo em `checklist_motorista_execution`?
  - Admin consegue ver a execução?

---

## 🔍 Verificações no Banco de Dados

Execute o script `VERIFICAR_CHECKLISTS.sql` para verificar:

1. **Estrutura das Tabelas**
   ```sql
   -- Verificar se todas as tabelas existem
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE 'checklist%' OR tablename = 'daily_checklists';
   ```

2. **Dados Recentes**
   ```sql
   -- Últimos checklists criados/atualizados
   SELECT * FROM daily_checklists 
   WHERE date >= CURRENT_DATE - INTERVAL '7 days'
   ORDER BY updated_at DESC;
   ```

3. **Configurações de Tarefas**
   ```sql
   -- Verificar tarefas configuradas
   SELECT key, jsonb_array_length(value) as num_tasks
   FROM app_settings
   WHERE key IN ('daily_checklist_tasks', 'daily_checklist_gerencial_tasks');
   ```

---

## 🚨 Problemas Identificados

### Problema 1: Falta de Notificação Automática
**Descrição**: Admin não recebe notificação automática quando:
- Loja atualiza checklist diário
- Usuário cria/atualiza tarefas de checklist específico
- Usuário executa checklist específico

**Solução Proposta**: 
- Criar sistema de notificações usando `alerts` ou `notifications`
- Ou adicionar indicador visual na interface do admin

### Problema 2: Admin não tem visibilidade centralizada
**Descrição**: Admin precisa acessar múltiplas páginas para ver atualizações

**Solução Proposta**:
- Criar dashboard de checklists para admin
- Mostrar resumo de todas as atualizações recentes

---

## 📝 Testes Manuais Recomendados

1. **Teste de Criação de Tarefa (Admin)**
   ```
   1. Login como admin
   2. Ir para Checklists → Gerenciar Checklists
   3. Adicionar nova tarefa "Teste de Tarefa"
   4. Salvar
   5. Verificar se aparece para lojas
   ```

2. **Teste de Atualização (Loja)**
   ```
   1. Login como loja
   2. Ir para Checklists → Checklist Diário
   3. Marcar tarefa como concluída
   4. Verificar se admin consegue ver
   ```

3. **Teste de Checklist Específico**
   ```
   1. Login como comunicação
   2. Criar tarefa em Gerenciar Comunicação
   3. Executar tarefa em Executar Comunicação
   4. Verificar se admin consegue ver ambas ações
   ```

---

## ✅ Checklist de Correções Necessárias

- [ ] Implementar sistema de notificações para admin
- [ ] Criar dashboard centralizado de checklists para admin
- [ ] Adicionar logs de auditoria para todas as ações
- [ ] Melhorar visibilidade de atualizações em tempo real
- [ ] Adicionar indicadores visuais de novas atualizações

---

## 📊 Métricas de Sucesso

- ✅ Admin consegue ver todas as atualizações de checklists
- ✅ Lojas conseguem atualizar checklists sem problemas
- ✅ Dados são salvos corretamente no banco
- ✅ Histórico está disponível e preciso
- ✅ Auditorias funcionam corretamente
























