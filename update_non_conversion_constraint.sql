-- ============================================
-- ATUALIZAÇÃO DA CONSTRAINT: non_conversion_records
-- Adicionar "OUTROS" à constraint CHECK de situacao
-- ============================================

-- PASSO 1: Verificar constraint atual
SELECT 
    'ANTES' AS etapa,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.non_conversion_records'::regclass
AND conname = 'non_conversion_records_situacao_check';

-- PASSO 2: Remover TODAS as constraints CHECK de situacao (caso tenha nomes diferentes)
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Remover constraint pelo nome conhecido
    ALTER TABLE public.non_conversion_records 
    DROP CONSTRAINT IF EXISTS non_conversion_records_situacao_check;
    
    -- Tentar remover outras possíveis constraints CHECK na coluna situacao
    FOR constraint_name_var IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.non_conversion_records'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%situacao%'
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.non_conversion_records DROP CONSTRAINT %I', constraint_name_var);
            RAISE NOTICE 'Constraint removida: %', constraint_name_var;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao remover constraint %: %', constraint_name_var, SQLERRM;
        END;
    END LOOP;
END $$;

-- PASSO 3: Adicionar a nova constraint com "OUTROS"
ALTER TABLE public.non_conversion_records
ADD CONSTRAINT non_conversion_records_situacao_check 
CHECK (situacao IN ('GRADE', 'PREÇO', 'PRODUTO', 'OUTROS'));

-- PASSO 4: Verificar se a constraint foi aplicada corretamente
SELECT 
    'DEPOIS' AS etapa,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    CASE 
        WHEN pg_get_constraintdef(oid) LIKE '%OUTROS%' 
        THEN '✅ SUCESSO - Constraint atualizada com OUTROS'
        ELSE '❌ ERRO - Constraint não inclui OUTROS'
    END AS status
FROM pg_constraint
WHERE conrelid = 'public.non_conversion_records'::regclass
AND conname = 'non_conversion_records_situacao_check';

