-- ============================================
-- CRIAR COLUNA CTO_DATA NA TABELA STORES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Verificar se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stores' 
        AND column_name = 'cto_data'
    ) THEN
        -- Adicionar coluna cto_data como JSONB
        ALTER TABLE public.stores 
        ADD COLUMN cto_data JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna cto_data criada com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna cto_data já existe.';
    END IF;
END $$;

-- Verificar se a coluna foi criada
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'cto_data';

-- Estrutura esperada do JSONB cto_data:
-- {
--   "m2": 150.50,
--   "aluguelMin": 15000.00,
--   "aluguelPercentual": 12.5,
--   "monthlySales": {
--     "2024-01": 150000.00,
--     "2024-02": 160000.00
--   },
--   "monthlyBills": {
--     "2024-01": {
--       "amm": 15000.00,
--       "ammDiscount": 500.00,
--       "fpp": 5000.00,
--       "cond": 3000.00,
--       "additionalCosts": [
--         { "id": "1", "description": "IPTU", "value": 500.00 }
--       ]
--     },
--     "2024-02": {
--       "amm": 15000.00,
--       "ammDiscount": 0,
--       "fpp": 5000.00,
--       "cond": 3000.00,
--       "additionalCosts": []
--     }
--   },
--   "updated_at": "2024-01-01T00:00:00.000Z"
-- }

