-- ============================================
-- VERIFICAR E CORRIGIR RLS PARA EXCLUSÃO
-- ============================================
-- Este script verifica e corrige as políticas RLS
-- para permitir exclusão de feedbacks e avaliações

-- ============================================
-- 1. VERIFICAR POLÍTICAS ATUAIS
-- ============================================

-- Ver políticas de DELETE para feedbacks
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
WHERE tablename = 'feedbacks' 
AND cmd = 'DELETE';

-- Ver políticas de DELETE para evaluations
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
WHERE tablename = 'evaluations' 
AND cmd = 'DELETE';

-- ============================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================

SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('feedbacks', 'evaluations');

-- ============================================
-- 3. CRIAR/ATUALIZAR POLÍTICAS PARA FEEDBACKS
-- ============================================

-- Remover políticas antigas de DELETE (se existirem)
DROP POLICY IF EXISTS "Allow delete feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Users can delete own feedbacks" ON feedbacks;
DROP POLICY IF EXISTS "Admins can delete feedbacks" ON feedbacks;

-- Criar política permissiva para DELETE em feedbacks
-- Permite que usuários autenticados com role admin ou supervisor excluam
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

-- Alternativa: Se quiser permitir que qualquer usuário autenticado exclua seus próprios feedbacks
-- Descomente a política abaixo e comente a de cima:
/*
CREATE POLICY "Users can delete own feedbacks"
ON feedbacks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
  )
);
*/

-- ============================================
-- 4. CRIAR/ATUALIZAR POLÍTICAS PARA EVALUATIONS
-- ============================================

-- Remover políticas antigas de DELETE (se existirem)
DROP POLICY IF EXISTS "Allow delete evaluations" ON evaluations;
DROP POLICY IF EXISTS "Admins can delete evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow delete evaluations for admins" ON evaluations;

-- Criar política permissiva para DELETE em evaluations
-- Permite que usuários autenticados com role admin ou supervisor excluam
CREATE POLICY "Allow delete evaluations for admins and supervisors"
ON evaluations
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
-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- Verificar políticas de feedbacks
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feedbacks' 
AND cmd = 'DELETE';

-- Verificar políticas de evaluations
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'evaluations' 
AND cmd = 'DELETE';

-- ============================================
-- 7. TESTE DE PERMISSÕES (OPCIONAL)
-- ============================================

-- Para testar se as políticas estão funcionando,
-- execute no SQL Editor enquanto estiver logado como admin:

-- Teste 1: Verificar se consegue ver feedbacks
-- SELECT * FROM feedbacks LIMIT 1;

-- Teste 2: Verificar se consegue ver evaluations
-- SELECT * FROM evaluations LIMIT 1;

-- Teste 3: Tentar excluir (substitua o ID por um ID real)
-- DELETE FROM feedbacks WHERE id = 'ID_DO_FEEDBACK_AQUI';
-- DELETE FROM evaluations WHERE id = 'ID_DA_AVALIACAO_AQUI';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. As políticas acima permitem que apenas admin e supervisor excluam
--    Se quiser permitir que usuários de loja excluam seus próprios itens,
--    ajuste as políticas conforme necessário

-- 2. Se ainda houver problemas após executar este script:
--    - Verifique se o usuário está realmente autenticado
--    - Verifique se o usuário tem role 'admin' ou 'supervisor' em app_users
--    - Verifique os logs do Supabase para erros específicos

-- 3. Para diagnóstico, você pode temporariamente desabilitar RLS:
--    ALTER TABLE feedbacks DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;
--    (Lembre-se de reabilitar após o teste!)








