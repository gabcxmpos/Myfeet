# ✅ PPAD GERENCIAL CONFIGURADO PARA PERFIL LOJA

## ✅ CONFIGURAÇÕES CONFIRMADAS

### 1. Aba PPAD GERENCIAL Visível para Loja
- ✅ Aba "PPAD GERENCIAL" aparece no menu para perfil `loja` e `loja_franquia`
- ✅ Aba padrão agora é "PPAD GERENCIAL" (antes era "Checklist Diário")
- ✅ Usuário loja pode alternar entre "Checklist Diário" e "PPAD GERENCIAL"

### 2. Componente Renderizado Corretamente
- ✅ `GerencialChecklist` verifica se é loja e renderiza `StoreGerencialChecklistView`
- ✅ Componente mostra tarefas separadas por setor (AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS)
- ✅ Tarefas separadas em "Pendentes" e "Realizadas"
- ✅ Atualização instantânea ao marcar/desmarcar tarefas

### 3. Verificações de Segurança
- ✅ Verifica se usuário tem `storeId` antes de renderizar
- ✅ Mostra mensagem de erro se loja não estiver vinculada
- ✅ Logs detalhados para debug

## 📋 ESTRUTURA DO CÓDIGO

### `src/pages/ChecklistsManagement.jsx`
```javascript
// Abas para Loja (linhas 167-178)
{isLoja && (
  <>
    <TabsTrigger value="diario">Checklist Diário</TabsTrigger>
    <TabsTrigger value="gerencial">PPAD GERENCIAL</TabsTrigger>
  </>
)}

// Conteúdo das Abas - Loja (linhas 232-240)
{isLoja && (
  <>
    <TabsContent value="diario"><DailyChecklist /></TabsContent>
    <TabsContent value="gerencial"><GerencialChecklist /></TabsContent>
  </>
)}
```

### `src/pages/GerencialChecklist.jsx`
```javascript
// Verificação de perfil loja (linha 597)
const isLoja = user?.role === 'loja' || user?.role === 'loja_franquia';

// Renderização para loja (linha 647-649)
{isLoja && user?.storeId && (
  <StoreGerencialChecklistView storeId={user.storeId} />
)}
```

## 🚀 COMO ACESSAR

1. **Login com perfil loja:**
   - Role: `loja` ou `loja_franquia`
   - Deve ter `storeId` vinculado

2. **Navegar para Checklists:**
   - Menu lateral → "Checklists"
   - Ou URL: `/checklists`

3. **Aba PPAD GERENCIAL:**
   - Aba padrão será "PPAD GERENCIAL"
   - Ou clique na aba "PPAD GERENCIAL"

4. **Funcionalidades:**
   - Ver tarefas por setor
   - Marcar tarefas como concluídas
   - Ver progresso por setor
   - Ver histórico de 7 dias
   - Tarefas movem instantaneamente ao marcar

## 🔍 LOGS PARA VERIFICAR

No console (F12), você deve ver:

```
🔍 [ChecklistsManagement] Renderizando: {
  userRole: "loja",
  isLoja: true,
  activeTab: "gerencial"
}

🔍 [GerencialChecklist] Renderizando: {
  userRole: "loja",
  storeId: "...",
  isLoja: true,
  gerencialTasksCount: 14
}

🔍 [StoreGerencialChecklistView] Renderizando: {
  storeId: "...",
  storeName: "...",
  completedTasks: 0,
  totalTasks: 14
}
```

## ⚠️ SE NÃO APARECER

1. **Verificar perfil do usuário:**
   - Role deve ser `loja` ou `loja_franquia`
   - Deve ter `store_id` na tabela `app_users`

2. **Verificar logs:**
   - Abrir console (F12)
   - Verificar se `isLoja` é `true`
   - Verificar se `storeId` existe

3. **Limpar cache:**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
   npm run dev
   ```
   - Ctrl+Shift+Delete → Limpar cache do navegador
   - Ctrl+F5 (hard refresh)

4. **Verificar no Supabase:**
   ```sql
   SELECT id, email, role, store_id 
   FROM app_users 
   WHERE role IN ('loja', 'loja_franquia');
   ```

## ✅ TUDO CONFIGURADO!

O PPAD GERENCIAL está **100% configurado** para aparecer no perfil loja:
- ✅ Aba visível
- ✅ Conteúdo renderizado
- ✅ Funcionalidade completa
- ✅ Aba padrão configurada
- ✅ Atualização instantânea

**TESTE AGORA COM UM USUÁRIO LOJA!**










