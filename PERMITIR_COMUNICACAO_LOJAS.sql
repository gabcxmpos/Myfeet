-- ============================================
-- PERMITIR PERFIL COMUNICAÇÃO GERENCIAR LOJAS
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script atualiza as políticas RLS para permitir que o perfil
-- "comunicação" possa visualizar, criar, editar e gerenciar lojas

-- ============================================
-- PARTE 1: VERIFICAR POLÍTICAS RLS EXISTENTES
-- ============================================

-- PASSO 1.1: Verificar políticas RLS existentes para stores
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operacao,
    qual AS condicao_using,
    with_check AS condicao_with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
ORDER BY cmd, policyname;

-- ============================================
-- PARTE 2: ATUALIZAR POLÍTICAS RLS PARA stores
-- ============================================

-- PASSO 2.1: Remover políticas antigas que precisam ser atualizadas
DROP POLICY IF EXISTS "Admin e supervisor podem ver todas as lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin e supervisor podem criar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin e supervisor podem atualizar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin pode excluir lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem ver todas as lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem criar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem atualizar lojas" ON public.stores;

-- PASSO 2.2: Criar política para SELECT (visualização)
-- Admin, supervisor e comunicação podem ver todas as lojas
-- Loja pode ver apenas sua própria loja
CREATE POLICY "Admin, supervisor e comunicação podem ver todas as lojas"
ON public.stores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role IN ('admin', 'supervisor', 'comunicação')
      OR (
        app_users.role = 'loja'
        AND app_users.store_id = stores.id
      )
    )
  )
);

-- PASSO 2.3: Criar política para INSERT (criação de lojas)
-- Admin, supervisor e comunicação podem criar lojas
CREATE POLICY "Admin, supervisor e comunicação podem criar lojas"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- PASSO 2.4: Criar política para UPDATE (atualização de lojas)
-- Admin, supervisor e comunicação podem atualizar lojas
CREATE POLICY "Admin, supervisor e comunicação podem atualizar lojas"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- PASSO 2.5: Criar política para DELETE (exclusão de lojas)
-- Apenas admin pode excluir lojas
CREATE POLICY "Admin pode excluir lojas"
ON public.stores
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- PASSO 2.6: Garantir que RLS está habilitado
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 3: VERIFICAR POLÍTICAS CRIADAS
-- ============================================

-- PASSO 3.1: Verificar políticas criadas para stores
SELECT 
    'stores' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação",
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin, supervisor e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        WHEN qual IS NULL OR qual = 'true' THEN '✅ Permite todos autenticados'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
ORDER BY cmd, policyname;

-- PASSO 3.2: Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'stores';

-- ✅ Políticas RLS atualizadas! Agora o perfil "comunicação" pode:
-- - Visualizar todas as lojas (SELECT)
-- - Criar novas lojas (INSERT)
-- - Editar informações das lojas (UPDATE)
-- - Ver informações de headcount (através do modal)
-- - Aprovar e excluir avaliações das lojas
-- - NÃO pode excluir lojas (apenas admin)



























