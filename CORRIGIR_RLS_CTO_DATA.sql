-- ============================================
-- CORRIGIR RLS PARA PERMITIR UPDATE DE CTO_DATA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: VERIFICAR SE A COLUNA CTO_DATA EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stores' 
        AND column_name = 'cto_data'
    ) THEN
        -- Adicionar coluna cto_data como JSONB
        ALTER TABLE public.stores 
        ADD COLUMN cto_data JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE '✅ Coluna cto_data criada com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna cto_data já existe.';
    END IF;
END $$;

-- PASSO 2: VERIFICAR SE RLS ESTÁ HABILITADO
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'stores' 
        AND rowsecurity = true
    ) THEN
        -- Habilitar RLS na tabela stores
        ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado na tabela stores!';
    ELSE
        RAISE NOTICE 'ℹ️ RLS já está habilitado na tabela stores.';
    END IF;
END $$;

-- PASSO 3: REMOVER POLÍTICAS ANTIGAS DE CTO_DATA (SE EXISTIREM)
DROP POLICY IF EXISTS "Admin e financeiro podem atualizar cto_data" ON public.stores;
DROP POLICY IF EXISTS "Financeiro pode atualizar cto_data" ON public.stores;
DROP POLICY IF EXISTS "Admin pode atualizar cto_data" ON public.stores;

-- PASSO 4: CRIAR POLÍTICA PARA ADMIN ATUALIZAR CTO_DATA DE TODAS AS LOJAS
CREATE POLICY "Admin pode atualizar cto_data de todas as lojas"
ON public.stores
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.app_users 
        WHERE app_users.id = auth.uid()
        AND app_users.role::text = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.app_users 
        WHERE app_users.id = auth.uid()
        AND app_users.role::text = 'admin'
    )
);

-- PASSO 5: CRIAR POLÍTICA PARA FINANCEIRO ATUALIZAR CTO_DATA DE TODAS AS LOJAS
CREATE POLICY "Financeiro pode atualizar cto_data de todas as lojas"
ON public.stores
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.app_users 
        WHERE app_users.id = auth.uid()
        AND app_users.role::text = 'financeiro'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.app_users 
        WHERE app_users.id = auth.uid()
        AND app_users.role::text = 'financeiro'
    )
);

-- PASSO 6: VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'stores'
    AND policyname LIKE '%cto_data%'
ORDER BY policyname;

-- PASSO 7: VERIFICAR SE A COLUNA CTO_DATA EXISTE E ESTÁ CORRETA
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'cto_data';

-- PASSO 8: TESTE DE VERIFICAÇÃO
-- Execute esta query para verificar se você tem permissão:
-- SELECT id, name, code, cto_data FROM public.stores LIMIT 1;

-- PASSO 9: VERIFICAR ESTRUTURA DE UMA LOJA COM CTO_DATA
-- Execute esta query para ver um exemplo:
-- SELECT 
--     id,
--     name,
--     code,
--     cto_data,
--     jsonb_typeof(cto_data) as cto_data_type,
--     cto_data->'m2' as m2,
--     cto_data->'aluguelMin' as aluguel_min,
--     cto_data->'aluguelPercentual' as aluguel_percentual,
--     cto_data->'monthlySales' as monthly_sales,
--     cto_data->'monthlyBills' as monthly_bills
-- FROM public.stores
-- WHERE cto_data IS NOT NULL
-- LIMIT 5;

-- PASSO 10: MENSAGEM DE CONCLUSÃO
DO $$
BEGIN
    RAISE NOTICE '✅ Script executado com sucesso! Verifique as políticas criadas acima.';
END $$;

