-- ============================================
-- SCRIPT DE VERIFICAÇÃO - Verificar se tudo foi criado corretamente
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a foreign key está correta
SELECT 
  'FOREIGN KEY' AS tipo,
  tc.constraint_name AS nome_constraint, 
  tc.table_name AS tabela,
  kcu.column_name AS coluna,
  ccu.table_schema AS schema_referenciado,
  ccu.table_name AS tabela_referenciada,
  ccu.column_name AS coluna_referenciada,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Deve referenciar auth.users(id)'
  END AS status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'app_users' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 2. Verificar se a função handle_new_user existe
SELECT 
  'FUNÇÃO' AS tipo,
  routine_name AS nome,
  routine_type AS tipo_routine,
  CASE 
    WHEN routine_name = 'handle_new_user' THEN '✅ EXISTE'
    ELSE '❌ NÃO ENCONTRADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 3. Verificar se o trigger foi criado
SELECT 
  'TRIGGER' AS tipo,
  trigger_name AS nome,
  event_object_table AS tabela,
  event_manipulation AS evento,
  action_timing AS timing,
  action_statement AS acao,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ CRIADO'
    ELSE '❌ NÃO ENCONTRADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 4. Verificar estrutura da tabela app_users
SELECT 
  'ESTRUTURA' AS tipo,
  column_name AS coluna,
  data_type AS tipo_dado,
  is_nullable AS permite_null,
  column_default AS valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
ORDER BY ordinal_position;

-- 5. Verificar se há usuários sem perfil em app_users
SELECT 
  'VERIFICAÇÃO' AS tipo,
  COUNT(*) AS total_usuarios_auth,
  COUNT(au.id) AS usuarios_com_perfil,
  COUNT(*) - COUNT(au.id) AS usuarios_sem_perfil,
  CASE 
    WHEN COUNT(*) - COUNT(au.id) = 0 THEN '✅ Todos os usuários têm perfil'
    ELSE '⚠️ Existem ' || (COUNT(*) - COUNT(au.id))::text || ' usuários sem perfil'
  END AS status
FROM auth.users u
LEFT JOIN public.app_users au ON u.id = au.id;

-- 6. Verificar configuração de confirmação de email (se possível)
-- Nota: Isso requer acesso à tabela de configurações do Supabase
-- Você precisa verificar manualmente em Authentication > Settings > Email Auth

-- 7. Testar a função (opcional - descomente para testar)
-- SELECT public.handle_new_user();

-- ============================================
-- RESUMO DA VERIFICAÇÃO
-- ============================================
-- Se todas as verificações acima mostrarem ✅, tudo está correto!
-- Se houver ❌, execute o script supabase_fix.sql novamente
-- ============================================


