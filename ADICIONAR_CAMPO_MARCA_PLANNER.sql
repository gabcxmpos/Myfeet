-- ============================================
-- ADICIONAR CAMPO MARCA NA TABELA RETURNS_PLANNER
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar coluna marca na tabela returns_planner
ALTER TABLE public.returns_planner 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_returns_planner_brand ON public.returns_planner(brand);

-- Verificação
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'returns_planner'
    AND column_name = 'brand';





























