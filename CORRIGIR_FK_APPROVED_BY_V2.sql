-- ============================================
-- CORRIGIR FOREIGN KEY DA COLUNA approved_by - VERSÃO 2
-- Esta versão força a remoção e recriação da constraint
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar o estado atual da constraint
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
AND tc.constraint_name = 'evaluations_approved_by_fkey';

-- PASSO 2: Remover TODAS as constraints relacionadas a approved_by (forçar remoção)
DO $$
BEGIN
    -- Tentar remover usando DROP CONSTRAINT
    BEGIN
        ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey CASCADE;
        RAISE NOTICE '✅ Constraint evaluations_approved_by_fkey removida.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao remover constraint (pode não existir): %', SQLERRM;
    END;
    
    -- Verificar se ainda há constraints órfãs
    BEGIN
        -- Tentar remover qualquer constraint relacionada via pg_constraint
        PERFORM conname FROM pg_constraint 
        WHERE conrelid = 'public.evaluations'::regclass 
        AND conname LIKE '%approved_by%';
        
        IF FOUND THEN
            RAISE NOTICE '⚠️ Ainda existem constraints relacionadas. Tentando remover via pg_constraint...';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Verificação de constraints órfãs concluída.';
    END;
END
$$;

-- PASSO 3: Verificar se a coluna approved_by existe
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

-- PASSO 4: Remover índice antigo se existir (pode estar ligado à constraint)
DROP INDEX IF EXISTS public.idx_evaluations_approved_by;

-- PASSO 5: Criar a foreign key correta APONTANDO PARA auth.users(id)
-- IMPORTANTE: Usar schema completo 'auth.users'
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.evaluations
        ADD CONSTRAINT evaluations_approved_by_fkey
        FOREIGN KEY (approved_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Foreign key evaluations_approved_by_fkey criada com sucesso.';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ Constraint já existe. Removendo e recriando...';
        ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey CASCADE;
        
        ALTER TABLE public.evaluations
        ADD CONSTRAINT evaluations_approved_by_fkey
        FOREIGN KEY (approved_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Foreign key recriada com sucesso.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar foreign key: %', SQLERRM;
        RAISE;
    END;
END
$$;

-- PASSO 6: Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_evaluations_approved_by 
ON public.evaluations(approved_by);

-- PASSO 7: Verificar se a constraint foi criada CORRETAMENTE agora
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name IS NOT NULL THEN '✅ OK - Foreign key está corretamente configurada'
        ELSE '❌ ERRO - Foreign key ainda não está configurada'
    END AS status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'evaluations'
AND tc.constraint_name = 'evaluations_approved_by_fkey';

-- PASSO 8: Se ainda estiver NULL, tentar criar sem constraint e depois adicionar
DO $$
DECLARE
    fk_exists BOOLEAN;
    fk_has_reference BOOLEAN;
BEGIN
    -- Verificar se a FK existe e tem referência
    SELECT 
        EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'evaluations_approved_by_fkey'
        ),
        EXISTS (
            SELECT 1
            FROM information_schema.constraint_column_usage ccu
            JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_name = 'evaluations_approved_by_fkey'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
        )
    INTO fk_exists, fk_has_reference;
    
    IF fk_exists AND NOT fk_has_reference THEN
        RAISE NOTICE '⚠️ Foreign key existe mas não tem referência. Tentando correção manual...';
        
        -- Remover completamente
        ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey CASCADE;
        
        -- Recriar explicitamente
        EXECUTE 'ALTER TABLE public.evaluations 
                 ADD CONSTRAINT evaluations_approved_by_fkey
                 FOREIGN KEY (approved_by)
                 REFERENCES auth.users(id)
                 ON DELETE SET NULL';
        
        RAISE NOTICE '✅ Foreign key recriada manualmente.';
    ELSIF NOT fk_exists THEN
        RAISE NOTICE '⚠️ Foreign key não existe. Criando...';
        
        EXECUTE 'ALTER TABLE public.evaluations 
                 ADD CONSTRAINT evaluations_approved_by_fkey
                 FOREIGN KEY (approved_by)
                 REFERENCES auth.users(id)
                 ON DELETE SET NULL';
        
        RAISE NOTICE '✅ Foreign key criada.';
    ELSE
        RAISE NOTICE '✅ Foreign key já está configurada corretamente.';
    END IF;
END
$$;

-- PASSO 9: Verificação final
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
AND tc.constraint_name = 'evaluations_approved_by_fkey';

-- PASSO 10: Criar/atualizar política RLS
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

-- ✅ Script concluído! Verifique o resultado do PASSO 9 para confirmar que foreign_table_name = 'users'





























