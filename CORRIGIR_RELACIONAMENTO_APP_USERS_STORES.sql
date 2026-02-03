-- ============================================
-- CORRIGIR RELACIONAMENTO APP_USERS E STORES
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a foreign key store_id existe
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'app_users'
  AND kcu.column_name = 'store_id';

-- 2. Limpar dados inválidos ANTES de criar a foreign key
-- Encontrar e corrigir store_id que não existem na tabela stores
UPDATE public.app_users
SET store_id = NULL
WHERE store_id IS NOT NULL
  AND store_id NOT IN (SELECT id FROM public.stores);

-- Mostrar quantos registros foram corrigidos
SELECT 
  COUNT(*) as registros_corrigidos
FROM public.app_users
WHERE store_id IS NULL;

-- 3. Se não existir, criar a foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
      AND table_name = 'app_users'
      AND constraint_name = 'app_users_store_id_fkey'
  ) THEN
    ALTER TABLE public.app_users
    ADD CONSTRAINT app_users_store_id_fkey 
    FOREIGN KEY (store_id) 
    REFERENCES public.stores(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key app_users_store_id_fkey criada';
  ELSE
    RAISE NOTICE 'Foreign key app_users_store_id_fkey já existe';
  END IF;
END $$;

-- 4. Verificar se há políticas RLS que podem estar bloqueando
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_users';

-- 5. Criar política RLS para permitir leitura de app_users com relacionamento stores
-- (Se não existir uma política adequada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'app_users'
      AND policyname = 'app_users_select_with_stores'
  ) THEN
    CREATE POLICY app_users_select_with_stores ON public.app_users
    FOR SELECT
    USING (true);
    
    RAISE NOTICE 'Política RLS app_users_select_with_stores criada';
  ELSE
    RAISE NOTICE 'Política RLS app_users_select_with_stores já existe';
  END IF;
END $$;

-- 6. Verificar estrutura da tabela app_users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
ORDER BY ordinal_position;

-- 7. Verificar se o relacionamento está funcionando
-- Teste: buscar usuários com lojas
SELECT 
  au.id,
  au.username,
  au.role,
  au.store_id,
  s.name as store_name,
  s.code as store_code
FROM public.app_users au
LEFT JOIN public.stores s ON au.store_id = s.id
LIMIT 5;

