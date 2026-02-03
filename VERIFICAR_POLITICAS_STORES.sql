-- ============================================
-- VERIFICAR POLÍTICAS RLS CRIADAS PARA STORES
-- ============================================

-- Verificar todas as políticas UPDATE para a tabela stores
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stores'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Contar quantas políticas foram criadas
SELECT 
  COUNT(*) as total_politicas_update
FROM pg_policies
WHERE tablename = 'stores'
AND cmd = 'UPDATE';

-- Verificar se há políticas que podem estar bloqueando
SELECT 
  policyname,
  CASE 
    WHEN qual IS NULL AND with_check IS NULL THEN '⚠️ Política sem condições'
    ELSE '✅ Política com condições'
  END as status
FROM pg_policies
WHERE tablename = 'stores'
AND cmd = 'UPDATE';























