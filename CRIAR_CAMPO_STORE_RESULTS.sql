-- ============================================
-- ADICIONAR CAMPO STORE_RESULTS (JSONB)
-- Para armazenar resultados gerais da loja por mês
-- ============================================

DO $$
BEGIN
    -- Verifica se a coluna 'store_results' existe na tabela 'stores'
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'store_results'
    ) THEN
        -- Se a coluna não existe, adiciona ela
        ALTER TABLE public.stores
        ADD COLUMN store_results JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "store_results" adicionada à tabela "stores" com sucesso.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna "store_results" já existe na tabela "stores". Nenhuma alteração feita.';
    END IF;
END
$$;

-- Verificar estrutura da coluna
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stores'
AND column_name = 'store_results';

-- Exemplo de estrutura esperada:
-- store_results = {
--   "2025-12": {
--     "conversao": 15.5,
--     "pa": 2.8,
--     "faturamento": 150000,
--     "prateleiraInfinita": 15000,
--     "ticketMedio": 250.50
--   },
--   "2025-11": { ... }
-- }
























