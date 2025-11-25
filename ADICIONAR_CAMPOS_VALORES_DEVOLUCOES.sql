-- ============================================
-- ADICIONAR CAMPOS DE VALORES NAS TABELAS DE DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

DO $$
BEGIN
    -- Adicionar coluna 'nf_value' na tabela returns se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'returns' AND column_name = 'nf_value') THEN
        ALTER TABLE public.returns
        ADD COLUMN nf_value NUMERIC(10,2);
        
        CREATE INDEX IF NOT EXISTS idx_returns_nf_value ON public.returns(nf_value);
        
        RAISE NOTICE 'Coluna nf_value adicionada à tabela returns.';
    ELSE
        RAISE NOTICE 'Coluna nf_value já existe na tabela returns.';
    END IF;

    -- Adicionar coluna 'cost_value' na tabela physical_missing se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'cost_value') THEN
        ALTER TABLE public.physical_missing
        ADD COLUMN cost_value NUMERIC(10,2);
        
        CREATE INDEX IF NOT EXISTS idx_physical_missing_cost_value ON public.physical_missing(cost_value);
        
        RAISE NOTICE 'Coluna cost_value adicionada à tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna cost_value já existe na tabela physical_missing.';
    END IF;

    -- Ajustar coluna 'quantity' se não for nullable (caso precise)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'quantity' AND is_nullable = 'NO') THEN
        ALTER TABLE public.physical_missing
        ALTER COLUMN quantity DROP NOT NULL;
        
        RAISE NOTICE 'Coluna quantity agora é nullable na tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna quantity já é nullable ou não existe na tabela physical_missing.';
    END IF;

    -- Adicionar coluna 'total_value' na tabela physical_missing se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'physical_missing' AND column_name = 'total_value') THEN
        ALTER TABLE public.physical_missing
        ADD COLUMN total_value NUMERIC(10,2);
        
        CREATE INDEX IF NOT EXISTS idx_physical_missing_total_value ON public.physical_missing(total_value);
        
        RAISE NOTICE 'Coluna total_value adicionada à tabela physical_missing.';
    ELSE
        RAISE NOTICE 'Coluna total_value já existe na tabela physical_missing.';
    END IF;

END $$;

-- NOTA: Para registros existentes, as novas colunas NUMERIC serão NULL por padrão.
-- Os valores serão calculados automaticamente pelo frontend quando novos registros forem criados.





