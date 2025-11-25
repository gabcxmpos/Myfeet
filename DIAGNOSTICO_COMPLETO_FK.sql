-- ============================================
-- DIAGNÓSTICO COMPLETO DA FOREIGN KEY
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR TODAS AS TABELAS "users" NO BANCO
SELECT 
  'TODAS AS TABELAS users' AS tipo,
  n.nspname AS schema,
  c.relname AS tabela,
  c.oid AS oid,
  c.relkind AS tipo_relacao,
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
  AND c.relkind = 'r'
ORDER BY n.nspname, c.relname;

-- PASSO 2: VERIFICAR FOREIGN KEY ATUAL (MÉTODO DIRETO NO pg_constraint)
SELECT 
  'FOREIGN KEY ATUAL (pg_constraint)' AS tipo,
  tc.conname AS constraint_name,
  pg_get_constraintdef(tc.oid) AS constraint_definition_completa,
  tc.confrelid AS oid_tabela_referenciada,
  tc.confrelid::regclass::text AS nome_tabela_referenciada,
  c.relnamespace::regnamespace::text AS schema_real,
  c.relname AS tabela_real,
  c.oid AS oid_real,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO - Referencia auth.users'
    WHEN c.relnamespace::regnamespace::text = 'public' AND c.relname = 'users'
    THEN '❌ INCORRETO - Referencia public.users (ERRO!)'
    ELSE '❌ INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname
  END AS status
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 3: OBTER OID DA TABELA auth.users
SELECT 
  'OID auth.users' AS tipo,
  oid AS oid_auth_users,
  relname AS nome,
  relnamespace::regnamespace::text AS schema
FROM pg_class
WHERE relnamespace = 'auth'::regnamespace
  AND relname = 'users'
  AND relkind = 'r';

-- PASSO 4: OBTER OID DA TABELA public.users (SE EXISTIR)
SELECT 
  'OID public.users (SE EXISTIR)' AS tipo,
  oid AS oid_public_users,
  relname AS nome,
  relnamespace::regnamespace::text AS schema,
  CASE 
    WHEN oid IS NOT NULL THEN '⚠️ PROBLEMA: Esta tabela existe e está interferindo!'
    ELSE '✅ Tabela não existe'
  END AS status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname = 'users'
  AND relkind = 'r';

-- PASSO 5: COMPARAR OIDs
-- Se a foreign key estiver incorreta, comparar o OID que está sendo usado
-- com o OID correto de auth.users
SELECT 
  'COMPARAÇÃO DE OIDs' AS tipo,
  (SELECT oid FROM pg_class WHERE relnamespace = 'auth'::regnamespace AND relname = 'users' AND relkind = 'r') AS oid_auth_users_correto,
  (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = 'users' AND relkind = 'r') AS oid_public_users_se_existir,
  tc.confrelid AS oid_usado_pela_fk,
  CASE 
    WHEN tc.confrelid = (SELECT oid FROM pg_class WHERE relnamespace = 'auth'::regnamespace AND relname = 'users' AND relkind = 'r')
    THEN '✅ CORRETO - FK usa o OID de auth.users'
    WHEN tc.confrelid = (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = 'users' AND relkind = 'r')
    THEN '❌ INCORRETO - FK usa o OID de public.users (ERRO!)'
    ELSE '❌ INCORRETO - FK usa um OID desconhecido'
  END AS status
FROM pg_constraint tc
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 6: VERIFICAR SEARCH_PATH ATUAL
SHOW search_path;

-- PASSO 7: VERIFICAR SE EXISTE VIEW OU ALIAS INTERFERINDO
SELECT 
  'VIEWS OU ALIAS' AS tipo,
  n.nspname AS schema,
  c.relname AS nome,
  c.relkind AS tipo,
  CASE 
    WHEN c.relname = 'users' AND n.nspname = 'public' 
    THEN '⚠️ PROBLEMA: Existe view/alias users no PUBLIC!'
    ELSE 'OK'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'users'
  AND c.relkind IN ('v', 'm') -- views e materialized views
ORDER BY n.nspname, c.relname;

-- PASSO 8: VERIFICAR SE HÁ SINÔNIMOS (synonyms) - PostgreSQL não tem, mas verificar mesmo assim
-- PostgreSQL não tem sinônimos nativos, mas verificar se há extensões que possam criar

-- PASSO 9: SE EXISTIR TABELA public.users, SUGERIR SOLUÇÃO
DO $$
DECLARE
  public_users_exists BOOLEAN;
  auth_users_oid OID;
BEGIN
  -- Verificar se existe tabela public.users
  SELECT EXISTS (
    SELECT 1 FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname = 'users'
      AND relkind = 'r'
  ) INTO public_users_exists;
  
  -- Obter OID de auth.users
  SELECT oid INTO auth_users_oid
  FROM pg_class
  WHERE relnamespace = 'auth'::regnamespace
    AND relname = 'users'
    AND relkind = 'r';
  
  IF public_users_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '⚠️ PROBLEMA ENCONTRADO:';
    RAISE NOTICE 'Existe uma tabela public.users no banco!';
    RAISE NOTICE 'Isso está fazendo o PostgreSQL resolver "users" para public.users em vez de auth.users.';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUÇÃO:';
    RAISE NOTICE '1. Renomeie ou remova a tabela public.users (se não for necessária)';
    RAISE NOTICE '2. OU renomeie a tabela para outro nome (ex: public_users)';
    RAISE NOTICE '3. Depois, execute o script de correção novamente';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '✅ Não existe tabela public.users - O problema pode ser outro';
  END IF;
  
  IF auth_users_oid IS NULL THEN
    RAISE WARNING '❌ ERRO: Tabela auth.users não encontrada!';
  ELSE
    RAISE NOTICE '✅ OID de auth.users: %', auth_users_oid;
  END IF;
END $$;











