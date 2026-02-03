-- ============================================
-- ADICIONAR CAMPO LAST_LOGIN NA TABELA APP_USERS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Adicionar coluna last_login se não existir
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- PASSO 2: Adicionar comentário na coluna
COMMENT ON COLUMN public.app_users.last_login IS 'Data e hora do último acesso do usuário ao sistema';

-- PASSO 3: Verificar se a coluna foi criada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_users'
  AND column_name = 'last_login';

-- PASSO 4: Criar função para atualizar last_login automaticamente
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar last_login quando houver uma sessão válida
  UPDATE public.app_users
  SET last_login = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se houver erro, não impedir o login
    RAISE WARNING 'Erro ao atualizar last_login para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- PASSO 5: Verificar se a função foi criada
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_user_last_login';

-- ============================================
-- NOTA: A atualização do last_login será feita
-- através da aplicação quando o usuário fizer login,
-- não através de trigger (mais seguro e confiável)
-- ============================================





























