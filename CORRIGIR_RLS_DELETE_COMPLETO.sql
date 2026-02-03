-- ============================================
-- CORRIGIR RLS PARA DELETE EM RETURNS E PHYSICAL_MISSING
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar políticas DELETE existentes
SELECT 
  'RETURNS' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'returns'
  AND cmd = 'DELETE'
ORDER BY policyname;

SELECT 
  'PHYSICAL_MISSING' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'physical_missing'
  AND cmd = 'DELETE'
ORDER BY policyname;

-- 2. Criar política DELETE para RETURNS
-- Permitir que admin, supervisor e devoluções possam deletar
DROP POLICY IF EXISTS "devoluções_pode_deletar_returns" ON public.returns;
CREATE POLICY "devoluções_pode_deletar_returns"
ON public.returns
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
      OR (app_users.role IN ('loja', 'admin_loja') AND app_users.store_id = returns.store_id)
    )
  )
);

-- 3. Criar política DELETE para PHYSICAL_MISSING
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

-- 4. Garantir que RLS está habilitado
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_missing ENABLE ROW LEVEL SECURITY;

-- 5. Verificar todas as políticas criadas
SELECT 
  'RETURNS' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'returns'
ORDER BY cmd, policyname;

SELECT 
  'PHYSICAL_MISSING' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'physical_missing'
ORDER BY cmd, policyname;

-- 6. Mensagem final
SELECT '✅ Políticas RLS DELETE criadas para returns e physical_missing. Admin, supervisor, devoluções e lojas podem deletar seus próprios registros.' AS status;








