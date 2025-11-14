-- ============================================
-- CORRIGIR TUDO DE UMA VEZ
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar Foreign Key ATUAL
SELECT 
  'Foreign Key ATUAL' AS tipo,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  pg_get_constraintdef(tc.oid) AS definicao_completa,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 2: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
DO $$
DECLARE
  constraint_name_var TEXT;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO TODAS AS FOREIGN KEYS...';
  RAISE NOTICE '========================================';
  
  FOR constraint_name_var IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.app_users'::regclass
      AND contype = 'f'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', constraint_name_var);
      removed_count := removed_count + 1;
      RAISE NOTICE '✅ Removida: %', constraint_name_var;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao remover %: %', constraint_name_var, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Total removidas: %', removed_count;
END $$;

-- PASSO 3: Verificar se foram removidas
SELECT 
  'Após remoção' AS tipo,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'f';

-- PASSO 4: CRIAR FOREIGN KEY CORRETA
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 5: Verificar se foi criada corretamente
SELECT 
  'Foreign Key CRIADA' AS tipo,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  pg_get_constraintdef(tc.oid) AS definicao_completa,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 6: CRIAR FUNÇÃO RPC create_user_profile (SE NÃO EXISTIR)
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

-- PASSO 7: GRANT PERMISSÕES PARA A FUNÇÃO RPC
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- PASSO 8: Verificar se a função foi criada
SELECT 
  'Função RPC' AS tipo,
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

-- PASSO 9: Verificar/Criar Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username TEXT;
  v_role TEXT;
  v_store_id UUID;
  v_status TEXT;
BEGIN
  v_username := COALESCE(
    (NEW.raw_user_meta_data->>'username'),
    (NEW.raw_user_meta_data->>'name'),
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );
  
  v_role := COALESCE((NEW.raw_user_meta_data->>'role'), 'user');
  v_status := COALESCE((NEW.raw_user_meta_data->>'status'), 'active');
  v_store_id := NULL;
  
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'store_id' != '' 
     AND NEW.raw_user_meta_data->>'store_id' != 'null' THEN
    BEGIN
      v_store_id := (NEW.raw_user_meta_data->>'store_id')::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        v_store_id := NULL;
    END;
  END IF;
  
  INSERT INTO public.app_users (id, status, username, role, store_id)
  VALUES (NEW.id, v_status, v_username, v_role, v_store_id)
  ON CONFLICT (id) DO UPDATE
  SET 
    status = COALESCE(EXCLUDED.status, app_users.status),
    username = COALESCE(EXCLUDED.username, app_users.username),
    role = COALESCE(EXCLUDED.role, app_users.role),
    store_id = COALESCE(EXCLUDED.store_id, app_users.store_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- PASSO 10: Verificar/Criar Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 11: RESUMO FINAL
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


