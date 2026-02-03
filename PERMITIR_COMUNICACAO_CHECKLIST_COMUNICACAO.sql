-- ============================================
-- PERMITIR PERFIL COMUNICAÇÃO GERENCIAR CHECKLIST COMUNICAÇÃO
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script atualiza as políticas RLS para permitir que o perfil
-- "comunicação" possa criar, atualizar e gerenciar tarefas do checklist de comunicação

-- ============================================
-- PARTE 1: VERIFICAR POLÍTICAS RLS EXISTENTES
-- ============================================

-- PASSO 1.1: Verificar políticas RLS existentes para checklist_comunicacao_tasks
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operacao,
    qual AS condicao_using,
    with_check AS condicao_with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_tasks'
ORDER BY cmd, policyname;

-- ============================================
-- PARTE 2: ATUALIZAR POLÍTICAS RLS
-- ============================================

-- PASSO 2.1: Remover TODAS as políticas existentes (incluindo as novas que podem ter sido criadas)
DROP POLICY IF EXISTS "Admin pode gerenciar checklist_comunicacao_tasks" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin e comunicação podem gerenciar checklist_comunicacao_tasks" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin e comunicação podem ver todas as tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin e comunicação podem criar tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin e comunicação podem atualizar tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin e comunicação podem excluir tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem ver tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem criar tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem atualizar tarefas" ON public.checklist_comunicacao_tasks;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem excluir tarefas" ON public.checklist_comunicacao_tasks;

-- PASSO 2.2: Criar política para SELECT (visualização)
-- Admin e comunicação podem ver todas as tarefas
-- Usuários podem ver suas próprias tarefas
CREATE POLICY "Admin, comunicação e usuários podem ver tarefas"
ON public.checklist_comunicacao_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_tasks.user_id = auth.uid()
    )
  )
);

-- PASSO 2.3: Criar política para INSERT (criação)
-- Admin e comunicação podem criar tarefas para qualquer usuário
-- Usuários podem criar suas próprias tarefas
CREATE POLICY "Admin, comunicação e usuários podem criar tarefas"
ON public.checklist_comunicacao_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_tasks.user_id = auth.uid()
    )
  )
);

-- PASSO 2.4: Criar política para UPDATE (atualização)
-- Admin e comunicação podem atualizar qualquer tarefa
-- Usuários podem atualizar suas próprias tarefas
CREATE POLICY "Admin, comunicação e usuários podem atualizar tarefas"
ON public.checklist_comunicacao_tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_tasks.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_tasks.user_id = auth.uid()
    )
  )
);

-- PASSO 2.5: Criar política para DELETE (exclusão)
-- Admin e comunicação podem excluir qualquer tarefa
-- Usuários podem excluir suas próprias tarefas
CREATE POLICY "Admin, comunicação e usuários podem excluir tarefas"
ON public.checklist_comunicacao_tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_tasks.user_id = auth.uid()
    )
  )
);

-- PASSO 2.6: Garantir que RLS está habilitado
ALTER TABLE public.checklist_comunicacao_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 3: VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- PASSO 3.1: Verificar políticas criadas
SELECT 
    'checklist_comunicacao_tasks' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação",
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        WHEN qual IS NULL OR qual = 'true' THEN '✅ Permite todos autenticados'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_tasks'
ORDER BY cmd, policyname;

-- PASSO 3.2: Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_tasks';

-- ============================================
-- PARTE 4: POLÍTICAS PARA checklist_comunicacao_execution
-- ============================================

-- PASSO 4.1: Verificar políticas RLS existentes para checklist_comunicacao_execution
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operacao,
    qual AS condicao_using,
    with_check AS condicao_with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_execution'
ORDER BY cmd, policyname;

-- PASSO 4.2: Remover TODAS as políticas existentes (incluindo as novas que podem ter sido criadas)
DROP POLICY IF EXISTS "Admin pode gerenciar checklist_comunicacao_execution" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin e comunicação podem gerenciar checklist_comunicacao_execution" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin e comunicação podem ver todas as execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin e comunicação podem criar execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin e comunicação podem atualizar execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin e comunicação podem excluir execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem ver execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem criar execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem atualizar execuções" ON public.checklist_comunicacao_execution;
DROP POLICY IF EXISTS "Admin, comunicação e usuários podem excluir execuções" ON public.checklist_comunicacao_execution;

-- PASSO 4.3: Criar política para SELECT (visualização)
CREATE POLICY "Admin, comunicação e usuários podem ver execuções"
ON public.checklist_comunicacao_execution
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_execution.user_id = auth.uid()
    )
  )
);

-- PASSO 4.4: Criar política para INSERT (criação)
CREATE POLICY "Admin, comunicação e usuários podem criar execuções"
ON public.checklist_comunicacao_execution
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_execution.user_id = auth.uid()
    )
  )
);

-- PASSO 4.5: Criar política para UPDATE (atualização)
CREATE POLICY "Admin, comunicação e usuários podem atualizar execuções"
ON public.checklist_comunicacao_execution
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_execution.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_execution.user_id = auth.uid()
    )
  )
);

-- PASSO 4.6: Criar política para DELETE (exclusão)
CREATE POLICY "Admin, comunicação e usuários podem excluir execuções"
ON public.checklist_comunicacao_execution
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'comunicação')
      OR checklist_comunicacao_execution.user_id = auth.uid()
    )
  )
);

-- PASSO 4.7: Garantir que RLS está habilitado
ALTER TABLE public.checklist_comunicacao_execution ENABLE ROW LEVEL SECURITY;

-- PASSO 4.8: Verificar políticas criadas para checklist_comunicacao_execution
SELECT 
    'checklist_comunicacao_execution' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação",
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        WHEN qual IS NULL OR qual = 'true' THEN '✅ Permite todos autenticados'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_execution'
ORDER BY cmd, policyname;

-- PASSO 4.9: Verificar se RLS está habilitado para checklist_comunicacao_execution
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'checklist_comunicacao_execution';

-- ✅ Políticas RLS atualizadas! Agora o perfil "comunicação" pode:
-- - Visualizar todas as tarefas do checklist de comunicação
-- - Criar novas tarefas
-- - Atualizar tarefas existentes
-- - Excluir tarefas
-- - Visualizar todas as execuções do checklist de comunicação
-- - Criar novas execuções
-- - Atualizar execuções existentes
-- - Excluir execuções

