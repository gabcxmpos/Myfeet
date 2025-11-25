-- ============================================
-- ADICIONAR CAMPOS SEPARADOS (SKU, COR, TAMANHO) NA TABELA physical_missing
-- Execute este script no Supabase SQL Editor
-- ============================================

DO $$
BEGIN
    -- Adicionar coluna 'sku' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'sku') THEN
        ALTER TABLE public.physical_missing
        ADD COLUMN sku TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_physical_missing_sku ON public.physical_missing(sku);
        
        RAISE NOTICE 'Coluna sku adicionada à tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna sku já existe na tabela physical_missing.';
    END IF;

    -- Adicionar coluna 'color' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'color') THEN
        ALTER TABLE public.physical_missing
        ADD COLUMN color TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_physical_missing_color ON public.physical_missing(color);
        
        RAISE NOTICE 'Coluna color adicionada à tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna color já existe na tabela physical_missing.';
    END IF;

    -- Adicionar coluna 'size' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'size') THEN
        ALTER TABLE public.physical_missing
        ADD COLUMN size TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_physical_missing_size ON public.physical_missing(size);
        
        RAISE NOTICE 'Coluna size adicionada à tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna size já existe na tabela physical_missing.';
    END IF;

END $$;

-- NOTA: Para registros existentes, as novas colunas TEXT serão NULL por padrão.
-- O campo sku_info existente será mantido para compatibilidade com dados antigos.
-- Novos registros devem preencher os campos separados (sku, color, size) para análises mais precisas.





