-- ============================================
-- VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ============================================

-- Listar todas as políticas UPDATE para stores
SELECT 
  policyname as "Nome da Política",
  cmd as "Comando",
  CASE 
    WHEN qual IS NOT NULL AND with_check IS NOT NULL THEN '✅ Completa'
    WHEN qual IS NOT NULL THEN '⚠️ Apenas USING'
    WHEN with_check IS NOT NULL THEN '⚠️ Apenas WITH CHECK'
    ELSE '❌ Sem condições'
  END as "Status"
FROM pg_policies
WHERE tablename = 'stores'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Contar políticas
SELECT 
  COUNT(*) as "Total de Políticas UPDATE"
FROM pg_policies
WHERE tablename = 'stores'
AND cmd = 'UPDATE';

-- Verificar se as políticas esperadas existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Lojas podem atualizar seus próprios resultados') 
    THEN '✅ Política de Lojas criada'
    ELSE '❌ Política de Lojas NÃO criada'
  END as status_lojas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Admin loja pode atualizar resultados da loja') 
    THEN '✅ Política de Admin Loja criada'
    ELSE '❌ Política de Admin Loja NÃO criada'
  END as status_admin_loja,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Colaboradores podem atualizar resultados da loja') 
    THEN '✅ Política de Colaboradores criada'
    ELSE '❌ Política de Colaboradores NÃO criada'
  END as status_colaboradores,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stores' AND policyname = 'Admin e supervisores podem atualizar todas as lojas') 
    THEN '✅ Política de Admin/Supervisores criada'
    ELSE '❌ Política de Admin/Supervisores NÃO criada'
  END as status_admin_supervisor;























