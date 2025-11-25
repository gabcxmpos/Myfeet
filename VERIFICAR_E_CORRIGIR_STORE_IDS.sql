-- ============================================
-- VERIFICAR E CORRIGIR COLUNA store_ids
-- ============================================

-- 1. Verificar se a coluna existe
SELECT 
  'Verificação da coluna store_ids' AS status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trainings' AND column_name = 'store_ids'
    ) THEN '✅ Coluna existe'
    ELSE '❌ Coluna NÃO existe - precisa executar ATUALIZAR_TREINAMENTOS_LOJAS.sql'
  END AS result;

-- 2. Se não existir, criar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' AND column_name = 'store_ids'
  ) THEN
    ALTER TABLE public.trainings ADD COLUMN store_ids JSONB;
    COMMENT ON COLUMN public.trainings.store_ids IS 'Array de IDs das lojas para as quais o treinamento é destinado. Se NULL, disponível para todas.';
    RAISE NOTICE '✅ Coluna store_ids criada';
  ELSE
    RAISE NOTICE '✅ Coluna store_ids já existe';
  END IF;
END $$;

-- 3. Verificar treinamentos existentes
SELECT 
  id,
  title,
  store_ids,
  CASE 
    WHEN store_ids IS NULL THEN 'NULL (disponível para todas)'
    WHEN store_ids::text = '[]' THEN 'Array vazio'
    ELSE store_ids::text
  END AS store_ids_display,
  training_date,
  format
FROM public.trainings
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'trainings'
ORDER BY ordinal_position;







