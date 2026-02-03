-- ============================================
-- CORREÇÃO RÁPIDA: Adicionar "OUTROS" à constraint
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Remover a constraint antiga
ALTER TABLE public.non_conversion_records 
DROP CONSTRAINT IF EXISTS non_conversion_records_situacao_check;

-- Adicionar a nova constraint com "OUTROS"
ALTER TABLE public.non_conversion_records
ADD CONSTRAINT non_conversion_records_situacao_check 
CHECK (situacao IN ('GRADE', 'PREÇO', 'PRODUTO', 'OUTROS'));

-- Verificar se funcionou
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.non_conversion_records'::regclass
AND conname = 'non_conversion_records_situacao_check';


