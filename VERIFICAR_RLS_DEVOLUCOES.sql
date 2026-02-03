-- ============================================
-- VERIFICAR E CORRIGIR RLS PARA DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Verificar políticas RLS existentes para a tabela 'returns'
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
WHERE tablename = 'returns'
ORDER BY policyname;

-- 2. Verificar políticas RLS existentes para a tabela 'physical_missing'
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
ORDER BY policyname;

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('returns', 'physical_missing')
  AND schemaname = 'public';

-- 4. Criar/Atualizar políticas para RETURNS (se necessário)
-- Permitir que perfil 'devoluções' veja todas as devoluções pendentes

-- Política para SELECT: Admin, supervisor e devoluções podem ver todas
DROP POLICY IF EXISTS "devoluções_pode_ver_returns" ON public.returns;
CREATE POLICY "devoluções_pode_ver_returns"
ON public.returns
FOR SELECT
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

-- Política para INSERT: Loja pode criar devoluções para sua loja
DROP POLICY IF EXISTS "loja_pode_criar_returns" ON public.returns;
CREATE POLICY "loja_pode_criar_returns"
ON public.returns
FOR INSERT
TO authenticated
WITH CHECK (
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

-- Política para UPDATE: Admin, supervisor e devoluções podem atualizar
DROP POLICY IF EXISTS "devoluções_pode_atualizar_returns" ON public.returns;
CREATE POLICY "devoluções_pode_atualizar_returns"
ON public.returns
FOR UPDATE
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

-- Política para DELETE: Admin, supervisor e devoluções podem deletar
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

-- 5. Criar/Atualizar políticas para PHYSICAL_MISSING (se necessário)
-- Permitir que perfil 'devoluções' veja todas as faltas físicas

-- Política para SELECT: Admin, supervisor e devoluções podem ver todas
DROP POLICY IF EXISTS "devoluções_pode_ver_physical_missing" ON public.physical_missing;
CREATE POLICY "devoluções_pode_ver_physical_missing"
ON public.physical_missing
FOR SELECT
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

-- Política para INSERT: Loja pode criar faltas físicas para sua loja
DROP POLICY IF EXISTS "loja_pode_criar_physical_missing" ON public.physical_missing;
CREATE POLICY "loja_pode_criar_physical_missing"
ON public.physical_missing
FOR INSERT
TO authenticated
WITH CHECK (
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

-- Política para UPDATE: Admin, supervisor e devoluções podem atualizar
DROP POLICY IF EXISTS "devoluções_pode_atualizar_physical_missing" ON public.physical_missing;
CREATE POLICY "devoluções_pode_atualizar_physical_missing"
ON public.physical_missing
FOR UPDATE
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

-- Política para DELETE: Admin, supervisor e devoluções podem deletar
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

-- 6. Garantir que RLS está habilitado
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_missing ENABLE ROW LEVEL SECURITY;

-- 7. Verificar políticas criadas
SELECT 
  'RETURNS' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'returns'
ORDER BY policyname;

SELECT 
  'PHYSICAL_MISSING' AS tabela,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'physical_missing'
ORDER BY policyname;

-- 8. Mensagem final
SELECT '✅ Políticas RLS verificadas e atualizadas para permitir acesso do perfil "devoluções"' AS status;

















