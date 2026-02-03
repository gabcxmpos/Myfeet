-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES - VERSÃO SIMPLES (SEM FUNÇÃO AUXILIAR)
-- Use esta versão se tiver problemas com a função get_user_role()
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Política de acesso para checklist de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;

-- PASSO 2: Remover TODAS as versões da função get_user_role (para evitar conflitos)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'get_user_role'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- PASSO 3: Criar política para ADMIN (sem função auxiliar, apenas JWT)
CREATE POLICY "Admin pode gerenciar todas as tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        (auth.jwt() ->> 'role')::text = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- PASSO 4: Criar política para PERFIL DEVOLUÇÕES (sem função auxiliar, apenas JWT)
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
    LEFT(qual::text, 150) as qual_preview,
    LEFT(with_check::text, 150) as with_check_preview
FROM pg_policies
WHERE tablename = 'checklist_devolucoes_tasks'
ORDER BY policyname;





























