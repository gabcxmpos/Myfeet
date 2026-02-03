-- ============================================
-- CORRIGIR RLS DELETE PARA RETURNS_PLANNER
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Verificar políticas existentes de DELETE
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
WHERE tablename = 'returns_planner'
  AND cmd = 'DELETE';

-- Remover política antiga se existir
DROP POLICY IF EXISTS "devoluções_pode_deletar_returns_planner" ON public.returns_planner;
DROP POLICY IF EXISTS "admin_pode_deletar_returns_planner" ON public.returns_planner;
DROP POLICY IF EXISTS "supervisor_pode_deletar_returns_planner" ON public.returns_planner;

-- Criar política para DELETE: Admin, supervisor e devoluções podem deletar qualquer registro
CREATE POLICY "devoluções_admin_supervisor_pode_deletar_returns_planner"
ON public.returns_planner
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR app_users.role = 'supervisor'
      OR app_users.role = 'supervisor_franquia'
      OR app_users.role = 'devoluções'
    )
  )
);

-- Verificar se a política foi criada
SELECT 
  'Política criada' AS status,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'returns_planner'
  AND cmd = 'DELETE';

-- Verificar se a tabela tem RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';

-- Se RLS não estiver habilitado, habilitar
ALTER TABLE public.returns_planner ENABLE ROW LEVEL SECURITY;

-- Verificar novamente
SELECT 
  'RLS habilitado' AS status,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';








