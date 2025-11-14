-- ============================================
-- VERIFICAR SE O TRIGGER ESTÁ FUNCIONANDO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se o trigger existe
SELECT 
  'Trigger' AS tipo,
  trigger_name AS nome,
  event_object_schema AS schema,
  event_object_table AS tabela,
  action_timing AS quando,
  event_manipulation AS evento,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth' AND event_object_table = 'users'
    THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 2: Verificar se a função handle_new_user existe
SELECT 
  'Função' AS tipo,
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

-- PASSO 3: Verificar os últimos usuários criados no auth.users
SELECT 
  'Últimos usuários criados' AS tipo,
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' AS role_meta_data,
  raw_user_meta_data->>'username' AS username_meta_data,
  raw_user_meta_data->>'status' AS status_meta_data,
  raw_user_meta_data->>'store_id' AS store_id_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- PASSO 4: Verificar se esses usuários têm perfil em app_users
SELECT 
  'Perfis correspondentes' AS tipo,
  au.id,
  au.username,
  au.role,
  au.status,
  au.store_id,
  au.created_at,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ PERFIL EXISTE'
    ELSE '❌ PERFIL NÃO EXISTE'
  END AS status
FROM auth.users u
LEFT JOIN public.app_users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 5;

-- PASSO 5: Verificar se há usuários sem perfil
SELECT 
  'Usuários sem perfil' AS tipo,
  COUNT(*) AS total,
  STRING_AGG(u.email, ', ') AS emails
FROM auth.users u
LEFT JOIN public.app_users au ON u.id = au.id
WHERE au.id IS NULL;

-- PASSO 6: Verificar os logs do trigger (se disponíveis)
-- Nota: Os logs do trigger aparecem na aba "Logs" do Supabase Dashboard
SELECT 
  'Instrução' AS tipo,
  'Verifique os logs do trigger na aba "Logs" do Supabase Dashboard' AS mensagem,
  'Procure por mensagens "Criando perfil para usuário" ou erros relacionados' AS detalhes;

-- PASSO 7: Testar o trigger manualmente (criar um usuário de teste)
-- CUIDADO: Isso criará um usuário real no auth.users
-- Descomente apenas se quiser testar
/*
DO $$
DECLARE
  test_user_id UUID;
  test_meta_data JSONB;
BEGIN
  -- Criar um usuário de teste (isso disparará o trigger)
  -- Nota: Você precisará usar a API do Supabase ou criar manualmente no Dashboard
  -- Este exemplo apenas mostra como verificar se o trigger funcionaria
  
  RAISE NOTICE 'Para testar o trigger, crie um usuário através da interface da aplicação';
  RAISE NOTICE 'Depois, verifique se o perfil foi criado automaticamente em app_users';
END $$;
*/


