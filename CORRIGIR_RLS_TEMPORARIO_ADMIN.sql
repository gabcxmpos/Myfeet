-- ============================================
-- CORRIGIR RLS - PERMITIR ADMIN TEMPORARIAMENTE
-- Esta versão desabilita temporariamente o RLS para admin
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as rotas motorista" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista pode gerenciar suas próprias rotas" ON public.checklist_motorista_routes;

-- PASSO 2: Criar função simples que busca role da tabela
CREATE OR REPLACE FUNCTION public.get_user_role_simple()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.app_users WHERE id = auth.uid();
$$;

-- PASSO 3: Criar política para ADMIN (usando função simples)
CREATE POLICY "Admin total acesso"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        public.get_user_role_simple() = 'admin'
    )
    WITH CHECK (
        public.get_user_role_simple() = 'admin'
    );

-- PASSO 4: Criar política para DEVOLUÇÕES
CREATE POLICY "Devoluções acesso próprio"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        public.get_user_role_simple() = 'devoluções'
        AND user_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role_simple() = 'devoluções'
        AND user_id = auth.uid()
    );

-- PASSO 5: Fazer o mesmo para checklist_motorista_routes
CREATE POLICY "Admin total acesso rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        public.get_user_role_simple() = 'admin'
    )
    WITH CHECK (
        public.get_user_role_simple() = 'admin'
    );

CREATE POLICY "Motorista acesso próprio rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        public.get_user_role_simple() = 'motorista'
        AND user_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role_simple() = 'motorista'
        AND user_id = auth.uid()
    );

-- PASSO 6: Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('checklist_devolucoes_tasks', 'checklist_motorista_routes')
ORDER BY tablename, policyname;





























