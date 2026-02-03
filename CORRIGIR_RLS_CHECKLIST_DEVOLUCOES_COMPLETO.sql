-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES - VERSÃO COMPLETA
-- Este script corrige a política RLS e cria uma função auxiliar se necessário
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas relacionadas
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas" ON public.checklist_devolucoes_tasks;

-- PASSO 2: Criar função auxiliar para obter role do usuário (se não existir)
-- Esta função busca o role da tabela app_users caso não esteja no JWT
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Se user_id_param for fornecido, usar ele; senão usar sub do JWT
  v_user_id := COALESCE(user_id_param, (auth.jwt() ->> 'sub')::UUID);
  
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

-- PASSO 3: Criar política RLS corrigida
-- IMPORTANTE: O JWT do Supabase usa 'sub' para o ID do usuário, não 'user_id'
-- O role pode estar no JWT (auth.jwt() ->> 'role') ou precisa ser buscado da tabela
CREATE POLICY "Admin e devoluções podem gerenciar tarefas de devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (
        -- Admin pode ver tudo (verificar role no JWT ou na tabela)
        (auth.jwt() ->> 'role')::text = 'admin'
        OR public.get_user_role() = 'admin'
        OR 
        -- Perfil devoluções pode ver apenas suas próprias tarefas
        -- Verificar se user_id da tabela = sub do JWT (ID do usuário logado)
        (
            (
                (auth.jwt() ->> 'role')::text = 'devoluções'
                OR public.get_user_role() = 'devoluções'
            )
            AND user_id::text = (auth.jwt() ->> 'sub')::text
        )
    )
    WITH CHECK (
        -- Admin pode criar/atualizar/deletar para qualquer user_id
        (auth.jwt() ->> 'role')::text = 'admin'
        OR public.get_user_role() = 'admin'
        OR 
        -- Perfil devoluções pode criar/atualizar/deletar apenas suas próprias tarefas
        -- IMPORTANTE: Ao criar, verificar se user_id da tabela = sub do JWT
        (
            (
                (auth.jwt() ->> 'role')::text = 'devoluções'
                OR public.get_user_role() = 'devoluções'
            )
            AND user_id::text = (auth.jwt() ->> 'sub')::text
        )
    );

-- PASSO 4: Verificar políticas criadas
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

-- PASSO 5: Testar a função auxiliar (descomente para testar)
-- SELECT public.get_user_role();





























