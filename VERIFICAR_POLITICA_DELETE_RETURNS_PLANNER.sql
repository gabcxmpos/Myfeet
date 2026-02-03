-- ============================================
-- VERIFICAR POLÍTICA DELETE RETURNS_PLANNER
-- Execute este script para verificar se tudo está correto
-- ============================================

-- 1. Verificar se RLS está habilitado
SELECT 
  'RLS Status' AS verificação,
  tablename,
  rowsecurity AS rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESABILITADO - Execute: ALTER TABLE public.returns_planner ENABLE ROW LEVEL SECURITY;'
  END AS status
FROM pg_tables
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';

-- 2. Verificar todas as políticas de DELETE existentes
SELECT 
  'Políticas DELETE' AS verificação,
  policyname AS nome_politica,
  cmd AS comando,
  roles AS perfis_permitidos,
  qual AS condição_using,
  CASE 
    WHEN cmd = 'DELETE' THEN '✅ Política DELETE encontrada'
    ELSE '⚠️ Outra política'
  END AS status
FROM pg_policies
WHERE tablename = 'returns_planner'
ORDER BY cmd, policyname;

-- 3. Verificar especificamente a política para devoluções/admin/supervisor
SELECT 
  'Política DELETE para devoluções' AS verificação,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN policyname LIKE '%devoluções%' OR policyname LIKE '%admin%' OR policyname LIKE '%supervisor%' THEN '✅ Política encontrada'
    ELSE '❌ Política não encontrada'
  END AS status
FROM pg_policies
WHERE tablename = 'returns_planner'
  AND cmd = 'DELETE';

-- 4. Verificar se o usuário atual tem permissão (substitua pelo ID do usuário de devoluções se necessário)
-- Esta query mostra quais políticas se aplicam ao usuário autenticado
SELECT 
  'Permissões do usuário atual' AS verificação,
  policyname,
  cmd,
  roles,
  'Verifique se seu perfil está na lista de roles' AS observação
FROM pg_policies
WHERE tablename = 'returns_planner'
  AND cmd = 'DELETE';

-- 5. Resumo: Contar quantas políticas de DELETE existem
SELECT 
  'Resumo' AS verificação,
  COUNT(*) AS total_politicas_delete,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem políticas de DELETE'
    ELSE '❌ Nenhuma política de DELETE encontrada'
  END AS status
FROM pg_policies
WHERE tablename = 'returns_planner'
  AND cmd = 'DELETE';








