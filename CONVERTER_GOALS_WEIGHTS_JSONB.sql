-- Converter campos goals e weights para JSONB (se necessário)
-- Este script garante que goals e weights sejam campos JSONB na tabela stores

DO $$
BEGIN
    -- ============================================
    -- VERIFICAR/CONVERTER CAMPO GOALS PARA JSONB
    -- ============================================
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'goals'
    ) THEN
        -- Verificar se já é JSONB
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'stores'
            AND column_name = 'goals'
            AND data_type = 'jsonb'
        ) THEN
            -- Converter para JSONB
            ALTER TABLE public.stores
            ALTER COLUMN goals TYPE JSONB USING 
                CASE 
                    WHEN goals IS NULL THEN '{}'::jsonb
                    WHEN goals::text = '' THEN '{}'::jsonb
                    ELSE goals::text::jsonb
                END;
            
            RAISE NOTICE '✅ Coluna "goals" convertida para JSONB.';
        ELSE
            RAISE NOTICE 'ℹ️ Coluna "goals" já é JSONB. Nenhuma alteração necessária.';
        END IF;
    ELSE
        -- Criar coluna goals como JSONB
        ALTER TABLE public.stores
        ADD COLUMN goals JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "goals" criada como JSONB.';
    END IF;

    -- ============================================
    -- VERIFICAR/CONVERTER CAMPO WEIGHTS PARA JSONB
    -- ============================================
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'stores'
        AND column_name = 'weights'
    ) THEN
        -- Verificar se já é JSONB
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'stores'
            AND column_name = 'weights'
            AND data_type = 'jsonb'
        ) THEN
            -- Converter para JSONB
            ALTER TABLE public.stores
            ALTER COLUMN weights TYPE JSONB USING 
                CASE 
                    WHEN weights IS NULL THEN '{}'::jsonb
                    WHEN weights::text = '' THEN '{}'::jsonb
                    ELSE weights::text::jsonb
                END;
            
            RAISE NOTICE '✅ Coluna "weights" convertida para JSONB.';
        ELSE
            RAISE NOTICE 'ℹ️ Coluna "weights" já é JSONB. Nenhuma alteração necessária.';
        END IF;
    ELSE
        -- Criar coluna weights como JSONB
        ALTER TABLE public.stores
        ADD COLUMN weights JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna "weights" criada como JSONB.';
    END IF;

END
$$;

-- Verificação final das colunas
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stores'
AND column_name IN ('goals', 'weights');
























