-- ============================================
-- VERIFICAR SE TABELA goals_history EXISTE E ESTÁ CONFIGURADA
-- Execute este script no Supabase SQL Editor
-- ============================================
--
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor (menu lateral esquerdo)
-- 3. Copie TODO este conteúdo
-- 4. Cole no SQL Editor
-- 5. Clique em RUN (ou Ctrl+Enter)
--
-- O que este script faz:
-- - Verifica se a tabela goals_history existe
-- - Verifica a estrutura da tabela
-- - Verifica se os índices foram criados
-- - Verifica se as políticas RLS estão configuradas
-- ============================================

-- PASSO 1: Verificar se a tabela existe
SELECT
    'Verificação da Tabela' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
    ) THEN '✅ Tabela goals_history EXISTE' ELSE '❌ Tabela goals_history NÃO EXISTE' END AS status;

-- PASSO 2: Verificar estrutura da tabela
SELECT
    'Estrutura da Tabela goals_history' AS tipo,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null,
    column_default AS valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goals_history'
ORDER BY ordinal_position;

-- PASSO 3: Verificar se todas as colunas necessárias existem
SELECT
    'Verificação de Colunas' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'id'
    ) THEN '✅' ELSE '❌' END AS id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'store_id'
    ) THEN '✅' ELSE '❌' END AS store_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'goals'
    ) THEN '✅' ELSE '❌' END AS goals,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'weights'
    ) THEN '✅' ELSE '❌' END AS weights,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'changed_by'
    ) THEN '✅' ELSE '❌' END AS changed_by,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
          AND column_name = 'created_at'
    ) THEN '✅' ELSE '❌' END AS created_at;

-- PASSO 4: Verificar índices criados
SELECT
    'Índices da Tabela' AS tipo,
    indexname AS indice,
    indexdef AS definicao
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'goals_history'
ORDER BY indexname;

-- PASSO 5: Verificar políticas RLS
SELECT
    'Políticas RLS' AS tipo,
    policyname AS politica,
    permissive AS permissivo,
    roles AS roles,
    cmd AS comando,
    qual AS condicao
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'goals_history'
ORDER BY policyname;

-- PASSO 6: Verificar se RLS está habilitado
SELECT
    'Row Level Security' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'goals_history'
          AND rowsecurity = true
    ) THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESABILITADO' END AS status;

-- PASSO 7: Contar registros existentes (se houver)
SELECT
    'Registros Existentes' AS tipo,
    COUNT(*) AS total_registros
FROM public.goals_history;

-- PASSO 8: Verificar registros recentes (últimos 5, se houver)
SELECT
    'Registros Recentes' AS tipo,
    id,
    store_id,
    created_at,
    changed_by
FROM public.goals_history
ORDER BY created_at DESC
LIMIT 5;

-- PASSO 9: Verificação final completa
SELECT
    'VERIFICAÇÃO FINAL' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'goals_history'
    ) THEN '✅ Tabela criada' ELSE '❌ Tabela não existe' END AS tabela,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'goals_history') AS total_colunas,
    (SELECT COUNT(*) FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename = 'goals_history') AS total_indices,
    (SELECT COUNT(*) FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'goals_history') AS total_politicas,
    (SELECT COUNT(*) FROM public.goals_history) AS total_registros;











