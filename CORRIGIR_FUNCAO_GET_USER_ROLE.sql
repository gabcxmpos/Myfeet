-- ============================================
-- CORRIGIR FUNÇÃO get_user_role - REMOVER DUPLICATAS
-- Execute este script PRIMEIRO antes de executar os scripts de RLS
-- ============================================

-- PASSO 1: Remover TODAS as versões da função get_user_role (caso existam múltiplas)
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(user_id_param UUID);
DROP FUNCTION IF EXISTS public.get_user_role(user_id_param UUID DEFAULT NULL);

-- PASSO 2: Verificar se ainda existem funções com esse nome
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'get_user_role';

-- PASSO 3: Criar UMA ÚNICA versão da função (sem parâmetros)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Obter ID do usuário do JWT (sempre usa 'sub')
  BEGIN
    v_user_id := (auth.jwt() ->> 'sub')::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
  
  -- Tentar obter role do JWT primeiro
  v_role := auth.jwt() ->> 'role';
  
  -- Se não estiver no JWT ou for vazio, buscar da tabela app_users
  IF v_role IS NULL OR v_role = '' OR v_role = 'null' THEN
    BEGIN
      SELECT role INTO v_role
      FROM public.app_users
      WHERE id = v_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        v_role := NULL;
    END;
  END IF;
  
  -- Retornar role ou 'user' como padrão
  RETURN COALESCE(v_role, 'user');
END;
$$;

-- PASSO 4: Verificar se a função foi criada corretamente
SELECT 
    'Função criada' AS status,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'get_user_role';

-- PASSO 5: Testar a função (descomente quando estiver logado)
-- SELECT public.get_user_role() as meu_role, (auth.jwt() ->> 'sub')::text as meu_id;





























