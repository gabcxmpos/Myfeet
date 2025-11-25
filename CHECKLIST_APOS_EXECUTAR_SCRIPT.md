# Checklist Após Executar o Script

## ✅ Passo 1: Execute o Script `CRIAR_FUNCAO_RPC_AGORA.sql`

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Abra o arquivo `CRIAR_FUNCAO_RPC_AGORA.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** (ou pressione Ctrl+Enter)

## ✅ Passo 2: Verifique os Resultados

Após executar, você deve ver:

### PASSO 4: Verificação da Função
- Deve mostrar: **✅ CRIADA COM SUCESSO**
- Se mostrar **❌ NÃO CRIADA**, execute o script novamente

### PASSO 5: Teste da Função
- Se houver usuários sem perfil, deve mostrar: **✅ Teste da função: {"success": true, ...}**
- Se não houver usuários sem perfil, deve mostrar: **ℹ️ Nenhum usuário sem perfil encontrado para testar**

## ✅ Passo 3: Verifique se a Confirmação de Email Está Desabilitada

1. Vá em **Authentication** > **Settings**
2. Verifique se **"Enable email confirmations"** está **DESABILITADA**
3. Se estiver habilitada, desabilite e clique em **Save**

## ✅ Passo 4: Teste Criar um Novo Usuário

1. Volte para a aplicação
2. Tente criar um novo usuário
3. Verifique se:
   - O usuário é criado com sucesso
   - O perfil é criado automaticamente (via trigger ou função RPC)
   - Não há erros no console

## ✅ Passo 5: Se Ainda Houver Erros

Se ainda houver erros:

1. Verifique o console do navegador para ver qual erro aparece
2. Execute o script `VERIFICAR_E_CORRIGIR_TUDO.sql` para diagnosticar
3. Verifique se:
   - A foreign key está correta (deve referenciar `auth.users(id)`)
   - O trigger está criado
   - A função RPC foi criada
   - A confirmação de email está desabilitada

## 🔍 Verificação Final

Execute esta query no SQL Editor para verificar tudo:

```sql
-- Verificar tudo de uma vez
SELECT 
  'Foreign Key' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint tc
      JOIN pg_class c ON c.oid = tc.confrelid
      WHERE tc.conrelid = 'public.app_users'::regclass
        AND tc.contype = 'f'
        AND c.relnamespace::regnamespace::text = 'auth'
        AND c.relname = 'users'
    ) THEN '✅ CORRETA'
    ELSE '❌ INCORRETA'
  END AS status
UNION ALL
SELECT 
  'Trigger' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
    ) THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status
UNION ALL
SELECT 
  'Função RPC' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'create_user_profile'
    ) THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status;
```

Todos devem mostrar **✅**.

## 📝 Notas

- Após executar o script, aguarde alguns segundos para o cache do PostgREST atualizar
- Se a função RPC não aparecer imediatamente, aguarde 10-30 segundos e tente criar o usuário novamente
- O código JavaScript tenta usar a função RPC primeiro, e se não funcionar, tenta criar diretamente
- Se a função RPC funcionar, o perfil será criado automaticamente, mesmo se o trigger não executar

## 🎯 Próximos Passos

1. Execute o script `CRIAR_FUNCAO_RPC_AGORA.sql`
2. Verifique se a função foi criada (PASSO 4)
3. Teste criar um novo usuário
4. Se funcionar, você está pronto! ✅
5. Se não funcionar, execute o script `VERIFICAR_E_CORRIGIR_TUDO.sql` para diagnosticar











