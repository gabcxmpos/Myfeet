-- ============================================
-- SCRIPT SIMPLES - EXECUTE ESTE NO SUPABASE
-- ============================================
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Copie TODO este conteúdo
-- 4. Cole no SQL Editor
-- 5. Clique em RUN (ou Ctrl+Enter)
-- ============================================

-- PASSO 1: Ver qual tabela a foreign key está usando
SELECT 
  'Qual tabela está sendo referenciada?' AS pergunta,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname
  END AS resultado
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';

-- PASSO 2: Verificar se existe tabela "users" no schema "public"
SELECT 
  'Existe tabela users no PUBLIC?' AS pergunta,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
        AND relname = 'users'
        AND relkind = 'r'
    ) THEN '⚠️ SIM - Isso está causando o problema!'
    ELSE '✅ NÃO - Não existe'
  END AS resultado;

-- PASSO 3: Remover a foreign key incorreta
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
    EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT %I CASCADE', constraint_name_var);
    RAISE NOTICE 'Removida: %', constraint_name_var;
  END LOOP;
END $$;

-- PASSO 4: Criar a foreign key correta
ALTER TABLE public.app_users
ADD CONSTRAINT app_users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- PASSO 5: Verificar se ficou correto
SELECT 
  'A foreign key ficou correta?' AS pergunta,
  c.relnamespace::regnamespace::text AS schema,
  c.relname AS tabela,
  CASE 
    WHEN c.relnamespace::regnamespace::text = 'auth' AND c.relname = 'users'
    THEN '✅ SIM - CORRETO!'
    ELSE '❌ NÃO - Ainda está incorreta. Referencia ' || c.relnamespace::regnamespace::text || '.' || c.relname
  END AS resultado
FROM pg_constraint tc
JOIN pg_class c ON c.oid = tc.confrelid
WHERE tc.conrelid = 'public.app_users'::regclass
  AND tc.contype = 'f';


