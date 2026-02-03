-- ============================================
-- RECRIAR POLÍTICAS RLS CORRETAS PARA CHECKLIST DEVOLUÇÕES
-- Este script remove as políticas atuais e as recria com as condições corretas
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

-- PASSO 2: Garantir que a função get_user_role existe e está correta
DROP FUNCTION IF EXISTS public.get_user_role();

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  BEGIN
    v_user_id := (auth.jwt() ->> 'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
  
  v_role := auth.jwt() ->> 'role';
  
  IF v_role IS NULL OR v_role = '' OR v_role = 'null' THEN
    BEGIN
      SELECT role INTO v_role
      FROM public.app_users
      WHERE id = v_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        v_role := NULL;
    END;
  END IF;
  
  RETURN COALESCE(v_role, 'user');
END;
$$;

-- PASSO 3: Criar política para ADMIN com condições EXPLÍCITAS
CREATE POLICY "Admin pode gerenciar todas as tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        (auth.jwt() ->> 'role')::text = 'admin'
        OR (public.get_user_role())::text = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'role')::text = 'admin'
        OR (public.get_user_role())::text = 'admin'
    );

-- PASSO 4: Criar política para DEVOLUÇÕES com verificação de user_id
CREATE POLICY "Devoluções pode gerenciar suas próprias tarefas"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        (
            (auth.jwt() ->> 'role')::text = 'devoluções'
            OR (public.get_user_role())::text = 'devoluções'
        )
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    )
    WITH CHECK (
        (
            (auth.jwt() ->> 'role')::text = 'devoluções'
            OR (public.get_user_role())::text = 'devoluções'
        )
        AND user_id::text = (auth.jwt() ->> 'sub')::text
    );

-- PASSO 5: Verificar políticas criadas (mostrar condição completa)
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





























