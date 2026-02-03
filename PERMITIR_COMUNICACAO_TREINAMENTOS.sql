-- ============================================
-- PERMITIR PERFIL COMUNICAÇÃO ACESSAR E CONTROLAR TREINAMENTOS
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script atualiza as políticas RLS para permitir que o perfil
-- "comunicação" tenha acesso completo aos treinamentos (criar, ler, atualizar, excluir)

-- PASSO 1: Verificar políticas RLS existentes
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
AND tablename = 'trainings'
ORDER BY cmd, policyname;

-- PASSO 2: Remover políticas antigas que precisam ser atualizadas
DROP POLICY IF EXISTS "Admin e supervisor podem ver todos os treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode criar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode atualizar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode excluir treinamentos" ON public.trainings;

-- PASSO 3: Criar/atualizar políticas incluindo o perfil "comunicação"

-- Política para SELECT (leitura)
-- Admin, supervisor e comunicação podem ver todos os treinamentos
CREATE POLICY "Admin, supervisor e comunicação podem ver todos os treinamentos"
ON public.trainings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- Política para INSERT (criação)
-- Admin e comunicação podem criar treinamentos
CREATE POLICY "Admin e comunicação podem criar treinamentos"
ON public.trainings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'comunicação')
  )
);

-- Política para UPDATE (atualização)
-- Admin e comunicação podem atualizar treinamentos
CREATE POLICY "Admin e comunicação podem atualizar treinamentos"
ON public.trainings
FOR UPDATE
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

-- Política para DELETE (exclusão)
-- Admin e comunicação podem excluir treinamentos
CREATE POLICY "Admin e comunicação podem excluir treinamentos"
ON public.trainings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'comunicação')
  )
);

-- PASSO 4: Verificar se RLS está habilitado
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS operacao,
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin e comunicação'
        WHEN qual LIKE '%admin%' AND qual LIKE '%supervisor%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin, supervisor e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'trainings'
ORDER BY cmd, policyname;

-- ✅ Políticas RLS atualizadas! Agora o perfil "comunicação" pode:
-- - Ver todos os treinamentos
-- - Criar novos treinamentos
-- - Atualizar treinamentos existentes
-- - Excluir treinamentos



























