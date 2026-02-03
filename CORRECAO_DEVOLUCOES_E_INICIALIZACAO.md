# 🔧 Correção: Aba Devoluções e Erro de Inicialização

## ❌ Problemas Identificados

1. **Aba Devoluções não funcionava em todos os perfis**
   - Perfis `financeiro` e `supervisor_franquia` não tinham acesso
   - Rota no `App.jsx` não incluía todos os perfis necessários

2. **Erro de inicialização: "Cannot access 'f' before initialization"**
   - Variável `isLoja` estava sendo usada ANTES de ser definida em `ReturnsConsolidated.jsx`
   - Isso causava erro de referência no código minificado

---

## ✅ Correções Aplicadas

### 1. **`src/pages/ReturnsConsolidated.jsx`**

**Problema:** Variáveis de perfil (`isLoja`, `isAdmin`, etc.) estavam sendo usadas antes de serem definidas.

**Solução:** Movidas as definições de variáveis de perfil para ANTES de serem usadas.

**Antes:**
```javascript
// ❌ isLoja usado aqui, mas definido depois
const handleTabChange = (value) => {
  if (isLoja && (value === 'missing' || value === 'capacity')) {
    // ...
  }
};

if (!user) {
  return null;
}

// ❌ isLoja definido aqui (muito tarde)
const isLoja = user?.role === 'loja' || user?.role === 'admin_loja' || user?.role === 'loja_franquia';
```

**Depois:**
```javascript
if (!user) {
  return null;
}

// ✅ Variáveis definidas ANTES de serem usadas
const isAdmin = user?.role === 'admin';
const isDevolucoes = user?.role === 'devoluções';
const isSupervisor = user?.role === 'supervisor' || user?.role === 'supervisor_franquia';
const isFinanceiro = user?.role === 'financeiro';
const isLoja = user?.role === 'loja' || user?.role === 'admin_loja' || user?.role === 'loja_franquia';

// ✅ Agora pode usar isLoja sem problemas
const handleTabChange = (value) => {
  if (isLoja && (value === 'missing' || value === 'capacity')) {
    // ...
  }
};
```

**Outras alterações:**
- Adicionado suporte para `supervisor_franquia` em `isSupervisor`
- Adicionado suporte para `financeiro` em `isFinanceiro`
- Atualizado `getInitialTab()` para incluir todos os perfis
- Atualizado `useEffect` para incluir todos os perfis
- Adicionado `isFinanceiro` às condições de acesso às abas
- Adicionado `isSupervisor` às condições de acesso às abas Planner, Falta Física e Capacidade

### 2. **`src/App.jsx`**

**Problema:** Rota `/returns` não incluía todos os perfis necessários.

**Solução:** Atualizada a rota para incluir todos os perfis.

**Antes:**
```javascript
<Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja', 'devoluções']}><ReturnsConsolidated /></ProtectedRoute>} />
```

**Depois:**
```javascript
<Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'devoluções', 'financeiro']}><ReturnsConsolidated /></ProtectedRoute>} />
```

### 3. **`src/lib/supabaseService.js`**

**Problema:** Variável `format` poderia conflitar com função `format` do `date-fns`.

**Solução:** Renomeada variável `format` para `trainingFormat` na função `updateTraining`.

---

## 📋 Resumo das Alterações

### Arquivos Modificados:
1. ✅ `src/pages/ReturnsConsolidated.jsx`
   - Reordenadas declarações de variáveis
   - Adicionado suporte para `supervisor_franquia` e `financeiro`
   - Corrigida ordem de inicialização

2. ✅ `src/App.jsx`
   - Atualizada rota `/returns` para incluir todos os perfis

3. ✅ `src/lib/supabaseService.js`
   - Renomeada variável `format` para `trainingFormat`

---

## 🎯 Perfis com Acesso à Aba Devoluções

### Aba "Devoluções" (Pendentes):
- ✅ `admin`
- ✅ `supervisor`
- ✅ `supervisor_franquia`
- ✅ `loja`
- ✅ `loja_franquia`
- ✅ `devoluções`
- ✅ `financeiro`

### Aba "Planner":
- ✅ `admin`
- ✅ `supervisor`
- ✅ `supervisor_franquia`
- ✅ `devoluções`

### Aba "Falta Física":
- ✅ `admin`
- ✅ `supervisor`
- ✅ `supervisor_franquia`
- ✅ `devoluções`
- ⚠️ `loja` e `loja_franquia` têm aba dedicada (`/physical-missing`)

### Aba "Capacidade":
- ✅ `admin`
- ✅ `supervisor`
- ✅ `supervisor_franquia`
- ✅ `devoluções`

---

## 🧪 Testes Recomendados

1. **Testar acesso à aba Devoluções:**
   - Login como `admin` → Deve ver todas as abas
   - Login como `supervisor` → Deve ver todas as abas
   - Login como `supervisor_franquia` → Deve ver todas as abas
   - Login como `loja` → Deve ver apenas aba "Devoluções"
   - Login como `financeiro` → Deve ver apenas aba "Devoluções"
   - Login como `devoluções` → Deve ver todas as abas

2. **Testar erro de inicialização:**
   - Acessar Dashboard → Não deve haver erro no console
   - Acessar Devoluções → Não deve haver erro no console
   - Navegar entre abas → Deve funcionar sem erros

3. **Testar navegação:**
   - Clicar em "Devoluções" no menu → Deve abrir a aba correta
   - Trocar de aba → Deve funcionar corretamente
   - Loja tentando acessar "Falta Física" → Deve redirecionar para "Devoluções"

---

## ✅ Status

- ✅ Erro de inicialização corrigido
- ✅ Acesso à aba Devoluções corrigido para todos os perfis
- ✅ Rota atualizada no `App.jsx`
- ✅ Sem erros de lint

---

**Data:** 2024-12-19
**Status:** ✅ Corrigido



