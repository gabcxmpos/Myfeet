-- ============================================
-- CORREÇÃO FORÇADA DA FOREIGN KEY
-- Execute este script COMPLETO no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER TODAS AS FOREIGN KEYS DA TABELA app_users (FORÇADO)
DO $$
DECLARE
  r RECORD;
  constraint_count INTEGER := 0;
BEGIN
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
  
  RAISE NOTICE '✅ Total de foreign keys removidas: %', constraint_count;
END $$;

-- 2. CRIAR A FOREIGN KEY CORRETA (REFERENCIANDO auth.users)
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. CRIAR/RECRIAR A FUNÇÃO handle_new_user
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR/RECRIAR O TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
  'VERIFICAÇÃO' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO - ' || ccu.table_schema || '.' || ccu.table_name
  END AS status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 6. VERIFICAR SE O TRIGGER FOI CRIADO
SELECT 
  'TRIGGER' AS tipo,
  trigger_name AS nome,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ CRIADO'
    ELSE '❌ NÃO ENCONTRADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';


