-- ============================================
-- SCRIPT DE VERIFICAÇÃO - TABELAS DE DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor para verificar se tudo está criado
-- ============================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
    missing_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICAÇÃO DE TABELAS E COLUNAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Verificar tabela returns
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'returns'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela "returns" existe';
        
        -- Verificar colunas da tabela returns
        -- Colunas obrigatórias
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'returns' 
            AND column_name = 'nf_emission_date'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'returns.nf_emission_date');
            RAISE NOTICE '  ❌ Coluna "nf_emission_date" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "nf_emission_date" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'returns' 
            AND column_name = 'nf_value'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'returns.nf_value');
            RAISE NOTICE '  ❌ Coluna "nf_value" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "nf_value" existe';
        END IF;
    ELSE
        missing_items := array_append(missing_items, 'Tabela returns');
        RAISE NOTICE '❌ Tabela "returns" NÃO existe';
    END IF;
    
    RAISE NOTICE '';

    -- Verificar tabela returns_status_history
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'returns_status_history'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela "returns_status_history" existe';
    ELSE
        missing_items := array_append(missing_items, 'Tabela returns_status_history');
        RAISE NOTICE '❌ Tabela "returns_status_history" NÃO existe';
    END IF;
    
    RAISE NOTICE '';

    -- Verificar tabela physical_missing
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'physical_missing'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela "physical_missing" existe';
        
        -- Verificar colunas da tabela physical_missing
        -- Campos novos
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'brand'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.brand');
            RAISE NOTICE '  ❌ Coluna "brand" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "brand" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'nf_number'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.nf_number');
            RAISE NOTICE '  ❌ Coluna "nf_number" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "nf_number" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'sku'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.sku');
            RAISE NOTICE '  ❌ Coluna "sku" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "sku" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'color'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.color');
            RAISE NOTICE '  ❌ Coluna "color" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "color" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'size'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.size');
            RAISE NOTICE '  ❌ Coluna "size" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "size" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'cost_value'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.cost_value');
            RAISE NOTICE '  ❌ Coluna "cost_value" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "cost_value" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'total_value'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.total_value');
            RAISE NOTICE '  ❌ Coluna "total_value" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "total_value" existe';
        END IF;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'physical_missing' 
            AND column_name = 'moved_to_defect'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            missing_items := array_append(missing_items, 'physical_missing.moved_to_defect');
            RAISE NOTICE '  ❌ Coluna "moved_to_defect" NÃO existe';
        ELSE
            RAISE NOTICE '  ✅ Coluna "moved_to_defect" existe';
        END IF;
        
        -- Verificar se product_name e quantity são nullable
        SELECT is_nullable = 'YES' INTO column_exists
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'physical_missing' 
        AND column_name = 'product_name';
        
        IF NOT column_exists THEN
            RAISE NOTICE '  ⚠️  Coluna "product_name" ainda é NOT NULL (deve ser nullable)';
        ELSE
            RAISE NOTICE '  ✅ Coluna "product_name" é nullable';
        END IF;
        
    ELSE
        missing_items := array_append(missing_items, 'Tabela physical_missing');
        RAISE NOTICE '❌ Tabela "physical_missing" NÃO existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    
    IF array_length(missing_items, 1) IS NULL THEN
        RAISE NOTICE '✅ TUDO ESTÁ CRIADO CORRETAMENTE!';
    ELSE
        RAISE NOTICE '❌ ITENS FALTANDO:';
        FOR i IN 1..array_length(missing_items, 1) LOOP
            RAISE NOTICE '   - %', missing_items[i];
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE 'Execute os scripts SQL correspondentes para criar os itens faltantes.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Verificar índices
SELECT 
    'Índices da tabela returns:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'returns'
ORDER BY indexname;

SELECT 
    'Índices da tabela physical_missing:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename = 'physical_missing'
ORDER BY indexname;

-- Verificar políticas RLS
SELECT 
    'Políticas RLS da tabela returns:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'returns'
ORDER BY policyname;

SELECT 
    'Políticas RLS da tabela physical_missing:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'physical_missing'
ORDER BY policyname;






