-- ============================================
-- DIAGNOSTICAR O PROBLEMA REAL
-- Execute este script primeiro para entender o problema
-- ============================================

-- PASSO 1: Verificar TODAS as tabelas "users" no banco
SELECT 
  'TODAS AS TABELAS users' AS tipo,
  n.nspname AS schema,
  c.relname AS tabela,
  c.oid AS oid,
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

-- PASSO 2: Verificar qual tabela a foreign key está realmente referenciando
SELECT 
  'Foreign Key ATUAL' AS tipo,
  tc.conname AS constraint_name,
  pg_get_constraintdef(tc.oid) AS definicao_completa,
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

-- PASSO 3: Comparar OIDs
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

-- PASSO 4: Verificar se existe um usuário de teste no auth.users
SELECT 
  'Usuários em auth.users' AS tipo,
  COUNT(*) AS total_usuarios,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem usuários em auth.users'
    ELSE '⚠️ Não existem usuários em auth.users'
  END AS status
FROM auth.users;

-- PASSO 5: Verificar o último usuário criado
SELECT 
  'Último usuário criado' AS tipo,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;


