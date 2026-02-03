-- ============================================
-- CORRIGIR RLS PARA CHECKLIST DEVOLUÇÕES - VERSÃO OTIMIZADA
-- Política clara e separada para melhor performance e manutenção
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover TODAS as políticas antigas (incluindo as que podem ter sido criadas incorretamente)
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Devoluções pode gerenciar suas próprias tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Perfil devoluções pode ler suas tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Gerenciar tarefas de devoluções por role e user_id" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Admin e devoluções podem gerenciar tarefas de devoluções" ON public.checklist_devolucoes_tasks;
DROP POLICY IF EXISTS "Política de acesso para checklist de devoluções" ON public.checklist_devolucoes_tasks;

-- PASSO 2: Remover TODAS as versões existentes da função (para evitar conflito)
-- Usar CASCADE para remover dependências também
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Buscar todas as versões da função get_user_role e removê-las
    FOR r IN 
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'get_user_role'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- PASSO 3: Criar função auxiliar ÚNICA para obter role
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
  BEGIN
    v_user_id := (auth.jwt() ->> 'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
  
  -- Tentar obter role do JWT primeiro
  v_role := auth.jwt() ->> 'role';
  
  -- Se não estiver no JWT, buscar da tabela app_users
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

-- PASSO 4: Criar política separada para ADMIN (pode tudo)
-- IMPORTANTE: Usar cast explícito para garantir comparação correta
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

-- PASSO 5: Criar política separada para PERFIL DEVOLUÇÕES (apenas suas próprias)
-- IMPORTANTE: Usar cast explícito e verificar que user_id corresponde ao usuário logado
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

-- PASSO 6: Verificar políticas criadas (mostrar condição completa)
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

