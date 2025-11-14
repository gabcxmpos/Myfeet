-- ============================================
-- SOLUÇÃO URGENTE - EXECUTE ESTE SCRIPT PRIMEIRO
-- Este script remove a foreign key incorreta e cria a correta
-- ============================================

-- PASSO 1: DIAGNOSTICAR QUAL TABELA ESTÁ SENDO REFERENCIADA
SELECT 
  'DIAGNÓSTICO' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 2: REMOVER A FOREIGN KEY INCORRETA (FORÇADO)
ALTER TABLE public.app_users 
DROP CONSTRAINT IF EXISTS app_users_id_fkey CASCADE;

-- Se houver outras foreign keys, remover também
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
      AND constraint_type = 'FOREIGN KEY'
  ) LOOP
    EXECUTE 'ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    RAISE NOTICE 'Foreign key removida: %', r.constraint_name;
  END LOOP;
END $$;

-- PASSO 3: CRIAR A FOREIGN KEY CORRETA
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 4: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 5: CRIAR/RECRIAR FUNÇÃO handle_new_user
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

-- PASSO 6: CRIAR/RECRIAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 7: VERIFICAR TUDO
SELECT 'Foreign Key' AS item, 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'app_users' AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
  ) THEN '✅ CORRETO' ELSE '❌ INCORRETO' END AS status;

SELECT 'Trigger' AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
  ) THEN '✅ CRIADO' ELSE '❌ NÃO CRIADO' END AS status;

SELECT 'Função' AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'handle_new_user'
  ) THEN '✅ CRIADA' ELSE '❌ NÃO CRIADA' END AS status;


