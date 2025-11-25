-- ============================================
-- VERIFICAÇÃO COMPLETA DE POLÍTICAS RLS
-- ============================================
-- Execute este script para verificar TODAS as políticas
-- de DELETE para feedbacks e evaluations

-- ============================================
-- 1. VERIFICAR POLÍTICA DE FEEDBACKS
-- ============================================

SELECT 
    'FEEDBACKS' as tabela,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'SEM RESTRIÇÃO'
        ELSE qual::text
    END as condicao,
    with_check
FROM pg_policies 
WHERE tablename = 'feedbacks' 
AND cmd = 'DELETE';

-- ============================================
-- 2. VERIFICAR POLÍTICA DE EVALUATIONS
-- ============================================

SELECT 
    'EVALUATIONS' as tabela,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'SEM RESTRIÇÃO'
        ELSE qual::text
    END as condicao,
    with_check
FROM pg_policies 
WHERE tablename = 'evaluations' 
AND cmd = 'DELETE';

-- ============================================
-- 3. SE FALTAR POLÍTICA PARA FEEDBACKS, CRIAR
-- ============================================

-- Verificar se existe política para feedbacks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'feedbacks' 
        AND cmd = 'DELETE'
    ) THEN
        -- Criar política para feedbacks
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
        
        RAISE NOTICE 'Política criada para feedbacks';
    ELSE
        RAISE NOTICE 'Política já existe para feedbacks';
    END IF;
END $$;

-- ============================================
-- 4. VERIFICAR RLS ESTÁ HABILITADO
-- ============================================

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESABILITADO'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('feedbacks', 'evaluations');

-- ============================================
-- 5. RESUMO FINAL
-- ============================================

SELECT 
    'RESUMO' as tipo,
    tablename,
    COUNT(*) as total_politicas_delete,
    STRING_AGG(policyname, ', ') as politicas
FROM pg_policies 
WHERE tablename IN ('feedbacks', 'evaluations')
AND cmd = 'DELETE'
GROUP BY tablename;

