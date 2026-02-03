-- ============================================
-- VERIFICAR E HABILITAR REALTIME PARA EQUIPAMENTOS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verificar se o Realtime está habilitado para equipments
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'equipments'
    ) THEN '✅ HABILITADO'
    ELSE '❌ NÃO HABILITADO'
  END AS status_realtime
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'equipments';

-- Verificar se o Realtime está habilitado para chips
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'chips'
    ) THEN '✅ HABILITADO'
    ELSE '❌ NÃO HABILITADO'
  END AS status_realtime
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'chips';

-- Habilitar Realtime se não estiver habilitado
DO $$
BEGIN
  -- Habilitar para equipments
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'equipments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.equipments;
    RAISE NOTICE '✅ Realtime habilitado para equipments';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime já estava habilitado para equipments';
  END IF;

  -- Habilitar para chips
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chips;
    RAISE NOTICE '✅ Realtime habilitado para chips';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime já estava habilitado para chips';
  END IF;
END $$;

-- Verificar novamente após habilitar
SELECT 
  'RESULTADO FINAL' AS verificacao,
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = pt.tablename
    ) THEN '✅ HABILITADO'
    ELSE '❌ NÃO HABILITADO'
  END AS status
FROM pg_publication_tables pt
WHERE pubname = 'supabase_realtime' 
  AND schemaname = 'public' 
  AND tablename IN ('equipments', 'chips');



