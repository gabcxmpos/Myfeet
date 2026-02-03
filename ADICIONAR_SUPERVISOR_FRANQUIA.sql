-- ============================================
-- ADICIONAR 'supervisor_franquia' E 'loja_franquia' AO ENUM user_role
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Verificar se o enum user_role existe e listar valores atuais
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- IMPORTANTE: Execute cada comando ALTER TYPE em uma query separada se necessário
-- Alguns comandos de alteração de enum precisam ser executados em transações separadas

-- 1. Adicionar 'supervisor_franquia' ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supervisor_franquia';

-- 2. Adicionar 'loja_franquia' ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'loja_franquia';

-- Verificar novamente para confirmar que foi adicionado
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

-- 2. Se encontrar uma constraint, remova-a e recrie com supervisor_franquia e loja_franquia incluídos
-- (Substitua 'nome_da_constraint' pelo nome real encontrado acima)
-- ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS nome_da_constraint;
-- ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check 
-- CHECK (role IN ('admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'colaborador', 'admin_loja', 'devoluções', 'comunicação', 'financeiro', 'rh', 'motorista', 'user'));

