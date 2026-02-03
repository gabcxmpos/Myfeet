-- ============================================
-- ADICIONAR USER_ID AOS CHECKLISTS DE DEVOLUÇÕES E MOTORISTA
-- Permite definir checklists individuais por usuário
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar user_id à tabela checklist_devolucoes_tasks
ALTER TABLE public.checklist_devolucoes_tasks 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id à tabela checklist_motorista_routes
ALTER TABLE public.checklist_motorista_routes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_devolucoes_tasks_user ON public.checklist_devolucoes_tasks(user_id, is_active, task_order);
CREATE INDEX IF NOT EXISTS idx_checklist_motorista_routes_user ON public.checklist_motorista_routes(user_id, is_active, route_order);

-- Atualizar RLS para permitir que admin veja todas, mas usuários vejam apenas as suas
-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin pode gerenciar tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar rotas motorista" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista pode ler rotas" ON public.checklist_motorista_routes;

-- Nova política para checklist_devolucoes_tasks: Admin pode tudo, usuários podem ver apenas as suas
CREATE POLICY "Admin pode gerenciar todas as tarefas de devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR
        (auth.jwt() ->> 'role' = 'devoluções' AND user_id::text = auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR
        (auth.jwt() ->> 'role' = 'devoluções' AND user_id::text = auth.jwt() ->> 'sub')
    );

CREATE POLICY "Perfil devoluções pode ler suas tarefas"
    ON public.checklist_devolucoes_tasks
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'devoluções') AND
        (auth.jwt() ->> 'role' = 'admin' OR user_id::text = auth.jwt() ->> 'sub')
    );

-- Nova política para checklist_motorista_routes: Admin pode tudo, usuários podem ver apenas as suas
CREATE POLICY "Admin pode gerenciar todas as rotas motorista"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR
        (auth.jwt() ->> 'role' = 'motorista' AND user_id::text = auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR
        (auth.jwt() ->> 'role' = 'motorista' AND user_id::text = auth.jwt() ->> 'sub')
    );

CREATE POLICY "Motorista pode ler suas rotas"
    ON public.checklist_motorista_routes
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'motorista') AND
        (auth.jwt() ->> 'role' = 'admin' OR user_id::text = auth.jwt() ->> 'sub')
    );

-- Verificação
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('checklist_devolucoes_tasks', 'checklist_motorista_routes')
    AND column_name = 'user_id'
ORDER BY table_name;





























