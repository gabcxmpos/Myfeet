-- ============================================
-- DIAGNOSTICAR POR QUE O TRIGGER NÃO ESTÁ FUNCIONANDO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se o trigger está realmente criado
SELECT 
  'Trigger Status' AS tipo,
  trigger_name AS nome,
  event_object_schema AS schema,
  event_object_table AS tabela,
  action_timing AS timing,
  event_manipulation AS evento,
  action_statement AS acao,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
    THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 2: Verificar se a função handle_new_user está correta
SELECT 
  'Função handle_new_user' AS tipo,
  routine_name AS nome,
  routine_schema AS schema,
  routine_type AS tipo_funcao,
  security_type AS tipo_seguranca,
  CASE 
    WHEN routine_name = 'handle_new_user' AND routine_schema = 'public'
    THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- PASSO 3: Verificar se o último usuário criado tem perfil
SELECT 
  'Último usuário criado' AS tipo,
  u.id AS user_id,
  u.email AS email,
  u.created_at AS criado_em,
  u.email_confirmed_at AS email_confirmado_em,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email NÃO confirmado (usuário pode não estar ativo)'
    ELSE '✅ Email confirmado'
  END AS status_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.app_users WHERE id = u.id) 
    THEN '✅ Perfil existe em app_users'
    ELSE '❌ Perfil NÃO existe em app_users'
  END AS status_perfil
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- PASSO 4: Verificar se o trigger tem permissões corretas
SELECT 
  'Permissões do Trigger' AS tipo,
  p.proname AS nome_funcao,
  p.prosecdef AS security_definer,
  p.proconfig AS configuracoes,
  CASE 
    WHEN p.prosecdef THEN '✅ Security Definer (tem permissões)'
    ELSE '❌ Não é Security Definer (pode não ter permissões)'
  END AS status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'handle_new_user'
  AND n.nspname = 'public';

-- PASSO 5: Verificar logs do trigger (se houver)
-- Nota: PostgreSQL não mantém logs automáticos, mas podemos verificar se há erros

-- PASSO 6: Testar se o trigger funciona manualmente
-- Vamos verificar se podemos criar um perfil manualmente para um usuário existente
SELECT 
  'Teste Manual' AS tipo,
  'Para testar: SELECT public.handle_new_user() com um usuário existente' AS instrucao;

-- PASSO 7: Verificar se há algum problema com o raw_user_meta_data
SELECT 
  'Último usuário - Metadados' AS tipo,
  id AS user_id,
  email,
  raw_user_meta_data AS metadados,
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '⚠️ Metadados vazios'
    ELSE '✅ Metadados presentes'
  END AS status_metadados
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;

-- PASSO 8: Verificar se o problema é de timing
-- Verificar quantos usuários foram criados nos últimos minutos
SELECT 
  'Usuários recentes' AS tipo,
  COUNT(*) AS total,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) AS com_email_confirmado,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) AS sem_email_confirmado
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';

-- PASSO 9: Verificar se os usuários recentes têm perfil
SELECT 
  'Usuários sem perfil' AS tipo,
  u.id AS user_id,
  u.email AS email,
  u.created_at AS criado_em,
  u.email_confirmed_at AS email_confirmado,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.app_users WHERE id = u.id) 
    THEN '✅ Tem perfil'
    ELSE '❌ NÃO tem perfil'
  END AS status_perfil
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = u.id)
ORDER BY u.created_at DESC;











