-- ============================================
-- PASSO 1: ADICIONAR ROLE "devoluções"
-- Execute este script PRIMEIRO no Supabase SQL Editor
-- ============================================

-- IMPORTANTE: No PostgreSQL, ALTER TYPE ADD VALUE deve ser executado 
-- em uma transação separada. Execute este comando PRIMEIRO:

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'devoluções';

-- Se o comando acima der erro dizendo que não pode ser executado em transação,
-- execute APENAS esta linha em uma nova query separada (sem o IF NOT EXISTS):

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

-- Se você ver 'devoluções' na lista, o passo 1 foi concluído com sucesso!

