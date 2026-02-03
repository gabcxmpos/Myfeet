# 🔧 Correções no Planner de Devoluções

## Problemas Identificados e Corrigidos

### 1. ❌ Problema: Exclusão não funcionava (perfil devoluções)

**Sintoma:** Mesmo mostrando mensagem de sucesso, o registro não era excluído.

**Causa:** Faltava política RLS (Row Level Security) para DELETE na tabela `returns_planner` para o perfil `devoluções`.

**Solução:**
- ✅ Criado script SQL `CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql` para adicionar política RLS de DELETE
- ✅ Adicionado `await fetchData()` após exclusão para atualizar a lista imediatamente
- ✅ Adicionado tratamento de erro com `console.error` para debug

**Arquivos modificados:**
- `src/pages/ReturnsPlanner.jsx` - Função `handleDeleteConfirm`

---

### 2. ❌ Problema: Data de Emissão NF não era obrigatória

**Sintoma:** Ao criar um registro, não deixava seguir sem a data da NF, mas não havia validação no frontend.

**Causa:** Campo `invoice_issue_date` não tinha validação obrigatória no formulário.

**Solução:**
- ✅ Adicionada validação obrigatória para `invoice_issue_date` no `handleSave`
- ✅ Adicionado asterisco (*) no label do campo para indicar obrigatoriedade
- ✅ Adicionado atributo `required` no input de data

**Arquivos modificados:**
- `src/pages/ReturnsPlanner.jsx` - Função `handleSave` e campos do formulário

---

### 3. ❌ Problema: Erro 400 ao criar/atualizar registro

**Sintoma:** Erro 400 (Bad Request) ao tentar criar ou atualizar registros.

**Causa:** Campos numéricos sendo enviados como strings, campos vazios sendo enviados incorretamente.

**Solução:**
- ✅ Normalização dos dados antes de enviar:
  - `return_value`: convertido para `parseFloat()` ou `null`
  - `items_quantity`: convertido para `parseInt()` ou `null`
  - Campos de texto vazios: convertidos para `null`
- ✅ Adicionado `await fetchData()` após salvar para atualizar a lista
- ✅ Melhorado tratamento de erros com `console.error`

**Arquivos modificados:**
- `src/pages/ReturnsPlanner.jsx` - Função `handleSave`

---

## 📋 Scripts SQL para Executar

### Script Principal: `CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql`

Execute este script no **Supabase SQL Editor** para permitir que o perfil `devoluções` possa excluir registros do planner.

**O que o script faz:**
1. Verifica políticas RLS existentes
2. Remove políticas antigas (se existirem)
3. Cria nova política para DELETE permitindo:
   - `admin`
   - `supervisor`
   - `supervisor_franquia`
   - `devoluções`
4. Habilita RLS na tabela (se não estiver habilitado)
5. Verifica se tudo foi criado corretamente

---

## ✅ Checklist de Verificação

Após executar o script SQL e atualizar o código:

- [ ] Executar `CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql` no Supabase
- [ ] Verificar que o perfil `devoluções` consegue excluir registros
- [ ] Verificar que a data de emissão NF é obrigatória ao criar registro
- [ ] Verificar que não há mais erro 400 ao criar/atualizar registros
- [ ] Verificar que a lista é atualizada imediatamente após exclusão/salvamento

---

## 🔍 Como Testar

1. **Teste de Exclusão:**
   - Faça login com perfil `devoluções`
   - Tente excluir um registro do planner
   - Verifique que o registro é excluído e desaparece da lista

2. **Teste de Validação:**
   - Tente criar um novo registro sem preencher a "Data Emissão NF"
   - Verifique que aparece mensagem de erro: "Informe a data de emissão da NF. Este campo é obrigatório."
   - Preencha a data e verifique que o registro é criado com sucesso

3. **Teste de Criação/Atualização:**
   - Crie um novo registro com todos os campos preenchidos
   - Verifique que não há erro 400
   - Edite um registro existente
   - Verifique que não há erro 400

---

## 📝 Notas Importantes

- O campo `invoice_issue_date` agora é **obrigatório** para criar novos registros
- A exclusão agora atualiza a lista automaticamente após sucesso
- Os dados são normalizados antes de serem enviados ao banco (números como números, strings vazias como null)
- O tratamento de erros foi melhorado para facilitar debug

---

**Última atualização:** $(date)








