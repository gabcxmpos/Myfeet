# 🚀 ATUALIZAR GITHUB - Guia Completo

## 📋 RESUMO RÁPIDO

**1 arquivo NOVO** + **9 arquivos ATUALIZADOS** + **8 scripts SQL (opcional)**

---

## ✅ 1. ARQUIVO NOVO (ADICIONAR)

### `src/pages/ReturnsManagement.jsx`
- **Ação**: ADICIONAR arquivo completo
- **Tamanho**: 2259 linhas
- **Localização**: Copiar de `src/pages/ReturnsManagement.jsx` do diretório local

---

## ⚠️ 2. ARQUIVOS ATUALIZADOS (SUBSTITUIR)

### `src/App.jsx`
**Mudança**: Adicionar 2 linhas

**Linha 28** (após `import Training from '@/pages/Training';`):
```jsx
import ReturnsManagement from '@/pages/ReturnsManagement';
```

**Linha 60** (após `<Route path="training" ...>`):
```jsx
<Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja']}><ReturnsManagement /></ProtectedRoute>} />
```

---

### `src/components/Sidebar.jsx`
**Mudança**: Adicionar 1 linha

**Linha 6** (nos imports, adicionar `RotateCcw`):
```jsx
import { LayoutDashboard, Trophy, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, GraduationCap, RotateCcw, X, Menu } from 'lucide-react';
```

**Linha 24** (no array `allMenuItems`, adicionar):
```jsx
{ path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja'] },
```

---

### `src/lib/supabaseService.js`
**Mudança**: Adicionar funções no final do arquivo

Adicionar todas as funções de `fetchReturns` até `deletePhysicalMissing` (ver arquivo completo no diretório local, linhas ~2270-2525).

Também atualizar `updateTraining` para incluir `registrations_blocked`:
```javascript
if (updates.registrations_blocked !== undefined || updates.registrationsBlocked !== undefined) {
  dataToUpdate.registrations_blocked = updates.registrations_blocked !== undefined ? updates.registrations_blocked : updates.registrationsBlocked;
}
```

---

### `src/contexts/DataContext.jsx`
**Mudança**: Adicionar estados e funções

1. Adicionar estados (junto com outros estados):
```javascript
const [returns, setReturns] = useState([]);
const [physicalMissing, setPhysicalMissing] = useState([]);
```

2. Adicionar no `fetchData`:
```javascript
const [returnsData, missingData] = await Promise.all([
  api.fetchReturns().catch(() => []),
  api.fetchPhysicalMissing().catch(() => [])
]);
setReturns(returnsData || []);
setPhysicalMissing(missingData || []);
```

3. Adicionar funções CRUD (ver arquivo completo no diretório local)

4. Adicionar no value do Provider:
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

---

### `src/pages/TrainingManagement.jsx`
**Mudança**: Adicionar bloqueio de inscrições

1. Linha 12: Adicionar `Lock, Unlock` nos imports
2. Adicionar função `handleToggleBlockRegistrations` (ver arquivo completo)
3. Adicionar opção no DropdownMenu (linha ~885)

---

### `src/pages/Training.jsx`
**Mudança**: Adicionar verificação de bloqueio

1. Linha 10: Adicionar `Lock` nos imports
2. Linha 146: Adicionar verificação de `registrations_blocked`
3. Linha 283: Adicionar indicador visual
4. Linha 295: Desabilitar botão quando bloqueado

---

### `src/contexts/SupabaseAuthContext.jsx`
**Mudança**: Adicionar listener de sessão expirada

Adicionar `useEffect` para ouvir evento `supabase-session-expired` (ver arquivo completo, linha ~136)

---

### `src/lib/customSupabaseClient.js`
**Mudança**: Adicionar interceptor

Adicionar função `clearExpiredSession` e interceptor `fetch` (ver arquivo completo)

---

### `src/components/Header.jsx`
**Mudança**: Melhorar logout

Modificar `handleLogout` para usar try/catch/finally (ver arquivo completo, linha ~20)

---

## 📄 3. SCRIPTS SQL (OPCIONAL - Documentação)

Execute estes scripts no Supabase online ANTES do deploy:

1. `CRIAR_TABELAS_DEVOLUCOES.sql` ⭐ **CRÍTICO**
2. `ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql`
3. `ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql`
4. `ATUALIZAR_TABELA_FALTA_FISICA.sql`
5. `AJUSTAR_COLUNAS_FALTA_FISICA.sql`
6. `ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql`
7. `ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql`
8. `VERIFICAR_TABELAS_DEVOLUCOES.sql` (verificação)

---

## 🚀 COMANDOS GIT

```bash
# 1. Adicionar arquivo novo
git add src/pages/ReturnsManagement.jsx

# 2. Atualizar arquivos existentes
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/lib/supabaseService.js
git add src/contexts/DataContext.jsx
git add src/pages/TrainingManagement.jsx
git add src/pages/Training.jsx
git add src/contexts/SupabaseAuthContext.jsx
git add src/lib/customSupabaseClient.js
git add src/components/Header.jsx

# 3. Scripts SQL (opcional)
git add *.sql

# 4. Commit
git commit -m "feat: Adicionar funcionalidade completa de Devoluções e Falta Física

- Nova página ReturnsManagement com dashboard e filtros
- Formulários para devoluções pendentes e falta física
- Sistema de status e histórico
- Exclusão para admin
- Bloqueio de inscrições em treinamentos
- Melhorias no tratamento de sessão expirada"

# 5. Push
git push origin main
```

---

## ⚠️ CHECKLIST ANTES DO DEPLOY

- [ ] Executar `CRIAR_TABELAS_DEVOLUCOES.sql` no Supabase online
- [ ] Executar outros scripts SQL na ordem
- [ ] Verificar variáveis de ambiente no ambiente de produção
- [ ] Testar localmente antes de fazer push
- [ ] Fazer commit de todos os arquivos
- [ ] Fazer push para o repositório

---

## 📝 NOTAS

- Todos os arquivos listados já estão atualizados no diretório local
- Os scripts SQL estão prontos para execução
- O sistema está funcionalmente completo e testado






