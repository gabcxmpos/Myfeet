-- ============================================
-- PERMITIR SUPERVISOR EXCLUIR AVALIAÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script adiciona uma política RLS que permite que
-- admin e supervisor possam excluir avaliações

-- PASSO 1: Verificar políticas RLS existentes para DELETE na tabela evaluations
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
AND tablename = 'evaluations'
AND cmd = 'DELETE'
ORDER BY policyname;

-- PASSO 2: Remover política existente de DELETE se houver (para recriar)
DROP POLICY IF EXISTS "Admin pode excluir avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Admin e supervisor podem excluir avaliações" ON public.evaluations;

-- PASSO 3: Criar política RLS para permitir que admin e supervisor excluam avaliações
CREATE POLICY "Admin e supervisor podem excluir avaliações"
ON public.evaluations
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
);

-- PASSO 4: Verificar se a política foi criada corretamente
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
AND tablename = 'evaluations'
AND cmd = 'DELETE'
ORDER BY policyname;

-- ✅ Política RLS criada! Agora admin e supervisor podem excluir avaliações.



























