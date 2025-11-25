-- ============================================
-- CORREÇÃO DEFINITIVA DA FOREIGN KEY
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: DIAGNOSTICAR O PROBLEMA
SELECT 
  'DIAGNÓSTICO' AS tipo,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema AS schema_ref,
  ccu.table_name AS tabela_ref,
  ccu.column_name AS coluna_ref,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 2: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS tipo,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ PROBLEMA ENCONTRADO: Existe tabela "users" no schema PUBLIC!'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ TABELA "users" CORRETA NO AUTH'
    ELSE 'ℹ️ Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 3: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
DO $$
DECLARE
  constraint_name_var TEXT;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO TODAS AS FOREIGN KEYS...';
  RAISE NOTICE '========================================';
  
  -- Remover todas as foreign keys
  FOR constraint_name_var IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'app_users'
      AND tc.constraint_type = 'FOREIGN KEY'
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
  
  -- Tentar remover pelo nome específico também
  BEGIN
    ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_id_fkey CASCADE;
    IF removed_count = 0 THEN
      removed_count := 1;
      RAISE NOTICE '✅ Removida: app_users_id_fkey';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ app_users_id_fkey não existe ou já foi removida';
  END;
  
  RAISE NOTICE '✅ Total removidas: %', removed_count;
END $$;

-- PASSO 4: VERIFICAR SE TODAS FORAM REMOVIDAS
SELECT 
  'VERIFICAÇÃO APÓS REMOÇÃO' AS tipo,
  COUNT(*) AS quantidade_restante,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 5: SE AINDA HOUVER FOREIGN KEYS, REMOVER NOVAMENTE
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
    EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', r.constraint_name);
    RAISE NOTICE '✅ Removida novamente: %', r.constraint_name;
  END LOOP;
END $$;

-- PASSO 6: VERIFICAR SE auth.users EXISTE E TEM A COLUNA id
SELECT 
  'VERIFICAÇÃO auth.users' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN '✅ Tabela auth.users existe'
    ELSE '❌ Tabela auth.users NÃO existe!'
  END AS status;

SELECT 
  'VERIFICAÇÃO COLUNA id' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id'
    ) THEN '✅ Coluna id existe em auth.users'
    ELSE '❌ Coluna id NÃO existe em auth.users!'
  END AS status;

-- PASSO 7: CRIAR A FOREIGN KEY CORRETA (SEM SE, SEM MAS)
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 8: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS tipo,
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

-- PASSO 9: SE AINDA ESTIVER INCORRETO, MOSTRAR DETALHES
SELECT 
  'DETALHES DA FOREIGN KEY' AS tipo,
  tc.constraint_name,
  'Referencia: ' || ccu.table_schema || '.' || ccu.table_name || '(' || ccu.column_name || ')' AS referencia_completa,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users'
    THEN '✅ Esta foreign key está CORRETA'
    ELSE '❌ Esta foreign key está INCORRETA e precisa ser removida'
  END AS acao_necessaria
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';











