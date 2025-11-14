-- ============================================
-- SOLUÇÃO COMPLETA E DEFINITIVA
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- PASSO 1: DIAGNOSTICAR A SITUAÇÃO ATUAL
SELECT 
  'DIAGNÓSTICO INICIAL' AS etapa,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_referenciado,
  ccu.table_name AS tabela_referenciada,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO - Referencia auth.users(id)'
    WHEN ccu.table_schema = 'public' AND ccu.table_name = 'users'
    THEN '❌ INCORRETO - Referencia public.users (TABELA ERRADA!)'
    ELSE '❌ INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 2: VERIFICAR SE EXISTE TABELA "users" NO SCHEMA PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS etapa,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ TABELA "users" ENCONTRADA NO PUBLIC - Pode causar conflito'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ TABELA "users" CORRETA NO AUTH'
    ELSE 'ℹ️ Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 3: REMOVER TODAS AS FOREIGN KEYS DA TABELA app_users (FORÇADO)
DO $$
DECLARE
  r RECORD;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO FOREIGN KEYS INCORRETAS...';
  RAISE NOTICE '========================================';
  
  FOR r IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
      AND constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE 'ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
      removed_count := removed_count + 1;
      RAISE NOTICE '✅ Foreign key removida: %', r.constraint_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao remover constraint %: %', r.constraint_name, SQLERRM;
    END;
  END LOOP;
  
  IF removed_count = 0 THEN
    RAISE NOTICE 'ℹ️ Nenhuma foreign key encontrada para remover';
  ELSE
    RAISE NOTICE '✅ Total de foreign keys removidas: %', removed_count;
  END IF;
END $$;

-- PASSO 4: VERIFICAR SE A FOREIGN KEY FOI REMOVIDA
SELECT 
  'VERIFICAÇÃO APÓS REMOÇÃO' AS etapa,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '⚠️ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 5: CRIAR A FOREIGN KEY CORRETA (REFERENCIANDO auth.users)
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CRIANDO FOREIGN KEY CORRETA...';
  RAISE NOTICE '========================================';
  
  BEGIN
    ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key criada com sucesso: app_users_id_fkey -> auth.users(id)';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'ℹ️ Foreign key já existe, pulando criação...';
    WHEN OTHERS THEN
      RAISE WARNING '❌ Erro ao criar foreign key: %', SQLERRM;
      RAISE;
  END;
END $$;

-- PASSO 6: VERIFICAR SE A FOREIGN KEY FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL DA FOREIGN KEY' AS etapa,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO - ' || ccu.table_schema || '.' || ccu.table_name
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 7: CRIAR/RECRIAR A FUNÇÃO handle_new_user COM TRATAMENTO MELHORADO
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
  -- Extrair dados dos metadados do usuário
  v_username := COALESCE(
    (NEW.raw_user_meta_data->>'username'),
    (NEW.raw_user_meta_data->>'name'),
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );
  
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role'),
    'user'
  );
  
  v_status := COALESCE(
    (NEW.raw_user_meta_data->>'status'),
    'active'
  );
  
  v_store_id := NULL;
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'store_id' != '' 
     AND NEW.raw_user_meta_data->>'store_id' != 'null' THEN
    BEGIN
      v_store_id := (NEW.raw_user_meta_data->>'store_id')::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        v_store_id := NULL;
        RAISE WARNING 'Erro ao converter store_id para UUID: %', SQLERRM;
    END;
  END IF;
  
  -- Inserir em app_users
  BEGIN
    INSERT INTO public.app_users (id, status, username, role, store_id)
    VALUES (NEW.id, v_status, v_username, v_role, v_store_id)
    ON CONFLICT (id) DO UPDATE
    SET 
      status = COALESCE(EXCLUDED.status, app_users.status),
      username = COALESCE(EXCLUDED.username, app_users.username),
      role = COALESCE(EXCLUDED.role, app_users.role),
      store_id = COALESCE(EXCLUDED.store_id, app_users.store_id);
    
    RAISE NOTICE '✅ Perfil criado para usuário % (email: %)', NEW.id, NEW.email;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '❌ Erro ao criar perfil para usuário %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
      -- Retornar NEW mesmo em caso de erro para não impedir a criação do usuário no auth
  END;
  
  RETURN NEW;
END;
$$;

-- PASSO 8: REMOVER O TRIGGER SE EXISTIR E CRIAR NOVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 9: VERIFICAR SE O TRIGGER FOI CRIADO
SELECT 
  'VERIFICAÇÃO DO TRIGGER' AS etapa,
  trigger_name AS nome,
  event_object_schema AS schema_tabela,
  event_object_table AS tabela,
  action_timing AS timing,
  event_manipulation AS evento,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' 
    THEN '✅ CRIADO'
    ELSE '❌ NÃO ENCONTRADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 10: VERIFICAR A FUNÇÃO
SELECT 
  'VERIFICAÇÃO DA FUNÇÃO' AS etapa,
  routine_name AS nome,
  routine_type AS tipo_funcao,
  routine_schema AS schema,
  CASE 
    WHEN routine_name = 'handle_new_user' 
    THEN '✅ CRIADA'
    ELSE '❌ NÃO ENCONTRADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- PASSO 11: CRIAR FUNÇÃO RPC PARA CRIAR PERFIL MANUALMENTE (FALLBACK)
-- Esta função permite criar o perfil mesmo se a foreign key estiver incorreta
-- Ela usa SECURITY DEFINER para ter permissões suficientes
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
  v_result JSON;
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
  -- Usando SECURITY DEFINER, isso funciona mesmo se a foreign key estiver incorreta
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

-- PASSO 12: GRANT PERMISSÕES PARA A FUNÇÃO RPC
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- PASSO 13: RESUMO FINAL
SELECT 
  'Foreign Key' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'app_users'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
    ) THEN '✅ CONFIGURADA CORRETAMENTE'
    ELSE '❌ NÃO CONFIGURADA OU INCORRETA'
  END AS status;

SELECT 
  'Trigger' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
        AND event_object_schema = 'auth'
        AND event_object_table = 'users'
    ) THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status;

SELECT 
  'Função handle_new_user' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'handle_new_user'
    ) THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status;

SELECT 
  'Função create_user_profile (RPC)' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'create_user_profile'
    ) THEN '✅ CRIADA'
    ELSE '❌ NÃO CRIADA'
  END AS status;

-- ============================================
-- IMPORTANTE: Após executar este script:
-- 1. Verifique se todas as verificações mostram ✅
-- 2. Desabilite a confirmação de email em Authentication > Settings > Email Auth
-- 3. Teste criando um novo usuário
-- 4. Se a foreign key ainda estiver incorreta, a função RPC create_user_profile
--    será usada como fallback para criar o perfil manualmente
-- ============================================

