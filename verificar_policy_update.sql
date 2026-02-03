-- ============================================
-- VERIFICAR E CORRIGIR POLÍTICA DE UPDATE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verificar se a política de UPDATE existe
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
WHERE schemaname = 'public' 
  AND tablename = 'equipments'
  AND policyname = 'Store can update equipment condition';

-- Verificar se há outras políticas de UPDATE que possam estar conflitando
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'equipments'
  AND cmd = 'UPDATE';

-- Se a política não permitir UPDATE corretamente, vamos recriá-la
DROP POLICY IF EXISTS "Store can update equipment condition" ON public.equipments;

-- Recriar a política de forma mais permissiva para UPDATE
CREATE POLICY "Store can update equipment condition"
    ON public.equipments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
    );

-- Verificar novamente
SELECT 
  'POLÍTICA RECRIADA' AS status,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'equipments'
  AND policyname = 'Store can update equipment condition';



