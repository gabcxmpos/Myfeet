-- ============================================
-- PERMITIR PERFIL COMUNICAÇÃO ACESSAR CHAVE E CRIAR AVALIAÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script atualiza as políticas RLS para permitir que o perfil
-- "comunicação" possa editar o conteúdo da CHAVE e criar avaliações

-- ============================================
-- PARTE 1: POLÍTICAS PARA app_settings (CHAVE)
-- ============================================

-- PASSO 1.1: Verificar políticas RLS existentes para app_settings
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
AND tablename = 'app_settings'
ORDER BY cmd, policyname;

-- PASSO 1.2: Remover políticas antigas que precisam ser atualizadas
DROP POLICY IF EXISTS "Admin can manage app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin pode gerenciar app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admin e comunicação podem gerenciar app_settings" ON public.app_settings;

-- PASSO 1.3: Criar política para SELECT (leitura)
-- Todos os usuários autenticados podem ler app_settings
CREATE POLICY "Usuários autenticados podem ler app_settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- PASSO 1.4: Criar política para INSERT/UPDATE (criação/atualização)
-- Admin e comunicação podem criar/atualizar app_settings
CREATE POLICY "Admin e comunicação podem gerenciar app_settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'comunicação')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'comunicação')
  )
);

-- PASSO 1.5: Criar política para DELETE (exclusão)
-- Apenas admin pode excluir app_settings
CREATE POLICY "Admin pode excluir app_settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- ============================================
-- PARTE 2: POLÍTICAS PARA evaluations
-- ============================================

-- PASSO 2.1: Verificar políticas RLS existentes para evaluations
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
AND tablename = 'evaluations'
ORDER BY cmd, policyname;

-- PASSO 2.2: Verificar se há política para INSERT que precisa incluir "comunicação"
-- (Não vamos remover políticas existentes, apenas verificar e criar se necessário)

-- PASSO 2.3: Criar política para INSERT (criação de avaliações)
-- Admin, supervisor, loja e comunicação podem criar avaliações
DROP POLICY IF EXISTS "Usuários podem criar avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Admin, supervisor, loja e comunicação podem criar avaliações" ON public.evaluations;

CREATE POLICY "Admin, supervisor, loja e comunicação podem criar avaliações"
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'loja', 'comunicação')
  )
);

-- PASSO 2.4: Verificar se RLS está habilitado
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- PASSO 2.5: Verificar políticas criadas
SELECT 
    'app_settings' AS tabela,
    policyname,
    cmd AS operacao,
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        WHEN qual IS NULL OR qual = 'true' THEN '✅ Permite todos autenticados'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'app_settings'
ORDER BY cmd, policyname;

SELECT 
    'evaluations' AS tabela,
    policyname,
    cmd AS operacao,
    CASE 
        WHEN with_check LIKE '%admin%' AND with_check LIKE '%comunicação%' THEN '✅ Permite admin e comunicação'
        WHEN with_check LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'evaluations'
AND cmd = 'INSERT'
ORDER BY policyname;

-- ✅ Políticas RLS atualizadas! Agora o perfil "comunicação" pode:
-- - Editar o conteúdo da CHAVE (app_settings)
-- - Criar avaliações (evaluations)



























