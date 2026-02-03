-- ============================================
-- VERIFICAR E CORRIGIR PERMISSÕES PARA LAST_LOGIN
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se a coluna existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND column_name = 'last_login';

-- PASSO 2: Verificar políticas RLS existentes para UPDATE
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
  AND tablename = 'app_users'
  AND cmd = 'UPDATE';

-- PASSO 3: Criar política RLS para permitir que usuários atualizem seu próprio last_login
-- (Se já existir, será substituída)
DROP POLICY IF EXISTS "Users can update their own last_login" ON public.app_users;

CREATE POLICY "Users can update their own last_login"
ON public.app_users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- PASSO 4: Verificar se a política foi criada
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'app_users'
  AND policyname = 'Users can update their own last_login';

-- PASSO 5: Testar atualização manual (substitua o UUID pelo ID de um usuário de teste)
-- UPDATE public.app_users
-- SET last_login = NOW()
-- WHERE id = 'SEU_USER_ID_AQUI'
-- RETURNING id, username, last_login;

-- ============================================
-- NOTA: Se ainda não funcionar, pode ser necessário
-- permitir que usuários autenticados atualizem last_login
-- mesmo que não seja o próprio registro (para uso interno)
-- ============================================

-- POLÍTICA ALTERNATIVA (mais permissiva - use apenas se necessário):
-- DROP POLICY IF EXISTS "Authenticated users can update last_login" ON public.app_users;
-- 
-- CREATE POLICY "Authenticated users can update last_login"
-- ON public.app_users
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);







