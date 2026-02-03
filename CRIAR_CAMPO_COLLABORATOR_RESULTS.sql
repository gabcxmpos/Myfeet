-- ============================================
-- ADICIONAR CAMPO COLLABORATOR_RESULTS (JSONB)
-- Para armazenar resultados individuais dos colaboradores
-- ============================================

DO $$
BEGIN
    -- Verifica se a coluna 'collaborator_results' existe na tabela 'stores'
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'collaborator_results'
    ) THEN
        -- Se a coluna não existe, adiciona ela
        ALTER TABLE public.stores
        ADD COLUMN collaborator_results JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "collaborator_results" adicionada à tabela "stores" com sucesso.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna "collaborator_results" já existe na tabela "stores". Nenhuma alteração feita.';
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
AND column_name = 'collaborator_results';

-- Exemplo de estrutura esperada:
-- collaborator_results = {
--   "2025-12": {
--     "collaborator_id_1": {
--       "faturamento": 1000,
--       "prateleiraInfinita": 500,
--       "pa": 2.5,
--       "ticketMedio": 200
--     },
--     "collaborator_id_2": {
--       "faturamento": 1500,
--       "prateleiraInfinita": 600,
--       "pa": 3.0,
--       "ticketMedio": 250
--     }
--   },
--   "2025-11": { ... }
-- }
























