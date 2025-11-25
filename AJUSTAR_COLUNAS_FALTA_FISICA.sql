-- ============================================
-- AJUSTAR COLUNAS ANTIGAS DA TABELA DE FALTA FÍSICA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Tornar colunas antigas nullable para permitir uso apenas dos novos campos
ALTER TABLE public.physical_missing
ALTER COLUMN product_name DROP NOT NULL,
ALTER COLUMN quantity DROP NOT NULL;

-- Atualizar coluna quantity para permitir NULL e remover default se necessário
ALTER TABLE public.physical_missing
ALTER COLUMN quantity SET DEFAULT NULL;

-- Verificar se as alterações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'physical_missing' 
    AND column_name IN ('product_name', 'quantity', 'brand', 'nf_number', 'sku_info', 'moved_to_defect')
ORDER BY column_name;







