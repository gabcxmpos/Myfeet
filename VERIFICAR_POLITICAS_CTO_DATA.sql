-- ============================================
-- VERIFICAR POLÍTICAS RLS PARA CTO_DATA
-- Execute este script para verificar se tudo está configurado corretamente
-- ============================================

-- 1. Verificar se a coluna cto_data existe
SELECT 
    'Coluna cto_data' AS verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'stores' 
            AND column_name = 'cto_data'
        ) THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END AS status,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'cto_data';

-- 2. Verificar se RLS está habilitado
SELECT 
    'RLS Habilitado' AS verificacao,
    CASE 
        WHEN rowsecurity = true THEN '✅ HABILITADO'
        ELSE '❌ DESABILITADO'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'stores';

-- 3. Verificar políticas RLS para cto_data
SELECT 
    'Políticas RLS' AS verificacao,
    policyname AS nome_politica,
    cmd AS comando,
    roles AS roles_permitidos,
    CASE 
        WHEN policyname LIKE '%cto_data%' THEN '✅ POLÍTICA CTO_DATA'
        ELSE '⚠️ OUTRA POLÍTICA'
    END AS tipo
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'stores'
ORDER BY 
    CASE 
        WHEN policyname LIKE '%cto_data%' THEN 1
        ELSE 2
    END,
    policyname;

-- 4. Verificar se existem políticas específicas para admin e financeiro
SELECT 
    'Políticas Admin/Financeiro' AS verificacao,
    COUNT(*) AS total_politicas,
    STRING_AGG(policyname, ', ') AS politicas_encontradas
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'stores'
    AND (
        (policyname LIKE '%admin%' AND policyname LIKE '%cto_data%')
        OR (policyname LIKE '%financeiro%' AND policyname LIKE '%cto_data%')
        OR policyname LIKE '%Admin pode atualizar cto_data%'
        OR policyname LIKE '%Financeiro pode atualizar cto_data%'
    )
    AND cmd = 'UPDATE';

-- 5. Verificar estrutura de uma loja com cto_data (se houver dados)
SELECT 
    'Dados de Exemplo' AS verificacao,
    COUNT(*) AS total_lojas_com_cto_data,
    COUNT(CASE WHEN cto_data IS NOT NULL AND cto_data != '{}'::jsonb THEN 1 END) AS lojas_com_dados_preenchidos
FROM public.stores;

-- 6. Exemplo de estrutura de cto_data (se houver) - Versão simplificada
SELECT 
    id,
    name,
    code,
    jsonb_typeof(cto_data) as tipo_dados,
    cto_data->'m2' as m2,
    cto_data->'aluguelMin' as aluguel_min,
    cto_data->'aluguelPercentual' as aluguel_percentual,
    CASE 
        WHEN cto_data->'monthlySales' IS NOT NULL AND cto_data->'monthlySales' != '{}'::jsonb 
        THEN 'Tem vendas cadastradas'
        ELSE 'Sem vendas'
    END as status_vendas,
    CASE 
        WHEN cto_data->'monthlyBills' IS NOT NULL AND cto_data->'monthlyBills' != '{}'::jsonb
        THEN 'Tem boletos cadastrados'
        ELSE 'Sem boletos'
    END as status_boletos
FROM public.stores
WHERE cto_data IS NOT NULL 
    AND cto_data != '{}'::jsonb
LIMIT 5;

-- 6B. Ver meses específicos com vendas (se houver)
SELECT 
    s.id,
    s.name,
    meses_vendas.key as mes_vendas
FROM public.stores s
CROSS JOIN LATERAL jsonb_object_keys(s.cto_data->'monthlySales') AS meses_vendas(key)
WHERE s.cto_data IS NOT NULL 
    AND s.cto_data->'monthlySales' IS NOT NULL
    AND s.cto_data->'monthlySales' != '{}'::jsonb
LIMIT 20;

-- 6C. Ver meses específicos com boletos (se houver)
SELECT 
    s.id,
    s.name,
    meses_boletos.key as mes_boletos
FROM public.stores s
CROSS JOIN LATERAL jsonb_object_keys(s.cto_data->'monthlyBills') AS meses_boletos(key)
WHERE s.cto_data IS NOT NULL 
    AND s.cto_data->'monthlyBills' IS NOT NULL
    AND s.cto_data->'monthlyBills' != '{}'::jsonb
LIMIT 20;

-- 7. Verificar usuário atual e permissões
SELECT 
    'Usuário Atual' AS verificacao,
    auth.uid() AS user_id,
    au.username,
    au.role,
    au.store_id,
    CASE 
        WHEN au.role::text IN ('admin', 'financeiro') THEN '✅ TEM PERMISSÃO PARA CTO_DATA'
        ELSE '❌ SEM PERMISSÃO PARA CTO_DATA'
    END AS permissao_cto
FROM public.app_users au
WHERE au.id = auth.uid();

-- RESUMO FINAL
SELECT 
    'RESUMO' AS tipo,
    'Coluna cto_data criada' AS item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'stores' 
            AND column_name = 'cto_data'
        ) THEN '✅ OK'
        ELSE '❌ FALTA CRIAR'
    END AS status
UNION ALL
SELECT 
    'RESUMO',
    'RLS habilitado',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'stores' 
            AND rowsecurity = true
        ) THEN '✅ OK'
        ELSE '❌ FALTA HABILITAR'
    END
UNION ALL
SELECT 
    'RESUMO',
    'Política Admin para cto_data',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'stores' 
            AND (
                policyname LIKE '%Admin pode atualizar cto_data%'
                OR (policyname LIKE '%admin%' AND policyname LIKE '%cto_data%')
            )
            AND cmd = 'UPDATE'
        ) THEN '✅ OK'
        ELSE '❌ FALTA CRIAR'
    END
UNION ALL
SELECT 
    'RESUMO',
    'Política Financeiro para cto_data',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'stores' 
            AND (
                policyname LIKE '%Financeiro pode atualizar cto_data%'
                OR (policyname LIKE '%financeiro%' AND policyname LIKE '%cto_data%')
            )
            AND cmd = 'UPDATE'
        ) THEN '✅ OK'
        ELSE '❌ FALTA CRIAR'
    END;

