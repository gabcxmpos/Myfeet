-- ============================================
-- ADICIONAR ROLE "digital" AO ENUM user_role
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se o enum user_role existe e quais valores ele possui
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- PASSO 2: Adicionar o valor "digital" ao enum user_role
-- IMPORTANTE: No PostgreSQL, ALTER TYPE ADD VALUE deve ser executado em uma transação separada
-- Por isso, vamos usar uma abordagem que verifica primeiro se já existe

-- Verificar e adicionar o valor ao enum (se não existir)
DO $$ 
BEGIN
    -- Verificar se o valor já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'digital' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        -- Adicionar o valor ao enum
        -- Nota: Em algumas versões do PostgreSQL, isso precisa ser executado separadamente
        EXECUTE 'ALTER TYPE user_role ADD VALUE ''digital''';
        RAISE NOTICE '✅ Valor "digital" adicionado ao enum user_role';
    ELSE
        RAISE NOTICE 'ℹ️ Valor "digital" já existe no enum user_role';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ Valor "digital" já existe no enum user_role';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao adicionar valor ao enum: %', SQLERRM;
        RAISE NOTICE 'ℹ️ Tentando verificar se a coluna é do tipo TEXT com constraint CHECK...';
END $$;

-- PASSO 3: Se o enum não funcionar, verificar se há constraint CHECK na coluna role
-- e atualizá-la para incluir 'digital'
DO $$
DECLARE
    constraint_rec RECORD;
    constraint_def TEXT;
    new_constraint_def TEXT;
BEGIN
    -- Procurar por constraints CHECK na coluna role
    FOR constraint_rec IN
        SELECT 
            conname,
            pg_get_constraintdef(oid) AS constraint_def
        FROM pg_constraint
        WHERE conrelid = 'public.app_users'::regclass
            AND contype = 'c'
            AND (pg_get_constraintdef(oid) LIKE '%role%' OR conname LIKE '%role%')
    LOOP
        constraint_def := constraint_rec.constraint_def;
        
        -- Se a constraint não incluir 'digital', vamos recriá-la
        IF constraint_def NOT LIKE '%digital%' THEN
            -- Remover a constraint antiga
            EXECUTE format('ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
            
            -- Criar nova constraint incluindo 'digital'
            -- Verificar se já existe uma constraint com esse nome
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'app_users_role_check' 
                AND conrelid = 'public.app_users'::regclass
            ) THEN
                -- Tentar criar a constraint com todos os roles conhecidos
                ALTER TABLE public.app_users 
                ADD CONSTRAINT app_users_role_check 
                CHECK (role IN (
                    'admin', 
                    'supervisor', 
                    'supervisor_franquia',
                    'loja', 
                    'loja_franquia',
                    'admin_loja',
                    'colaborador',
                    'devoluções', 
                    'comunicação',
                    'financeiro',
                    'rh',
                    'motorista',
                    'digital',
                    'user'
                ));
                
                RAISE NOTICE '✅ Constraint atualizada para incluir "digital"';
            END IF;
        ELSE
            RAISE NOTICE 'ℹ️ Constraint já inclui "digital"';
        END IF;
    END LOOP;
    
    -- Se não encontrou nenhuma constraint, pode ser que a coluna seja do tipo enum
    -- e o valor precisa ser adicionado diretamente (o que foi feito no PASSO 2)
    IF NOT FOUND THEN
        RAISE NOTICE 'ℹ️ Nenhuma constraint CHECK encontrada. A coluna provavelmente usa enum.';
    END IF;
END $$;

-- PASSO 4: Verificar novamente os valores do enum após a alteração
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- PASSO 5: Verificar a estrutura da coluna role na tabela app_users
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'app_users' 
    AND column_name = 'role';

-- PASSO 6: Verificação final
SELECT 
    '✅ SCRIPT CONCLUÍDO' AS status,
    'Verifique se o valor "digital" foi adicionado corretamente' AS mensagem,
    'Agora você pode criar usuários com o perfil "digital"' AS proximo_passo;





















