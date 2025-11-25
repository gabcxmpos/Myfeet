-- ============================================
-- CORREÇÃO FINAL DA FOREIGN KEY
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: REMOVER TODAS AS FOREIGN KEYS (FORÇADO - TODOS OS NOMES POSSÍVEIS)
DO $$
DECLARE
  r RECORD;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO TODAS AS FOREIGN KEYS...';
  RAISE NOTICE '========================================';
  
  -- Remover todas as foreign keys da tabela app_users
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'app_users'
      AND tc.constraint_type = 'FOREIGN KEY'
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
  
  -- Também tentar remover pelo nome específico caso ainda exista
  BEGIN
    ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_id_fkey CASCADE;
    IF removed_count = 0 THEN removed_count := 1; END IF;
    RAISE NOTICE '✅ Tentativa de remover app_users_id_fkey';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ app_users_id_fkey não existe ou já foi removida';
  END;
  
  RAISE NOTICE '✅ Total de foreign keys removidas/verificadas: %', removed_count;
END $$;

-- PASSO 2: VERIFICAR SE TODAS AS FOREIGN KEYS FORAM REMOVIDAS
SELECT 
  'VERIFICAÇÃO APÓS REMOÇÃO' AS etapa,
  COUNT(*) AS foreign_keys_restantes,
  STRING_AGG(constraint_name, ', ') AS constraints_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '⚠️ Ainda existem ' || COUNT(*) || ' foreign key(s): ' || STRING_AGG(constraint_name, ', ')
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 3: SE AINDA HOUVER FOREIGN KEYS, REMOVER FORÇADAMENTE
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Tentar remover todas as constraints novamente, uma por uma
  FOR constraint_name_var IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'app_users'
      AND tc.constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', constraint_name_var);
      RAISE NOTICE '✅ Removida: %', constraint_name_var;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Não foi possível remover %: %', constraint_name_var, SQLERRM;
    END;
  END LOOP;
END $$;

-- PASSO 4: AGORA CRIAR A FOREIGN KEY CORRETA
-- Primeiro verificar se não há mais nenhuma foreign key
DO $$
BEGIN
  -- Verificar se ainda há foreign keys
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    RAISE EXCEPTION 'Ainda existem foreign keys na tabela app_users. Execute os passos anteriores novamente.';
  END IF;
  
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
      RAISE EXCEPTION 'Erro ao criar foreign key: %', SQLERRM;
  END;
END $$;

-- PASSO 5: VERIFICAR SE A FOREIGN KEY FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  ccu.column_name AS coluna_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 6: SE AINDA ESTIVER INCORRETA, VERIFICAR O QUE ESTÁ ACONTECENDO
DO $$
DECLARE
  fk_count INTEGER;
  fk_details RECORD;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name = 'app_users'
    AND constraint_type = 'FOREIGN KEY';
  
  IF fk_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DETALHES DAS FOREIGN KEYS RESTANTES:';
    RAISE NOTICE '========================================';
    
    FOR fk_details IN (
      SELECT 
        tc.constraint_name,
        ccu.table_schema AS ref_schema,
        ccu.table_name AS ref_table,
        ccu.column_name AS ref_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'app_users'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) LOOP
      RAISE NOTICE 'Foreign Key: % -> %.%(%)', 
        fk_details.constraint_name, 
        fk_details.ref_schema, 
        fk_details.ref_table,
        fk_details.ref_column;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ Nenhuma foreign key encontrada - pronto para criar a correta';
  END IF;
END $$;

-- PASSO 7: VERIFICAR SE EXISTE TABELA "users" NO SCHEMA PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS etapa,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ TABELA "users" ENCONTRADA NO PUBLIC - Isso pode estar causando o problema!'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ TABELA "users" CORRETA NO AUTH'
    ELSE 'ℹ️ Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');











