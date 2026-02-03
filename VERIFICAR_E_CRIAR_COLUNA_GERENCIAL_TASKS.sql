-- ============================================
-- VERIFICAR E CRIAR COLUNA gerencialTasks
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a coluna existe
SELECT 
  'VERIFICAÇÃO' AS etapa,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_checklists'
  AND column_name = 'gerencialTasks';

-- 2. Criar coluna se não existir
DO $$
BEGIN
  -- Verificar se a coluna já existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'daily_checklists'
      AND column_name = 'gerencialTasks'
  ) THEN
    -- Criar coluna gerencialTasks do tipo JSONB
    ALTER TABLE public.daily_checklists
    ADD COLUMN "gerencialTasks" JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Coluna gerencialTasks criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna gerencialTasks já existe.';
  END IF;
END $$;

-- 3. Verificar se foi criada corretamente
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'gerencialTasks' AND data_type = 'jsonb'
    THEN '✅ Coluna criada corretamente'
    ELSE '⚠️ Verifique manualmente'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_checklists'
  AND column_name = 'gerencialTasks';

-- 4. Verificar estrutura completa da tabela
SELECT 
  'ESTRUTURA COMPLETA' AS etapa,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_checklists'
ORDER BY ordinal_position;


