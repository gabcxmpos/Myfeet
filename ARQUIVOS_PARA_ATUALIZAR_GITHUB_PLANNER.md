# Arquivos para Atualizar no GitHub - Correção Planner de Devoluções

## 📋 Resumo
Este documento lista todos os arquivos que foram modificados ou criados durante a correção do problema do Planner de Devoluções e que precisam ser atualizados no GitHub.

---

## ✅ ARQUIVOS CRÍTICOS (OBRIGATÓRIO ATUALIZAR)

### 1. **`src/lib/supabaseService.js`** ⚠️ **CRÍTICO**
**O que foi adicionado:**
- Funções CRUD completas para `returns_planner`:
  - `fetchReturnsPlanner()` - Busca todos os registros
  - `createReturnsPlanner()` - Cria novo registro
  - `updateReturnsPlanner()` - Atualiza registro existente
  - `deleteReturnsPlanner()` - Deleta registro

**Localização:** Linhas 569-610

**Por que é crítico:** Sem essas funções, a aplicação não consegue buscar os dados do planner do banco de dados.

---

### 2. **`src/contexts/DataContext.jsx`** ⚠️ **CRÍTICO**
**O que foi modificado:**
- Adicionado estado `returnsPlanner` (linha 55)
- Adicionado `fetchReturnsPlanner()` no `fetchData()` (linha 91)
- Adicionado `setReturnsPlanner()` após buscar dados (linha 98)
- Adicionado limpeza do estado no logout (linha 135)
- Adicionadas funções:
  - `addReturnsPlanner()` (linha 178)
  - `updateReturnsPlanner()` (linha 179)
  - `deleteReturnsPlanner()` (linha 180)
- Exportado no contexto (linhas 283-285)

**Por que é crítico:** Sem essas mudanças, o componente `ReturnsPlanner.jsx` não consegue acessar os dados do planner.

---

## 📄 ARQUIVOS SQL CRIADOS (OPCIONAL - mas recomendado)

### 3. **`VERIFICAR_VALORES_ENUM_USER_ROLE.sql`** 📝 **NOVO**
**Descrição:** Script para verificar valores válidos do enum `user_role` antes de usar nas políticas RLS.

**Por que adicionar:** Útil para diagnóstico e evitar erros futuros.

---

### 4. **`DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql`** 📝 **NOVO**
**Descrição:** Script completo de diagnóstico para identificar problemas no planner de devoluções.

**Por que adicionar:** Ferramenta útil para troubleshooting futuro.

---

### 5. **`VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql`** 📝 **NOVO**
**Descrição:** Script que corrige todas as políticas RLS e restaura a visibilidade dos registros.

**Por que adicionar:** Script principal de correção que pode ser necessário executar novamente.

---

### 6. **`VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql`** 📝 **NOVO**
**Descrição:** Script para verificar se há backups ou histórico que possam restaurar registros deletados.

**Por que adicionar:** Útil para recuperação de dados em caso de perda.

---

### 7. **`INSTRUCOES_RESTAURAR_PLANNER.md`** 📝 **NOVO**
**Descrição:** Instruções completas de como usar os scripts SQL para restaurar o planner.

**Por que adicionar:** Documentação útil para referência futura.

---

## 🚀 Como Atualizar no GitHub

### Opção 1: Via GitHub Desktop (Recomendado)

1. Abra o GitHub Desktop
2. Você verá os arquivos modificados:
   - ✅ `src/lib/supabaseService.js` (modificado)
   - ✅ `src/contexts/DataContext.jsx` (modificado)
   - ✅ Novos arquivos SQL (se quiser adicionar)

3. **Para os arquivos críticos:**
   - Marque `src/lib/supabaseService.js`
   - Marque `src/contexts/DataContext.jsx`

4. **Para os arquivos SQL (opcional):**
   - Marque os arquivos `.sql` que deseja adicionar
   - Marque `INSTRUCOES_RESTAURAR_PLANNER.md`

5. Escreva uma mensagem de commit:
   ```
   fix: Adicionar funções CRUD para returns_planner e integrar ao DataContext
   
   - Adicionadas funções fetchReturnsPlanner, createReturnsPlanner, 
     updateReturnsPlanner e deleteReturnsPlanner em supabaseService.js
   - Integrado returnsPlanner ao DataContext para disponibilizar dados 
     aos componentes
   - Corrigido problema de registros não aparecerem na interface
   ```

6. Clique em "Commit to main" (ou sua branch)
7. Clique em "Push origin" para enviar ao GitHub

---

### Opção 2: Via Terminal (se Git estiver instalado)

```bash
# Adicionar arquivos críticos
git add src/lib/supabaseService.js
git add src/contexts/DataContext.jsx

# Adicionar arquivos SQL (opcional)
git add VERIFICAR_VALORES_ENUM_USER_ROLE.sql
git add DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql
git add VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql
git add VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql
git add INSTRUCOES_RESTAURAR_PLANNER.md
git add ARQUIVOS_PARA_ATUALIZAR_GITHUB_PLANNER.md

# Fazer commit
git commit -m "fix: Adicionar funções CRUD para returns_planner e integrar ao DataContext

- Adicionadas funções fetchReturnsPlanner, createReturnsPlanner, 
  updateReturnsPlanner e deleteReturnsPlanner em supabaseService.js
- Integrado returnsPlanner ao DataContext para disponibilizar dados 
  aos componentes
- Corrigido problema de registros não aparecerem na interface
- Adicionados scripts SQL para diagnóstico e correção"

# Enviar para GitHub
git push origin main
```

---

## ✅ Checklist de Atualização

- [ ] `src/lib/supabaseService.js` atualizado
- [ ] `src/contexts/DataContext.jsx` atualizado
- [ ] (Opcional) Scripts SQL adicionados
- [ ] (Opcional) Documentação adicionada
- [ ] Commit feito com mensagem descritiva
- [ ] Push realizado para GitHub

---

## 🔍 Verificação Pós-Atualização

Após atualizar no GitHub, verifique:

1. ✅ Os arquivos aparecem no repositório GitHub
2. ✅ O código está correto (sem erros de sintaxe)
3. ✅ A aplicação funciona após deploy (se houver CI/CD)

---

## 📝 Notas Importantes

1. **Arquivos Críticos:** `supabaseService.js` e `DataContext.jsx` são **OBRIGATÓRIOS** - sem eles, o planner não funcionará.

2. **Arquivos SQL:** São opcionais mas recomendados para referência futura e troubleshooting.

3. **Scripts SQL já executados:** Os scripts SQL já foram executados no Supabase, então adicioná-los ao GitHub é apenas para documentação e referência.

4. **Teste antes de fazer push:** Certifique-se de que a aplicação funciona localmente antes de fazer push.

---

## 🆘 Se Algo Der Errado

Se após atualizar no GitHub a aplicação parar de funcionar:

1. Verifique se os arquivos foram atualizados corretamente
2. Verifique se há erros no console do navegador
3. Verifique se o Supabase está acessível
4. Execute os scripts SQL de diagnóstico novamente se necessário

---

**Última atualização:** $(date)
**Arquivos modificados nesta sessão:** 2 arquivos críticos + 5 arquivos novos (SQL e documentação)

