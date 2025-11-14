-- ============================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- Execute este script passo a passo no SQL Editor do Supabase
-- ============================================

-- PASSO 1: VERIFICAR QUAL TABELA ESTÁ SENDO REFERENCIADA (DIAGNÓSTICO)
SELECT 
  'DIAGNÓSTICO' AS tipo,
  tc.constraint_name AS constraint_nome,
  tc.table_schema AS schema_tabela,
  tc.table_name AS tabela,
  kcu.column_name AS coluna,
  ccu.table_schema AS schema_referenciado,
  ccu.table_name AS tabela_referenciada,
  ccu.column_name AS coluna_referenciada,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name
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

-- PASSO 2: LISTAR TODAS AS FOREIGN KEYS DA TABELA app_users
SELECT 
  'LISTAGEM' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema || '.' || ccu.table_name AS tabela_referenciada
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY';

-- PASSO 3: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
DO $$
DECLARE
  r RECORD;
  constraint_count INTEGER := 0;
BEGIN
  -- Remover todas as foreign keys
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints AS tc
    WHERE tc.table_name = 'app_users'
      AND tc.table_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS %I CASCADE', r.constraint_name);
      constraint_count := constraint_count + 1;
      RAISE NOTICE '✅ Foreign key removida: %', r.constraint_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao remover constraint %: %', r.constraint_name, SQLERRM;
    END;
  END LOOP;
  
  IF constraint_count = 0 THEN
    RAISE NOTICE 'ℹ️ Nenhuma foreign key encontrada para remover';
  ELSE
    RAISE NOTICE '✅ Total de foreign keys removidas: %', constraint_count;
  END IF;
END $$;

-- PASSO 4: VERIFICAR SE EXISTE UMA TABELA "users" NO SCHEMA PUBLIC
-- (Isso pode estar causando confusão)
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS tipo,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' THEN '⚠️ TABELA "users" ENCONTRADA NO PUBLIC - Pode causar conflito'
    WHEN table_name = 'users' AND table_schema = 'auth' THEN '✅ TABELA "users" CORRETA NO AUTH'
    ELSE 'ℹ️ Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 5: CRIAR A FOREIGN KEY CORRETA (REFERENCIANDO auth.users)
DO $$
BEGIN
  -- Verificar se já existe a foreign key correta
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'app_users' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) THEN
    -- Criar a foreign key correta
    BEGIN
      ALTER TABLE public.app_users
      ADD CONSTRAINT app_users_id_fkey 
      FOREIGN KEY (id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
      
      RAISE NOTICE '✅ Foreign key criada com sucesso: app_users_id_fkey -> auth.users(id)';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao criar foreign key: %', SQLERRM;
        RAISE;
    END;
  ELSE
    RAISE NOTICE '✅ Foreign key correta já existe';
  END IF;
END $$;

-- PASSO 6: VERIFICAR SE A FOREIGN KEY FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  ccu.column_name AS coluna_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')'
  END AS status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 7: CRIAR/RECRIAR A FUNÇÃO handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
  v_role TEXT;
  v_store_id UUID;
BEGIN
  -- Extrair dados dos metadados do usuário
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  v_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'user'
  );
  
  v_store_id := NULL;
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL AND NEW.raw_user_meta_data->>'store_id' != '' THEN
    BEGIN
      v_store_id := (NEW.raw_user_meta_data->>'store_id')::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        v_store_id := NULL;
    END;
  END IF;
  
  -- Inserir em app_users quando um usuário é criado no auth
  BEGIN
    INSERT INTO public.app_users (id, status, username, role, store_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'status', 'active'),
      v_username,
      v_role,
      v_store_id
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      status = COALESCE(NEW.raw_user_meta_data->>'status', app_users.status, 'active'),
      username = COALESCE(v_username, app_users.username),
      role = COALESCE(v_role, app_users.role),
      store_id = COALESCE(v_store_id, app_users.store_id);
    
    RAISE NOTICE '✅ Perfil criado para usuário %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '❌ Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      -- Não impedir a criação do usuário mesmo se houver erro no perfil
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 8: CRIAR/RECRIAR O TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASSO 9: VERIFICAR SE O TRIGGER FOI CRIADO
SELECT 
  'TRIGGER' AS tipo,
  trigger_name AS nome,
  event_object_schema AS schema_tabela,
  event_object_table AS tabela,
  event_manipulation AS evento,
  action_timing AS timing,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ CRIADO'
    ELSE '❌ NÃO ENCONTRADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 10: VERIFICAR ESTRUTURA DA TABELA app_users
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

-- ============================================
-- RESUMO FINAL
-- ============================================
-- Se todas as verificações mostrarem ✅, tudo está correto!
-- Se ainda houver problemas, verifique:
-- 1. Se existe uma tabela "users" no schema "public" (pode causar conflito)
-- 2. Se a confirmação de email está desabilitada
-- 3. Se há permissões corretas na tabela app_users
-- ============================================


