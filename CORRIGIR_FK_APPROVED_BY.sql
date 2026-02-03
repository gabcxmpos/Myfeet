-- ============================================
-- CORRIGIR FOREIGN KEY DA COLUNA approved_by
-- A constraint está definida mas sem referência (NULL)
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover a constraint incorreta
ALTER TABLE public.evaluations
DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey;

-- PASSO 2: Verificar se a coluna approved_by existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'evaluations'
AND column_name = 'approved_by';

-- PASSO 3: Adicionar a coluna se ela não existir
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
        ADD COLUMN approved_by UUID;
        
        RAISE NOTICE '✅ Coluna approved_by adicionada à tabela evaluations.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna approved_by já existe na tabela evaluations.';
    END IF;
END
$$;

-- PASSO 4: Criar a foreign key correta apontando para auth.users(id)
ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_approved_by_fkey
FOREIGN KEY (approved_by)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- PASSO 5: Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_evaluations_approved_by 
ON public.evaluations(approved_by);

-- PASSO 6: Verificar se a constraint foi criada corretamente
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
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
AND tc.constraint_name = 'evaluations_approved_by_fkey'
ORDER BY tc.constraint_type, tc.constraint_name;

-- PASSO 7: Verificar política RLS para garantir que admin e supervisor podem atualizar
DROP POLICY IF EXISTS "Admin e supervisor podem atualizar avaliações" ON public.evaluations;

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

-- ✅ Correção completa! A foreign key agora referencia corretamente auth.users(id)





























