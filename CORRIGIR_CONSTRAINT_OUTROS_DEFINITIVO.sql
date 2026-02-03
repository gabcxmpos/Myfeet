-- ============================================
-- CORREÇÃO DEFINITIVA: Adicionar "OUTROS" à constraint
-- Execute este script COMPLETO no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar constraint atual (antes)
SELECT 
    'ANTES' AS etapa,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.non_conversion_records'::regclass
AND contype = 'c'
AND pg_get_constraintdef(oid) LIKE '%situacao%';

-- PASSO 2: Remover TODAS as constraints CHECK relacionadas a situacao
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- Buscar e remover todas as constraints CHECK que envolvem a coluna situacao
    FOR constraint_rec IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.non_conversion_records'::regclass
        AND contype = 'c'
        AND (
            conname LIKE '%situacao%' 
            OR pg_get_constraintdef(oid) LIKE '%situacao%'
        )
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.non_conversion_records DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_rec.conname);
            RAISE NOTICE '✅ Constraint removida: %', constraint_rec.conname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '⚠️ Erro ao remover constraint %: %', constraint_rec.conname, SQLERRM;
        END;
    END LOOP;
END $$;

-- PASSO 3: Garantir que a constraint foi removida
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM pg_constraint
    WHERE conrelid = 'public.non_conversion_records'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%situacao%';
    
    IF remaining_count > 0 THEN
        RAISE WARNING '⚠️ Ainda existem % constraint(s) relacionadas a situacao', remaining_count;
    ELSE
        RAISE NOTICE '✅ Todas as constraints de situacao foram removidas';
    END IF;
END $$;

-- PASSO 4: Adicionar a nova constraint COMPLETA com todos os valores
ALTER TABLE public.non_conversion_records
ADD CONSTRAINT non_conversion_records_situacao_check 
CHECK (situacao IN ('GRADE', 'PREÇO', 'PRODUTO', 'OUTROS'));

-- PASSO 5: Verificar se a constraint foi criada corretamente (depois)
SELECT 
    'DEPOIS' AS etapa,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%OUTROS%' 
        AND pg_get_constraintdef(oid) LIKE '%GRADE%'
        AND pg_get_constraintdef(oid) LIKE '%PREÇO%'
        AND pg_get_constraintdef(oid) LIKE '%PRODUTO%'
        THEN '✅ SUCESSO - Constraint completa com todos os valores'
        ELSE '❌ ERRO - Constraint incompleta ou incorreta'
    END AS status
FROM pg_constraint
WHERE conrelid = 'public.non_conversion_records'::regclass
AND conname = 'non_conversion_records_situacao_check';

-- PASSO 6: Teste rápido - tentar inserir um valor "OUTROS" (não vai inserir, só valida)
DO $$
BEGIN
    -- Verificar se a constraint aceita "OUTROS"
    PERFORM 1 FROM pg_constraint
    WHERE conrelid = 'public.non_conversion_records'::regclass
    AND conname = 'non_conversion_records_situacao_check'
    AND pg_get_constraintdef(oid) LIKE '%OUTROS%';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Constraint validada: Aceita valor "OUTROS"';
    ELSE
        RAISE WARNING '❌ Constraint não aceita valor "OUTROS"';
    END IF;
END $$;


