-- ============================================
-- CRIAR FUNÇÃO PARA RESET DE SENHA
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Esta função reseta a senha do usuário para "afeet10" usando SECURITY DEFINER
-- IMPORTANTE: Execute este script com permissões de administrador no Supabase

-- Habilitar extensão pgcrypto se não estiver habilitada
-- IMPORTANTE: Execute isso com permissões de superusuário ou admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

-- Função para resetar senha de um usuário para a senha padrão "afeet10"
-- IMPORTANTE: Esta função usa SECURITY DEFINER para acessar auth.users
CREATE OR REPLACE FUNCTION reset_user_password_to_default(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_encrypted_password TEXT;
  v_salt TEXT;
  v_hash_result TEXT;
BEGIN
  -- Buscar o ID e email do usuário
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  WHERE email = LOWER(TRIM(p_email));

  -- Verificar se o usuário existe
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado com este email.'
    );
  END IF;

  -- Gerar hash bcrypt da senha "afeet10"
  -- O Supabase usa bcrypt com formato específico
  -- IMPORTANTE: A extensão pgcrypto deve estar habilitada no schema public
  -- Usar a sintaxe correta do pgcrypto: gen_salt('bf') retorna TEXT
  BEGIN
    -- Verificar se pgcrypto está disponível
    PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Extensão pgcrypto não está habilitada. Execute: CREATE EXTENSION IF NOT EXISTS pgcrypto;';
    END IF;
    
    -- Gerar salt e hash usando pgcrypto
    -- No Supabase, as funções do pgcrypto podem estar em diferentes schemas
    -- Tentar diferentes formas de chamar a função
    BEGIN
      -- Tentar 1: Chamar sem prefixo (se estiver no search_path)
      v_salt := gen_salt('bf');
      v_encrypted_password := crypt('afeet10', v_salt);
    EXCEPTION
      WHEN OTHERS THEN
        BEGIN
          -- Tentar 2: Chamar com schema extensions (comum no Supabase)
          v_salt := extensions.gen_salt('bf');
          v_encrypted_password := extensions.crypt('afeet10', v_salt);
        EXCEPTION
          WHEN OTHERS THEN
            BEGIN
              -- Tentar 3: Chamar com schema public explicitamente
              v_salt := public.gen_salt('bf');
              v_encrypted_password := public.crypt('afeet10', v_salt);
            EXCEPTION
              WHEN OTHERS THEN
                RAISE EXCEPTION 'Não foi possível gerar hash. Erro: % (Código: %). Verifique se a extensão pgcrypto está habilitada e as funções gen_salt/crypt estão disponíveis.', SQLERRM, SQLSTATE;
            END;
        END;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Erro ao gerar hash da senha: % (Código: %)', SQLERRM, SQLSTATE;
  END;

  -- Atualizar a senha do usuário em auth.users
  -- IMPORTANTE: SECURITY DEFINER permite acesso a auth.users
  UPDATE auth.users
  SET 
    encrypted_password = v_encrypted_password,
    updated_at = NOW(),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()) -- Garantir que email está confirmado
  WHERE id = v_user_id;

  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Não foi possível atualizar a senha do usuário.'
    );
  END IF;

  -- Verificar se realmente atualizou
  SELECT encrypted_password INTO v_hash_result
  FROM auth.users
  WHERE id = v_user_id;

  IF v_hash_result IS NULL OR v_hash_result = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro ao verificar atualização da senha.'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Senha resetada com sucesso para "afeet10".',
    'user_id', v_user_id,
    'email', v_user_email
  );

EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Permissões insuficientes. Esta função requer SECURITY DEFINER e acesso a auth.users. Verifique se você tem permissões de administrador no Supabase.'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erro ao resetar senha: ' || SQLERRM || ' (Código: ' || SQLSTATE || ')'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Dar permissão para usuários autenticados (admin/supervisor) executarem esta função
GRANT EXECUTE ON FUNCTION reset_user_password_to_default(TEXT) TO authenticated;

-- Comentário na função
COMMENT ON FUNCTION reset_user_password_to_default(TEXT) IS 'Reseta a senha do usuário para "afeet10". Requer SECURITY DEFINER e permissões de administrador no Supabase.';
