-- ============================================
-- VERIFICAÇÃO RÁPIDA - TESTAR TREINAMENTOS
-- ============================================

-- 1. Verificar se ambas as tabelas existem
SELECT 
  'trainings' AS tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') 
    THEN '✅ CRIADA'
    ELSE '❌ NÃO EXISTE'
  END AS status
UNION ALL
SELECT 
  'training_registrations' AS tabela,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_registrations') 
    THEN '✅ CRIADA'
    ELSE '❌ NÃO EXISTE'
  END AS status;

-- 2. Verificar se a coluna CPF foi adicionada
SELECT 
  'CPF em collaborators' AS item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaborators' AND column_name = 'cpf')
    THEN '✅ ADICIONADA'
    ELSE '❌ NÃO EXISTE'
  END AS status;

-- 3. Contar registros (para verificar se está vazio, o que é esperado)
SELECT 
  'trainings' AS tabela,
  COUNT(*) AS total_registros
FROM trainings
UNION ALL
SELECT 
  'training_registrations' AS tabela,
  COUNT(*) AS total_registros
FROM training_registrations;







