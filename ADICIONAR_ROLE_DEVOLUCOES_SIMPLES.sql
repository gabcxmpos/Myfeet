-- ============================================
-- ADICIONAR ROLE "devoluções" AO ENUM user_role
-- Execute este script no Supabase SQL Editor
-- ============================================

-- IMPORTANTE: No PostgreSQL, ALTER TYPE ADD VALUE deve ser executado 
-- em uma transação separada. Execute este comando PRIMEIRO:

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'devoluções';

-- Se o comando acima der erro dizendo que não pode ser executado em transação,
-- execute APENAS esta linha em uma nova query separada (sem o DO $$):

-- ALTER TYPE user_role ADD VALUE 'devoluções';

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

-- 2. Se encontrar uma constraint, remova-a e recrie com 'devoluções' incluído
-- (Substitua 'nome_da_constraint' pelo nome real encontrado acima)
-- ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS nome_da_constraint;
-- ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check 
-- CHECK (role IN ('admin', 'supervisor', 'loja', 'devoluções', 'user'));






























