-- ============================================
-- VERIFICAR HISTÓRICO E BACKUP DO PLANNER
-- Execute este script para verificar se há histórico de alterações
-- ============================================

-- ============================================
-- 1. VERIFICAR SE EXISTE TABELA DE AUDITORIA/HISTÓRICO
-- ============================================
SELECT 
  '1. TABELAS DE AUDITORIA/HISTÓRICO' AS verificacao,
  table_name,
  CASE 
    WHEN table_name LIKE '%audit%' OR table_name LIKE '%log%' OR table_name LIKE '%history%'
    THEN '✅ Possível tabela de histórico'
    ELSE 'Tabela relacionada'
  END AS tipo
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%returns%' 
    OR table_name LIKE '%planner%'
    OR table_name LIKE '%devoluc%'
    OR table_name LIKE '%audit%'
    OR table_name LIKE '%log%'
    OR table_name LIKE '%history%'
  )
ORDER BY table_name;

-- ============================================
-- 2. VERIFICAR SE HÁ TRIGGERS DE AUDITORIA
-- ============================================
SELECT 
  '2. TRIGGERS DE AUDITORIA' AS verificacao,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'returns_planner'
  AND event_object_schema = 'public'
  AND (
    trigger_name LIKE '%audit%' 
    OR trigger_name LIKE '%log%' 
    OR trigger_name LIKE '%history%'
  );

-- ============================================
-- 3. VERIFICAR SE EXISTE TABELA DE BACKUP ESPECÍFICA
-- ============================================
SELECT 
  '3. TABELAS DE BACKUP' AS verificacao,
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
   AND table_schema = 'public') AS numero_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%returns_planner%backup%'
    OR table_name LIKE '%returns_planner%old%'
    OR table_name LIKE '%returns_planner%_bak%'
    OR table_name LIKE '%planner_backup%'
  );

-- ============================================
-- 4. VERIFICAR SE HÁ VIEWS QUE PODEM TER DADOS ANTIGOS
-- ============================================
SELECT 
  '4. VIEWS RELACIONADAS' AS verificacao,
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%returns%' 
    OR table_name LIKE '%planner%'
  );

-- ============================================
-- 5. VERIFICAR ÚLTIMAS ALTERAÇÕES NA TABELA (se houver log)
-- ============================================
-- Verificar se há coluna updated_at e quando foi a última atualização
SELECT 
  '5. ÚLTIMA ATUALIZAÇÃO' AS verificacao,
  COUNT(*) AS total_registros,
  MIN(created_at) AS primeiro_registro,
  MAX(created_at) AS ultimo_registro_criado,
  MAX(updated_at) AS ultima_atualizacao
FROM public.returns_planner;

-- ============================================
-- 6. VERIFICAR SE HÁ REGISTROS SOFT DELETED (se houver coluna deleted_at)
-- ============================================
SELECT 
  '6. COLUNA DELETED_AT' AS verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'returns_planner'
        AND column_name = 'deleted_at'
    ) THEN '✅ Existe coluna deleted_at - Verificar registros soft deleted'
    ELSE '❌ Não existe coluna deleted_at'
  END AS resultado;

-- Se existir coluna deleted_at, mostrar registros não deletados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'returns_planner'
      AND column_name = 'deleted_at'
  ) THEN
    RAISE NOTICE 'Registros não deletados (deleted_at IS NULL):';
    PERFORM * FROM public.returns_planner WHERE deleted_at IS NULL;
  END IF;
END $$;

-- ============================================
-- 7. VERIFICAR SE HÁ FUNÇÕES DE BACKUP OU RESTAURAÇÃO
-- ============================================
SELECT 
  '7. FUNÇÕES DE BACKUP/RESTAURAÇÃO' AS verificacao,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%backup%'
    OR routine_name LIKE '%restore%'
    OR routine_name LIKE '%history%'
    OR routine_name LIKE '%audit%'
  );

-- ============================================
-- 8. VERIFICAR SE HÁ DADOS EM OUTRAS TABELAS RELACIONADAS
-- ============================================
-- Verificar tabela de devoluções geral
SELECT 
  '8. TABELA DEVOLUÇÕES GERAL' AS verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'returns'
    ) THEN '✅ Existe tabela returns'
    ELSE '❌ Não existe tabela returns'
  END AS resultado;

-- Se existir, contar registros
DO $$
DECLARE
  total_returns INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'returns'
  ) THEN
    SELECT COUNT(*) INTO total_returns FROM public.returns;
    RAISE NOTICE 'Total de registros na tabela returns: %', total_returns;
  END IF;
END $$;

-- ============================================
-- 9. VERIFICAR SE HÁ DADOS EXPORTADOS (CSV, JSON)
-- ============================================
-- Nota: Esta verificação não pode ser feita diretamente no SQL
-- Mas podemos verificar se há funções que exportam dados
SELECT 
  '9. FUNÇÕES DE EXPORTAÇÃO' AS verificacao,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%export%'
    OR routine_name LIKE '%csv%'
    OR routine_name LIKE '%json%'
  );

-- ============================================
-- 10. RECOMENDAÇÕES PARA RESTAURAÇÃO
-- ============================================
DO $$
DECLARE
  tem_backup BOOLEAN := false;
  tem_audit BOOLEAN := false;
  tem_deleted_at BOOLEAN := false;
  total_reg INTEGER;
BEGIN
  -- Verificar se há tabela de backup
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        table_name LIKE '%backup%'
        OR table_name LIKE '%old%'
      )
  ) INTO tem_backup;
  
  -- Verificar se há tabela de auditoria
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        table_name LIKE '%audit%'
        OR table_name LIKE '%log%'
      )
  ) INTO tem_audit;
  
  -- Verificar se há coluna deleted_at
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'returns_planner'
      AND column_name = 'deleted_at'
  ) INTO tem_deleted_at;
  
  -- Contar registros
  SELECT COUNT(*) INTO total_reg FROM public.returns_planner;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RECOMENDAÇÕES PARA RESTAURAÇÃO';
  RAISE NOTICE '========================================';
  
  IF total_reg = 0 THEN
    RAISE NOTICE '⚠️ A tabela está vazia!';
    RAISE NOTICE '';
    
    IF tem_backup THEN
      RAISE NOTICE '✅ Encontrada tabela de backup!';
      RAISE NOTICE '   Ação: Verifique as tabelas de backup listadas acima';
      RAISE NOTICE '   e restaure os dados manualmente.';
    END IF;
    
    IF tem_audit THEN
      RAISE NOTICE '✅ Encontrada tabela de auditoria!';
      RAISE NOTICE '   Ação: Verifique os logs de auditoria para ver';
      RAISE NOTICE '   quando e como os registros foram deletados.';
    END IF;
    
    IF tem_deleted_at THEN
      RAISE NOTICE '✅ Existe coluna deleted_at!';
      RAISE NOTICE '   Ação: Execute: UPDATE returns_planner SET deleted_at = NULL';
      RAISE NOTICE '   para restaurar registros soft deleted.';
    END IF;
    
    IF NOT tem_backup AND NOT tem_audit AND NOT tem_deleted_at THEN
      RAISE NOTICE '❌ Não foram encontradas opções de restauração automática.';
      RAISE NOTICE '';
      RAISE NOTICE 'OPÇÕES DISPONÍVEIS:';
      RAISE NOTICE '1. Restaurar de backup do Supabase (se houver)';
      RAISE NOTICE '2. Restaurar de backup manual (CSV, JSON, etc.)';
      RAISE NOTICE '3. Recriar os registros manualmente';
      RAISE NOTICE '4. Verificar logs do Supabase Dashboard';
    END IF;
  ELSE
    RAISE NOTICE '✅ A tabela tem % registros', total_reg;
    RAISE NOTICE '   Se você não consegue vê-los, o problema é nas políticas RLS.';
    RAISE NOTICE '   Execute: VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

