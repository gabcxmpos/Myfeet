-- ============================================
-- ADICIONAR CAMPO CAIXA ELEVADA NA TABELA RETURNS
-- Execute este script no Supabase SQL Editor
-- ============================================

DO $$
BEGIN
    -- Adicionar coluna 'caixa_elevada' na tabela returns se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'returns' 
        AND column_name = 'caixa_elevada'
    ) THEN
        ALTER TABLE public.returns
        ADD COLUMN caixa_elevada BOOLEAN NOT NULL DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_returns_caixa_elevada ON public.returns(caixa_elevada);
        
        RAISE NOTICE '✅ Coluna caixa_elevada adicionada à tabela returns.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna caixa_elevada já existe na tabela returns.';
    END IF;
END $$;

-- Verificar se a coluna foi criada corretamente
SELECT 
    'VERIFICAÇÃO' AS tipo,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null,
    column_default AS valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'returns'
    AND column_name = 'caixa_elevada';






















