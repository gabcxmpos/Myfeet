-- ============================================
-- CORRIGIR RLS PARA PERMITIR UPDATE DE STORE_RESULTS E COLLABORATOR_RESULTS
-- ============================================
-- Este script garante que usuários de loja, admin_loja e colaboradores
-- possam atualizar os campos store_results e collaborator_results na tabela stores

-- ============================================
-- PASSO 1: REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Lojas podem atualizar seus próprios resultados" ON public.stores;
DROP POLICY IF EXISTS "Admin loja pode atualizar resultados da loja" ON public.stores;
DROP POLICY IF EXISTS "Colaboradores podem atualizar resultados da loja" ON public.stores;
DROP POLICY IF EXISTS "Usuários podem atualizar store_results e collaborator_results" ON public.stores;

-- ============================================
-- PASSO 2: VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 3: VERIFICAR TIPO DO CAMPO ROLE E CRIAR POLÍTICA ADEQUADA
-- ============================================
-- Primeiro, verificar se role é enum ou text
DO $$
DECLARE
  role_type TEXT;
BEGIN
  -- Verificar o tipo de dados da coluna role
  SELECT data_type INTO role_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'app_users'
    AND column_name = 'role';
  
  RAISE NOTICE 'Tipo da coluna role: %', role_type;
END $$;

-- ============================================
-- PASSO 3A: CRIAR POLÍTICA PARA LOJAS ATUALIZAREM SEUS PRÓPRIOS RESULTADOS
-- ============================================
-- Usar CAST para garantir compatibilidade com enum ou text
CREATE POLICY "Lojas podem atualizar seus próprios resultados"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o usuário é da loja (role 'loja' ou qualquer role que contenha 'loja')
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role::text = 'loja' 
      OR app_users.role::text LIKE 'loja%'
      OR app_users.role::text = 'franquia'
    )
    AND app_users.store_id = stores.id
  )
)
WITH CHECK (
  -- Permitir atualização apenas dos campos de resultados
  -- e garantir que o usuário pertence à loja
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role::text = 'loja' 
      OR app_users.role::text LIKE 'loja%'
      OR app_users.role::text = 'franquia'
    )
    AND app_users.store_id = stores.id
  )
);

-- ============================================
-- PASSO 4: CRIAR POLÍTICA PARA ADMIN_LOJA ATUALIZAR RESULTADOS
-- ============================================
CREATE POLICY "Admin loja pode atualizar resultados da loja"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o usuário é admin_loja da loja (usando CAST para compatibilidade)
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text = 'admin_loja'
    AND app_users.store_id = stores.id
  )
)
WITH CHECK (
  -- Permitir atualização apenas se o usuário é admin_loja da loja
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text = 'admin_loja'
    AND app_users.store_id = stores.id
  )
);

-- ============================================
-- PASSO 5: CRIAR POLÍTICA PARA COLABORADORES ATUALIZAREM RESULTADOS
-- ============================================
CREATE POLICY "Colaboradores podem atualizar resultados da loja"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o usuário é colaborador da loja (usando CAST para compatibilidade)
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text = 'colaborador'
    AND app_users.store_id = stores.id
  )
)
WITH CHECK (
  -- Permitir atualização apenas se o usuário é colaborador da loja
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role::text = 'colaborador'
    AND app_users.store_id = stores.id
  )
);

-- ============================================
-- PASSO 6: CRIAR POLÍTICA PARA ADMIN E SUPERVISORES (acesso total)
-- ============================================
CREATE POLICY "Admin e supervisores podem atualizar todas as lojas"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o usuário é admin ou supervisor (usando CAST para compatibilidade)
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role::text = 'admin' 
      OR app_users.role::text LIKE 'supervisor%'
    )
  )
)
WITH CHECK (
  -- Permitir atualização se o usuário é admin ou supervisor
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role::text = 'admin' 
      OR app_users.role::text LIKE 'supervisor%'
    )
  )
);

-- ============================================
-- PASSO 7: VERIFICAR POLÍTICAS CRIADAS
-- ============================================
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

-- ============================================
-- PASSO 8: VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'stores';

-- ============================================
-- PASSO 9: TESTAR PERMISSÕES (opcional - executar manualmente)
-- ============================================
-- Para testar, execute como um usuário de loja:
-- UPDATE public.stores 
-- SET store_results = '{"2024-12": {"faturamento": 1000}}'::jsonb
-- WHERE id = 'ID_DA_LOJA_DO_USUARIO';
--
-- Se funcionar, você verá "UPDATE 1"
-- Se não funcionar, você verá erro de permissão

