# 📦 Arquivos para Atualizar no GitHub

## ✅ Arquivos Principais que DEVEM ser Commitados

### 🎯 Componentes React (CRÍTICOS)

#### 1. **src/pages/ReturnsManagement.jsx** ⭐ NOVO/ATUALIZADO
- **Status**: Arquivo principal da funcionalidade de devoluções
- **Importância**: CRÍTICO - Funcionalidade completa
- **Conteúdo**: 
  - Dashboard de devoluções e falta física
  - Formulários de criação
  - Filtros por seção
  - Exclusão para admin
  - Tabs: Pendentes, Coletados, Falta Física, Finalizados

#### 2. **src/App.jsx** ⚠️ ATUALIZADO
- **Mudanças**: 
  - Import de `ReturnsManagement`
  - Rota `/returns` adicionada
- **Linha**: `import ReturnsManagement from '@/pages/ReturnsManagement';`
- **Linha**: `<Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja']}><ReturnsManagement /></ProtectedRoute>} />`

#### 3. **src/components/Sidebar.jsx** ⚠️ ATUALIZADO
- **Mudanças**: 
  - Item de menu "Devoluções" adicionado
  - Ícone `RotateCcw`
  - Visível para admin, supervisor e loja

#### 4. **src/lib/supabaseService.js** ⚠️ ATUALIZADO
- **Novas Funções**:
  - `fetchReturns()` - Buscar devoluções
  - `createReturn()` - Criar devolução (com nf_emission_date e nf_value)
  - `updateReturn()` - Atualizar devolução (com histórico)
  - `deleteReturn()` - Excluir devolução
  - `saveReturnStatusHistory()` - Salvar histórico de status
  - `fetchPhysicalMissing()` - Buscar falta física
  - `createPhysicalMissing()` - Criar falta física (com campos separados)
  - `updatePhysicalMissing()` - Atualizar falta física
  - `deletePhysicalMissing()` - Excluir falta física
  - `updateTraining()` - Atualizado para incluir `registrations_blocked`

#### 5. **src/contexts/DataContext.jsx** ⚠️ ATUALIZADO
- **Mudanças**:
  - Estados `returns` e `physicalMissing` adicionados
  - Funções CRUD expostas: `addReturn`, `updateReturn`, `deleteReturn`, `addPhysicalMissing`, `updatePhysicalMissing`, `deletePhysicalMissing`
  - Refresh automático incluindo returns e physicalMissing
  - Tratamento de erros para tabelas não encontradas

#### 6. **src/pages/TrainingManagement.jsx** ⚠️ ATUALIZADO
- **Mudanças**:
  - Opção "Bloquear/Desbloquear Inscrições" no dropdown admin
  - Função `handleToggleBlockRegistrations`
  - Indicador visual de inscrições bloqueadas

#### 7. **src/pages/Training.jsx** ⚠️ ATUALIZADO
- **Mudanças**:
  - Verificação de `registrations_blocked` antes de permitir inscrição
  - Botão desabilitado quando bloqueado
  - Indicador visual "Inscrições bloqueadas"

#### 8. **src/contexts/SupabaseAuthContext.jsx** ⚠️ ATUALIZADO
- **Mudanças**:
  - Listener para evento `supabase-session-expired`
  - Limpeza de sessão expirada
  - Melhor tratamento de erros 403/401

#### 9. **src/lib/customSupabaseClient.js** ⚠️ ATUALIZADO
- **Mudanças**:
  - Interceptor de fetch para detectar sessão expirada
  - Função `clearExpiredSession()`
  - Disparo de evento customizado

#### 10. **src/components/Header.jsx** ⚠️ ATUALIZADO
- **Mudanças**:
  - `handleLogout` com try/catch/finally
  - Redirecionamento garantido mesmo com erro

---

## 📄 Scripts SQL (OPCIONAL - Documentação)

### ⚠️ IMPORTANTE: Scripts SQL são para referência/documentação
**NÃO são necessários para o funcionamento do sistema online**, mas são úteis para:
- Documentação
- Recriação do banco
- Referência futura

#### Scripts Principais de Devoluções:
1. **CRIAR_TABELAS_DEVOLUCOES.sql** - Script principal (já deve estar no Supabase)
2. **ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql** - Campo adicional
3. **ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql** - Campos de valores
4. **ATUALIZAR_TABELA_FALTA_FISICA.sql** - Campos iniciais
5. **AJUSTAR_COLUNAS_FALTA_FISICA.sql** - Tornar nullable
6. **ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql** - SKU, Cor, Tamanho
7. **ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql** - Bloqueio de inscrições
8. **VERIFICAR_TABELAS_DEVOLUCOES.sql** - Script de verificação

**Recomendação**: Commit apenas os scripts principais, não todos os scripts de teste/diagnóstico.

---

## 📋 Checklist de Commit

### ✅ Arquivos OBRIGATÓRIOS (Código Fonte):

- [ ] `src/pages/ReturnsManagement.jsx` ⭐ NOVO
- [ ] `src/App.jsx` (rota adicionada)
- [ ] `src/components/Sidebar.jsx` (menu adicionado)
- [ ] `src/lib/supabaseService.js` (funções de API)
- [ ] `src/contexts/DataContext.jsx` (estados e funções CRUD)
- [ ] `src/pages/TrainingManagement.jsx` (bloqueio de inscrições)
- [ ] `src/pages/Training.jsx` (verificação de bloqueio)
- [ ] `src/contexts/SupabaseAuthContext.jsx` (sessão expirada)
- [ ] `src/lib/customSupabaseClient.js` (interceptor)
- [ ] `src/components/Header.jsx` (logout melhorado)

### 📝 Arquivos OPCIONAIS (Documentação):

- [ ] `CRIAR_TABELAS_DEVOLUCOES.sql` (script principal)
- [ ] `ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql`
- [ ] `ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql`
- [ ] `ATUALIZAR_TABELA_FALTA_FISICA.sql`
- [ ] `AJUSTAR_COLUNAS_FALTA_FISICA.sql`
- [ ] `ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql`
- [ ] `ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql`
- [ ] `VERIFICAR_TABELAS_DEVOLUCOES.sql`

### ❌ Arquivos que NÃO devem ser Commitados:

- `VERIFICACAO_COMPLETA_SISTEMA.md` (documentação local)
- `ARQUIVOS_PARA_GITHUB.md` (este arquivo - apenas referência)
- Scripts SQL de teste/diagnóstico antigos
- Arquivos `.backup`
- `node_modules/`
- `.env` e variáveis de ambiente

---

## 🚀 Comandos Git Sugeridos

```bash
# Adicionar arquivos principais
git add src/pages/ReturnsManagement.jsx
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/lib/supabaseService.js
git add src/contexts/DataContext.jsx
git add src/pages/TrainingManagement.jsx
git add src/pages/Training.jsx
git add src/contexts/SupabaseAuthContext.jsx
git add src/lib/customSupabaseClient.js
git add src/components/Header.jsx

# Adicionar scripts SQL principais (opcional)
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
# ou
git push origin master
```

---

## ⚠️ IMPORTANTE: Antes de Fazer Deploy

1. **Verificar se os scripts SQL foram executados no Supabase online**
   - Execute `VERIFICAR_TABELAS_DEVOLUCOES.sql` no Supabase online
   - Certifique-se de que todas as tabelas e colunas existem

2. **Verificar variáveis de ambiente**
   - `VITE_SUPABASE_URL` configurada
   - `VITE_SUPABASE_ANON_KEY` configurada

3. **Testar localmente antes do deploy**
   - Criar uma devolução como loja
   - Verificar se aparece para admin
   - Testar exclusão como admin
   - Testar filtros

4. **Build de produção**
   ```bash
   npm run build
   ```

---

## 📊 Resumo

**Total de arquivos críticos**: 10 arquivos de código fonte
**Total de scripts SQL opcionais**: 8 scripts principais

**Prioridade**:
1. ⭐ **CRÍTICO**: Todos os arquivos `.jsx` e `.js` listados acima
2. 📝 **OPCIONAL**: Scripts SQL (apenas para documentação)

