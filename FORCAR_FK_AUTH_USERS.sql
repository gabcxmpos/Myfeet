-- ============================================
-- FORÇAR FOREIGN KEY PARA auth.users (USANDO OID)
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS etapa,
  n.nspname AS schema,
  c.relname AS tabela,
  c.oid AS oid,
  CASE 
    WHEN c.relname = 'users' AND n.nspname = 'public' 
    THEN '⚠️ PROBLEMA CRÍTICO: Existe tabela users no PUBLIC! Isso está causando o problema.'
    WHEN c.relname = 'users' AND n.nspname = 'auth' 
    THEN '✅ Tabela users existe no AUTH (correto)'
    ELSE 'Outra tabela'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'users'
  AND (n.nspname = 'public' OR n.nspname = 'auth')
  AND c.relkind = 'r';

-- PASSO 2: OBTER O OID DA TABELA auth.users
DO $$
DECLARE
  auth_users_oid OID;
BEGIN
  SELECT oid INTO auth_users_oid
  FROM pg_class
  WHERE relnamespace = 'auth'::regnamespace
    AND relname = 'users'
    AND relkind = 'r';
  
  IF auth_users_oid IS NULL THEN
    RAISE EXCEPTION '❌ ERRO: Tabela auth.users não encontrada!';
  ELSE
    RAISE NOTICE '✅ OID da tabela auth.users: %', auth_users_oid;
  END IF;
END $$;

-- PASSO 3: VERIFICAR FOREIGN KEY ATUAL (MÉTODO DIRETO)
SELECT 
  'FOREIGN KEY ATUAL' AS etapa,
  tc.conname AS constraint_name,
  pg_get_constraintdef(tc.oid) AS constraint_definition,
  c.relnamespace::regnamespace::text AS schema_ref,
  c.relname AS tabela_ref,
  a.attname AS coluna_ref,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users' AND a.attname = 'id'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname || '(' || a.attname || ')'
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(tc.confkey)
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 4: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
DO $$
DECLARE
  constraint_name_var TEXT;
  removed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO TODAS AS FOREIGN KEYS...';
  RAISE NOTICE '========================================';
  
  FOR constraint_name_var IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.app_users'::regclass
      AND contype = 'f'
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
  
  RAISE NOTICE '✅ Total removidas: %', removed_count;
END $$;

-- PASSO 5: VERIFICAR SE FORAM REMOVIDAS
SELECT 
  'APÓS REMOÇÃO' AS etapa,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'f';

-- PASSO 6: DEFINIR SEARCH_PATH PARA FORÇAR A RESOLUÇÃO CORRETA
-- Primeiro, verificar o search_path atual
SHOW search_path;

-- Definir search_path temporariamente para garantir que 'auth' seja encontrado primeiro
SET search_path = auth, public;

-- PASSO 7: CRIAR A FOREIGN KEY USANDO O NOME COMPLETO DO SCHEMA
-- Mesmo com search_path definido, usar o nome completo para garantir
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Restaurar search_path padrão
RESET search_path;

-- PASSO 8: VERIFICAR SE FOI CRIADA CORRETAMENTE (MÉTODO DIRETO)
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  tc.conname AS constraint_name,
  pg_get_constraintdef(tc.oid) AS constraint_definition,
  c.relnamespace::regnamespace::text AS schema_ref,
  c.relname AS tabela_ref,
  a.attname AS coluna_ref,
  tc.confrelid::regclass::text AS tabela_referenciada_completa,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users' AND a.attname = 'id'
    THEN '✅ CORRETO - Referencia auth.users(id)'
    ELSE '❌ AINDA INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname || '(' || a.attname || ')'
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(tc.confkey)
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 9: SE AINDA ESTIVER INCORRETO, VERIFICAR O QUE ESTÁ ACONTECENDO
-- Verificar o OID da tabela que está sendo referenciada
SELECT 
  'OID DA TABELA REFERENCIADA' AS etapa,
  tc.conname AS constraint_name,
  tc.confrelid AS oid_tabela_referenciada,
  tc.confrelid::regclass::text AS nome_tabela_referenciada,
  c.relnamespace::regnamespace::text AS schema_real,
  c.relname AS tabela_real
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 10: COMPARAR COM O OID DE auth.users
SELECT 
  'COMPARAÇÃO DE OIDs' AS etapa,
  'auth.users' AS tabela_esperada,
  oid AS oid_esperado,
  relname AS nome
FROM pg_class
WHERE relnamespace = 'auth'::regnamespace
  AND relname = 'users'
  AND relkind = 'r';

-- PASSO 11: SE EXISTIR TABELA public.users, MOSTRAR SEU OID
SELECT 
  'OID public.users (SE EXISTIR)' AS etapa,
  oid AS oid_public_users,
  relname AS nome,
  CASE 
    WHEN oid IS NOT NULL THEN '⚠️ PROBLEMA: Esta tabela pode estar interferindo!'
    ELSE '✅ Tabela public.users não existe'
  END AS status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname = 'users'
  AND relkind = 'r';


