-- Script para adicionar colunas de auditoria na tabela daily_checklists
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna is_audited (se não existir)
ALTER TABLE daily_checklists 
ADD COLUMN IF NOT EXISTS is_audited BOOLEAN DEFAULT FALSE;

-- Adicionar coluna audited_by (se não existir)
-- Esta coluna armazena o ID do usuário que fez a auditoria
ALTER TABLE daily_checklists 
ADD COLUMN IF NOT EXISTS audited_by UUID REFERENCES auth.users(id);

-- Adicionar coluna audited_at (se não existir)
-- Esta coluna armazena a data/hora em que a auditoria foi realizada
ALTER TABLE daily_checklists 
ADD COLUMN IF NOT EXISTS audited_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance nas consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_daily_checklists_is_audited 
ON daily_checklists(is_audited) 
WHERE is_audited = true;

CREATE INDEX IF NOT EXISTS idx_daily_checklists_audited_by 
ON daily_checklists(audited_by);

CREATE INDEX IF NOT EXISTS idx_daily_checklists_audited_at 
ON daily_checklists(audited_at);

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_checklists' 
AND column_name IN ('is_audited', 'audited_by', 'audited_at')
ORDER BY column_name;
