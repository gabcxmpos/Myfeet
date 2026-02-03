-- Script para adicionar campo results_locks (JSONB) na tabela stores
-- Este campo armazena o estado de bloqueio de edição de resultados por mês

-- Verificar se a coluna já existe e adicionar se não existir
DO $$
BEGIN
    -- Verificar se a coluna results_locks existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stores' 
        AND column_name = 'results_locks'
    ) THEN
        -- Adicionar coluna results_locks como JSONB com valor padrão {}
        ALTER TABLE public.stores 
        ADD COLUMN results_locks JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna results_locks adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna results_locks já existe.';
    END IF;
END $$;

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'stores'
AND column_name = 'results_locks';

-- Exemplo de uso:
-- Para bloquear resultados de dezembro de 2025:
-- UPDATE stores SET results_locks = jsonb_set(
--     COALESCE(results_locks, '{}'::jsonb),
--     '{2025-12}',
--     'true'::jsonb
-- );
--
-- Para desbloquear:
-- UPDATE stores SET results_locks = jsonb_set(
--     COALESCE(results_locks, '{}'::jsonb),
--     '{2025-12}',
--     'false'::jsonb
-- );
























