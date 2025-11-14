-- ============================================
-- CORREÇÃO FORÇADA DA FOREIGN KEY PARA auth.users
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS tipo,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ PROBLEMA: Existe tabela users no PUBLIC! Isso pode estar causando o problema.'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ Tabela users existe no AUTH (correto)'
    ELSE 'Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 2: VERIFICAR QUAL FOREIGN KEY EXISTE AGORA
SELECT 
  'FOREIGN KEY ATUAL' AS tipo,
  tc.constraint_name AS nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia,
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

-- PASSO 3: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
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
      RAISE NOTICE '✅ Removida: %', constraint_name_var;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao remover %: %', constraint_name_var, SQLERRM;
    END;
  END LOOP;
  
  -- Tentar remover pelo nome específico também
  BEGIN
    ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_id_fkey CASCADE;
    RAISE NOTICE '✅ Tentativa de remover app_users_id_fkey';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ app_users_id_fkey não existe ou já foi removida';
  END;
END $$;

-- PASSO 4: VERIFICAR SE FORAM REMOVIDAS
SELECT 
  'APÓS REMOÇÃO' AS tipo,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 5: CRIAR A FOREIGN KEY CORRETA USANDO SCHEMA COMPLETO
-- Definir o search_path explicitamente antes de criar
SET search_path = public, auth;

-- Criar a foreign key usando o nome completo do schema
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 6: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS tipo,
  tc.constraint_name AS nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia_completa,
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

-- PASSO 7: VERIFICAR O SEARCH_PATH ATUAL
SHOW search_path;

-- PASSO 8: SE AINDA ESTIVER INCORRETO, TENTAR OUTRA ABORDAGEM
-- Verificar se há algum problema com a definição da tabela
SELECT 
  'ESTRUTURA DA TABELA' AS tipo,
  column_name AS coluna,
  data_type AS tipo_dado,
  is_nullable AS nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND column_name = 'id';

-- PASSO 9: VERIFICAR SE auth.users TEM A COLUNA id
SELECT 
  'ESTRUTURA auth.users' AS tipo,
  column_name AS coluna,
  data_type AS tipo_dado,
  is_nullable AS nullable
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name = 'id';


