-- ============================================
-- VERIFICAR SE TUDO ESTÁ FUNCIONANDO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar Foreign Key
SELECT 
  'Foreign Key' AS item,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 2: Verificar Trigger
SELECT 
  'Trigger' AS item,
  trigger_name AS nome,
  event_object_schema AS schema,
  event_object_table AS tabela,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
    THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 3: Verificar Função
SELECT 
  'Função' AS item,
  routine_name AS nome,
  routine_schema AS schema,
  CASE 
    WHEN routine_name = 'handle_new_user' AND routine_schema = 'public'
    THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- PASSO 4: RESUMO FINAL
SELECT 
  'RESUMO' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint tc
      JOIN pg_class c ON c.oid = tc.confrelid
      WHERE tc.conrelid = 'public.app_users'::regclass
        AND tc.contype = 'f'
        AND c.relnamespace::regnamespace::text = 'auth'
        AND c.relname = 'users'
    ) THEN '✅ Foreign Key: CORRETA'
    ELSE '❌ Foreign Key: INCORRETA'
  END AS foreign_key_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
    ) THEN '✅ Trigger: CRIADO'
    ELSE '❌ Trigger: NÃO CRIADO'
  END AS trigger_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
    ) THEN '✅ Função: CRIADA'
    ELSE '❌ Função: NÃO CRIADA'
  END AS funcao_status;











