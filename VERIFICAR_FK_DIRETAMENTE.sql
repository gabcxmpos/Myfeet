-- ============================================
-- VERIFICAR FOREIGN KEY DIRETAMENTE NO POSTGRESQL
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR FOREIGN KEY DIRETAMENTE NO pg_constraint
-- Isso mostra a referência REAL da foreign key, não o que o information_schema diz
SELECT 
  'VERIFICAÇÃO DIRETA' AS tipo,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  CASE 
    WHEN pg_get_constraintdef(oid) LIKE '%auth.users%'
    THEN '✅ CORRETO - Referencia auth.users'
    WHEN pg_get_constraintdef(oid) LIKE '%public.users%'
    THEN '❌ INCORRETO - Referencia public.users'
    ELSE '⚠️ Verifique manualmente'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'f';

-- PASSO 2: VERIFICAR QUAL TABELA ESTÁ SENDO REFERENCIADA (MÉTODO DIRETO)
SELECT 
  'REFERÊNCIA DA FK' AS tipo,
  tc.conname AS constraint_name,
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

-- PASSO 3: SE AINDA ESTIVER INCORRETA, REMOVER TODAS AS FOREIGN KEYS
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  FOR constraint_name_var IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.app_users'::regclass
      AND contype = 'f'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', constraint_name_var);
      RAISE NOTICE '✅ Removida: %', constraint_name_var;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao remover %: %', constraint_name_var, SQLERRM;
    END;
  END LOOP;
END $$;

-- PASSO 4: VERIFICAR SE FORAM REMOVIDAS
SELECT 
  'APÓS REMOÇÃO' AS tipo,
  COUNT(*) AS foreign_keys_restantes,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Todas as foreign keys foram removidas'
    ELSE '❌ Ainda existem ' || COUNT(*) || ' foreign key(s)'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'f';

-- PASSO 5: CRIAR A FOREIGN KEY CORRETA
-- Usar o OID diretamente do auth.users para garantir que está correto
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 6: VERIFICAR SE FOI CRIADA CORRETAMENTE (MÉTODO DIRETO)
SELECT 
  'VERIFICAÇÃO FINAL' AS tipo,
  tc.conname AS constraint_name,
  pg_get_constraintdef(tc.oid) AS constraint_definition,
  c.relnamespace::regnamespace::text AS schema_ref,
  c.relname AS tabela_ref,
  a.attname AS coluna_ref,
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

-- PASSO 7: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC
SELECT 
  'VERIFICAÇÃO DE TABELAS' AS tipo,
  n.nspname AS schema,
  c.relname AS tabela,
  CASE 
    WHEN c.relname = 'users' AND n.nspname = 'public' 
    THEN '⚠️ PROBLEMA: Existe tabela users no PUBLIC!'
    WHEN c.relname = 'users' AND n.nspname = 'auth' 
    THEN '✅ Tabela users existe no AUTH (correto)'
    ELSE 'Outra tabela'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'users'
  AND (n.nspname = 'public' OR n.nspname = 'auth')
  AND c.relkind = 'r';

-- PASSO 8: VERIFICAR O OID DA TABELA auth.users
SELECT 
  'OID DA TABELA' AS tipo,
  'auth.users' AS tabela,
  oid::text AS oid,
  relname AS nome
FROM pg_class
WHERE relnamespace = 'auth'::regnamespace
  AND relname = 'users'
  AND relkind = 'r';











