-- Script para adicionar a coluna gerencialTasks à tabela daily_checklists
-- Esta coluna armazena as tarefas do checklist gerencial (PPAD Gerencial)

-- Verificar se a coluna já existe antes de adicionar
DO $$
BEGIN
    -- Adicionar coluna gerencialTasks como JSONB se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'daily_checklists' 
        AND column_name = 'gerencialTasks'
    ) THEN
        ALTER TABLE public.daily_checklists 
        ADD COLUMN "gerencialTasks" JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Coluna gerencialTasks adicionada com sucesso à tabela daily_checklists';
    ELSE
        RAISE NOTICE 'Coluna gerencialTasks já existe na tabela daily_checklists';
    END IF;
END $$;

-- Verificar a estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'daily_checklists'
ORDER BY ordinal_position;








