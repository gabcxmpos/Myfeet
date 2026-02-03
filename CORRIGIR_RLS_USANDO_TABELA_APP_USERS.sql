-- ============================================
-- CORRIGIR RLS USANDO TABELA app_users
-- Esta versão busca o role da tabela app_users se não estiver no JWT
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas e funções antigas
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_from_table() CASCADE;

-- PASSO 2: Criar função que busca role da tabela app_users
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
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar role da tabela app_users
  SELECT role INTO v_role
  FROM public.app_users
  WHERE id = v_user_id;
  
  RETURN COALESCE(v_role, NULL);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- PASSO 3: Criar política para ADMIN
-- Verifica JWT primeiro, se não tiver, busca da tabela
CREATE POLICY "Admin pode gerenciar todas as tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'admin'
    )
    WITH CHECK (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'admin'
    );

-- PASSO 4: Criar política para DEVOLUÇÕES
CREATE POLICY "Devoluções pode gerenciar suas próprias tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    )
    WITH CHECK (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    );

-- PASSO 5: Fazer o mesmo para checklist_motorista_routes
DROP POLICY IF EXISTS "Admin pode gerenciar todas as rotas motorista" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista pode gerenciar suas próprias rotas" ON public.checklist_motorista_routes;

CREATE POLICY "Admin pode gerenciar todas as rotas motorista"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'admin'
    )
    WITH CHECK (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'admin'
    );

CREATE POLICY "Motorista pode gerenciar suas próprias rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'motorista'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    )
    WITH CHECK (
        COALESCE(
            (auth.jwt() ->> 'role')::text,
            public.get_user_role_from_table()
        ) = 'motorista'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    );

-- PASSO 6: Verificar políticas criadas
SELECT 
    'checklist_devolucoes_tasks' as tabela,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'checklist_devolucoes_tasks'
UNION ALL
SELECT 
    'checklist_motorista_routes' as tabela,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'checklist_motorista_routes'
ORDER BY tabela, policyname;





























