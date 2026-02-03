-- ============================================
-- MIGRAR STATUS 'movimentado' PARA 'estoque_falta_fisica'
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Verificar quantos registros têm o status 'movimentado'
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.physical_missing
WHERE status = 'movimentado'
GROUP BY status;

-- Atualizar todos os registros com status 'movimentado' para 'estoque_falta_fisica'
UPDATE public.physical_missing
SET status = 'estoque_falta_fisica'
WHERE status = 'movimentado';

-- Verificar se a atualização foi bem-sucedida
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.physical_missing
GROUP BY status
ORDER BY status;

-- Verificar se ainda há registros com status 'movimentado' (não deveria haver)
SELECT 
    COUNT(*) as registros_com_status_antigo
FROM public.physical_missing
WHERE status = 'movimentado';























