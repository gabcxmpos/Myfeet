-- ============================================
-- ATUALIZAR TABELA DE TREINAMENTOS
-- Mudar de bandeira para lojas específicas
-- ============================================

-- Remover coluna bandeira e adicionar coluna store_ids (array de IDs de lojas)
DO $$ 
BEGIN
  -- Adicionar coluna store_ids (JSON array de IDs de lojas)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' AND column_name = 'store_ids'
  ) THEN
    ALTER TABLE public.trainings ADD COLUMN store_ids JSONB;
    COMMENT ON COLUMN public.trainings.store_ids IS 'Array de IDs das lojas para as quais o treinamento é destinado. Se NULL, disponível para todas.';
  END IF;
  
  -- Manter coluna bandeira por enquanto para compatibilidade (pode ser removida depois)
  -- A migração será feita gradualmente
END $$;

-- Verificar se foi adicionado
SELECT 
  'Coluna store_ids adicionada' AS status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trainings' AND column_name = 'store_ids'
    ) THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END AS result;







