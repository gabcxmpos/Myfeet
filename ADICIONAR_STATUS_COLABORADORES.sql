-- Adiciona coluna status na tabela collaborators
-- Valores possíveis: 'ativo', 'ferias', 'afastado'
-- Padrão: 'ativo'

ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo' NOT NULL;

-- Adiciona constraint para garantir valores válidos
ALTER TABLE public.collaborators
DROP CONSTRAINT IF EXISTS collaborators_status_check;

ALTER TABLE public.collaborators
ADD CONSTRAINT collaborators_status_check 
CHECK (status IN ('ativo', 'ferias', 'afastado'));

-- Comentário na coluna
COMMENT ON COLUMN public.collaborators.status IS 'Status do colaborador: ativo, ferias ou afastado. Apenas colaboradores ativos contam no headcount.';






























