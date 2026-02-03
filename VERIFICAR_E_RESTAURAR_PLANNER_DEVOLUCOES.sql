-- ============================================
-- VERIFICAR E RESTAURAR REGISTROS DO PLANNER DE DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- ============================================
-- PASSO 1: VERIFICAR SE A TABELA EXISTE E QUANTOS REGISTROS TEM
-- ============================================
SELECT 
  'VERIFICAÇÃO INICIAL' AS etapa,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'returns_planner'
    ) THEN '✅ Tabela existe'
    ELSE '❌ Tabela não existe - Execute CRIAR_TABELA_PLANNER_DEVOLUCOES.sql primeiro'
  END AS status_tabela;

-- Contar registros TOTAL (sem considerar RLS - usando service_role)
-- Nota: Esta query pode não funcionar se você não tiver permissões de service_role
-- Mas vamos tentar verificar de outras formas
SELECT 
  'Total de registros na tabela' AS tipo,
  COUNT(*) AS total_registros
FROM public.returns_planner;

-- ============================================
-- PASSO 2: VERIFICAR POLÍTICAS RLS DE SELECT
-- ============================================
SELECT 
  'POLÍTICAS RLS SELECT' AS etapa,
  policyname AS nome_politica,
  cmd AS comando,
  roles AS perfis_permitidos,
  qual AS condicao_using,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Política SELECT encontrada'
    ELSE '⚠️ Outra política'
  END AS status
FROM pg_policies
WHERE tablename = 'returns_planner'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
  'RLS Status' AS etapa,
  tablename,
  rowsecurity AS rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESABILITADO'
  END AS status
FROM pg_tables
WHERE tablename = 'returns_planner'
  AND schemaname = 'public';

-- ============================================
-- PASSO 3: CORRIGIR/CRIAR POLÍTICAS RLS DE SELECT
-- ============================================

-- Remover políticas antigas de SELECT se existirem
DROP POLICY IF EXISTS "returns_planner_select_all" ON public.returns_planner;
DROP POLICY IF EXISTS "devoluções_pode_ver_returns_planner" ON public.returns_planner;
DROP POLICY IF EXISTS "admin_pode_ver_returns_planner" ON public.returns_planner;
DROP POLICY IF EXISTS "supervisor_pode_ver_returns_planner" ON public.returns_planner;

-- Garantir que RLS está habilitado
ALTER TABLE public.returns_planner ENABLE ROW LEVEL SECURITY;

-- Criar política de SELECT: Usuários com perfil 'devoluções', 'admin', 'supervisor' e 'supervisor_franquia' podem ver todos os registros
CREATE POLICY "returns_planner_select_all"
ON public.returns_planner
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
  )
);

-- Também permitir para service_role (para backups e administração)
CREATE POLICY "returns_planner_select_service_role"
ON public.returns_planner
FOR SELECT
TO service_role
USING (true);

-- ============================================
-- PASSO 4: VERIFICAR E CORRIGIR POLÍTICAS DE INSERT
-- ============================================

-- Remover políticas antigas de INSERT
DROP POLICY IF EXISTS "returns_planner_insert" ON public.returns_planner;

-- Criar política de INSERT
CREATE POLICY "returns_planner_insert"
ON public.returns_planner
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
  )
);

-- ============================================
-- PASSO 5: VERIFICAR E CORRIGIR POLÍTICAS DE UPDATE
-- ============================================

-- Remover políticas antigas de UPDATE
DROP POLICY IF EXISTS "returns_planner_update" ON public.returns_planner;

-- Criar política de UPDATE
CREATE POLICY "returns_planner_update"
ON public.returns_planner
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
  )
);

-- ============================================
-- PASSO 6: VERIFICAR E CORRIGIR POLÍTICAS DE DELETE
-- ============================================

-- Remover políticas antigas de DELETE
DROP POLICY IF EXISTS "returns_planner_delete" ON public.returns_planner;
DROP POLICY IF EXISTS "devoluções_admin_supervisor_pode_deletar_returns_planner" ON public.returns_planner;

-- Criar política de DELETE
CREATE POLICY "returns_planner_delete"
ON public.returns_planner
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text IN ('devoluções', 'admin', 'supervisor', 'supervisor_franquia')
  )
);

-- ============================================
-- PASSO 7: VERIFICAR ESTRUTURA DA TABELA
-- ============================================
SELECT 
  'ESTRUTURA DA TABELA' AS etapa,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'returns_planner'
ORDER BY ordinal_position;

-- ============================================
-- PASSO 8: VERIFICAR REGISTROS APÓS CORREÇÃO DAS POLÍTICAS
-- ============================================
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  COUNT(*) AS total_registros_visiveis,
  COUNT(DISTINCT store_id) AS total_lojas,
  COUNT(DISTINCT status) AS total_status_diferentes,
  MIN(created_at) AS registro_mais_antigo,
  MAX(created_at) AS registro_mais_recente
FROM public.returns_planner;

-- Listar alguns registros de exemplo (se existirem)
SELECT 
  'EXEMPLOS DE REGISTROS' AS etapa,
  id,
  store_id,
  supervisor,
  return_type,
  opening_date,
  case_number,
  invoice_number,
  status,
  brand,
  created_at
FROM public.returns_planner
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- PASSO 9: VERIFICAR SE HÁ REGISTROS NO HISTÓRICO OU BACKUP
-- ============================================
-- Verificar se existe tabela de histórico ou backup
SELECT 
  'VERIFICAÇÃO DE BACKUP' AS etapa,
  table_name,
  CASE 
    WHEN table_name LIKE '%returns_planner%' OR table_name LIKE '%planner%backup%' OR table_name LIKE '%planner%history%'
    THEN '✅ Possível tabela de backup encontrada'
    ELSE '⚠️ Nenhuma tabela de backup encontrada'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%returns_planner%' 
    OR table_name LIKE '%planner%backup%' 
    OR table_name LIKE '%planner%history%'
    OR table_name LIKE '%planner%log%'
  );

-- ============================================
-- PASSO 10: RESUMO FINAL
-- ============================================
SELECT 
  'RESUMO FINAL' AS etapa,
  (SELECT COUNT(*) FROM public.returns_planner) AS total_registros,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'returns_planner' AND cmd = 'SELECT') AS politicas_select,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'returns_planner' AND cmd = 'INSERT') AS politicas_insert,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'returns_planner' AND cmd = 'UPDATE') AS politicas_update,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'returns_planner' AND cmd = 'DELETE') AS politicas_delete,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'returns_planner' AND schemaname = 'public') 
    THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END AS status_rls;

-- ============================================
-- OBSERVAÇÕES IMPORTANTES:
-- ============================================
-- 1. Se os registros realmente foram deletados, eles não podem ser restaurados
--    sem um backup do banco de dados.
-- 2. Este script corrige as políticas RLS para garantir que os registros sejam visíveis
--    para usuários com os perfis corretos.
-- 3. Se você tiver um backup, será necessário restaurá-lo manualmente.
-- 4. Verifique se o usuário logado tem o perfil correto em app_users.
-- ============================================

