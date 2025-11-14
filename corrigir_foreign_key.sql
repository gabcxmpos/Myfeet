-- ============================================
-- CORREÇÃO RÁPIDA DA FOREIGN KEY
-- Execute este script NO SUPABASE SQL EDITOR
-- ============================================

-- PASSO 1: REMOVER TODAS AS FOREIGN KEYS (FORÇADO)
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
    EXECUTE 'ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    RAISE NOTICE 'Foreign key removida: %', r.constraint_name;
  END LOOP;
END $$;

-- PASSO 2: VERIFICAR SE FOI REMOVIDA
SELECT 
  'Foreign Keys Restantes' AS status,
  COUNT(*) AS quantidade
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 3: CRIAR FOREIGN KEY CORRETA
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 4: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'Foreign Key' AS item,
  tc.constraint_name AS nome,
  ccu.table_schema || '.' || ccu.table_name AS referencia,
  CASE 
    WHEN ccu.table_schema = 'auth' AND ccu.table_name = 'users' 
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

