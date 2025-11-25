-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA TREINAMENTOS
-- Permitir que lojas vejam treinamentos disponíveis para elas
-- ============================================

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admin pode ver todos os treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin e supervisor podem ver todos os treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Lojas podem ver treinamentos disponíveis" ON public.trainings;
DROP POLICY IF EXISTS "Lojas podem ver treinamentos da sua marca" ON public.trainings;
DROP POLICY IF EXISTS "Usuários autenticados podem ver treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode criar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode atualizar treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode excluir treinamentos" ON public.trainings;
DROP POLICY IF EXISTS "Admin pode gerenciar treinamentos" ON public.trainings;

-- 2. Criar políticas corretas

-- Política para SELECT (leitura)
-- Admin e supervisor podem ver todos os treinamentos
CREATE POLICY "Admin e supervisor podem ver todos os treinamentos"
ON public.trainings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor')
  )
);

-- Lojas podem ver treinamentos disponíveis para elas
-- (treinamentos sem store_ids ou com store_ids contendo a loja da loja)
CREATE POLICY "Lojas podem ver treinamentos disponíveis"
ON public.trainings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'loja'
    AND app_users.store_id IS NOT NULL
    AND (
      -- Treinamento sem lojas específicas (disponível para todos)
      trainings.store_ids IS NULL 
      OR trainings.store_ids = '[]'::jsonb
      OR trainings.store_ids::text = 'null'
      OR trainings.store_ids::text = ''
      -- OU treinamento tem a loja do usuário no array (verificar se o UUID está no JSONB)
      OR (
        trainings.store_ids IS NOT NULL
        AND trainings.store_ids != '[]'::jsonb
        AND trainings.store_ids::text != 'null'
        AND trainings.store_ids::text != ''
        AND (
          -- Verificar se o store_id está no array JSONB (múltiplas formas de verificar)
          trainings.store_ids::jsonb @> to_jsonb(app_users.store_id::text)
          OR trainings.store_ids::jsonb @> to_jsonb(app_users.store_id)
          OR trainings.store_ids::text LIKE '%' || app_users.store_id::text || '%'
        )
      )
    )
  )
);

-- Política para INSERT (criação)
-- Apenas admin pode criar treinamentos
CREATE POLICY "Admin pode criar treinamentos"
ON public.trainings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Política para UPDATE (atualização)
-- Apenas admin pode atualizar treinamentos
CREATE POLICY "Admin pode atualizar treinamentos"
ON public.trainings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Política para DELETE (exclusão)
-- Apenas admin pode excluir treinamentos
CREATE POLICY "Admin pode excluir treinamentos"
ON public.trainings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- 3. Verificar se RLS está habilitado
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- 4. Verificar políticas criadas
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
WHERE tablename = 'trainings'
ORDER BY policyname;

-- 5. Testar acesso (substitua o UUID pela loja de teste)
-- SELECT * FROM public.trainings WHERE store_ids IS NULL OR store_ids::jsonb ? 'c64beb23-ad79-4607-b4cf-aa30452958a3'::text;

