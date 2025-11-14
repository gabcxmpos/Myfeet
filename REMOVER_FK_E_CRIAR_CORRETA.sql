-- ============================================
-- REMOVER FOREIGN KEY INCORRETA E CRIAR A CORRETA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR QUAL TABELA ESTÁ SENDO REFERENCIADA
SELECT 
  'ANTES DA REMOÇÃO' AS etapa,
  tc.constraint_name AS nome_constraint,
  ccu.table_schema || '.' || ccu.table_name AS referencia_atual
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 2: REMOVER TODAS AS FOREIGN KEYS (MÚLTIPLAS TENTATIVAS)
-- Primeira tentativa
ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_id_fkey CASCADE;

-- Segunda tentativa: remover todas as foreign keys encontradas
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN (
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'app_users'
      AND constraint_type = 'FOREIGN KEY'
  ) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', constraint_record.constraint_name);
      RAISE NOTICE 'Removida: %', constraint_record.constraint_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Erro ao remover %: %', constraint_record.constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- PASSO 3: VERIFICAR SE FORAM REMOVIDAS
SELECT 
  'APÓS REMOÇÃO' AS etapa,
  COUNT(*) AS foreign_keys_restantes
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND constraint_type = 'FOREIGN KEY';

-- PASSO 4: VERIFICAR SE EXISTE TABELA "users" NO PUBLIC
SELECT 
  'VERIFICAÇÃO' AS etapa,
  table_schema AS schema,
  table_name AS tabela,
  CASE 
    WHEN table_name = 'users' AND table_schema = 'public' 
    THEN '⚠️ PROBLEMA: Existe tabela users no PUBLIC!'
    WHEN table_name = 'users' AND table_schema = 'auth' 
    THEN '✅ Tabela users existe no AUTH'
    ELSE 'Outra tabela'
  END AS status
FROM information_schema.tables
WHERE table_name = 'users'
  AND (table_schema = 'public' OR table_schema = 'auth');

-- PASSO 5: CRIAR A FOREIGN KEY CORRETA (EXPLÍCITA)
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 6: VERIFICAR SE FOI CRIADA CORRETAMENTE
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
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


