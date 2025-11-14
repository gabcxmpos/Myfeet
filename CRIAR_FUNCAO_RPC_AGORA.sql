-- ============================================
-- CRIAR FUNÇÃO RPC create_user_profile
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover a função se existir (para recriar)
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, UUID);

-- PASSO 2: Criar a função RPC create_user_profile
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

-- PASSO 3: GRANT PERMISSÕES PARA A FUNÇÃO RPC
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- PASSO 4: Verificar se a função foi criada
SELECT 
  'Função RPC create_user_profile' AS tipo,
  routine_name AS nome,
  routine_schema AS schema,
  routine_type AS tipo_funcao,
  CASE 
    WHEN routine_name = 'create_user_profile' AND routine_schema = 'public'
    THEN '✅ CRIADA COM SUCESSO'
    ELSE '❌ NÃO CRIADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_user_profile';

-- PASSO 5: Testar a função com um usuário existente (se houver)
-- Isso verifica se a função está funcionando corretamente
DO $$
DECLARE
  test_user_id UUID;
  test_result JSON;
BEGIN
  -- Pegar o primeiro usuário que não tem perfil
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.users.id)
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Testar a função
    SELECT public.create_user_profile(test_user_id) INTO test_result;
    RAISE NOTICE '✅ Teste da função: %', test_result;
  ELSE
    RAISE NOTICE 'ℹ️ Nenhum usuário sem perfil encontrado para testar';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Erro ao testar função: %', SQLERRM;
END $$;


