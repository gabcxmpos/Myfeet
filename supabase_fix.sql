-- ============================================
-- SCRIPT PARA CORRIGIR FOREIGN KEY E CRIAR TRIGGER
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar a foreign key atual
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
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

-- 2. Se a foreign key referenciar uma tabela "users" incorreta, 
--    remova a foreign key antiga e crie uma nova que referencia auth.users
--    (Descomente as linhas abaixo se necessário)

-- DROP CONSTRAINT se existir
-- ALTER TABLE app_users 
-- DROP CONSTRAINT IF EXISTS app_users_id_fkey;

-- Criar nova foreign key que referencia auth.users
-- ALTER TABLE app_users
-- ADD CONSTRAINT app_users_id_fkey 
-- FOREIGN KEY (id) 
-- REFERENCES auth.users(id) 
-- ON DELETE CASCADE;

-- 3. Criar função para criar perfil automaticamente quando usuário é criado no auth
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
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL THEN
    v_store_id := (NEW.raw_user_meta_data->>'store_id')::UUID;
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
    -- Se houver erro, logar mas não impedir a criação do usuário
    RAISE WARNING 'Erro ao criar perfil em app_users para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger que executa a função quando um usuário é criado no auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir que a foreign key referencia auth.users corretamente
--    Se a foreign key atual referencia uma tabela "users" incorreta, remova e recrie

-- Verificar se existe uma foreign key incorreta
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  -- Verificar se há uma foreign key que referencia uma tabela "users" diferente de auth.users
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.table_name = 'app_users' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
    AND ccu.table_schema != 'auth';
  
  -- Se encontrou uma foreign key incorreta, remover
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS %I', fk_name);
    RAISE NOTICE 'Foreign key incorreta removida: %', fk_name;
  END IF;
END $$;

-- Criar ou verificar se a foreign key correta existe
DO $$
BEGIN
  -- Verificar se a foreign key correta já existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.table_name = 'app_users' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'users'
      AND ccu.table_schema = 'auth'
      AND kcu.column_name = 'id'
  ) THEN
    -- Criar a foreign key correta
    ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key criada: app_users_id_fkey referencia auth.users(id)';
  ELSE
    RAISE NOTICE 'Foreign key correta já existe';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar foreign key: %', SQLERRM;
END $$;

-- 6. Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

