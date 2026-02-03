-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA TREINAMENTOS
-- Permitir que o perfil "comunicação" possa criar treinamentos
-- Execute este script no Supabase SQL Editor
-- ============================================

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

-- PASSO 2: Remover políticas antigas de INSERT que precisam ser atualizadas
DROP POLICY IF EXISTS "Admin pode criar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin e comunicação podem criar treinamentos" ON public.trainings;

-- PASSO 3: Criar nova política de INSERT incluindo "comunicação"
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

-- PASSO 4: Verificar se há política de SELECT que precisa incluir "comunicação"
-- Remover política antiga de SELECT se não incluir comunicação
DROP POLICY IF EXISTS "Admin e supervisor podem ver todos os treinamentos" ON public.trainings;

-- Criar nova política de SELECT incluindo "comunicação"
CREATE POLICY "Admin, supervisor e comunicação podem ver todos os treinamentos"
ON public.trainings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
  OR
  -- Manter acesso para lojas (política existente)
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'loja'
    AND app_users.store_id IS NOT NULL
    AND (
      trainings.store_ids IS NULL 
      OR trainings.store_ids = '[]'::jsonb
      OR trainings.store_ids::text = 'null'
      OR trainings.store_ids::text = ''
      OR (
        trainings.store_ids IS NOT NULL
        AND trainings.store_ids != '[]'::jsonb
        AND trainings.store_ids::text != 'null'
        AND trainings.store_ids::text != ''
        AND (
          trainings.store_ids::jsonb @> to_jsonb(app_users.store_id::text)
          OR trainings.store_ids::jsonb @> to_jsonb(app_users.store_id)
          OR trainings.store_ids::text LIKE '%' || app_users.store_id::text || '%'
        )
      )
    )
  )
);

-- PASSO 5: Verificar e atualizar política de UPDATE
DROP POLICY IF EXISTS "Admin pode atualizar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin e comunicação podem atualizar treinamentos" ON public.trainings;

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

-- PASSO 6: Verificar e atualizar política de DELETE
DROP POLICY IF EXISTS "Admin pode excluir treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin e comunicação podem excluir treinamentos" ON public.trainings;

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

-- PASSO 7: Garantir que RLS está habilitado
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- PASSO 8: Verificar políticas criadas
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
-- - Ver todos os treinamentos (SELECT)
-- - Criar novos treinamentos (INSERT)
-- - Atualizar treinamentos existentes (UPDATE)
-- - Excluir treinamentos (DELETE)





















