-- ============================================
-- CRIAR PERFIS DE FRANQUIA E SEPARAR PRÓPRIAS DE FRANQUIAS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Adicionar coluna 'tipo' na tabela stores se não existir
-- Valores possíveis: 'propria' ou 'franquia'
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
    
    RAISE NOTICE '✅ Coluna "tipo" adicionada à tabela stores';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna "tipo" já existe na tabela stores';
  END IF;
END $$;

-- PASSO 2: Atualizar lojas existentes baseado no campo 'franqueado'
-- Se tem franqueado preenchido, é franquia; caso contrário, é própria
UPDATE public.stores
SET tipo = CASE 
  WHEN franqueado IS NOT NULL AND franqueado != '' THEN 'franquia'
  ELSE 'propria'
END
WHERE tipo IS NULL OR tipo = 'propria';

-- PASSO 3: Verificar se os novos roles já existem no enum (se usar enum)
-- Se a tabela app_users usar CHECK constraint, não precisa fazer nada
-- Se usar enum, adicionar os novos valores:
DO $$
BEGIN
  -- Verificar se existe enum para roles
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    -- Adicionar novos roles ao enum se não existirem
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'loja_franquia' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      ALTER TYPE user_role ADD VALUE 'loja_franquia';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'supervisor_franquia' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      ALTER TYPE user_role ADD VALUE 'supervisor_franquia';
    END IF;
    
    RAISE NOTICE '✅ Novos roles adicionados ao enum user_role';
  ELSE
    RAISE NOTICE 'ℹ️ Não foi encontrado enum user_role, usando CHECK constraint (já deve estar configurado)';
  END IF;
END $$;

-- PASSO 4: Criar função helper para identificar tipo de loja baseado no role
CREATE OR REPLACE FUNCTION public.get_store_type_from_role(p_role TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE p_role
    WHEN 'loja' THEN RETURN 'propria';
    WHEN 'supervisor' THEN RETURN 'propria';
    WHEN 'loja_franquia' THEN RETURN 'franquia';
    WHEN 'supervisor_franquia' THEN RETURN 'franquia';
    WHEN 'admin' THEN RETURN NULL; -- Admin vê tudo
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASSO 5: Criar função para verificar se usuário pode ver loja
CREATE OR REPLACE FUNCTION public.can_user_view_store(p_user_id UUID, p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_store_tipo TEXT;
  v_user_store_id UUID;
BEGIN
  -- Buscar role do usuário
  SELECT role, store_id INTO v_user_role, v_user_store_id
  FROM public.app_users
  WHERE id = p_user_id;
  
  -- Se não encontrou usuário, retornar false
  IF v_user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin vê tudo
  IF v_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Buscar tipo da loja
  SELECT tipo INTO v_store_tipo
  FROM public.stores
  WHERE id = p_store_id;
  
  -- Se não encontrou loja, retornar false
  IF v_store_tipo IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se é loja e a loja é dele, pode ver
  IF (v_user_role = 'loja' OR v_user_role = 'loja_franquia') AND v_user_store_id = p_store_id THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se o tipo da loja corresponde ao tipo do role
  IF v_user_role IN ('loja', 'supervisor') AND v_store_tipo = 'propria' THEN
    RETURN TRUE;
  END IF;
  
  IF v_user_role IN ('loja_franquia', 'supervisor_franquia') AND v_store_tipo = 'franquia' THEN
    RETURN TRUE;
  END IF;
  
  -- Supervisor pode ver lojas do mesmo tipo que ele supervisiona
  -- (isso será verificado pela coluna supervisor na tabela stores)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 6: Atualizar RLS policies para stores
-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin pode ver todas as lojas" ON public.stores;
DROP POLICY IF EXISTS "Supervisores podem ver lojas que supervisionam" ON public.stores;
DROP POLICY IF EXISTS "Lojas podem ver sua própria loja" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem ver todas as lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem criar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem atualizar lojas" ON public.stores;
DROP POLICY IF EXISTS "Admin pode excluir lojas" ON public.stores;

-- Criar novas políticas que separam próprias de franquias

-- SELECT: Admin vê tudo; outros veem apenas do seu tipo
CREATE POLICY "Admin vê todas as lojas, outros veem apenas do seu tipo"
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
        -- Loja própria vê apenas lojas próprias
        (app_users.role = 'loja' AND stores.tipo = 'propria' AND stores.id = app_users.store_id)
        OR
        -- Loja franquia vê apenas lojas franquia
        (app_users.role = 'loja_franquia' AND stores.tipo = 'franquia' AND stores.id = app_users.store_id)
        OR
        -- Supervisor próprio vê lojas próprias que supervisiona
        (app_users.role = 'supervisor' AND stores.tipo = 'propria' AND stores.supervisor = (
          SELECT supervisor FROM public.stores WHERE id = app_users.store_id LIMIT 1
        ))
        OR
        -- Supervisor franquia vê lojas franquia que supervisiona
        (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia' AND stores.supervisor = (
          SELECT supervisor FROM public.stores WHERE id = app_users.store_id LIMIT 1
        ))
        OR
        -- Supervisor/comunicação vê todas do seu tipo (sem restrição de loja específica)
        (app_users.role IN ('supervisor', 'supervisor_franquia', 'comunicação') AND stores.tipo = public.get_store_type_from_role(app_users.role))
      )
    )
  )
);

-- INSERT: Admin, supervisor e comunicação podem criar lojas do seu tipo
CREATE POLICY "Admin, supervisor e comunicação podem criar lojas do seu tipo"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        app_users.role IN ('supervisor', 'supervisor_franquia', 'comunicação')
        AND (
          (app_users.role IN ('supervisor', 'comunicação') AND NEW.tipo = 'propria')
          OR
          (app_users.role = 'supervisor_franquia' AND NEW.tipo = 'franquia')
        )
      )
    )
  )
);

-- UPDATE: Admin, supervisor e comunicação podem atualizar lojas do seu tipo
CREATE POLICY "Admin, supervisor e comunicação podem atualizar lojas do seu tipo"
ON public.stores
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        app_users.role IN ('supervisor', 'supervisor_franquia', 'comunicação')
        AND (
          (app_users.role IN ('supervisor', 'comunicação') AND stores.tipo = 'propria')
          OR
          (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia')
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        app_users.role IN ('supervisor', 'supervisor_franquia', 'comunicação')
        AND (
          (app_users.role IN ('supervisor', 'comunicação') AND NEW.tipo = 'propria')
          OR
          (app_users.role = 'supervisor_franquia' AND NEW.tipo = 'franquia')
        )
      )
    )
  )
);

-- DELETE: Apenas admin pode excluir
CREATE POLICY "Apenas admin pode excluir lojas"
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

-- PASSO 7: Atualizar RLS policies para evaluations
-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem ver todas as avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Lojas podem ver suas próprias avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem criar avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem atualizar avaliações" ON public.evaluations;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem excluir avaliações" ON public.evaluations;

-- SELECT: Separar por tipo
CREATE POLICY "Avaliações separadas por tipo de loja"
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
        -- Verificar se a loja da avaliação é do mesmo tipo do usuário
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = evaluations.store_id
          AND (
            (app_users.role IN ('loja', 'supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role IN ('loja_franquia', 'supervisor_franquia') AND stores.tipo = 'franquia')
          )
          AND (
            app_users.role NOT IN ('loja', 'loja_franquia')
            OR stores.id = app_users.store_id
          )
        )
      )
    )
  )
);

-- INSERT: Criar avaliações apenas para lojas do seu tipo
CREATE POLICY "Criar avaliações apenas para lojas do seu tipo"
ON public.evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = NEW.store_id
          AND (
            (app_users.role IN ('loja', 'supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role IN ('loja_franquia', 'supervisor_franquia') AND stores.tipo = 'franquia')
          )
          AND (
            app_users.role NOT IN ('loja', 'loja_franquia')
            OR stores.id = app_users.store_id
          )
        )
      )
    )
  )
);

-- UPDATE e DELETE: Mesma lógica do SELECT
CREATE POLICY "Atualizar avaliações apenas do seu tipo"
ON public.evaluations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = evaluations.store_id
          AND (
            (app_users.role IN ('supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia')
          )
        )
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = NEW.store_id
          AND (
            (app_users.role IN ('supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia')
          )
        )
      )
    )
  )
);

CREATE POLICY "Excluir avaliações apenas do seu tipo"
ON public.evaluations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND (
      app_users.role = 'admin'
      OR (
        EXISTS (
          SELECT 1 FROM public.stores
          WHERE stores.id = evaluations.store_id
          AND (
            (app_users.role IN ('supervisor', 'comunicação') AND stores.tipo = 'propria')
            OR
            (app_users.role = 'supervisor_franquia' AND stores.tipo = 'franquia')
          )
        )
      )
    )
  )
);

-- PASSO 8: Verificar se as políticas foram criadas
SELECT 
    'stores' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'stores'
ORDER BY cmd, policyname;

SELECT 
    'evaluations' AS tabela,
    policyname AS "Nome da Política",
    cmd AS "Operação"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'evaluations'
ORDER BY cmd, policyname;

-- ✅ Script concluído!
-- Agora você pode criar usuários com roles 'loja_franquia' e 'supervisor_franquia'
-- As lojas devem ter o campo 'tipo' preenchido com 'propria' ou 'franquia'



























