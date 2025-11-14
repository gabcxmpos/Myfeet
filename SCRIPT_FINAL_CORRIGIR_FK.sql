-- ============================================
-- SCRIPT FINAL - CORRIGIR FOREIGN KEY
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR A SITUAÇÃO ATUAL
SELECT 
  'DIAGNÓSTICO INICIAL' AS etapa,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia_atual,
  ccu.column_name AS coluna,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 2: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC (ISSO CAUSARIA O PROBLEMA)
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS etapa,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ PROBLEMA: Existe tabela users no PUBLIC! Isso está causando o problema.'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ Tabela users existe no AUTH (correto)'
    ELSE 'Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 3: REMOVER TODAS AS FOREIGN KEYS
DO $$
DECLARE
  constraint_name_var TEXT;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO TODAS AS FOREIGN KEYS...';
  RAISE NOTICE '========================================';
  
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
    END IF;
    RAISE NOTICE '✅ Tentativa de remover app_users_id_fkey';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ app_users_id_fkey não existe ou já foi removida';
  END;
  
  RAISE NOTICE '✅ Total removidas: %', removed_count;
END $$;

-- PASSO 4: VERIFICAR SE FORAM REMOVIDAS
SELECT 
  'APÓS REMOÇÃO' AS etapa,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s) - Execute o script novamente'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 5: VERIFICAR SE auth.users EXISTE
SELECT 
  'VERIFICAÇÃO auth.users' AS etapa,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN '✅ Tabela auth.users existe'
    ELSE '❌ ERRO: Tabela auth.users NÃO existe!'
  END AS status;

-- PASSO 6: CRIAR A FOREIGN KEY CORRETA
-- IMPORTANTE: Usar o nome completo do schema (auth.users)
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 7: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  tc.constraint_name AS constraint_nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia,
  ccu.column_name AS coluna,
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

-- PASSO 8: VERIFICAÇÃO DIRETA NO pg_constraint (FONTE REAL DO POSTGRESQL)
SELECT 
  'VERIFICAÇÃO DIRETA (pg_constraint)' AS etapa,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  CASE 
    WHEN pg_get_constraintdef(oid) LIKE '%auth.users%'
    THEN '✅ CORRETO - Referencia auth.users'
    WHEN pg_get_constraintdef(oid) LIKE '%public.users%'
    THEN '❌ INCORRETO - Referencia public.users'
    ELSE '⚠️ Verifique manualmente a definição acima'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'f';

-- ============================================
-- RESUMO FINAL
-- ============================================
SELECT 
  'RESUMO' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'app_users' AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'auth' AND ccu.table_name = 'users' AND ccu.column_name = 'id'
    ) THEN '✅ Foreign Key: CORRETA'
    ELSE '❌ Foreign Key: AINDA INCORRETA'
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
    ) THEN '✅ Função: CRIADA'
    ELSE '❌ Função: NÃO CRIADA'
  END AS funcao_status;

