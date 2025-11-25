-- ============================================
-- ADICIONAR CAMPO DE BLOQUEIO DE INSCRIÇÕES EM TREINAMENTOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar coluna registrations_blocked na tabela trainings
ALTER TABLE public.trainings
ADD COLUMN IF NOT EXISTS registrations_blocked BOOLEAN NOT NULL DEFAULT false;

-- Adicionar comentário na coluna para documentação
COMMENT ON COLUMN public.trainings.registrations_blocked IS 'Indica se as inscrições para este treinamento estão bloqueadas';

-- Criar índice para melhorar performance em buscas por bloqueio (opcional)
CREATE INDEX IF NOT EXISTS idx_trainings_registrations_blocked ON public.trainings(registrations_blocked);

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'trainings' 
    AND column_name = 'registrations_blocked';






