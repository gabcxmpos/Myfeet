-- ============================================
-- VERIFICAR E CORRIGIR JWT ROLE
-- Este script verifica se o role está no JWT e ajusta as políticas
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se o role está disponível no JWT (descomente quando logado)
-- SELECT 
--     auth.jwt() ->> 'role' as role_no_jwt,
--     auth.jwt() ->> 'sub' as user_id,
--     auth.uid() as auth_uid;

-- PASSO 2: Verificar o role do usuário logado na tabela app_users
-- SELECT 
--     id,
--     username,
--     role,
--     status
-- FROM public.app_users
-- WHERE id = auth.uid();

-- PASSO 3: Criar função que busca role da tabela app_users
CREATE OR REPLACE FUNCTION public.get_user_role_from_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Obter ID do usuário do JWT
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar role da tabela app_users
  SELECT role INTO v_role
  FROM public.app_users
  WHERE id = v_user_id;
  
  RETURN COALESCE(v_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- PASSO 4: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;

-- PASSO 5: Criar política que verifica JWT E tabela (mais robusta)
CREATE POLICY "Admin pode gerenciar todas as tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        -- Verificar JWT primeiro, depois tabela
        COALESCE((auth.jwt() ->> 'role')::text, public.get_user_role_from_table()) = 'admin'
    )
    WITH CHECK (
        COALESCE((auth.jwt() ->> 'role')::text, public.get_user_role_from_table()) = 'admin'
    );

-- PASSO 6: Criar política para devoluções
CREATE POLICY "Devoluções pode gerenciar suas próprias tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        COALESCE((auth.jwt() ->> 'role')::text, public.get_user_role_from_table()) = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    )
    WITH CHECK (
        COALESCE((auth.jwt() ->> 'role')::text, public.get_user_role_from_table()) = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    );

-- PASSO 7: Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'checklist_devolucoes_tasks'
ORDER BY policyname;





























