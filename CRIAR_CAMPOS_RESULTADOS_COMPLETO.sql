-- ============================================
-- ADICIONAR CAMPOS DE RESULTADOS (JSONB)
-- Script completo para criar todas as colunas necessárias
-- ============================================

-- 1. Coluna store_results (resultados gerais da loja por mês)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'store_results'
    ) THEN
        ALTER TABLE public.stores
        ADD COLUMN store_results JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "store_results" adicionada à tabela "stores" com sucesso.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna "store_results" já existe na tabela "stores".';
    END IF;
END
$$;

-- 2. Coluna collaborator_results (resultados individuais dos colaboradores por mês)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'collaborator_results'
    ) THEN
        ALTER TABLE public.stores
        ADD COLUMN collaborator_results JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "collaborator_results" adicionada à tabela "stores" com sucesso.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna "collaborator_results" já existe na tabela "stores".';
    END IF;
END
$$;

-- 3. Coluna results_locks (bloqueio de edição por mês) - já deve existir, mas verificamos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'results_locks'
    ) THEN
        ALTER TABLE public.stores
        ADD COLUMN results_locks JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "results_locks" adicionada à tabela "stores" com sucesso.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna "results_locks" já existe na tabela "stores".';
    END IF;
END
$$;

-- Verificar estrutura das colunas criadas
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stores'
AND column_name IN ('store_results', 'collaborator_results', 'results_locks')
ORDER BY column_name;

-- Exemplo de estrutura esperada:
-- 
-- store_results = {
--   "2025-12": {
--     "conversao": 15.5,
--     "pa": 2.8,
--     "faturamento": 150000,
--     "prateleiraInfinita": 15000,
--     "ticketMedio": 250.50
--   }
-- }
--
-- collaborator_results = {
--   "2025-12": {
--     "collaborator_id_1": {
--       "faturamento": 1000,
--       "prateleiraInfinita": 500,
--       "pa": 2.5,
--       "ticketMedio": 200
--     }
--   }
-- }
--
-- results_locks = {
--   "2025-12": true,
--   "2025-11": false
-- }
























