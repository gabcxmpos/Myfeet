# Verificação de Comunicação de Treinamentos

## 📋 Resumo Executivo

Este documento verifica toda a comunicação relacionada ao sistema de treinamentos, incluindo quem cria, como cria, e com quem se comunica.

---

## 🔍 1. Quem Pode Criar Treinamentos

### 1.1 Roles com Permissão de Criação
**Arquivo:** `src/App.jsx` (linha 80)
- ✅ **Admin** (`admin`)
- ✅ **Supervisor** (`supervisor`)
- ✅ **Supervisor Franquia** (`supervisor_franquia`)
- ✅ **Comunicação** (`comunicação`)
- ✅ **Digital** (`digital`)

**Rota:** `/training-management`

### 1.2 Roles que Visualizam Treinamentos
**Arquivo:** `src/App.jsx` (linha 81)
- ✅ **Loja** (`loja`)
- ✅ **Loja Franquia** (`loja_franquia`)

**Rota:** `/training`

---

## 📝 2. Como os Treinamentos São Criados

### 2.1 Componente de Criação
**Arquivo:** `src/pages/TrainingManagement.jsx`

**Campos do Formulário:**
- Título (obrigatório)
- Descrição (opcional)
- Data (obrigatório)
- Horário (opcional)
- Formato: Presencial, Online ou Híbrido (obrigatório)
- Link da Reunião (obrigatório se Online)
- Localização (obrigatório se Presencial)
- Marca (opcional)
- Lojas Destinatárias (opcional - se vazio, disponível para todas)
- Máximo de Participantes (opcional)

### 2.2 Função de Criação
**Arquivo:** `src/pages/TrainingManagement.jsx` (linha 173-230)

```javascript
const handleSubmit = async (e) => {
  // Validações
  // Criação via: addTraining(trainingData)
  // Atualização via: updateTraining(editingTraining.id, trainingData)
}
```

### 2.3 Estrutura de Dados
```javascript
{
  title: string,
  description: string | null,
  trainingDate: string (YYYY-MM-DD),
  time: string | null,
  format: 'presencial' | 'online' | 'hibrido',
  link: string | null (obrigatório se online),
  brand: string | null,
  storeIds: string[] | null (se null, todas as lojas),
  location: string | null (obrigatório se presencial),
  maxParticipants: number | null
}
```

---

## 🎯 3. Sistema de Comunicação e Destinatários

### 3.1 Filtragem de Treinamentos por Loja
**Arquivo:** `src/pages/Training.jsx` (linha 47-108)

**Lógica de Filtragem:**
1. ✅ Se `store_ids` é `null` ou vazio → **Disponível para TODAS as lojas**
2. ✅ Se `store_ids` contém IDs específicos → **Disponível apenas para essas lojas**
3. ✅ Filtra apenas treinamentos futuros ou do dia atual

**Código Relevante:**
```javascript
const availableTrainings = useMemo(() => {
  // Se o treinamento não tem lojas específicas, está disponível para todos
  if (!t.store_ids || t.store_ids === null || t.store_ids === '') {
    storeMatch = true;
  } else {
    // Verifica se a loja do usuário está na lista
    const storeIds = typeof t.store_ids === 'string' 
      ? JSON.parse(t.store_ids) 
      : t.store_ids;
    storeMatch = storeIds.includes(user.storeId);
  }
  // Filtra apenas futuros
  const isFuture = trainingDate >= today;
  return storeMatch && isFuture;
}, [trainings, user?.storeId]);
```

### 3.2 Problema Identificado: Falta de Notificação Automática

**❌ PROBLEMA CRÍTICO:**
- **Não há sistema de notificação automática** quando um treinamento é criado
- As lojas só descobrem novos treinamentos quando:
  1. Acessam manualmente a página `/training`
  2. Recarregam a página
  3. O componente faz um `fetchData()` automático

**Impacto:**
- Lojas podem não saber imediatamente sobre novos treinamentos
- Dependência de acesso manual à página
- Sem alertas ou avisos

---

## 🔄 4. Fluxo de Comunicação Atual

### 4.1 Criação de Treinamento
```
1. Admin/Supervisor/Comunicação cria treinamento
   ↓
2. Dados salvos no banco (tabela `trainings`)
   ↓
3. ❌ SEM NOTIFICAÇÃO AUTOMÁTICA
   ↓
4. Loja precisa acessar `/training` manualmente
   ↓
5. Componente busca treinamentos disponíveis
   ↓
6. Treinamento aparece na lista (se atender critérios)
```

### 4.2 Inscrição em Treinamento
```
1. Loja acessa `/training`
   ↓
2. Vê treinamentos disponíveis para sua loja
   ↓
3. Seleciona colaborador e inscreve
   ↓
4. Inscrição salva no banco (tabela `training_registrations`)
   ↓
5. ❌ SEM NOTIFICAÇÃO PARA O CRIADOR DO TREINAMENTO
```

---

## ⚠️ 5. Problemas Identificados

### 5.1 Falta de Notificação na Criação
- ❌ **Não há notificação** quando um treinamento é criado
- ❌ **Não há email** enviado para lojas destinatárias
- ❌ **Não há alerta** no sistema para lojas

### 5.2 Falta de Notificação na Inscrição
- ❌ **Não há notificação** quando alguém se inscreve
- ❌ **Criador do treinamento** não é avisado de novas inscrições

### 5.3 Falta de Realtime
- ❌ **Não há Realtime** habilitado para a tabela `trainings`
- ❌ **Não há Realtime** habilitado para a tabela `training_registrations`
- ❌ Lojas precisam recarregar a página para ver novos treinamentos

### 5.4 Falta de API Functions - **CRÍTICO**
- ❌ **Não há funções** `fetchTrainings`, `createTraining`, etc. em `supabaseService.js`
- ❌ **Não há funções** no `DataContext.jsx` para gerenciar treinamentos
- ❌ **Não há estados** `trainings` e `trainingRegistrations` no `DataContext.jsx`
- ⚠️ **Os componentes tentam usar funções que NÃO EXISTEM:**
  - `TrainingManagement.jsx` usa: `addTraining`, `updateTraining`, `deleteTraining`, `addTrainingRegistration`, `updateTrainingRegistration`, `deleteTrainingRegistration`
  - `Training.jsx` usa: `addTrainingRegistration`
  - **TODAS essas funções estão FALTANDO no DataContext**
- 🚨 **SISTEMA PROVAVELMENTE QUEBRADO** - Os componentes não conseguem funcionar sem essas implementações

---

## ✅ 6. O que Está Funcionando

### 6.1 Filtragem por Loja
- ✅ Funciona corretamente quando `store_ids` é especificado
- ✅ Funciona corretamente quando `store_ids` é null (todas as lojas)
- ✅ Filtra apenas treinamentos futuros

### 6.2 Visualização
- ✅ Lojas veem apenas treinamentos disponíveis para elas
- ✅ Interface mostra informações completas do treinamento
- ✅ Mostra quantos colaboradores da loja estão inscritos

### 6.3 Inscrição
- ✅ Lojas podem inscrever colaboradores
- ✅ Validação de duplicatas funciona
- ✅ Bloqueio de inscrições funciona

---

## 🔧 7. Recomendações de Melhorias

### 7.1 Implementar Notificações Automáticas
1. **Ao criar treinamento:**
   - Enviar notificação para todas as lojas destinatárias
   - Criar alerta no sistema para lojas afetadas
   - Opcional: Enviar email para gestores das lojas

2. **Ao inscrever:**
   - Notificar criador do treinamento
   - Mostrar contador de inscrições em tempo real

### 7.2 Implementar Realtime
1. Habilitar Realtime na tabela `trainings`
2. Habilitar Realtime na tabela `training_registrations`
3. Atualizar UI automaticamente quando houver mudanças

### 7.3 Implementar Funções de API
1. Criar funções em `supabaseService.js`:
   - `fetchTrainings()`
   - `createTraining()`
   - `updateTraining()`
   - `deleteTraining()`
   - `fetchTrainingRegistrations()`
   - `createTrainingRegistration()`
   - `updateTrainingRegistration()`
   - `deleteTrainingRegistration()`

2. Adicionar ao `DataContext.jsx`:
   - Estados para `trainings` e `trainingRegistrations`
   - Funções wrapper para API calls
   - Carregamento automático na inicialização

### 7.4 Melhorar Comunicação
1. Adicionar campo de "notificado" para rastrear notificações enviadas
2. Criar sistema de notificações in-app
3. Integrar com sistema de email (opcional)

---

## 📊 8. Resumo de Verificação

| Aspecto | Status | Observações |
|---------|--------|-------------|
| **Criação de Treinamentos** | ✅ Funcional | Roles corretos, formulário completo |
| **Filtragem por Loja** | ✅ Funcional | Lógica correta de `store_ids` |
| **Visualização** | ✅ Funcional | Interface completa e intuitiva |
| **Inscrição** | ✅ Funcional | Validações funcionando |
| **Notificação na Criação** | ❌ Não Implementado | **CRÍTICO** |
| **Notificação na Inscrição** | ❌ Não Implementado | **CRÍTICO** |
| **Realtime** | ❌ Não Implementado | **CRÍTICO** |
| **API Functions** | ❌ Não Implementado | **CRÍTICO - Sistema Quebrado** |
| **Estados no Context** | ❌ Não Implementado | **CRÍTICO - Sistema Quebrado** |
| **Email** | ❌ Não Implementado | Opcional |

---

## 🎯 Conclusão

**🚨 PROBLEMA CRÍTICO IDENTIFICADO:**

O sistema de treinamentos **NÃO ESTÁ FUNCIONANDO** porque:
1. ❌ Funções de API não estão implementadas (`addTraining`, `updateTraining`, etc.)
2. ❌ Estados não estão no DataContext (`trainings`, `trainingRegistrations`)
3. ❌ Não há carregamento de dados de treinamentos no `fetchData()`

**Os componentes estão tentando usar recursos que não existem**, o que significa que:
- ❌ Treinamentos não podem ser criados
- ❌ Treinamentos não podem ser visualizados
- ❌ Inscrições não podem ser feitas
- ❌ Sistema está completamente quebrado

**Além disso**, mesmo que fosse implementado, **falta comunicação automática**. As lojas precisariam descobrir novos treinamentos manualmente, o que pode causar atrasos e perda de oportunidades.

**Prioridade Alta:**
1. Implementar Realtime para atualização automática
2. Implementar funções de API faltantes
3. Adicionar sistema de notificações

**Prioridade Média:**
1. Sistema de notificações in-app
2. Alertas visuais para novos treinamentos

**Prioridade Baixa:**
1. Integração com email
2. Dashboard de notificações

---

## 🚨 8. Ações Urgentes Necessárias

### 8.1 Implementar Funções de API (URGENTE)
**Arquivo:** `src/lib/supabaseService.js`

Adicionar as seguintes funções:
```javascript
// ============ TRAININGS ============
export const fetchTrainings = async () => {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('training_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createTraining = async (trainingData) => {
  const { data, error } = await supabase
    .from('trainings')
    .insert([{
      ...trainingData,
      store_ids: trainingData.storeIds ? JSON.stringify(trainingData.storeIds) : null,
      training_date: trainingData.trainingDate,
      max_participants: trainingData.maxParticipants,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTraining = async (id, updates) => {
  const updateData = {
    ...updates,
    store_ids: updates.storeIds ? JSON.stringify(updates.storeIds) : updates.store_ids,
    training_date: updates.trainingDate || updates.training_date,
    max_participants: updates.maxParticipants || updates.max_participants,
  };
  
  const { data, error } = await supabase
    .from('trainings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTraining = async (id) => {
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ TRAINING REGISTRATIONS ============
export const fetchTrainingRegistrations = async () => {
  const { data, error } = await supabase
    .from('training_registrations')
    .select('*, trainings(*), collaborators(*), stores(*)')
    .order('registered_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createTrainingRegistration = async (registrationData) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .insert([{
      training_id: registrationData.trainingId,
      collaborator_id: registrationData.collaboratorId,
      store_id: registrationData.storeId,
      status: registrationData.status || 'pending',
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTrainingRegistration = async (id, updates) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTrainingRegistration = async (id) => {
  const { error } = await supabase
    .from('training_registrations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
```

### 8.2 Adicionar Estados e Funções ao DataContext (URGENTE)
**Arquivo:** `src/contexts/DataContext.jsx`

1. Adicionar estados:
```javascript
const [trainings, setTrainings] = useState([]);
const [trainingRegistrations, setTrainingRegistrations] = useState([]);
```

2. Adicionar ao `fetchData()`:
```javascript
const [
  // ... outros
  fetchedTrainings,
  fetchedTrainingRegistrations,
] = await Promise.all([
  // ... outros
  api.fetchTrainings(),
  api.fetchTrainingRegistrations(),
]);

setTrainings(fetchedTrainings || []);
setTrainingRegistrations(fetchedTrainingRegistrations || []);
```

3. Adicionar funções wrapper:
```javascript
// Trainings
const addTraining = useCallback((trainingData) => {
  return handleApiCall(() => api.createTraining(trainingData), 'Treinamento criado.');
}, [handleApiCall]);

const updateTraining = useCallback((id, data) => {
  return handleApiCall(() => api.updateTraining(id, data), 'Treinamento atualizado.');
}, [handleApiCall]);

const deleteTraining = useCallback((id) => {
  return handleApiCall(() => api.deleteTraining(id), 'Treinamento removido.');
}, [handleApiCall]);

// Training Registrations
const addTrainingRegistration = useCallback((registrationData) => {
  return handleApiCall(() => api.createTrainingRegistration(registrationData), 'Colaborador inscrito.');
}, [handleApiCall]);

const updateTrainingRegistration = useCallback((id, data) => {
  return handleApiCall(() => api.updateTrainingRegistration(id, data), 'Inscrição atualizada.');
}, [handleApiCall]);

const deleteTrainingRegistration = useCallback((id) => {
  return handleApiCall(() => api.deleteTrainingRegistration(id), 'Inscrição removida.');
}, [handleApiCall]);
```

4. Adicionar ao `value` do Provider:
```javascript
const value = {
  // ... outros
  trainings,
  addTraining,
  updateTraining,
  deleteTraining,
  trainingRegistrations,
  addTrainingRegistration,
  updateTrainingRegistration,
  deleteTrainingRegistration,
  // ... outros
};
```

### 8.3 Verificar Tabelas no Banco de Dados
Certifique-se de que as tabelas existem:
- `trainings` (com campos: id, title, description, training_date, time, format, link, location, brand, store_ids, max_participants, created_at, updated_at)
- `training_registrations` (com campos: id, training_id, collaborator_id, store_id, status, presence, registered_at, notes)

---

**Data da Verificação:** 2024-12-19
**Verificado por:** Sistema de Análise Automática

