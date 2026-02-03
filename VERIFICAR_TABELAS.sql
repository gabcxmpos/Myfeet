-- ============================================
-- SCRIPT DE VERIFICAÇÃO DE TABELAS
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script verifica a estrutura de todas as tabelas principais
-- e especialmente verifica se a tabela 'feedbacks' tem as novas colunas
-- ============================================

-- ============================================
-- PARTE 1: LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
-- ============================================
SELECT 
  'TABELAS DO SCHEMA PUBLIC' AS secao,
  table_name AS tabela,
  CASE 
    WHEN table_name IN ('stores', 'app_users', 'forms', 'evaluations', 'collaborators', 
                        'trainings', 'training_registrations', 'feedbacks', 'daily_checklists',
                        'checklist_audits', 'app_settings', 'returns', 'physical_missing',
                        'returns_planner', 'acionamentos', 'alerts')
    THEN '✅ Tabela principal encontrada'
    ELSE 'ℹ️ Tabela auxiliar'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name IN ('stores', 'app_users', 'forms', 'evaluations', 'collaborators', 
                        'trainings', 'training_registrations', 'feedbacks', 'daily_checklists',
                        'checklist_audits', 'app_settings', 'returns', 'physical_missing',
                        'returns_planner', 'acionamentos', 'alerts')
    THEN 1
    ELSE 2
  END,
  table_name;

-- ============================================
-- PARTE 2: VERIFICAR ESTRUTURA DA TABELA FEEDBACKS
-- ============================================
SELECT 
  'ESTRUTURA DA TABELA FEEDBACKS' AS secao,
  column_name AS coluna,
  data_type AS tipo_dado,
  character_maximum_length AS tamanho_max,
  is_nullable AS permite_null,
  column_default AS valor_padrao,
  CASE 
    WHEN column_name = 'manager_satisfaction' THEN '✅ NOVA COLUNA - Satisfação do gerente com colaborador'
    WHEN column_name = 'collaborator_satisfaction' THEN '✅ NOVA COLUNA - Satisfação do colaborador com o todo'
    WHEN column_name = 'satisfaction' THEN '✅ COLUNA EXISTENTE - Satisfação geral'
    WHEN column_name IN ('id', 'store_id', 'collaborator_id', 'collaborator_name', 'feedback_text', 'created_at')
    THEN '✅ COLUNA OBRIGATÓRIA'
    ELSE 'ℹ️ COLUNA OPCIONAL'
  END AS observacao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- ============================================
-- PARTE 3: VERIFICAR SE AS NOVAS COLUNAS EXISTEM
-- ============================================
SELECT 
  'VERIFICAÇÃO DE COLUNAS NOVAS' AS secao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'manager_satisfaction'
    ) THEN '✅ manager_satisfaction EXISTE'
    ELSE '❌ manager_satisfaction NÃO EXISTE - Precisa ser criada'
  END AS status_manager_satisfaction,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'collaborator_satisfaction'
    ) THEN '✅ collaborator_satisfaction EXISTE'
    ELSE '❌ collaborator_satisfaction NÃO EXISTE - Precisa ser criada'
  END AS status_collaborator_satisfaction;

-- ============================================
-- PARTE 4: VERIFICAR TIPOS DE DADOS DAS COLUNAS DE SATISFAÇÃO
-- ============================================
SELECT 
  'TIPOS DE DADOS - COLUNAS DE SATISFAÇÃO' AS secao,
  column_name AS coluna,
  data_type AS tipo_dado,
  numeric_precision AS precisao,
  numeric_scale AS escala,
  CASE 
    WHEN data_type = 'integer' AND column_name LIKE '%satisfaction%' THEN '✅ Tipo correto (INTEGER)'
    WHEN data_type != 'integer' AND column_name LIKE '%satisfaction%' THEN '⚠️ Tipo pode estar incorreto'
    ELSE 'ℹ️ Outro tipo'
  END AS observacao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedbacks'
  AND column_name LIKE '%satisfaction%'
ORDER BY column_name;

-- ============================================
-- PARTE 5: VERIFICAR CONSTRAINTS E FOREIGN KEYS DA TABELA FEEDBACKS
-- ============================================
SELECT 
  'CONSTRAINTS DA TABELA FEEDBACKS' AS secao,
  tc.constraint_name AS constraint_nome,
  tc.constraint_type AS tipo_constraint,
  kcu.column_name AS coluna,
  ccu.table_schema AS schema_referenciado,
  ccu.table_name AS tabela_referenciada,
  ccu.column_name AS coluna_referenciada
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'feedbacks'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ============================================
-- PARTE 6: VERIFICAR ÍNDICES DA TABELA FEEDBACKS
-- ============================================
SELECT 
  'ÍNDICES DA TABELA FEEDBACKS' AS secao,
  indexname AS nome_indice,
  indexdef AS definicao_indice
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'feedbacks'
ORDER BY indexname;

-- ============================================
-- PARTE 7: RESUMO DE VERIFICAÇÃO DAS TABELAS PRINCIPAIS
-- ============================================
SELECT 
  'RESUMO - TABELAS PRINCIPAIS' AS secao,
  table_name AS tabela,
  COUNT(*) AS total_colunas,
  COUNT(CASE WHEN is_nullable = 'NO' THEN 1 END) AS colunas_obrigatorias,
  COUNT(CASE WHEN is_nullable = 'YES' THEN 1 END) AS colunas_opcionais
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('stores', 'app_users', 'forms', 'evaluations', 'collaborators', 
                     'trainings', 'training_registrations', 'feedbacks', 'daily_checklists',
                     'checklist_audits', 'app_settings', 'returns', 'physical_missing',
                     'returns_planner', 'acionamentos', 'alerts')
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- PARTE 8: SCRIPT PARA CRIAR AS COLUNAS SE NÃO EXISTIREM
-- ============================================
-- Execute este bloco apenas se as colunas não existirem
-- ============================================

DO $$
BEGIN
  -- Verificar e criar manager_satisfaction
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
      AND column_name = 'manager_satisfaction'
  ) THEN
    ALTER TABLE public.feedbacks
    ADD COLUMN manager_satisfaction INTEGER DEFAULT 3;
    
    RAISE NOTICE '✅ Coluna manager_satisfaction criada com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna manager_satisfaction já existe';
  END IF;

  -- Verificar e criar collaborator_satisfaction
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
      AND column_name = 'collaborator_satisfaction'
  ) THEN
    ALTER TABLE public.feedbacks
    ADD COLUMN collaborator_satisfaction INTEGER DEFAULT 3;
    
    RAISE NOTICE '✅ Coluna collaborator_satisfaction criada com sucesso';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna collaborator_satisfaction já existe';
  END IF;

  -- Adicionar comentários nas colunas para documentação
  COMMENT ON COLUMN public.feedbacks.manager_satisfaction IS 'Satisfação do gerente com o colaborador (1=Ruim, 2=Razoável, 3=Bom, 4=Excelente)';
  COMMENT ON COLUMN public.feedbacks.collaborator_satisfaction IS 'Satisfação do colaborador com o todo/equipe (1=Ruim, 2=Razoável, 3=Bom, 4=Excelente)';
  
  RAISE NOTICE '✅ Comentários adicionados nas colunas';
END $$;

-- ============================================
-- PARTE 9: VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'VERIFICAÇÃO FINAL' AS secao,
  'Todas as verificações foram concluídas!' AS resultado,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name IN ('manager_satisfaction', 'collaborator_satisfaction')
    ) THEN '✅ Colunas de satisfação estão presentes'
    ELSE '❌ Alguma coluna de satisfação está faltando'
  END AS status_final;
























