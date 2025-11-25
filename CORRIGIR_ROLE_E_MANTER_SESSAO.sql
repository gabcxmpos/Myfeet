-- ============================================
-- CORRIGIR TRIGGER PARA SALVAR ROLE CORRETAMENTE
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar o trigger atual
SELECT 
  'Trigger atual' AS tipo,
  trigger_name AS nome,
  event_object_schema AS schema,
  event_object_table AS tabela,
  action_statement AS acao
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 2: Recriar a função handle_new_user com melhor tratamento do role
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
  -- DEBUG: Log dos metadados recebidos
  RAISE NOTICE 'Criando perfil para usuário: %', NEW.email;
  RAISE NOTICE 'Metadados recebidos: %', NEW.raw_user_meta_data;
  
  -- Extrair username dos metadados
  v_username := COALESCE(
    (NEW.raw_user_meta_data->>'username'),
    (NEW.raw_user_meta_data->>'name'),
    split_part(NEW.email, '@', 1),
    'user_' || substring(NEW.id::text, 1, 8)
  );
  
  -- IMPORTANTE: Extrair role dos metadados
  -- Garantir que o role seja extraído corretamente, mesmo que seja null
  v_role := NULL;
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (NEW.raw_user_meta_data->>'role');
    -- Remover aspas se houver
    v_role := TRIM(BOTH '"' FROM v_role);
    -- Remover espaços em branco
    v_role := TRIM(v_role);
  END IF;
  
  -- Se o role ainda for null ou vazio, usar 'user' como padrão
  IF v_role IS NULL OR v_role = '' OR v_role = 'null' THEN
    v_role := 'user';
  END IF;
  
  -- DEBUG: Log do role extraído
  RAISE NOTICE 'Role extraído: %', v_role;
  
  -- Extrair status dos metadados
  v_status := NULL;
  IF NEW.raw_user_meta_data->>'status' IS NOT NULL THEN
    v_status := (NEW.raw_user_meta_data->>'status');
    v_status := TRIM(BOTH '"' FROM v_status);
    v_status := TRIM(v_status);
  END IF;
  
  -- Se o status ainda for null ou vazio, usar 'active' como padrão
  IF v_status IS NULL OR v_status = '' OR v_status = 'null' THEN
    v_status := 'active';
  END IF;
  
  -- Extrair store_id dos metadados
  v_store_id := NULL;
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL 
     AND NEW.raw_user_meta_data->>'store_id' != '' 
     AND NEW.raw_user_meta_data->>'store_id' != 'null' 
     AND NEW.raw_user_meta_data->>'store_id' != 'NULL' THEN
    BEGIN
      -- Remover aspas se houver
      DECLARE
        store_id_str TEXT;
      BEGIN
        store_id_str := (NEW.raw_user_meta_data->>'store_id');
        store_id_str := TRIM(BOTH '"' FROM store_id_str);
        store_id_str := TRIM(store_id_str);
        v_store_id := store_id_str::UUID;
      EXCEPTION
        WHEN OTHERS THEN
          v_store_id := NULL;
          RAISE WARNING 'Erro ao converter store_id para UUID: %', SQLERRM;
      END;
    END;
  END IF;
  
  -- DEBUG: Log dos valores finais
  RAISE NOTICE 'Valores finais - Username: %, Role: %, Status: %, Store ID: %', v_username, v_role, v_status, v_store_id;
  
  -- Inserir ou atualizar o perfil em app_users
  INSERT INTO public.app_users (id, status, username, role, store_id)
  VALUES (NEW.id, v_status, v_username, v_role, v_store_id)
  ON CONFLICT (id) DO UPDATE
  SET 
    status = EXCLUDED.status,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    store_id = EXCLUDED.store_id;
  
  RAISE NOTICE '✅ Perfil criado/atualizado com sucesso para usuário: % (role: %)', NEW.email, v_role;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erro ao criar perfil para usuário %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Retornar NEW mesmo em caso de erro para não impedir a criação do usuário no auth
    RETURN NEW;
END;
$$;

-- PASSO 3: Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 4: Verificar se o trigger foi criado
SELECT 
  'Trigger criado' AS tipo,
  trigger_name AS nome,
  event_object_schema AS schema,
  event_object_table AS tabela,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' AND event_object_schema = 'auth'
    THEN '✅ CRIADO'
    ELSE '❌ NÃO CRIADO'
  END AS status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- PASSO 5: Testar a função com um usuário existente (se houver)
-- Isso verifica se a função está funcionando corretamente
DO $$
DECLARE
  test_user RECORD;
  test_meta_data JSONB;
BEGIN
  -- Pegar o último usuário criado
  SELECT id, email, raw_user_meta_data INTO test_user
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF test_user.id IS NOT NULL THEN
    RAISE NOTICE '✅ Teste: Usuário encontrado: % (email: %)', test_user.id, test_user.email;
    RAISE NOTICE '✅ Metadados: %', test_user.raw_user_meta_data;
    
    -- Verificar se o perfil existe
    IF EXISTS (SELECT 1 FROM public.app_users WHERE id = test_user.id) THEN
      DECLARE
        profile_role TEXT;
        profile_status TEXT;
      BEGIN
        SELECT role, status INTO profile_role, profile_status
        FROM public.app_users
        WHERE id = test_user.id;
        
        RAISE NOTICE '✅ Perfil existe - Role: %, Status: %', profile_role, profile_status;
      END;
    ELSE
      RAISE WARNING '⚠️ Perfil não existe para o usuário: %', test_user.email;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Nenhum usuário encontrado para testar';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Erro ao testar: %', SQLERRM;
END $$;











