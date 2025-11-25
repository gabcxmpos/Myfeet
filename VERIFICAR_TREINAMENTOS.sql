-- ============================================
-- SCRIPT DE VERIFICAÇÃO - TREINAMENTOS
-- ============================================

-- Verificar se a coluna CPF existe
SELECT 
  'Coluna CPF em collaborators' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'collaborators' AND column_name = 'cpf'
    ) THEN '✅ SUCESSO'
    ELSE '❌ ERRO - Execute a parte 1 do script CRIAR_TABELAS_TREINAMENTOS.sql'
  END AS status;

-- Verificar se a tabela trainings existe
SELECT 
  'Tabela trainings' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'trainings'
    ) THEN '✅ SUCESSO'
    ELSE '❌ ERRO - Execute a parte 2 do script CRIAR_TABELAS_TREINAMENTOS.sql'
  END AS status;

-- Verificar se a tabela training_registrations existe
SELECT 
  'Tabela training_registrations' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'training_registrations'
    ) THEN '✅ SUCESSO'
    ELSE '❌ ERRO - Execute a parte 3 do script CRIAR_TABELAS_TREINAMENTOS.sql'
  END AS status;

-- Verificar se as políticas RLS estão ativas
SELECT 
  'RLS ativo em trainings' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'trainings' 
      AND rowsecurity = true
    ) THEN '✅ SUCESSO'
    ELSE '⚠️ ATENÇÃO - RLS pode não estar ativo'
  END AS status;

SELECT 
  'RLS ativo em training_registrations' AS item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'training_registrations' 
      AND rowsecurity = true
    ) THEN '✅ SUCESSO'
    ELSE '⚠️ ATENÇÃO - RLS pode não estar ativo'
  END AS status;

-- Verificar colunas da tabela trainings
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'trainings'
ORDER BY ordinal_position;

-- Verificar colunas da tabela training_registrations
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'training_registrations'
ORDER BY ordinal_position;







