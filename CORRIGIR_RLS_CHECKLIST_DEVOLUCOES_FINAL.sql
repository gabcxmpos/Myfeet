-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES - VERSÃO FINAL SIMPLIFICADA
-- Este script cria uma política RLS clara e funcional
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas relacionadas
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas de devoluções" ON public.checklist_devolucoes_tasks;

-- PASSO 2: Criar função auxiliar para obter role (se ainda não existir)
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
  -- Obter ID do usuário do JWT
  v_user_id := (auth.jwt() ->> 'sub')::UUID;
  
  -- Tentar obter role do JWT primeiro
  v_role := auth.jwt() ->> 'role';
  
  -- Se não estiver no JWT, buscar da tabela app_users
  IF v_role IS NULL OR v_role = '' THEN
    SELECT role INTO v_role
    FROM public.app_users
    WHERE id = v_user_id;
  END IF;
  
  RETURN COALESCE(v_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- PASSO 3: Criar política RLS simplificada e clara
-- A lógica é:
-- 1. Admin pode TUDO (ver, criar, atualizar, deletar) para QUALQUER user_id
-- 2. Perfil devoluções pode ver e gerenciar apenas tarefas onde user_id = seu próprio ID

CREATE POLICY "Política de acesso para checklist de devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        -- Admin pode ver tudo
        (auth.jwt() ->> 'role')::text = 'admin'
        OR public.get_user_role() = 'admin'
        OR 
        -- Perfil devoluções pode ver apenas suas próprias tarefas
        (
            (
                (auth.jwt() ->> 'role')::text = 'devoluções'
                OR public.get_user_role() = 'devoluções'
            )
            AND user_id::text = (auth.jwt() ->> 'sub')::text
        )
    )
    WITH CHECK (
        -- Admin pode criar/atualizar/deletar para QUALQUER user_id
        -- IMPORTANTE: Não verificamos user_id aqui, apenas o role
        (auth.jwt() ->> 'role')::text = 'admin'
        OR public.get_user_role() = 'admin'
        OR 
        -- Perfil devoluções pode criar/atualizar/deletar apenas suas próprias tarefas
        (
            (
                (auth.jwt() ->> 'role')::text = 'devoluções'
                OR public.get_user_role() = 'devoluções'
            )
            AND user_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- PASSO 4: Verificar política criada
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

-- PASSO 5: Testar se a função funciona (descomente para testar quando logado)
-- SELECT public.get_user_role() as meu_role, (auth.jwt() ->> 'sub')::text as meu_id;





























