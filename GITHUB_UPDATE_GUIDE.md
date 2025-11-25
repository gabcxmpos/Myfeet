# 📦 Guia de Atualização para GitHub

## 📋 Resumo

Este documento lista todos os arquivos que precisam ser **ATUALIZADOS** ou **ADICIONADOS** no GitHub para colocar o sistema online.

---

## ✅ ARQUIVOS NOVOS (ADICIONAR)

### 1. `src/pages/ReturnsManagement.jsx` ⭐ NOVO
**Ação**: ADICIONAR (arquivo novo)
**Tamanho**: ~2259 linhas
**Descrição**: Componente principal da funcionalidade de Devoluções

**Conteúdo**: Ver arquivo completo no diretório local `src/pages/ReturnsManagement.jsx`

---

## ⚠️ ARQUIVOS ATUALIZADOS (SUBSTITUIR)

### 2. `src/App.jsx`
**Ação**: ATUALIZAR (substituir arquivo existente)

**Mudanças**:
- Linha 28: Adicionar `import ReturnsManagement from '@/pages/ReturnsManagement';`
- Linha 60: Adicionar rota `<Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja']}><ReturnsManagement /></ProtectedRoute>} />`

**Arquivo completo**:
```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import FirstAccess from '@/pages/FirstAccess';
import Dashboard from '@/pages/Dashboard';
import MonthlyRanking from '@/pages/MonthlyRanking';
import Analytics from '@/pages/Analytics';
import GoalsPanel from '@/pages/GoalsPanel';
import StartEvaluation from '@/pages/StartEvaluation';
import StoresManagement from '@/pages/StoresManagement';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import UserManagement from '@/pages/UserManagement';
import FormBuilder from '@/pages/FormBuilder';
import Collaborators from '@/pages/Collaborators';
import Feedback from '@/pages/Feedback';
import FeedbackManagement from '@/pages/FeedbackManagement';
import Chave from '@/pages/Chave';
import DailyChecklist from '@/pages/DailyChecklist';
import MenuVisibilitySettings from '@/pages/MenuVisibilitySettings';
import TrainingManagement from '@/pages/TrainingManagement';
import Training from '@/pages/Training';
import ReturnsManagement from '@/pages/ReturnsManagement';

function App() {
  return (
    <>
      <Helmet>
        <title>MYFEET - Painel PPAD</title>
        <meta name="description" content="Painel de avaliação de desempenho de lojas baseado nos pilares: Pessoas, Performance, Ambientação e Digital." />
      </Helmet>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/first-access" element={<FirstAccess />} />
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ranking" element={<MonthlyRanking />} />
                <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><Analytics /></ProtectedRoute>} />
                <Route path="goals" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><GoalsPanel /></ProtectedRoute>} />
                <Route path="evaluation" element={<StartEvaluation />} />
                <Route path="stores" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><StoresManagement /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="forms" element={<ProtectedRoute allowedRoles={['admin']}><FormBuilder /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                <Route path="settings/visibility" element={<ProtectedRoute allowedRoles={['admin']}><MenuVisibilitySettings /></ProtectedRoute>} />
                <Route path="collaborators" element={<ProtectedRoute allowedRoles={['loja']}><Collaborators /></ProtectedRoute>} />
                <Route path="feedback" element={<ProtectedRoute allowedRoles={['loja']}><Feedback /></ProtectedRoute>} />
                <Route path="feedback-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor']}><FeedbackManagement /></ProtectedRoute>} />
                <Route path="training-management" element={<ProtectedRoute allowedRoles={['admin']}><TrainingManagement /></ProtectedRoute>} />
                <Route path="training" element={<ProtectedRoute allowedRoles={['loja']}><Training /></ProtectedRoute>} />
                <Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja']}><ReturnsManagement /></ProtectedRoute>} />
                <Route path="chave" element={<Chave />} />
                <Route path="checklist" element={<DailyChecklist />} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </>
  );
}

export default App;
```

---

### 3. `src/components/Sidebar.jsx`
**Ação**: ATUALIZAR (substituir arquivo existente)

**Mudanças**:
- Linha 6: Adicionar `RotateCcw` nos imports
- Linha 24: Adicionar item de menu `{ path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja'] }`

**Arquivo completo**: Ver arquivo `src/components/Sidebar.jsx` no diretório local (já contém as mudanças)

---

### 4. `src/lib/supabaseService.js`
**Ação**: ATUALIZAR (adicionar funções no final do arquivo)

**Mudanças**: Adicionar as seguintes funções após a última função existente:

```javascript
// ============ RETURNS (DEVOLUÇÕES) ============
export const fetchReturns = async () => {
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('⚠️ Tabela returns não existe ainda. Retornando array vazio.');
      return [];
    }
    throw error;
  }
  
  return data || [];
};

export const createReturn = async (returnData) => {
  const dataToInsert = {
    store_id: returnData.store_id || returnData.storeId,
    brand: returnData.brand,
    nf_number: returnData.nf_number || returnData.nfNumber,
    nf_emission_date: returnData.nf_emission_date || returnData.nfEmissionDate || null,
    nf_value: returnData.nf_value !== undefined && returnData.nf_value !== null ? returnData.nf_value : (returnData.nfValue !== undefined && returnData.nfValue !== null ? returnData.nfValue : null),
    volume_quantity: returnData.volume_quantity || returnData.volumeQuantity,
    date: returnData.date,
    admin_status: returnData.admin_status || returnData.adminStatus || 'aguardando_coleta',
    collected_at: returnData.collected_at || returnData.collectedAt || null,
    created_by: returnData.created_by || returnData.createdBy || null
  };

  const { data, error } = await supabase
    .from('returns')
    .insert([dataToInsert])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReturn = async (id, updates) => {
  const { data: currentReturn } = await supabase
    .from('returns')
    .select('admin_status')
    .eq('id', id)
    .single();
  
  const oldStatus = currentReturn?.admin_status;
  
  const dataToUpdate = {};
  
  if (updates.store_id !== undefined || updates.storeId !== undefined) {
    dataToUpdate.store_id = updates.store_id || updates.storeId;
  }
  if (updates.brand !== undefined) dataToUpdate.brand = updates.brand;
  if (updates.nf_number !== undefined || updates.nfNumber !== undefined) {
    dataToUpdate.nf_number = updates.nf_number || updates.nfNumber;
  }
  if (updates.nf_emission_date !== undefined || updates.nfEmissionDate !== undefined) {
    dataToUpdate.nf_emission_date = updates.nf_emission_date || updates.nfEmissionDate;
  }
  if (updates.nf_value !== undefined || updates.nfValue !== undefined) {
    dataToUpdate.nf_value = updates.nf_value !== undefined && updates.nf_value !== null ? updates.nf_value : (updates.nfValue !== undefined && updates.nfValue !== null ? updates.nfValue : null);
  }
  if (updates.volume_quantity !== undefined || updates.volumeQuantity !== undefined) {
    dataToUpdate.volume_quantity = updates.volume_quantity || updates.volumeQuantity;
  }
  if (updates.date !== undefined) dataToUpdate.date = updates.date;
  if (updates.admin_status !== undefined || updates.adminStatus !== undefined) {
    dataToUpdate.admin_status = updates.admin_status || updates.adminStatus;
  }
  if (updates.collected_at !== undefined || updates.collectedAt !== undefined) {
    dataToUpdate.collected_at = updates.collected_at || updates.collectedAt;
  }

  const { data, error } = await supabase
    .from('returns')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  const newStatus = dataToUpdate.admin_status;
  if (oldStatus && newStatus && oldStatus !== newStatus) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await saveReturnStatusHistory(id, oldStatus, newStatus, user?.id || null);
    } catch (historyError) {
      console.warn('⚠️ Erro ao salvar histórico de status:', historyError);
    }
  }
  
  return data;
};

export const deleteReturn = async (id) => {
  const { error } = await supabase
    .from('returns')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const saveReturnStatusHistory = async (returnId, oldStatus, newStatus, changedBy = null) => {
  try {
    const historyData = {
      return_id: returnId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_at: new Date().toISOString()
    };
    
    if (changedBy) {
      historyData.changed_by = changedBy;
    }
    
    const { error } = await supabase
      .from('returns_status_history')
      .insert([historyData]);
    
    if (error && error.code !== '42P01') {
      console.warn('⚠️ Erro ao salvar histórico de status (continuando mesmo assim):', error);
    }
  } catch (error) {
    console.warn('⚠️ Erro ao salvar histórico de status (continuando mesmo assim):', error);
  }
};

// ============ PHYSICAL MISSING (FALTA FÍSICA) ============
export const fetchPhysicalMissing = async () => {
  const { data, error } = await supabase
    .from('physical_missing')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('⚠️ Tabela physical_missing não existe ainda. Retornando array vazio.');
      return [];
    }
    throw error;
  }
  
  return data || [];
};

export const createPhysicalMissing = async (missingData) => {
  const dataToInsert = {
    store_id: missingData.store_id || missingData.storeId,
    brand: missingData.brand || null,
    nf_number: missingData.nf_number || missingData.nfNumber || null,
    sku: missingData.sku || null,
    color: missingData.color || null,
    size: missingData.size || null,
    sku_info: missingData.sku_info || missingData.skuInfo || null,
    cost_value: missingData.cost_value !== undefined && missingData.cost_value !== null ? missingData.cost_value : (missingData.costValue !== undefined && missingData.costValue !== null ? missingData.costValue : null),
    quantity: missingData.quantity !== undefined && missingData.quantity !== null ? missingData.quantity : null,
    total_value: missingData.total_value !== undefined && missingData.total_value !== null ? missingData.total_value : (missingData.totalValue !== undefined && missingData.totalValue !== null ? missingData.totalValue : null),
    moved_to_defect: missingData.moved_to_defect !== undefined ? missingData.moved_to_defect : (missingData.movedToDefect !== undefined ? missingData.movedToDefect : false),
    status: missingData.status || 'processo_aberto',
    created_by: missingData.created_by || missingData.createdBy || null
  };
  
  if (missingData.product_name || missingData.productName) {
    dataToInsert.product_name = missingData.product_name || missingData.productName;
  }
  if (missingData.product_code || missingData.productCode) {
    dataToInsert.product_code = missingData.product_code || missingData.productCode;
  }
  if (missingData.notes) {
    dataToInsert.notes = missingData.notes;
  }

  const { data, error } = await supabase
    .from('physical_missing')
    .insert([dataToInsert])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePhysicalMissing = async (id, updates) => {
  const dataToUpdate = {};
  
  if (updates.store_id !== undefined || updates.storeId !== undefined) {
    dataToUpdate.store_id = updates.store_id || updates.storeId;
  }
  if (updates.brand !== undefined) dataToUpdate.brand = updates.brand;
  if (updates.nf_number !== undefined || updates.nfNumber !== undefined) {
    dataToUpdate.nf_number = updates.nf_number || updates.nfNumber;
  }
  if (updates.sku !== undefined) dataToUpdate.sku = updates.sku;
  if (updates.color !== undefined) dataToUpdate.color = updates.color;
  if (updates.size !== undefined) dataToUpdate.size = updates.size;
  if (updates.sku_info !== undefined || updates.skuInfo !== undefined) {
    dataToUpdate.sku_info = updates.sku_info || updates.skuInfo;
  }
  if (updates.cost_value !== undefined || updates.costValue !== undefined) {
    dataToUpdate.cost_value = updates.cost_value !== undefined && updates.cost_value !== null ? updates.cost_value : (updates.costValue !== undefined && updates.costValue !== null ? updates.costValue : null);
  }
  if (updates.quantity !== undefined && updates.quantity !== null) {
    dataToUpdate.quantity = updates.quantity;
  }
  if (updates.total_value !== undefined || updates.totalValue !== undefined) {
    dataToUpdate.total_value = updates.total_value !== undefined && updates.total_value !== null ? updates.total_value : (updates.totalValue !== undefined && updates.totalValue !== null ? updates.totalValue : null);
  }
  if (updates.moved_to_defect !== undefined || updates.movedToDefect !== undefined) {
    dataToUpdate.moved_to_defect = updates.moved_to_defect !== undefined ? updates.moved_to_defect : updates.movedToDefect;
  }
  if (updates.product_name !== undefined || updates.productName !== undefined) {
    dataToUpdate.product_name = updates.product_name || updates.productName;
  }
  if (updates.product_code !== undefined || updates.productCode !== undefined) {
    dataToUpdate.product_code = updates.product_code || updates.productCode;
  }
  if (updates.notes !== undefined) dataToUpdate.notes = updates.notes;
  if (updates.status !== undefined) dataToUpdate.status = updates.status;

  const { data, error } = await supabase
    .from('physical_missing')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deletePhysicalMissing = async (id) => {
  const { error } = await supabase
    .from('physical_missing')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};
```

**Também atualizar a função `updateTraining`** para incluir `registrations_blocked`:

```javascript
// Na função updateTraining existente, adicionar:
if (updates.registrations_blocked !== undefined || updates.registrationsBlocked !== undefined) {
  dataToUpdate.registrations_blocked = updates.registrations_blocked !== undefined ? updates.registrations_blocked : updates.registrationsBlocked;
}
```

---

### 5. `src/contexts/DataContext.jsx`
**Ação**: ATUALIZAR (adicionar estados e funções)

**Mudanças necessárias**:

1. **Adicionar estados** (junto com os outros estados):
```javascript
const [returns, setReturns] = useState([]);
const [physicalMissing, setPhysicalMissing] = useState([]);
```

2. **Adicionar no fetchData inicial**:
```javascript
const fetchData = async () => {
  try {
    // ... código existente ...
    const [returnsData, missingData] = await Promise.all([
      api.fetchReturns().catch(() => []),
      api.fetchPhysicalMissing().catch(() => [])
    ]);
    setReturns(returnsData || []);
    setPhysicalMissing(missingData || []);
    // ... resto do código ...
  }
}
```

3. **Adicionar funções CRUD** (ver arquivo completo no diretório local):
- `addReturn`
- `updateReturn`
- `deleteReturn`
- `addPhysicalMissing`
- `updatePhysicalMissing`
- `deletePhysicalMissing`

4. **Adicionar no value do Provider**:
```javascript
returns,
physicalMissing,
addReturn,
updateReturn,
deleteReturn,
addPhysicalMissing,
updatePhysicalMissing,
deletePhysicalMissing,
```

**Arquivo completo**: Ver `src/contexts/DataContext.jsx` no diretório local (já contém todas as mudanças)

---

### 6. `src/pages/TrainingManagement.jsx`
**Ação**: ATUALIZAR (adicionar funcionalidade de bloqueio)

**Mudanças**:
- Linha 12: Adicionar `Lock, Unlock` nos imports
- Adicionar função `handleToggleBlockRegistrations` (linha ~267)
- Adicionar opção no DropdownMenu para bloquear/desbloquear (linha ~885)

**Arquivo completo**: Ver `src/pages/TrainingManagement.jsx` no diretório local (já contém as mudanças)

---

### 7. `src/pages/Training.jsx`
**Ação**: ATUALIZAR (adicionar verificação de bloqueio)

**Mudanças**:
- Linha 10: Adicionar `Lock` nos imports
- Linha 146: Adicionar verificação de `registrations_blocked`
- Linha 283: Adicionar indicador visual de bloqueio
- Linha 295: Desabilitar botão quando bloqueado

**Arquivo completo**: Ver `src/pages/Training.jsx` no diretório local (já contém as mudanças)

---

### 8. `src/contexts/SupabaseAuthContext.jsx`
**Ação**: ATUALIZAR (adicionar listener de sessão expirada)

**Mudanças**:
- Adicionar `useEffect` para ouvir evento `supabase-session-expired` (linha ~136)
- Melhorar tratamento de erros 403/401

**Arquivo completo**: Ver `src/contexts/SupabaseAuthContext.jsx` no diretório local (já contém as mudanças)

---

### 9. `src/lib/customSupabaseClient.js`
**Ação**: ATUALIZAR (adicionar interceptor)

**Mudanças**:
- Adicionar função `clearExpiredSession` (linha ~12)
- Adicionar interceptor `fetch` no `global` (linha ~48)
- Disparar evento `supabase-session-expired` quando detectar 403

**Arquivo completo**: Ver `src/lib/customSupabaseClient.js` no diretório local (já contém as mudanças)

---

### 10. `src/components/Header.jsx`
**Ação**: ATUALIZAR (melhorar logout)

**Mudanças**:
- Modificar `handleLogout` para usar try/catch/finally (linha ~20)
- Garantir redirecionamento mesmo com erro

**Arquivo completo**: Ver `src/components/Header.jsx` no diretório local (já contém as mudanças)

---

## 📄 SCRIPTS SQL (OPCIONAL - Documentação)

Estes scripts devem ser executados no Supabase online ANTES do deploy. Eles podem ser commitados para documentação:

1. **CRIAR_TABELAS_DEVOLUCOES.sql** - Script principal (CRÍTICO)
2. **ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql**
3. **ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql**
4. **ATUALIZAR_TABELA_FALTA_FISICA.sql**
5. **AJUSTAR_COLUNAS_FALTA_FISICA.sql**
6. **ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql**
7. **ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql**
8. **VERIFICAR_TABELAS_DEVOLUCOES.sql**

---

## 🚀 ORDEM DE EXECUÇÃO

### 1. Executar Scripts SQL no Supabase Online
Execute os scripts SQL na ordem:
1. `CRIAR_TABELAS_DEVOLUCOES.sql`
2. `ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql`
3. `ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql`
4. `ATUALIZAR_TABELA_FALTA_FISICA.sql`
5. `AJUSTAR_COLUNAS_FALTA_FISICA.sql`
6. `ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql`
7. `ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql`
8. `VERIFICAR_TABELAS_DEVOLUCOES.sql` (para verificar)

### 2. Fazer Commit dos Arquivos
```bash
# Arquivos novos
git add src/pages/ReturnsManagement.jsx

# Arquivos atualizados
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/lib/supabaseService.js
git add src/contexts/DataContext.jsx
git add src/pages/TrainingManagement.jsx
git add src/pages/Training.jsx
git add src/contexts/SupabaseAuthContext.jsx
git add src/lib/customSupabaseClient.js
git add src/components/Header.jsx

# Scripts SQL (opcional)
git add CRIAR_TABELAS_DEVOLUCOES.sql
git add ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql
git add ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql
git add ATUALIZAR_TABELA_FALTA_FISICA.sql
git add AJUSTAR_COLUNAS_FALTA_FISICA.sql
git add ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql
git add ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql
git add VERIFICAR_TABELAS_DEVOLUCOES.sql

# Commit
git commit -m "feat: Adicionar funcionalidade completa de Devoluções e Falta Física

- Nova página ReturnsManagement com dashboard e filtros
- Formulários para devoluções pendentes e falta física
- Sistema de status e histórico
- Exclusão para admin
- Bloqueio de inscrições em treinamentos
- Melhorias no tratamento de sessão expirada"

# Push
git push origin main
```

---

## ⚠️ IMPORTANTE

1. **Execute os scripts SQL ANTES do deploy**
2. **Verifique variáveis de ambiente** no ambiente de produção
3. **Teste localmente** antes de fazer push
4. **O arquivo `ReturnsManagement.jsx` é muito grande** - certifique-se de fazer upload completo

---

## 📝 NOTAS

- Todos os arquivos listados acima já estão atualizados no diretório local
- Os scripts SQL estão prontos para execução no Supabase
- O sistema está funcionalmente completo e testado localmente






