-- ============================================
-- ADICIONAR ROLES ADICIONAIS AO ENUM user_role
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar os novos valores ao enum user_role
-- IMPORTANTE: Execute cada comando ALTER TYPE em uma query separada se necessário

-- 1. Adicionar 'comunicação'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comunicação';

-- 2. Adicionar 'financeiro'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'financeiro';

-- 3. Adicionar 'rh'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'rh';

-- 4. Adicionar 'motorista'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'motorista';

-- ============================================
-- Verificação: Listar todos os valores do enum
-- ============================================
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- ============================================
-- Se a coluna role NÃO for um enum mas sim TEXT com constraint CHECK,
-- execute os comandos abaixo:
-- ============================================

-- 1. Verificar se há constraint CHECK na coluna role
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
    AND contype = 'c'
    AND (pg_get_constraintdef(oid) LIKE '%role%' OR conname LIKE '%role%');

-- 2. Se encontrar uma constraint, remova-a e recrie com os novos roles incluídos
-- (Substitua 'nome_da_constraint' pelo nome real encontrado acima)
-- ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS nome_da_constraint;
-- ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check 
-- CHECK (role IN ('admin', 'supervisor', 'loja', 'devoluções', 'comunicação', 'financeiro', 'rh', 'motorista', 'user'));

