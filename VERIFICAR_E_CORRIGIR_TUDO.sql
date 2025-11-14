-- ============================================
-- VERIFICAR E CORRIGIR TUDO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se a função RPC create_user_profile existe
SELECT 
  'Função RPC create_user_profile' AS tipo,
  routine_name AS nome,
  routine_schema AS schema,
  routine_type AS tipo_funcao,
  CASE 
    WHEN routine_name = 'create_user_profile' AND routine_schema = 'public'
    THEN '✅ EXISTE'
    ELSE '❌ NÃO EXISTE - Precisamos criá-la!'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_user_profile';

-- PASSO 2: Verificar Foreign Key
SELECT 
  'Foreign Key' AS tipo,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  pg_get_constraintdef(tc.oid) AS definicao_completa,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 3: CRIAR FUNÇÃO RPC create_user_profile (SE NÃO EXISTIR)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'user',
  p_status TEXT DEFAULT 'active',
  p_store_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username TEXT;
  v_user_email TEXT;
BEGIN
  -- Validar que o usuário existe no auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado em auth.users',
      'user_id', p_user_id
    );
  END IF;
  
  -- Usar username fornecido ou gerar um padrão do email
  v_username := COALESCE(
    p_username,
    split_part(v_user_email, '@', 1),
    'user_' || substring(p_user_id::text, 1, 8)
  );
  
  -- Inserir ou atualizar o perfil em app_users
  INSERT INTO public.app_users (id, status, username, role, store_id)
  VALUES (p_user_id, p_status, v_username, p_role, p_store_id)
  ON CONFLICT (id) DO UPDATE
  SET 
    status = COALESCE(EXCLUDED.status, app_users.status),
    username = COALESCE(EXCLUDED.username, app_users.username),
    role = COALESCE(EXCLUDED.role, app_users.role),
    store_id = COALESCE(EXCLUDED.store_id, app_users.store_id);
  
  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'message', 'Perfil criado com sucesso',
    'user_id', p_user_id,
    'username', v_username
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE,
      'user_id', p_user_id
    );
END;
$$;

-- PASSO 4: GRANT PERMISSÕES PARA A FUNÇÃO RPC
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- PASSO 5: Verificar se a função foi criada
SELECT 
  'Função RPC após criação' AS tipo,
  routine_name AS nome,
  routine_schema AS schema,
  CASE 
    WHEN routine_name = 'create_user_profile' AND routine_schema = 'public'
    THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_user_profile';

-- PASSO 6: Verificar usuários recentes sem perfil
SELECT 
  'Usuários sem perfil' AS tipo,
  u.id AS user_id,
  u.email AS email,
  u.created_at AS criado_em,
  u.email_confirmed_at AS email_confirmado,
  u.raw_user_meta_data AS metadados,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.app_users WHERE id = u.id) 
    THEN '✅ Tem perfil'
    ELSE '❌ NÃO tem perfil'
  END AS status_perfil
FROM auth.users u
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC
LIMIT 10;

-- PASSO 7: Criar perfis para usuários que não têm (SE HOUVER)
-- Isso corrige usuários que foram criados mas não têm perfil
DO $$
DECLARE
  user_record RECORD;
  profile_count INTEGER := 0;
BEGIN
  FOR user_record IN (
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = u.id)
      AND u.created_at > NOW() - INTERVAL '1 hour'
  ) LOOP
    BEGIN
      -- Tentar criar o perfil usando a função RPC
      PERFORM public.create_user_profile(
        user_record.id,
        COALESCE(
          user_record.raw_user_meta_data->>'username',
          split_part(user_record.email, '@', 1)
        ),
        COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
        COALESCE(user_record.raw_user_meta_data->>'status', 'active'),
        CASE 
          WHEN user_record.raw_user_meta_data->>'store_id' IS NOT NULL 
          THEN (user_record.raw_user_meta_data->>'store_id')::UUID
          ELSE NULL
        END
      );
      
      profile_count := profile_count + 1;
      RAISE NOTICE '✅ Perfil criado para usuário: %', user_record.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao criar perfil para usuário %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  IF profile_count > 0 THEN
    RAISE NOTICE '✅ Total de perfis criados: %', profile_count;
  ELSE
    RAISE NOTICE 'ℹ️ Nenhum usuário sem perfil encontrado';
  END IF;
END $$;

-- PASSO 8: RESUMO FINAL
SELECT 
  'RESUMO FINAL' AS tipo,
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
    ) THEN '✅ Função handle_new_user: CRIADA'
    ELSE '❌ Função handle_new_user: NÃO CRIADA'
  END AS funcao_trigger_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'create_user_profile'
    ) THEN '✅ Função create_user_profile: CRIADA'
    ELSE '❌ Função create_user_profile: NÃO CRIADA'
  END AS funcao_rpc_status;


