-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES
-- Permitir que admin crie tarefas para qualquer usuário
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Remover TODAS as políticas antigas relacionadas (pode ter diferentes nomes)
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;

-- Criar nova política que permite:
-- - Admin pode tudo (criar, ler, atualizar, deletar) para qualquer user_id
-- - Perfil devoluções pode ler e gerenciar apenas suas próprias tarefas (user_id = seu próprio id)
-- 
-- IMPORTANTE: 
-- - O role vem do JWT: auth.jwt() ->> 'role'
-- - O ID do usuário logado vem do JWT: auth.jwt() ->> 'sub' (NÃO 'user_id'!)
-- - O user_id na tabela checklist_devolucoes_tasks é a coluna user_id
CREATE POLICY "Admin e devoluções podem gerenciar tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        -- Admin pode ver tudo
        (auth.jwt() ->> 'role')::text = 'admin'
        OR 
        -- Perfil devoluções pode ver apenas suas próprias tarefas (user_id da tabela = sub do JWT)
        ((auth.jwt() ->> 'role')::text = 'devoluções' AND user_id::text = (auth.jwt() ->> 'sub')::text)
    )
    WITH CHECK (
        -- Admin pode criar/atualizar/deletar para qualquer user_id
        (auth.jwt() ->> 'role')::text = 'admin'
        OR 
        -- Perfil devoluções pode criar/atualizar/deletar apenas suas próprias tarefas
        -- IMPORTANTE: Ao criar, verificar se user_id da tabela = sub do JWT
        ((auth.jwt() ->> 'role')::text = 'devoluções' AND user_id::text = (auth.jwt() ->> 'sub')::text)
    );

-- Verificar políticas criadas
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

