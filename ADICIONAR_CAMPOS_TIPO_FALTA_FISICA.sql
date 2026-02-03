-- ============================================
-- ADICIONAR CAMPOS DE TIPO PARA FALTA FÍSICA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar campo para tipo de falta física (FALTA FISICA, DIVERGENCIA NF X FISICO, SOBRA)
-- Usar JSONB para armazenar array de tipos selecionados
ALTER TABLE public.physical_missing 
ADD COLUMN IF NOT EXISTS missing_type JSONB;

-- Adicionar campos para divergência (o que faltou)
ALTER TABLE public.physical_missing 
ADD COLUMN IF NOT EXISTS divergence_missing_brand TEXT,
ADD COLUMN IF NOT EXISTS divergence_missing_sku TEXT,
ADD COLUMN IF NOT EXISTS divergence_missing_color TEXT,
ADD COLUMN IF NOT EXISTS divergence_missing_size TEXT,
ADD COLUMN IF NOT EXISTS divergence_missing_quantity INTEGER,
ADD COLUMN IF NOT EXISTS divergence_missing_cost_value DECIMAL(10, 2);

-- Adicionar campos para divergência (o que sobrou no lugar)
ALTER TABLE public.physical_missing 
ADD COLUMN IF NOT EXISTS divergence_surplus_brand TEXT,
ADD COLUMN IF NOT EXISTS divergence_surplus_sku TEXT,
ADD COLUMN IF NOT EXISTS divergence_surplus_color TEXT,
ADD COLUMN IF NOT EXISTS divergence_surplus_size TEXT,
ADD COLUMN IF NOT EXISTS divergence_surplus_quantity INTEGER,
ADD COLUMN IF NOT EXISTS divergence_surplus_cost_value DECIMAL(10, 2);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_physical_missing_type ON public.physical_missing(missing_type);

-- Verificação
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'physical_missing'
    AND (column_name LIKE 'missing_type%' OR column_name LIKE 'divergence%')
ORDER BY ordinal_position;

