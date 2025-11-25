-- ============================================
-- ADICIONAR CAMPO DATA DE EMISSÃO DA NF
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar coluna nf_emission_date na tabela returns
ALTER TABLE public.returns
ADD COLUMN IF NOT EXISTS nf_emission_date DATE;

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN public.returns.nf_emission_date IS 'Data de emissão da Nota Fiscal';

-- Atualizar colunas existentes sem data de emissão para NULL (não obrigatório para registros antigos)
-- Isso garante que registros antigos continuem funcionando

-- Criar índice para melhorar performance em buscas por data de emissão (opcional)
CREATE INDEX IF NOT EXISTS idx_returns_nf_emission_date ON public.returns(nf_emission_date);

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'returns' 
    AND column_name = 'nf_emission_date';






