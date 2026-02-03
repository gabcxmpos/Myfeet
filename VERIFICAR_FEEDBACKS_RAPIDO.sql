-- ============================================
-- VERIFICAÇÃO RÁPIDA - TABELA FEEDBACKS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Verificar se a tabela feedbacks existe
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
    ) THEN '✅ Tabela feedbacks existe'
    ELSE '❌ Tabela feedbacks NÃO existe'
  END AS status_tabela;

-- Listar todas as colunas da tabela feedbacks
SELECT 
  column_name AS coluna,
  data_type AS tipo,
  is_nullable AS permite_null,
  column_default AS valor_padrao,
  CASE 
    WHEN column_name = 'manager_satisfaction' THEN '✅ NOVA COLUNA'
    WHEN column_name = 'collaborator_satisfaction' THEN '✅ NOVA COLUNA'
    ELSE ''
  END AS observacao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- Verificar especificamente as novas colunas
SELECT 
  'VERIFICAÇÃO DE COLUNAS NOVAS' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'manager_satisfaction'
    ) THEN '✅ manager_satisfaction EXISTE'
    ELSE '❌ manager_satisfaction NÃO EXISTE'
  END AS manager_satisfaction,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'collaborator_satisfaction'
    ) THEN '✅ collaborator_satisfaction EXISTE'
    ELSE '❌ collaborator_satisfaction NÃO EXISTE'
  END AS collaborator_satisfaction;

-- Criar as colunas se não existirem (execução automática)
DO $$
BEGIN
  -- Criar manager_satisfaction se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
      AND column_name = 'manager_satisfaction'
  ) THEN
    ALTER TABLE public.feedbacks
    ADD COLUMN manager_satisfaction INTEGER DEFAULT 3;
    RAISE NOTICE '✅ Coluna manager_satisfaction criada';
  END IF;

  -- Criar collaborator_satisfaction se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feedbacks'
      AND column_name = 'collaborator_satisfaction'
  ) THEN
    ALTER TABLE public.feedbacks
    ADD COLUMN collaborator_satisfaction INTEGER DEFAULT 3;
    RAISE NOTICE '✅ Coluna collaborator_satisfaction criada';
  END IF;
END $$;

-- Verificação final
SELECT 
  'RESULTADO FINAL' AS tipo,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'manager_satisfaction'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'feedbacks'
        AND column_name = 'collaborator_satisfaction'
    ) THEN '✅ Todas as colunas estão presentes!'
    ELSE '❌ Alguma coluna está faltando'
  END AS status;
























