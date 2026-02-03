-- ============================================
-- CORRIGIR PRECISÃO DOS CAMPOS NUMÉRICOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- O erro ocorre porque NUMERIC(5,2) só permite valores até 999.99
-- Vamos aumentar a precisão para NUMERIC(10,2) que permite até 99.999.999,99

-- Alterar percentual_ultimas_pecas de NUMERIC(5,2) para NUMERIC(10,2)
ALTER TABLE public.returns_processing_capacity 
ALTER COLUMN percentual_ultimas_pecas TYPE NUMERIC(10,2);

-- Alterar capacidade_estoque_venda de NUMERIC(5,2) para NUMERIC(10,2)
-- (caso também precise de valores maiores)
ALTER TABLE public.returns_processing_capacity 
ALTER COLUMN capacidade_estoque_venda TYPE NUMERIC(10,2);

-- Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Campos numéricos atualizados com sucesso!';
    RAISE NOTICE '✅ percentual_ultimas_pecas: NUMERIC(10,2) - permite até 99.999.999,99';
    RAISE NOTICE '✅ capacidade_estoque_venda: NUMERIC(10,2) - permite até 99.999.999,99';
END $$;

-- Verificar a estrutura atualizada
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'returns_processing_capacity'
    AND column_name IN ('percentual_ultimas_pecas', 'capacidade_estoque_venda');






















