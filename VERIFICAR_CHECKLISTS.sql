-- ============================================
-- SCRIPT DE VERIFICAÇÃO E TESTE DE CHECKLISTS
-- Verifica criação, atualização e comunicação
-- ============================================

-- ============================================
-- 1. VERIFICAR TABELAS DE CHECKLIST
-- ============================================

-- Verificar tabela de checklists diários
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'daily_checklists') THEN
        RAISE NOTICE '✅ Tabela daily_checklists existe';
    ELSE
        RAISE NOTICE '❌ Tabela daily_checklists NÃO existe';
    END IF;
END $$;

-- Verificar estrutura da tabela daily_checklists (query separada)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'daily_checklists'
ORDER BY ordinal_position;

-- Verificar tabela de auditorias
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_audits') THEN
        RAISE NOTICE '✅ Tabela checklist_audits existe';
    ELSE
        RAISE NOTICE '❌ Tabela checklist_audits NÃO existe';
    END IF;
END $$;

-- Verificar tabelas de checklists específicos
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_comunicacao_tasks') THEN
        RAISE NOTICE '✅ Tabela checklist_comunicacao_tasks existe';
    ELSE
        RAISE NOTICE '❌ Tabela checklist_comunicacao_tasks NÃO existe';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_devolucoes_tasks') THEN
        RAISE NOTICE '✅ Tabela checklist_devolucoes_tasks existe';
    ELSE
        RAISE NOTICE '❌ Tabela checklist_devolucoes_tasks NÃO existe';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_motorista_routes') THEN
        RAISE NOTICE '✅ Tabela checklist_motorista_routes existe';
    ELSE
        RAISE NOTICE '❌ Tabela checklist_motorista_routes NÃO existe';
    END IF;
END $$;

-- ============================================
-- 2. VERIFICAR APP_SETTINGS (Tarefas de Checklist)
-- ============================================

-- Verificar se existem tarefas configuradas
SELECT 
    key,
    CASE 
        WHEN key = 'daily_checklist_tasks' THEN 'Checklist Operacional'
        WHEN key = 'daily_checklist_gerencial_tasks' THEN 'Checklist Gerencial'
        ELSE key
    END AS descricao,
    CASE 
        WHEN value IS NULL THEN '❌ Não configurado'
        WHEN jsonb_typeof(value) = 'array' THEN '✅ Configurado (' || jsonb_array_length(value) || ' tarefas)'
        ELSE '⚠️ Configurado (formato desconhecido)'
    END AS status
FROM app_settings
WHERE key IN ('daily_checklist_tasks', 'daily_checklist_gerencial_tasks')
ORDER BY key;

-- ============================================
-- 3. VERIFICAR CHECKLISTS DIÁRIOS RECENTES
-- ============================================

-- Últimos 7 dias de checklists operacionais
SELECT 
    dc.store_id,
    s.name AS loja,
    dc.date,
    dc.checklist_type,
    dc.tasks,
    jsonb_object_keys(dc.tasks) AS task_id,
    dc.tasks->jsonb_object_keys(dc.tasks) AS completed,
    dc.created_at,
    dc.updated_at
FROM daily_checklists dc
LEFT JOIN stores s ON s.id = dc.store_id
WHERE dc.date >= CURRENT_DATE - INTERVAL '7 days'
AND dc.checklist_type = 'operacional'
ORDER BY dc.date DESC, s.name
LIMIT 50;

-- Últimos 7 dias de checklists gerenciais
SELECT 
    dc.store_id,
    s.name AS loja,
    dc.date,
    dc.checklist_type,
    dc.tasks,
    jsonb_object_keys(dc.tasks) AS task_id,
    dc.tasks->jsonb_object_keys(dc.tasks) AS completed,
    dc.created_at,
    dc.updated_at
FROM daily_checklists dc
LEFT JOIN stores s ON s.id = dc.store_id
WHERE dc.date >= CURRENT_DATE - INTERVAL '7 days'
AND dc.checklist_type = 'gerencial'
ORDER BY dc.date DESC, s.name
LIMIT 50;

-- ============================================
-- 4. VERIFICAR AUDITORIAS RECENTES
-- ============================================

SELECT 
    ca.store_id,
    s.name AS loja,
    ca.date,
    ca.checklist_type,
    ca.audited_by,
    COALESCE(ca.audited_by_name, au.username, 'N/A') AS audited_by_name,
    ca.updated_at AS audited_at
FROM checklist_audits ca
LEFT JOIN stores s ON s.id = ca.store_id
LEFT JOIN app_users au ON au.id = ca.audited_by
WHERE ca.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ca.date DESC, s.name
LIMIT 50;

-- ============================================
-- 5. VERIFICAR CHECKLISTS ESPECÍFICOS
-- ============================================

-- Checklist de Comunicação
SELECT 
    cct.user_id,
    COALESCE(au.username, 'N/A') AS usuario,
    cct.task_text,
    cct.task_order,
    cct.is_active,
    cct.created_at,
    cct.updated_at
FROM checklist_comunicacao_tasks cct
LEFT JOIN app_users au ON au.id = cct.user_id
ORDER BY cct.created_at DESC
LIMIT 20;

-- Execuções de Checklist de Comunicação
SELECT 
    cce.user_id,
    COALESCE(au.username, 'N/A') AS usuario,
    cce.tasks,
    jsonb_object_keys(cce.tasks) AS task_id,
    cce.tasks->jsonb_object_keys(cce.tasks) AS completed,
    cce.completed_at,
    cce.updated_at
FROM checklist_comunicacao_execution cce
LEFT JOIN app_users au ON au.id = cce.user_id
ORDER BY cce.completed_at DESC
LIMIT 20;

-- Checklist de Devoluções
SELECT 
    cdt.user_id,
    COALESCE(au.username, 'N/A') AS usuario,
    cdt.task_text,
    cdt.task_order,
    cdt.is_active,
    cdt.created_at,
    cdt.updated_at
FROM checklist_devolucoes_tasks cdt
LEFT JOIN app_users au ON au.id = cdt.user_id
ORDER BY cdt.created_at DESC
LIMIT 20;

-- Execuções de Checklist de Devoluções
SELECT 
    cde.user_id,
    COALESCE(au.username, 'N/A') AS usuario,
    cde.tasks,
    jsonb_object_keys(cde.tasks) AS task_id,
    cde.tasks->jsonb_object_keys(cde.tasks) AS completed,
    cde.completed_at,
    cde.updated_at
FROM checklist_devolucoes_execution cde
LEFT JOIN app_users au ON au.id = cde.user_id
ORDER BY cde.completed_at DESC
LIMIT 20;

-- ============================================
-- 6. ESTATÍSTICAS DE CHECKLISTS
-- ============================================

-- Estatísticas de checklists diários (últimos 7 dias)
SELECT 
    checklist_type,
    COUNT(DISTINCT store_id) AS lojas_com_checklist,
    COUNT(*) AS total_checklists,
    COUNT(DISTINCT date) AS dias_com_checklist
FROM daily_checklists
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY checklist_type;

-- Taxa de conclusão por loja (últimos 7 dias)
SELECT 
    dc.store_id,
    s.name AS loja,
    dc.checklist_type,
    COUNT(*) AS total_dias,
    AVG(
        (SELECT COUNT(*) FROM jsonb_each(dc.tasks) WHERE value::boolean = true)::numeric / 
        NULLIF((SELECT COUNT(*) FROM jsonb_each(dc.tasks)), 0) * 100
    ) AS taxa_conclusao_media
FROM daily_checklists dc
LEFT JOIN stores s ON s.id = dc.store_id
WHERE dc.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dc.store_id, s.name, dc.checklist_type
ORDER BY taxa_conclusao_media DESC;

-- ============================================
-- 7. VERIFICAR RLS (Row Level Security)
-- ============================================

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'daily_checklists',
    'checklist_audits',
    'checklist_comunicacao_tasks',
    'checklist_comunicacao_execution',
    'checklist_devolucoes_tasks',
    'checklist_devolucoes_execution',
    'checklist_motorista_routes',
    'checklist_motorista_execution'
)
ORDER BY tablename;

-- Verificar políticas RLS existentes
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
AND tablename IN (
    'daily_checklists',
    'checklist_audits',
    'checklist_comunicacao_tasks',
    'checklist_comunicacao_execution',
    'checklist_devolucoes_tasks',
    'checklist_devolucoes_execution',
    'checklist_motorista_routes',
    'checklist_motorista_execution'
)
ORDER BY tablename, policyname;

-- ============================================
-- 8. TESTE DE CRIAÇÃO E ATUALIZAÇÃO
-- ============================================

-- NOTA: Execute estes testes manualmente através da aplicação
-- ou descomente para testar diretamente no banco

/*
-- Teste 1: Criar checklist diário (substitua store_id e date)
INSERT INTO daily_checklists (store_id, date, checklist_type, tasks)
VALUES (
    'SEU_STORE_ID_AQUI',
    CURRENT_DATE,
    'operacional',
    '{"task-1": true, "task-2": false}'::jsonb
)
ON CONFLICT (store_id, date, checklist_type) 
DO UPDATE SET 
    tasks = EXCLUDED.tasks,
    updated_at = NOW()
RETURNING *;

-- Teste 2: Atualizar checklist existente
UPDATE daily_checklists
SET 
    tasks = jsonb_set(tasks, '{task-1}', 'false'::jsonb),
    updated_at = NOW()
WHERE store_id = 'SEU_STORE_ID_AQUI'
AND date = CURRENT_DATE
AND checklist_type = 'operacional'
RETURNING *;

-- Teste 3: Criar auditoria
INSERT INTO checklist_audits (store_id, date, checklist_type, audited_by, audited_by_name)
VALUES (
    'SEU_STORE_ID_AQUI',
    CURRENT_DATE,
    'operacional',
    'SEU_USER_ID_AQUI',
    'Nome do Auditor'
)
ON CONFLICT (store_id, date, checklist_type)
DO UPDATE SET
    audited_by = EXCLUDED.audited_by,
    audited_by_name = EXCLUDED.audited_by_name,
    audited_at = NOW(),
    updated_at = NOW()
RETURNING *;
*/

-- ============================================
-- 9. RESUMO FINAL
-- ============================================

DO $$
DECLARE
    daily_count INTEGER;
    audit_count INTEGER;
    comunicacao_tasks_count INTEGER;
    devolucoes_tasks_count INTEGER;
BEGIN
    -- Contar checklists diários dos últimos 7 dias
    SELECT COUNT(*) INTO daily_count
    FROM daily_checklists
    WHERE date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Contar auditorias dos últimos 7 dias
    SELECT COUNT(*) INTO audit_count
    FROM checklist_audits
    WHERE date >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Contar tarefas de comunicação
    SELECT COUNT(*) INTO comunicacao_tasks_count
    FROM checklist_comunicacao_tasks
    WHERE is_active = true;
    
    -- Contar tarefas de devoluções
    SELECT COUNT(*) INTO devolucoes_tasks_count
    FROM checklist_devolucoes_tasks
    WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMO DE CHECKLISTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Checklists Diários (últimos 7 dias): %', daily_count;
    RAISE NOTICE 'Auditorias (últimos 7 dias): %', audit_count;
    RAISE NOTICE 'Tarefas de Comunicação Ativas: %', comunicacao_tasks_count;
    RAISE NOTICE 'Tarefas de Devoluções Ativas: %', devolucoes_tasks_count;
    RAISE NOTICE '========================================';
END $$;

