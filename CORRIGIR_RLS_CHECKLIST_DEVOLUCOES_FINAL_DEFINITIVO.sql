-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES - VERSÃO FINAL DEFINITIVA
-- Esta versão não usa função auxiliar para evitar problemas
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Política de acesso para checklist de devoluções" ON public.checklist_devolucoes_tasks;

-- PASSO 2: Remover função auxiliar (vamos usar apenas JWT direto)
DROP FUNCTION IF EXISTS public.get_user_role() CASCADE;

-- PASSO 3: Criar política para ADMIN (pode tudo, sem restrição de user_id)
-- IMPORTANTE: Admin pode criar tarefas para QUALQUER user_id
CREATE POLICY "Admin pode gerenciar todas as tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- PASSO 4: Criar política para PERFIL DEVOLUÇÕES (apenas suas próprias tarefas)
-- IMPORTANTE: Devoluções só pode ver/criar tarefas onde user_id = seu próprio ID (sub do JWT)
CREATE POLICY "Devoluções pode gerenciar suas próprias tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        (auth.jwt() ->> 'role')::text = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    )
    WITH CHECK (
        (auth.jwt() ->> 'role')::text = 'devoluções'
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    );

-- PASSO 5: Verificar políticas criadas
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
WHERE tablename = 'checklist_devolucoes_tasks'
ORDER BY policyname;





























