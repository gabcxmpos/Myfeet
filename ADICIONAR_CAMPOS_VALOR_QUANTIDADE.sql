-- ============================================
-- ADICIONAR CAMPOS VALOR E QUANTIDADE
-- Execute este script no Supabase SQL Editor
-- (Se a tabela já foi criada anteriormente)
-- ============================================

-- Adicionar coluna de valor da devolução
ALTER TABLE public.returns_planner 
ADD COLUMN IF NOT EXISTS return_value DECIMAL(10, 2);

-- Adicionar coluna de quantidade de itens
ALTER TABLE public.returns_planner 
ADD COLUMN IF NOT EXISTS items_quantity INTEGER;

-- ============================================
-- Verificação: Listar as colunas da tabela
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'returns_planner'
    AND column_name IN ('return_value', 'items_quantity')
ORDER BY ordinal_position;






























