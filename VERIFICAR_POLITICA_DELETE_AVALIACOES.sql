-- ============================================
-- VERIFICAR POLÍTICA RLS PARA DELETE DE AVALIAÇÕES
-- Execute este script no Supabase SQL Editor para verificar
-- ============================================

-- Verificar todas as políticas RLS da tabela evaluations
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
AND tablename = 'evaluations'
ORDER BY cmd, policyname;

-- Verificar especificamente a política de DELETE
SELECT 
    policyname AS "Nome da Política",
    cmd AS "Operação",
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%supervisor%' THEN '✅ Permite admin e supervisor'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'evaluations'
AND cmd = 'DELETE';

-- Verificar se RLS está habilitado na tabela
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'evaluations';



























