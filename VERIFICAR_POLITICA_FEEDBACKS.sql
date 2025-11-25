-- ============================================
-- VERIFICAR POLÍTICA RLS PARA FEEDBACKS
-- ============================================
-- Execute este script para verificar se a política de DELETE
-- para feedbacks está configurada corretamente

-- ============================================
-- 1. VERIFICAR POLÍTICAS ATUAIS DE FEEDBACKS
-- ============================================

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feedbacks' 
AND cmd = 'DELETE';

-- ============================================
-- 2. SE NÃO EXISTIR, CRIAR POLÍTICA
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Allow delete feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Users can delete own feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Admins can delete feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Allow delete feedbacks for admins and supervisors" ON feedbacks;

-- Criar política para permitir DELETE de feedbacks para admin e supervisor
CREATE POLICY "Allow delete feedbacks for admins and supervisors"
ON feedbacks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor')
  )
);

-- ============================================
-- 3. VERIFICAR SE FOI CRIADA
-- ============================================

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feedbacks' 
AND cmd = 'DELETE';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Deve retornar uma linha com:
-- policyname: "Allow delete feedbacks for admins and supervisors"
-- cmd: "DELETE"
-- qual: (EXISTS ( SELECT 1 FROM app_users WHERE ((app_users.id = auth.uid()) AND (app_users.role = ANY (ARRAY['admin'::text, 'supervisor'::text])))))
-- with_check: NULL








