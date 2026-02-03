# 🔧 Correção: Problema na Aprovação de Avaliações

## ❌ Problema Identificado

A aprovação de avaliações por admin e supervisor está retornando erro **400 (Bad Request)** ao tentar atualizar a avaliação.

**Erro no console:**
```
PATCH https://hzwmacltgiyanukgvfvn.supabase.co/rest/v1/evaluations?id=eq.8eba8991-40ad-4da0-b52d-d8f726a0f419&select=* 400 (Bad Request)
```

## 🔍 Possíveis Causas

1. **Coluna `approved_by` não existe** na tabela `evaluations`
2. **RLS (Row Level Security)** bloqueando a atualização
3. **Formato de dados incorreto** sendo enviado

## ✅ Correções Implementadas

### 1. Código Frontend - Melhorias no Tratamento

**Arquivo:** `src/lib/supabaseService.js`
- ✅ Adicionada validação do ID da avaliação
- ✅ Removidos campos `undefined` que podem causar erro
- ✅ Logs detalhados para debug
- ✅ Melhor tratamento de erros

**Arquivo:** `src/contexts/DataContext.jsx`
- ✅ Validação do usuário antes de aprovar
- ✅ Mensagens de erro mais claras
- ✅ Refresh automático após aprovação
- ✅ Logs detalhados para debug

### 2. Script SQL para Verificação e Correção

**Arquivo:** `VERIFICAR_E_CORRIGIR_APPROVED_BY.sql`

O script verifica e corrige:
- ✅ Existência da coluna `approved_by`
- ✅ Estrutura da tabela `evaluations`
- ✅ Políticas RLS para admin e supervisor
- ✅ Constraints e foreign keys
- ✅ Índices para performance

## 🚀 Próximos Passos

### 1. Execute o Script SQL no Supabase

1. Acesse o **Supabase SQL Editor**
2. Execute o arquivo `VERIFICAR_E_CORRIGIR_APPROVED_BY.sql`
3. Verifique os resultados das consultas
4. Se a coluna `approved_by` não existir, o script irá criá-la

### 2. Verifique as Políticas RLS

O script cria/atualiza uma política RLS que permite que admin e supervisor atualizem avaliações:

```sql
CREATE POLICY "Admin e supervisor podem atualizar avaliações"
ON public.evaluations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
);
```

### 3. Teste a Aprovação

1. Faça login como admin ou supervisor
2. Vá para "Gerenciamento de Lojas"
3. Clique em "Avaliações Pendentes" em uma loja
4. Tente aprovar uma avaliação
5. Verifique o console do navegador para logs detalhados

## 📋 Verificações Adicionais

Se o problema persistir após executar o script SQL, verifique:

### 1. Estrutura da Tabela `evaluations`

Execute no Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'evaluations'
ORDER BY ordinal_position;
```

A tabela deve ter:
- `id` (UUID, PRIMARY KEY)
- `store_id` (UUID, FK para stores)
- `form_id` (UUID, FK para forms)
- `status` (VARCHAR, deve aceitar 'pending' e 'approved')
- `approved_by` (UUID, FK para auth.users, NULLABLE)
- Outros campos conforme necessário

### 2. Permissões RLS

Execute no Supabase SQL Editor:
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'evaluations';
```

Deve haver uma política que permita UPDATE para admin e supervisor.

### 3. Teste Manual de Atualização

Execute no Supabase SQL Editor (substitua os valores):
```sql
-- Verificar se você é admin/supervisor
SELECT role FROM public.app_users WHERE id = auth.uid();

-- Testar atualização manual
UPDATE public.evaluations
SET status = 'approved', approved_by = auth.uid()
WHERE id = 'ID_DA_AVALIACAO'
AND EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor')
)
RETURNING *;
```

## 🔍 Debug

Com as melhorias no código, agora você verá logs detalhados no console:

1. **Ao tentar aprovar:**
   - `🔐 [approveEvaluation] Obtendo usuário atual...`
   - `✅ [approveEvaluation] Usuário obtido: { userId, email }`
   - `🔄 [approveEvaluation] Aprovando avaliação: { id, updateData }`

2. **Na função de atualização:**
   - `🔄 [updateEvaluation] Atualizando avaliação: { id, updatesToSend }`
   - `✅ [updateEvaluation] Avaliação atualizada:` (em caso de sucesso)
   - `❌ [updateEvaluation] Erro ao atualizar:` (em caso de erro)

## 📝 Notas Importantes

- O campo `approved_by` deve ser NULLABLE (pode ser NULL)
- A política RLS deve permitir UPDATE para roles 'admin' e 'supervisor'
- O ID do usuário deve vir de `auth.uid()` ou do token JWT
- A atualização deve incluir tanto `status: 'approved'` quanto `approved_by: userId`

## ⚠️ Se o Problema Persistir

1. Verifique os logs detalhados no console do navegador
2. Execute o script SQL e verifique cada resultado
3. Teste a atualização manualmente no Supabase SQL Editor
4. Verifique se há outras políticas RLS conflitantes
5. Verifique se o usuário realmente tem role 'admin' ou 'supervisor' na tabela `app_users`





























