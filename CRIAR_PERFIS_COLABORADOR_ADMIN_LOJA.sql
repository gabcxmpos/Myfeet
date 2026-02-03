-- ============================================
-- CRIAR PERFIS: COLABORADOR E ADMIN DE LOJA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se os novos roles já existem no enum (se usar enum)
-- IMPORTANTE: Valores de enum devem ser adicionados em comandos SEPARADOS
-- Execute cada ALTER TYPE em uma transação separada (cada um em um RUN separado)
-- Se a tabela app_users usar CHECK constraint, pule este passo

-- Verificar se existe enum para roles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    RAISE NOTICE '✅ Enum user_role encontrado. Execute os comandos ALTER TYPE separadamente!';
  ELSE
    RAISE NOTICE 'ℹ️ Não foi encontrado enum user_role, usando CHECK constraint (pule os ALTER TYPE)';
  END IF;
END $$;

-- ============================================
-- IMPORTANTE: Execute estes comandos UM POR VEZ (cada um em um RUN separado)
-- ============================================

-- COMANDO 1: Adicionar 'colaborador' ao enum (execute este primeiro)
-- ALTER TYPE user_role ADD VALUE 'colaborador';

-- COMANDO 2: Adicionar 'admin_loja' ao enum (execute este depois do primeiro)
-- ALTER TYPE user_role ADD VALUE 'admin_loja';

-- ============================================
-- Se der erro dizendo que o valor já existe, ignore e continue
-- ============================================

-- PASSO 2: Verificar se a coluna store_id existe na tabela app_users
-- Se não existir, adicionar (já deve existir, mas vamos garantir)
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

-- PASSO 3: Atualizar CHECK constraint na tabela app_users para incluir os novos roles
-- (Se usar CHECK constraint ao invés de enum)
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
    RAISE NOTICE 'ℹ️ Não foi encontrada constraint de role, usando enum ou outra estrutura';
  END IF;
END $$;

-- PASSO 4: Criar função helper para identificar se role precisa de loja
-- NOTA: Esta função será criada após os valores do enum serem commitados
CREATE OR REPLACE FUNCTION public.role_requires_store(p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar comparação de texto para evitar problemas com enum
  RETURN p_role::text IN ('loja', 'loja_franquia', 'colaborador', 'admin_loja');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 5: Atualizar RLS policies para stores (incluir novos perfis)
-- Os novos perfis devem ver apenas a loja vinculada a eles

-- SELECT: Colaborador e Admin de Loja veem apenas sua loja
DROP POLICY IF EXISTS "Colaborador e Admin de Loja veem apenas sua loja" ON public.stores;

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
        app_users.role IN ('colaborador', 'admin_loja')
        AND stores.id = app_users.store_id
      )
      OR (
        -- Outros roles mantêm suas políticas existentes
        (app_users.role = 'loja' AND stores.tipo = 'propria' AND stores.id = app_users.store_id)
        OR
        (app_users.role = 'loja_franquia' AND stores.tipo = 'franquia' AND stores.id = app_users.store_id)
        OR
        (app_users.role = 'supervisor' AND stores.tipo = 'propria')
        OR
        (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia')
        OR
        (app_users.role = 'comunicação' AND stores.tipo = 'propria')
      )
    )
  )
);

-- PASSO 6: Atualizar RLS policies para evaluations (incluir novos perfis)
-- Colaborador e Admin de Loja veem apenas avaliações de sua loja

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
        app_users.role IN ('colaborador', 'admin_loja')
        AND evaluations.store_id = app_users.store_id
      )
      OR (
        -- Outros roles mantêm suas políticas existentes
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = evaluations.store_id
          AND (
            (app_users.role IN ('loja', 'supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role IN ('loja_franquia', 'supervisor_franquia') AND stores.tipo = 'franquia')
          )
          AND (
            app_users.role NOT IN ('loja', 'loja_franquia', 'colaborador', 'admin_loja')
            OR stores.id = app_users.store_id
          )
        )
      )
    )
  )
);

-- PASSO 7: Verificar se as políticas foram criadas
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

-- PASSO 8: Verificar roles disponíveis
SELECT 
    'Roles disponíveis' AS info,
    string_agg(DISTINCT role::text, ', ' ORDER BY role::text) AS roles
FROM public.app_users
WHERE role IS NOT NULL;

-- ✅ Script concluído!
-- Agora você pode criar usuários com roles 'colaborador' e 'admin_loja'
-- IMPORTANTE: Esses perfis DEVEM ter store_id vinculado a uma loja cadastrada
-- O colaborador é de loja própria (tipo = 'propria')
-- O admin_loja também é de loja própria (tipo = 'propria')

