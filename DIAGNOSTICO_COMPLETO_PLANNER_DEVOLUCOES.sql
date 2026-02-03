-- ============================================
-- DIAGNÓSTICO COMPLETO - PLANNER DE DEVOLUÇÕES
-- Execute este script para entender o que aconteceu
-- ============================================

-- ============================================
-- 1. VERIFICAR SE A TABELA EXISTE
-- ============================================
SELECT 
  '1. EXISTÊNCIA DA TABELA' AS diagnostico,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'returns_planner'
    ) THEN '✅ Tabela existe'
    ELSE '❌ Tabela NÃO existe - Execute CRIAR_TABELA_PLANNER_DEVOLUCOES.sql'
  END AS resultado;

-- ============================================
-- 2. VERIFICAR TOTAL DE REGISTROS (SEM RLS)
-- ============================================
-- Esta query tenta contar todos os registros, ignorando RLS
-- Se você tiver acesso como service_role, isso funcionará
DO $$
DECLARE
  total_registros INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_registros FROM public.returns_planner;
  RAISE NOTICE '========================================';
  RAISE NOTICE '2. TOTAL DE REGISTROS NA TABELA: %', total_registros;
  RAISE NOTICE '========================================';
  
  IF total_registros = 0 THEN
    RAISE NOTICE '⚠️ ATENÇÃO: A tabela está VAZIA!';
    RAISE NOTICE 'Os registros podem ter sido deletados ou nunca foram inseridos.';
  ELSE
    RAISE NOTICE '✅ A tabela tem % registros', total_registros;
    RAISE NOTICE 'Se você não consegue vê-los, o problema pode ser nas políticas RLS.';
  END IF;
END $$;

-- ============================================
-- 3. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  '3. POLÍTICAS RLS' AS diagnostico,
  cmd AS tipo_operacao,
  COUNT(*) AS quantidade_politicas,
  STRING_AGG(policyname, ', ') AS nomes_politicas
FROM pg_policies
WHERE tablename = 'returns_planner'
GROUP BY cmd
ORDER BY cmd;

-- Verificar se RLS está habilitado
SELECT 
  '3.1. RLS HABILITADO?' AS diagnostico,
  rowsecurity AS rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ SIM - RLS está habilitado'
    ELSE '❌ NÃO - RLS está desabilitado (todos podem ver todos os registros)'
  END AS resultado
FROM pg_tables
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';

-- ============================================
-- 4. VERIFICAR PERMISSÕES DO USUÁRIO ATUAL
-- ============================================
SELECT 
  '4. SEU PERFIL DE USUÁRIO' AS diagnostico,
  au.id AS user_id,
  au.username,
  au.role,
  au.status,
  au.store_id,
  CASE 
    WHEN au.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
    THEN '✅ Você TEM permissão para ver registros do planner'
    ELSE '❌ Você NÃO TEM permissão - Seu perfil: ' || COALESCE(au.role::text, 'NÃO DEFINIDO')
  END AS resultado
FROM public.app_users au
WHERE au.id = auth.uid();

-- ============================================
-- 5. VERIFICAR SE HÁ REGISTROS RECENTES
-- ============================================
SELECT 
  '5. REGISTROS RECENTES' AS diagnostico,
  COUNT(*) AS total,
  MIN(created_at) AS mais_antigo,
  MAX(created_at) AS mais_recente,
  MAX(updated_at) AS ultima_atualizacao
FROM public.returns_planner;

-- ============================================
-- 6. VERIFICAR ESTRUTURA COMPLETA DA TABELA
-- ============================================
SELECT 
  '6. ESTRUTURA DA TABELA' AS diagnostico,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'returns_planner'
ORDER BY ordinal_position;

-- ============================================
-- 7. VERIFICAR ÍNDICES
-- ============================================
SELECT 
  '7. ÍNDICES DA TABELA' AS diagnostico,
  indexname AS nome_indice,
  indexdef AS definicao
FROM pg_indexes
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';

-- ============================================
-- 8. VERIFICAR FOREIGN KEYS
-- ============================================
SELECT 
  '8. FOREIGN KEYS' AS diagnostico,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'returns_planner'
  AND tc.table_schema = 'public';

-- ============================================
-- 9. VERIFICAR TRIGGERS
-- ============================================
SELECT 
  '9. TRIGGERS' AS diagnostico,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'returns_planner'
  AND event_object_schema = 'public';

-- ============================================
-- 10. VERIFICAR SE HÁ TABELAS DE BACKUP OU HISTÓRICO
-- ============================================
SELECT 
  '10. TABELAS RELACIONADAS' AS diagnostico,
  table_name,
  CASE 
    WHEN table_name LIKE '%backup%' OR table_name LIKE '%history%' OR table_name LIKE '%log%' OR table_name LIKE '%audit%'
    THEN '✅ Possível tabela de backup/histórico'
    ELSE 'Tabela relacionada'
  END AS tipo
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%returns%' 
    OR table_name LIKE '%planner%'
    OR table_name LIKE '%devoluc%'
  )
ORDER BY table_name;

-- ============================================
-- 11. TESTAR VISIBILIDADE DOS REGISTROS
-- ============================================
-- Esta query mostra quantos registros você consegue ver com seu perfil atual
SELECT 
  '11. REGISTROS VISÍVEIS PARA VOCÊ' AS diagnostico,
  COUNT(*) AS total_visivel,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Você não consegue ver NENHUM registro'
    ELSE '✅ Você consegue ver ' || COUNT(*) || ' registro(s)'
  END AS resultado
FROM public.returns_planner;

-- ============================================
-- 12. RESUMO E RECOMENDAÇÕES
-- ============================================
DO $$
DECLARE
  total_reg INTEGER;
  rls_habilitado BOOLEAN;
  politicas_select INTEGER;
  user_role TEXT;
BEGIN
  -- Contar registros
  SELECT COUNT(*) INTO total_reg FROM public.returns_planner;
  
  -- Verificar RLS
  SELECT rowsecurity INTO rls_habilitado
  FROM pg_tables
  WHERE tablename = 'returns_planner' AND schemaname = 'public';
  
  -- Contar políticas SELECT
  SELECT COUNT(*) INTO politicas_select
  FROM pg_policies
  WHERE tablename = 'returns_planner' AND cmd = 'SELECT';
  
  -- Verificar perfil do usuário
  SELECT role INTO user_role
  FROM public.app_users
  WHERE id = auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de registros na tabela: %', total_reg;
  RAISE NOTICE 'RLS habilitado: %', CASE WHEN rls_habilitado THEN 'SIM' ELSE 'NÃO' END;
  RAISE NOTICE 'Políticas SELECT: %', politicas_select;
  RAISE NOTICE 'Seu perfil: %', COALESCE(user_role, 'NÃO DEFINIDO');
  RAISE NOTICE '';
  
  IF total_reg = 0 THEN
    RAISE NOTICE '⚠️ PROBLEMA: A tabela está VAZIA!';
    RAISE NOTICE '   Os registros foram deletados ou nunca foram inseridos.';
    RAISE NOTICE '   SOLUÇÃO: Restaure de um backup ou recrie os registros manualmente.';
  ELSIF politicas_select = 0 THEN
    RAISE NOTICE '⚠️ PROBLEMA: Não há políticas SELECT!';
    RAISE NOTICE '   SOLUÇÃO: Execute VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql';
  ELSIF user_role::text NOT IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia') THEN
    RAISE NOTICE '⚠️ PROBLEMA: Seu perfil não tem permissão!';
    RAISE NOTICE '   Seu perfil atual: %', user_role;
    RAISE NOTICE '   SOLUÇÃO: Atualize seu perfil em app_users para um dos seguintes:';
    RAISE NOTICE '            devoluções, admin, supervisor, supervisor_franquia';
  ELSE
    RAISE NOTICE '✅ CONFIGURAÇÃO PARECE CORRETA';
    RAISE NOTICE '   Se ainda não consegue ver os registros, verifique as condições das políticas RLS.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

