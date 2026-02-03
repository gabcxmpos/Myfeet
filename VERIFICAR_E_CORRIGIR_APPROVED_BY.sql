-- ============================================
-- VERIFICAR E CORRIGIR CAMPO approved_by NA TABELA evaluations
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se a coluna approved_by existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'evaluations'
AND column_name = 'approved_by';

-- PASSO 2: Se a coluna não existir, criá-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'evaluations'
        AND column_name = 'approved_by'
    ) THEN
        -- Adicionar coluna approved_by
        ALTER TABLE public.evaluations
        ADD COLUMN approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_evaluations_approved_by 
        ON public.evaluations(approved_by);
        
        RAISE NOTICE '✅ Coluna approved_by adicionada à tabela evaluations.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna approved_by já existe na tabela evaluations.';
    END IF;
END
$$;

-- PASSO 3: Verificar se há RLS policies que bloqueiam a atualização
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
ORDER BY policyname;

-- PASSO 4: Verificar a estrutura completa da tabela evaluations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'evaluations'
ORDER BY ordinal_position;

-- PASSO 5: Criar/atualizar política RLS para permitir que admin e supervisor possam atualizar approved_by
-- Primeiro, remover política existente se houver conflito
DROP POLICY IF EXISTS "Admin e supervisor podem atualizar avaliações" ON public.evaluations;

-- Criar política para permitir que admin e supervisor atualizem avaliações (incluindo approved_by)
CREATE POLICY "Admin e supervisor podem atualizar avaliações"
ON public.evaluations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
);

-- Política RLS criada/atualizada para permitir atualização de avaliações por admin e supervisor

-- PASSO 6: Verificar constraints e foreign keys
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'evaluations'
ORDER BY tc.constraint_type, tc.constraint_name;

-- PASSO 7: Testar atualização manual (opcional - descomente para testar)
/*
-- Exemplo de atualização de teste
UPDATE public.evaluations
SET approved_by = auth.uid()
WHERE id = 'ID_DA_AVALIACAO_AQUI'
AND EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor')
);
*/

-- Verificação completa! Verifique os resultados acima.

