-- ============================================
-- CORRIGIR RLS PARA DELETE EM PHYSICAL_MISSING
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar políticas DELETE existentes para physical_missing
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
WHERE tablename = 'physical_missing'
  AND cmd = 'DELETE'
ORDER BY policyname;

-- 2. Criar política DELETE para physical_missing
-- Permitir que admin, supervisor e devoluções possam deletar
DROP POLICY IF EXISTS "devoluções_pode_deletar_physical_missing" ON public.physical_missing;
CREATE POLICY "devoluções_pode_deletar_physical_missing"
ON public.physical_missing
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR app_users.role = 'supervisor'
      OR app_users.role = 'devoluções'
      OR (app_users.role IN ('loja', 'admin_loja') AND app_users.store_id = physical_missing.store_id)
    )
  )
);

-- 3. Verificar se RLS está habilitado
ALTER TABLE public.physical_missing ENABLE ROW LEVEL SECURITY;

-- 4. Verificar todas as políticas criadas para physical_missing
SELECT 
  'PHYSICAL_MISSING' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'physical_missing'
ORDER BY cmd, policyname;

-- 5. Mensagem final
SELECT '✅ Política RLS DELETE criada para physical_missing. Admin, supervisor, devoluções e lojas podem deletar seus próprios registros.' AS status;








