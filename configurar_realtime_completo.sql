-- ============================================
-- CONFIGURAR REALTIME COMPLETO PARA EQUIPAMENTOS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se o Realtime está habilitado
SELECT 
  'Verificação Realtime' AS tipo,
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

-- 2. Habilitar Realtime se não estiver habilitado
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
  END IF;
END $$;

-- 3. Verificar REPLICA IDENTITY (necessário para Realtime funcionar corretamente)
SELECT 
  'REPLICA IDENTITY' AS tipo,
  tablename,
  CASE 
    WHEN (SELECT relreplident FROM pg_class WHERE relname = tablename) = 'd' THEN '✅ DEFAULT (usa PRIMARY KEY)'
    WHEN (SELECT relreplident FROM pg_class WHERE relname = tablename) = 'f' THEN '✅ FULL'
    WHEN (SELECT relreplident FROM pg_class WHERE relname = tablename) = 'i' THEN '✅ INDEX'
    ELSE '⚠️ NONE'
  END AS replica_identity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('equipments', 'chips');

-- 4. Configurar REPLICA IDENTITY se necessário (usa PRIMARY KEY por padrão, que é o ideal)
-- Não precisa alterar, pois as tabelas já têm PRIMARY KEY

-- 5. Verificar políticas RLS para UPDATE
SELECT 
  'Políticas UPDATE' AS tipo,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'UPDATE' THEN '✅ Policy de UPDATE encontrada'
    ELSE '⚠️ Verificar'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'equipments'
  AND cmd = 'UPDATE';

-- 6. Resumo final
SELECT 
  'RESUMO FINAL' AS verificacao,
  'equipments' AS tabela,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'equipments'
    ) THEN '✅ Realtime OK'
    ELSE '❌ Realtime FALTANDO'
  END AS realtime_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'equipments' 
      AND cmd = 'UPDATE'
    ) THEN '✅ Policy UPDATE OK'
    ELSE '❌ Policy UPDATE FALTANDO'
  END AS policy_status
UNION ALL
SELECT 
  'RESUMO FINAL' AS verificacao,
  'chips' AS tabela,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'chips'
    ) THEN '✅ Realtime OK'
    ELSE '❌ Realtime FALTANDO'
  END AS realtime_status,
  'N/A' AS policy_status;



