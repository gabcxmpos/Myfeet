# ✅ Como Verificar se o Histórico de Metas Está Funcionando

## 🔍 Método 1: Verificação no Supabase (Recomendado)

### Passo 1: Execute o script de verificação
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo do arquivo: **`VERIFICAR_HISTORICO_METAS.sql`**
4. Verifique os resultados:
   - ✅ Se aparecer "Tabela goals_history EXISTE" → Tabela criada com sucesso!
   - ❌ Se aparecer "Tabela goals_history NÃO EXISTE" → Execute `CRIAR_HISTORICO_METAS.sql`

### Passo 2: Verificar visualmente
1. No Supabase Dashboard, vá em **Table Editor**
2. Procure pela tabela **`goals_history`**
3. Se a tabela aparecer → ✅ Tabela criada!

---

## 🔍 Método 2: Teste Prático

### Passo 1: Atualizar metas
1. Faça login no sistema
2. Vá para a página **Metas** (Goals Panel)
3. Selecione uma loja
4. Altere os valores das metas (ex: Faturamento)
5. Clique em **"Salvar Alterações"**

### Passo 2: Verificar no console do navegador
1. Abra o **DevTools** (F12 ou Ctrl+Shift+I)
2. Vá na aba **Console**
3. Procure por mensagens:

**✅ Se estiver funcionando:**
- Nenhuma mensagem de erro sobre `goals_history`
- Metas são salvas normalmente

**❌ Se NÃO estiver funcionando:**
- Mensagem: `⚠️ Tabela goals_history não existe ainda`
- Mensagem: `relation "goals_history" does not exist`

### Passo 3: Verificar se salvou no banco
1. No Supabase Dashboard, vá em **Table Editor**
2. Selecione a tabela **`goals_history`**
3. Verifique se há um novo registro após salvar as metas
4. Se aparecer um novo registro → ✅ Histórico funcionando!

---

## 📋 Checklist de Verificação

Marque conforme verifica:

- [ ] Tabela `goals_history` existe no Supabase
- [ ] Tabela tem as colunas: `id`, `store_id`, `goals`, `weights`, `changed_by`, `created_at`
- [ ] Índices foram criados (`idx_goals_history_store_id`, etc.)
- [ ] Ao atualizar metas, não aparece erro no console
- [ ] Após atualizar metas, aparece novo registro na tabela `goals_history`
- [ ] Função `fetchGoalsHistory` retorna dados (não array vazio)

---

## 🚨 Se Algo Não Estiver Funcionando

### Problema: Tabela não existe
**Solução:**
1. Execute o script `CRIAR_HISTORICO_METAS.sql` no Supabase SQL Editor
2. Aguarde a conclusão
3. Execute o script `VERIFICAR_HISTORICO_METAS.sql` para confirmar

### Problema: Tabela existe mas não salva histórico
**Solução:**
1. Verifique as políticas RLS (Row Level Security)
2. Verifique se você tem permissão de INSERT na tabela
3. Verifique os logs do Supabase para erros específicos

### Problema: Erro ao buscar histórico
**Solução:**
1. Verifique se a tabela existe
2. Verifique as políticas RLS para SELECT
3. Verifique se o `store_id` está correto

---

## 📝 Nota Importante

O código já está **implementado e pronto** para usar! 

A função `updateStore` já está configurada para:
- ✅ Salvar histórico automaticamente quando metas são atualizadas
- ✅ Não bloquear a atualização se o histórico falhar (só avisa no console)
- ✅ Funcionar mesmo se a tabela não existir (só não salva histórico)

**A única coisa necessária é executar o script SQL para criar a tabela!**











