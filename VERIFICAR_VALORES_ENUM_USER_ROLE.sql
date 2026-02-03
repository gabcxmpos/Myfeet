-- ============================================
-- VERIFICAR VALORES VÁLIDOS DO ENUM user_role
-- Execute este script PRIMEIRO para ver quais valores são válidos
-- ============================================

-- Verificar se o enum user_role existe
SELECT 
  '1. EXISTÊNCIA DO ENUM' AS verificacao,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) THEN '✅ Enum user_role existe'
    ELSE '❌ Enum user_role NÃO existe - A coluna role pode ser TEXT com constraint CHECK'
  END AS resultado;

-- Listar TODOS os valores do enum user_role
SELECT 
  '2. VALORES DO ENUM user_role' AS verificacao,
  t.typname AS nome_enum,
  e.enumlabel AS valor_enum,
  e.enumsortorder AS ordem
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Verificar se a coluna role em app_users é enum ou TEXT
SELECT 
  '3. TIPO DA COLUNA role' AS verificacao,
  column_name,
  data_type,
  udt_name,
  CASE 
    WHEN data_type = 'USER-DEFINED' AND udt_name = 'user_role' THEN '✅ É um ENUM'
    WHEN data_type = 'text' THEN '⚠️ É TEXT (pode ter constraint CHECK)'
    ELSE '❓ Tipo desconhecido: ' || data_type
  END AS resultado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND column_name = 'role';

-- Se for TEXT, verificar se há constraint CHECK
SELECT 
  '4. CONSTRAINT CHECK (se aplicável)' AS verificacao,
  conname AS nome_constraint,
  pg_get_constraintdef(oid) AS definicao_constraint
FROM pg_constraint
WHERE conrelid = 'public.app_users'::regclass
  AND contype = 'c'
  AND (pg_get_constraintdef(oid) LIKE '%role%' OR conname LIKE '%role%');

-- Verificar quais valores estão sendo usados na tabela app_users
SELECT 
  '5. VALORES EM USO NA TABELA app_users' AS verificacao,
  role::text AS valor_role,
  COUNT(*) AS quantidade_usuarios
FROM public.app_users
GROUP BY role::text
ORDER BY quantidade_usuarios DESC;

-- Resumo: Valores recomendados para usar nas políticas RLS
DO $$
DECLARE
  valores_enum TEXT;
BEGIN
  SELECT STRING_AGG(enumlabel::text, ', ' ORDER BY enumsortorder) INTO valores_enum
  FROM pg_enum e
  JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'user_role';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALORES VÁLIDOS DO ENUM user_role:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '%', COALESCE(valores_enum, 'Nenhum valor encontrado');
  RAISE NOTICE '';
  RAISE NOTICE 'Use APENAS estes valores nas políticas RLS!';
  RAISE NOTICE '========================================';
END $$;

