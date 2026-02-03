# Atualização GitHub - Correção Import CSV de Metas

## 📋 Resumo das Alterações

Este documento lista as alterações necessárias para corrigir o problema de importação de CSV de metas que está ocorrendo na versão online.

## 🔧 Arquivos que Precisam ser Atualizados

### 1. `src/pages/GoalsPanel.jsx` ⚠️ **CRÍTICO**

**Problema:** O arquivo atual não tem funcionalidade de import CSV e não salva metas com estrutura de mês.

**Alterações necessárias:**

1. **Adicionar imports:**
   ```javascript
   import { Upload, Download } from 'lucide-react';
   import { updateStore as updateStoreAPI } from '@/lib/supabaseService';
   import { useRef } from 'react';
   ```

2. **Adicionar estados:**
   ```javascript
   const [selectedMonth, setSelectedMonth] = useState(() => {
     const now = new Date();
     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
   });
   const [isUploadingGoals, setIsUploadingGoals] = useState(false);
   const goalsFileInputRef = useRef(null);
   ```

3. **Modificar `handleStoreSelect` para ler metas do mês:**
   ```javascript
   const handleStoreSelect = useCallback((storeId) => {
     setSelectedStore(storeId);
     const store = stores.find(s => s.id === storeId);
     if (store) {
       // Ler metas do mês selecionado
       const storeGoals = store.goals || {};
       const goalsForMonth = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
         ? (storeGoals[selectedMonth] || {})
         : (storeGoals || {});
       
       setGoals(goalsForMonth.faturamento !== undefined ? goalsForMonth : { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 });
       setWeights(store.weights || { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 });
     }
   }, [stores, selectedMonth]);
   ```

4. **Adicionar useEffect para recarregar quando mês mudar:**
   ```javascript
   useEffect(() => {
     if (selectedStore) {
       handleStoreSelect(selectedStore);
     }
   }, [selectedMonth]);
   ```

5. **Modificar `handleSaveGoals` para salvar com estrutura de mês:**
   ```javascript
   const handleSaveGoals = async () => {
     if (!selectedStore) return;
     try {
       const store = stores.find(s => s.id === selectedStore);
       if (!store) return;
       
       // Preservar metas de outros meses e atualizar apenas o mês selecionado
       const currentGoals = store.goals || {};
       const updatedGoals = typeof currentGoals === 'object' && !Array.isArray(currentGoals)
         ? { ...currentGoals, [selectedMonth]: goals }
         : { [selectedMonth]: goals };
       
       await updateStoreAPI(selectedStore, { goals: updatedGoals });
       toast({ title: 'Sucesso!', description: 'Metas da loja salvas.' });
       setTimeout(() => {
         fetchData();
       }, 500);
     } catch (error) {
       toast({ title: 'Erro', description: error.message || 'Erro ao salvar metas.', variant: 'destructive' });
     }
   };
   ```

6. **Modificar `handleSaveAll` da mesma forma**

7. **Adicionar funções de CSV:**
   - `cleanNumericValue()` - Limpa e converte valores numéricos
   - `generateGoalsCSVTemplate()` - Gera template CSV
   - `parseGoalsCSV()` - Processa CSV
   - `handleCSVUploadGoals()` - Faz upload e processa CSV

8. **Adicionar UI para CSV no JSX:**
   - Seletor de mês
   - Botão "Template Metas"
   - Botão "Importar Metas"
   - Input file oculto

**📄 Arquivo completo:** Substituir o arquivo inteiro pelo conteúdo atualizado do `src/pages/GoalsPanel.jsx` local.

---

### 2. `src/contexts/DataContext.jsx` ⚠️ **IMPORTANTE**

**Problema:** `fetchData` não está sendo exportado no value do contexto.

**Alteração necessária:**

No objeto `value` (linha ~184), adicionar:
```javascript
const value = {
  // ... outros valores ...
  fetchData,  // ← ADICIONAR ESTA LINHA
};
```

---

### 3. `src/lib/supabaseService.js` ⚠️ **IMPORTANTE**

**Problema:** Funções de alertas não existem (causa erro de importação).

**Alteração necessária:**

Adicionar todas as funções de alertas no final do arquivo (após `fetchCurrentUserProfile`):

```javascript
// ============ ALERTS ============
export const fetchAlerts = async () => { ... };
export const createAlert = async (alertData) => { ... };
export const updateAlert = async (id, updates) => { ... };
export const deleteAlert = async (id) => { ... };
export const fetchAlertViews = async (alertId) => { ... };
export const fetchAlertRecipients = async (alertId) => { ... };
export const fetchUnreadAlerts = async (storeId) => { ... };
export const markAlertAsViewed = async (alertId, storeId) => { ... };
```

**📄 Arquivo completo:** Substituir o arquivo inteiro pelo conteúdo atualizado do `src/lib/supabaseService.js` local.

---

### 4. `src/pages/PainelExcelencia.jsx` ⚠️ **CRÍTICO**

**Problema:** Arquivo vazio causa erro de importação.

**Alteração necessária:**

Criar componente básico com export default.

**📄 Arquivo completo:** Substituir pelo conteúdo atualizado do `src/pages/PainelExcelencia.jsx` local.

---

## 📝 Checklist de Atualização

- [ ] Atualizar `src/pages/GoalsPanel.jsx` com todas as funcionalidades de CSV
- [ ] Adicionar `fetchData` no `value` de `src/contexts/DataContext.jsx`
- [ ] Adicionar funções de alertas em `src/lib/supabaseService.js`
- [ ] Criar componente `src/pages/PainelExcelencia.jsx`
- [ ] Testar importação de CSV localmente antes de fazer deploy
- [ ] Fazer commit e push para GitHub
- [ ] Verificar deploy na Vercel

## 🎯 Principais Correções

1. **Estrutura de Metas por Mês:** Metas agora são salvas como `goals[YYYY-MM]` em vez de apenas `goals`
2. **Import CSV Funcional:** Adicionada funcionalidade completa de importação em massa
3. **Seletor de Mês:** Permite escolher qual mês de metas visualizar/editar
4. **Preservação de Dados:** Metas de outros meses são preservadas ao atualizar

## ⚠️ Importante

- **Backup:** Fazer backup do código atual antes de atualizar
- **Teste Local:** Testar todas as funcionalidades localmente antes de fazer deploy
- **Validação:** Verificar se o CSV importa corretamente após atualização

## 📞 Suporte

Se encontrar problemas após a atualização, verificar:
1. Console do navegador para erros JavaScript
2. Logs da Vercel para erros de build
3. Estrutura do banco de dados (campo `goals` deve ser JSONB)










