-- ============================================
-- CORRIGIR CONSTRAINT DE STATUS DA TABELA physical_missing
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Execute os passos na ordem apresentada
-- ============================================

-- PASSO 1: Verificar a constraint atual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.physical_missing'::regclass
    AND contype = 'c'
    AND (pg_get_constraintdef(oid) LIKE '%status%' OR conname LIKE '%status%');

-- PASSO 2: Verificar quantos registros têm o status 'movimentado' (ANTES de remover a constraint)
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.physical_missing
WHERE status = 'movimentado'
GROUP BY status;

-- PASSO 3: Remover a constraint antiga temporariamente para permitir a migração
ALTER TABLE public.physical_missing 
DROP CONSTRAINT IF EXISTS physical_missing_status_check;

-- PASSO 4: Migrar todos os registros com status 'movimentado' para 'estoque_falta_fisica'
UPDATE public.physical_missing
SET status = 'estoque_falta_fisica'
WHERE status = 'movimentado';

-- PASSO 5: Verificar se a migração foi bem-sucedida (não deve haver mais registros com 'movimentado')
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.physical_missing
GROUP BY status
ORDER BY status;

-- PASSO 6: Criar nova constraint com o status 'estoque_falta_fisica' incluído
ALTER TABLE public.physical_missing 
ADD CONSTRAINT physical_missing_status_check 
CHECK (status IN ('processo_aberto', 'estoque_falta_fisica', 'nota_finalizada'));

-- PASSO 7: Verificar se a constraint foi criada corretamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.physical_missing'::regclass
    AND contype = 'c'
    AND (pg_get_constraintdef(oid) LIKE '%status%' OR conname LIKE '%status%');

-- PASSO 8: Verificação final - confirmar que não há mais registros com status inválido
SELECT 
    COUNT(*) as registros_com_status_invalido
FROM public.physical_missing
WHERE status NOT IN ('processo_aberto', 'estoque_falta_fisica', 'nota_finalizada');

