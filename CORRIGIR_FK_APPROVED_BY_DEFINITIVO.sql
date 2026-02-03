-- ============================================
-- CORRIGIR FOREIGN KEY DA COLUNA approved_by - VERSÃO DEFINITIVA
-- Remove completamente e recria a constraint corretamente
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar estado ANTES da correção
SELECT
    'ANTES DA CORREÇÃO' AS status,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'evaluations'
AND tc.constraint_name = 'evaluations_approved_by_fkey';

-- PASSO 2: Remover constraint de forma FORÇADA (usando CASCADE para remover dependências)
ALTER TABLE public.evaluations
DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey CASCADE;

-- PASSO 3: Aguardar um momento para garantir que a remoção foi processada
DO $$
BEGIN
    PERFORM pg_sleep(0.5); -- Aguarda meio segundo
    RAISE NOTICE '✅ Constraint removida. Aguardando processamento...';
END
$$;

-- PASSO 4: Verificar se a coluna existe, se não existir, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'evaluations'
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE public.evaluations
        ADD COLUMN approved_by UUID;
        
        RAISE NOTICE '✅ Coluna approved_by criada.';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna approved_by já existe.';
    END IF;
END
$$;

-- PASSO 5: Remover índice relacionado se existir (pode estar causando conflito)
DROP INDEX IF EXISTS public.idx_evaluations_approved_by;

-- PASSO 6: CRIAR A FOREIGN KEY CORRETA - Usando método direto
-- IMPORTANTE: Referenciar explicitamente auth.users(id)
ALTER TABLE public.evaluations
ADD CONSTRAINT evaluations_approved_by_fkey
FOREIGN KEY (approved_by)
REFERENCES auth.users(id)
ON DELETE SET NULL
NOT DEFERRABLE;

-- PASSO 7: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_evaluations_approved_by 
ON public.evaluations(approved_by);

-- PASSO 8: Verificar se foi criada CORRETAMENTE agora
SELECT
    'DEPOIS DA CORREÇÃO' AS status,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name = 'users' AND ccu.table_schema = 'auth' THEN '✅ SUCESSO - Foreign key corretamente configurada!'
        WHEN ccu.table_name IS NULL THEN '❌ ERRO - Foreign key ainda está NULL'
        ELSE '⚠️ ATENÇÃO - Verifique a configuração'
    END AS resultado
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'evaluations'
AND tc.constraint_name = 'evaluations_approved_by_fkey';

-- PASSO 9: Verificação ALTERNATIVA usando pg_constraint (mais direto)
SELECT
    'VERIFICAÇÃO ALTERNATIVA' AS tipo,
    conname AS constraint_name,
    confrelid::regclass AS foreign_table,
    a.attname AS foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = ANY(c.confkey)
WHERE conrelid = 'public.evaluations'::regclass
AND conname = 'evaluations_approved_by_fkey';

-- PASSO 10: Se ainda não funcionar, tentar via pg_constraint diretamente
DO $$
DECLARE
    constraint_exists BOOLEAN;
    has_correct_reference BOOLEAN;
BEGIN
    -- Verificar se constraint existe
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'evaluations_approved_by_fkey'
        AND conrelid = 'public.evaluations'::regclass
    ) INTO constraint_exists;
    
    -- Verificar se tem referência correta
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = ANY(c.confkey)
        WHERE c.conname = 'evaluations_approved_by_fkey'
        AND c.conrelid = 'public.evaluations'::regclass
        AND c.confrelid = 'auth.users'::regclass
        AND a.attname = 'id'
    ) INTO has_correct_reference;
    
    IF constraint_exists AND NOT has_correct_reference THEN
        RAISE NOTICE '⚠️ Constraint existe mas referência está incorreta. Removendo e recriando...';
        
        -- Remover via pg_constraint se necessário
        EXECUTE 'ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_approved_by_fkey CASCADE';
        
        -- Recriar
        EXECUTE 'ALTER TABLE public.evaluations 
                 ADD CONSTRAINT evaluations_approved_by_fkey
                 FOREIGN KEY (approved_by)
                 REFERENCES auth.users(id)
                 ON DELETE SET NULL';
        
        RAISE NOTICE '✅ Constraint recriada.';
    ELSIF NOT constraint_exists THEN
        RAISE NOTICE '⚠️ Constraint não existe. Criando...';
        
        EXECUTE 'ALTER TABLE public.evaluations 
                 ADD CONSTRAINT evaluations_approved_by_fkey
                 FOREIGN KEY (approved_by)
                 REFERENCES auth.users(id)
                 ON DELETE SET NULL';
        
        RAISE NOTICE '✅ Constraint criada.';
    ELSE
        RAISE NOTICE '✅ Constraint já está corretamente configurada!';
    END IF;
END
$$;

-- PASSO 11: Verificação FINAL usando ambos os métodos
SELECT
    'VERIFICAÇÃO FINAL - information_schema' AS metodo,
    tc.constraint_name,
    ccu.table_schema AS schema_referenciado,
    ccu.table_name AS tabela_referenciada,
    ccu.column_name AS coluna_referenciada
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'evaluations'
AND tc.constraint_name = 'evaluations_approved_by_fkey'
UNION ALL
SELECT
    'VERIFICAÇÃO FINAL - pg_constraint' AS metodo,
    conname AS constraint_name,
    nsp.nspname AS schema_referenciado,
    rel.relname AS tabela_referenciada,
    a.attname AS coluna_referenciada
FROM pg_constraint c
JOIN pg_class rel ON rel.oid = c.confrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = ANY(c.confkey)
WHERE c.conrelid = 'public.evaluations'::regclass
AND c.conname = 'evaluations_approved_by_fkey';

-- PASSO 12: Garantir política RLS para admin e supervisor
DROP POLICY IF EXISTS "Admin e supervisor podem atualizar avaliações" ON public.evaluations;

CREATE POLICY "Admin e supervisor podem atualizar avaliações"
ON public.evaluations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.app_users
        WHERE app_users.id = auth.uid()
        AND app_users.role IN ('admin', 'supervisor')
    )
);

-- ✅ Script concluído! 
-- Verifique o PASSO 8 e PASSO 11 para confirmar que foreign_table_name = 'users' e foreign_table_schema = 'auth'





























