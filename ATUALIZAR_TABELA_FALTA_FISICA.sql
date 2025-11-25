-- ============================================
-- ATUALIZAR TABELA DE FALTA FÍSICA COM NOVOS CAMPOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar novas colunas na tabela physical_missing
ALTER TABLE public.physical_missing
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS nf_number TEXT,
ADD COLUMN IF NOT EXISTS sku_info TEXT,
ADD COLUMN IF NOT EXISTS moved_to_defect BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentários nas colunas para documentação
COMMENT ON COLUMN public.physical_missing.brand IS 'Marca do produto com falta física';
COMMENT ON COLUMN public.physical_missing.nf_number IS 'Número da Nota Fiscal';
COMMENT ON COLUMN public.physical_missing.sku_info IS 'Informações de SKU/COR/TAMANHO/QTD FALTANTE';
COMMENT ON COLUMN public.physical_missing.moved_to_defect IS 'Indica se o produto foi movimentado para defeito';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_physical_missing_brand ON public.physical_missing(brand);
CREATE INDEX IF NOT EXISTS idx_physical_missing_nf_number ON public.physical_missing(nf_number);
CREATE INDEX IF NOT EXISTS idx_physical_missing_moved_to_defect ON public.physical_missing(moved_to_defect);

-- Atualizar registros existentes (opcional - apenas se necessário)
-- Se quiser migrar dados antigos para os novos campos, adicione comandos UPDATE aqui
-- Exemplo:
-- UPDATE public.physical_missing 
-- SET brand = 'N/A', nf_number = 'N/A', sku_info = COALESCE(product_name, '') || ' - ' || COALESCE(product_code, '') || ' - QTD: ' || COALESCE(quantity::text, '0')
-- WHERE brand IS NULL OR nf_number IS NULL OR sku_info IS NULL;

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'physical_missing' 
    AND column_name IN ('brand', 'nf_number', 'sku_info', 'moved_to_defect')
ORDER BY column_name;






