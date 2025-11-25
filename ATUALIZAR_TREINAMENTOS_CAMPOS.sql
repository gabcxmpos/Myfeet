-- ============================================
-- ATUALIZAR TABELA DE TREINAMENTOS
-- Adicionar campos: horário, link, bandeira
-- ============================================

-- Adicionar coluna time (horário) na tabela trainings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' AND column_name = 'time'
  ) THEN
    ALTER TABLE public.trainings ADD COLUMN time TIME;
    COMMENT ON COLUMN public.trainings.time IS 'Horário do treinamento';
  END IF;
END $$;

-- Adicionar coluna link na tabela trainings (para treinamentos online)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' AND column_name = 'link'
  ) THEN
    ALTER TABLE public.trainings ADD COLUMN link VARCHAR(500);
    COMMENT ON COLUMN public.trainings.link IS 'Link da reunião para treinamentos online';
  END IF;
END $$;

-- Adicionar coluna bandeira na tabela trainings (AF/AW/MF)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainings' AND column_name = 'bandeira'
  ) THEN
    ALTER TABLE public.trainings ADD COLUMN bandeira VARCHAR(50);
    COMMENT ON COLUMN public.trainings.bandeira IS 'Bandeira do treinamento: AF (AUTHENTIC FEET), AW (ARTWALK), MF (MAGICFEET)';
  END IF;
END $$;

-- Adicionar coluna presence (presença) na tabela training_registrations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_registrations' AND column_name = 'presence'
  ) THEN
    ALTER TABLE public.training_registrations ADD COLUMN presence BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN public.training_registrations.presence IS 'Indica se o colaborador esteve presente no treinamento';
  END IF;
END $$;

-- Verificar se todas as colunas foram adicionadas
SELECT 
  'Colunas adicionadas em trainings' AS status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'time')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'link')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainings' AND column_name = 'bandeira')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_registrations' AND column_name = 'presence')
    THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END AS result;







