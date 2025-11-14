-- ============================================
-- CORREÇÃO COMPLETA E SIMPLES
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- PASSO 1: REMOVER TODAS AS FOREIGN KEYS DA TABELA app_users
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

-- PASSO 2: CRIAR A FOREIGN KEY CORRETA
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 3: CRIAR/RECRIAR A FUNÇÃO handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
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
    split_part(NEW.email, '@', 1)
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
    END;
  END IF;
  
  -- Inserir em app_users
  INSERT INTO public.app_users (id, status, username, role, store_id)
  VALUES (NEW.id, v_status, v_username, v_role, v_store_id)
  ON CONFLICT (id) DO UPDATE
  SET 
    status = COALESCE(v_status, app_users.status),
    username = COALESCE(v_username, app_users.username),
    role = COALESCE(v_role, app_users.role),
    store_id = COALESCE(v_store_id, app_users.store_id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- PASSO 4: REMOVER O TRIGGER SE EXISTIR E CRIAR NOVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 5: VERIFICAR SE TUDO FOI CRIADO
SELECT 
  'Foreign Key' AS tipo,
  tc.constraint_name AS nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

SELECT 
  'Trigger' AS tipo,
  trigger_name AS nome,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' 
    THEN '✅ CRIADO'
    ELSE '❌ NÃO ENCONTRADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 6: VERIFICAR A FUNÇÃO
SELECT 
  'Função' AS tipo,
  routine_name AS nome,
  routine_type AS tipo_funcao,
  CASE 
    WHEN routine_name = 'handle_new_user' 
    THEN '✅ CRIADA'
    ELSE '❌ NÃO ENCONTRADA'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';


