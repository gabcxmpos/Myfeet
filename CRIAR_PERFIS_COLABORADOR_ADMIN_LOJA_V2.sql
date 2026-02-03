-- ============================================
-- CRIAR PERFIS: COLABORADOR E ADMIN DE LOJA (VERSÃO CORRIGIDA)
-- Execute este script no Supabase SQL Editor
-- IMPORTANTE: Se usar ENUM, execute os comandos ALTER TYPE separadamente
-- ============================================

-- ============================================
-- PARTE 1: ADICIONAR VALORES AO ENUM (se usar enum)
-- Execute CADA comando abaixo em um RUN SEPARADO
-- ============================================

-- Verificar se existe enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    RAISE NOTICE '✅ Enum user_role encontrado. Adicione os valores abaixo um por vez.';
  ELSE
    RAISE NOTICE 'ℹ️ Usando CHECK constraint. Pule a parte do enum.';
  END IF;
END $$;

-- Execute este comando PRIMEIRO (descomente e execute):
-- ALTER TYPE user_role ADD VALUE 'colaborador';

-- Execute este comando DEPOIS (descomente e execute):
-- ALTER TYPE user_role ADD VALUE 'admin_loja';

-- ============================================
-- PARTE 2: Verificar/Criar coluna 'tipo' na tabela stores
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'stores' 
    AND column_name = 'tipo'
  ) THEN
    ALTER TABLE public.stores 
    ADD COLUMN tipo TEXT DEFAULT 'propria' CHECK (tipo IN ('propria', 'franquia'));
    
    -- Criar índice para melhor performance
    CREATE INDEX IF NOT EXISTS idx_stores_tipo ON public.stores (tipo);
    
    -- Atualizar lojas existentes baseado no campo 'franqueado'
    -- Se tem franqueado preenchido, é franquia; caso contrário, é própria
    UPDATE public.stores
    SET tipo = CASE 
      WHEN franqueado IS NOT NULL AND franqueado != '' AND franqueado != 'Loja Própria' THEN 'franquia'
      ELSE 'propria'
    END
    WHERE tipo IS NULL;
    
    RAISE NOTICE '✅ Coluna "tipo" adicionada à tabela stores';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna "tipo" já existe na tabela stores';
  END IF;
END $$;

-- ============================================
-- PARTE 3: ATUALIZAR CHECK CONSTRAINT (se usar CHECK constraint)
-- ============================================

DO $$
BEGIN
  -- Verificar se existe constraint de role
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%role%' 
    AND table_name = 'app_users'
    AND table_schema = 'public'
  ) THEN
    -- Remover constraint antiga se existir
    ALTER TABLE public.app_users 
    DROP CONSTRAINT IF EXISTS app_users_role_check;
    
    -- Criar nova constraint com os novos roles
    ALTER TABLE public.app_users 
    ADD CONSTRAINT app_users_role_check 
    CHECK (role IN (
      'admin',
      'supervisor',
      'supervisor_franquia',
      'loja',
      'loja_franquia',
      'devoluções',
      'comunicação',
      'financeiro',
      'rh',
      'motorista',
      'colaborador',      -- NOVO
      'admin_loja'        -- NOVO
    ));
    
    RAISE NOTICE '✅ Constraint de role atualizada com os novos perfis';
  ELSE
    RAISE NOTICE 'ℹ️ Não foi encontrada constraint de role, usando enum';
  END IF;
END $$;

-- ============================================
-- PARTE 4: Verificar se a coluna store_id existe
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'app_users' 
    AND column_name = 'store_id'
  ) THEN
    ALTER TABLE public.app_users 
    ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_app_users_store_id ON public.app_users (store_id);
    
    RAISE NOTICE '✅ Coluna "store_id" adicionada à tabela app_users';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna "store_id" já existe na tabela app_users';
  END IF;
END $$;

-- ============================================
-- PARTE 5: Criar função helper
-- ============================================

CREATE OR REPLACE FUNCTION public.role_requires_store(p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar comparação de texto para evitar problemas com enum
  RETURN p_role::text IN ('loja', 'loja_franquia', 'colaborador', 'admin_loja');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PARTE 6: Atualizar RLS policies para stores
-- ============================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Colaborador e Admin de Loja veem apenas sua loja" ON public.stores;

-- Criar nova política que inclui os novos perfis
CREATE POLICY "Colaborador e Admin de Loja veem apenas sua loja"
ON public.stores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        -- Colaborador e Admin de Loja veem apenas sua loja vinculada
        app_users.role::text IN ('colaborador', 'admin_loja')
        AND stores.id = app_users.store_id
      )
      OR (
        -- Outros roles mantêm suas políticas existentes
        (app_users.role::text = 'loja' AND stores.tipo = 'propria' AND stores.id = app_users.store_id)
        OR
        (app_users.role::text = 'loja_franquia' AND stores.tipo = 'franquia' AND stores.id = app_users.store_id)
        OR
        (app_users.role::text = 'supervisor' AND stores.tipo = 'propria')
        OR
        (app_users.role::text = 'supervisor_franquia' AND stores.tipo = 'franquia')
        OR
        (app_users.role::text = 'comunicação' AND stores.tipo = 'propria')
      )
    )
  )
);

-- ============================================
-- PARTE 7: Atualizar RLS policies para evaluations
-- ============================================

DROP POLICY IF EXISTS "Colaborador e Admin de Loja veem avaliações de sua loja" ON public.evaluations;

CREATE POLICY "Colaborador e Admin de Loja veem avaliações de sua loja"
ON public.evaluations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        -- Colaborador e Admin de Loja veem apenas avaliações de sua loja
        app_users.role::text IN ('colaborador', 'admin_loja')
        AND evaluations.store_id = app_users.store_id
      )
      OR (
        -- Outros roles mantêm suas políticas existentes
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = evaluations.store_id
          AND (
            (app_users.role::text IN ('loja', 'supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role::text IN ('loja_franquia', 'supervisor_franquia') AND stores.tipo = 'franquia')
          )
          AND (
            app_users.role::text NOT IN ('loja', 'loja_franquia', 'colaborador', 'admin_loja')
            OR stores.id = app_users.store_id
          )
        )
      )
    )
  )
);

-- ============================================
-- PARTE 8: Verificações finais
-- ============================================

-- Verificar políticas criadas
SELECT 
    'stores' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
AND policyname LIKE '%Colaborador%'
ORDER BY cmd, policyname;

SELECT 
    'evaluations' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'evaluations'
AND policyname LIKE '%Colaborador%'
ORDER BY cmd, policyname;

-- Verificar valores do enum (todos os valores possíveis)
SELECT 
    'Valores do Enum user_role' AS tipo,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) AS "Todos os valores do enum"
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Verificar se colaborador e admin_loja existem no enum
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'colaborador' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role'))
        THEN '✅ colaborador existe no enum'
        ELSE '❌ colaborador NÃO existe no enum'
    END AS status_colaborador,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_loja' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role'))
        THEN '✅ admin_loja existe no enum'
        ELSE '❌ admin_loja NÃO existe no enum'
    END AS status_admin_loja;

-- Verificar roles em uso (apenas roles que já têm usuários)
SELECT 
    'Roles em uso (com usuários)' AS info,
    string_agg(DISTINCT role::text, ', ' ORDER BY role::text) AS roles
FROM public.app_users
WHERE role IS NOT NULL;

-- ✅ Script concluído!
-- Agora você pode criar usuários com roles 'colaborador' e 'admin_loja'
-- IMPORTANTE: Esses perfis DEVEM ter store_id vinculado a uma loja cadastrada
-- O colaborador é de loja própria (tipo = 'propria')
-- O admin_loja também é de loja própria (tipo = 'propria')

