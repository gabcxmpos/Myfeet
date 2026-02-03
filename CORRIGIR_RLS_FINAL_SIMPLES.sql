-- ============================================
-- CORRIGIR RLS - VERSÃO FINAL SIMPLES E DIRETA
-- Busca role diretamente da tabela app_users usando auth.uid()
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas e funções antigas
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin total acesso" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções acesso próprio" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as rotas motorista" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista pode gerenciar suas próprias rotas" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Admin total acesso rotas" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista acesso próprio rotas" ON public.checklist_motorista_routes;

DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_from_table() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_simple() CASCADE;

-- PASSO 2: Criar função MUITO simples que retorna o role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.app_users WHERE id = auth.uid();
$$;

-- PASSO 3: Criar política para ADMIN (checklist_devolucoes_tasks)
CREATE POLICY "Admin acesso total devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (public.user_role() = 'admin')
    WITH CHECK (public.user_role() = 'admin');

-- PASSO 4: Criar política para DEVOLUÇÕES
CREATE POLICY "Devoluções acesso próprio devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        public.user_role() = 'devoluções'
        AND user_id = auth.uid()
    )
    WITH CHECK (
        public.user_role() = 'devoluções'
        AND user_id = auth.uid()
    );

-- PASSO 5: Criar políticas para checklist_motorista_routes
CREATE POLICY "Admin acesso total rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (public.user_role() = 'admin')
    WITH CHECK (public.user_role() = 'admin');

CREATE POLICY "Motorista acesso próprio rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        public.user_role() = 'motorista'
        AND user_id = auth.uid()
    )
    WITH CHECK (
        public.user_role() = 'motorista'
        AND user_id = auth.uid()
    );

-- PASSO 6: Testar a função (descomente quando logado como admin)
-- SELECT public.user_role() as meu_role, auth.uid() as meu_id;

-- PASSO 7: Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('checklist_devolucoes_tasks', 'checklist_motorista_routes')
ORDER BY tablename, policyname;





























