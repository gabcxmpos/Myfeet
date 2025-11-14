-- ============================================
-- CRIAR FUNÇÃO RPC PARA RESETAR SENHA PARA "afeet10"
-- Execute este script no Supabase SQL Editor
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor (menu lateral esquerdo)
-- 3. Copie TODO este conteúdo
-- 4. Cole no SQL Editor
-- 5. Clique em RUN (ou Ctrl+Enter)
-- 
-- O que este script faz:
-- - Cria uma função RPC que reseta a senha do usuário para "afeet10"
-- - A função recebe o email do usuário e atualiza a senha diretamente
-- - Não envia email, apenas atualiza a senha no banco de dados
-- - A senha será resetada para "afeet10" e o usuário poderá fazer login com essa senha
-- ============================================

-- PASSO 1: Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PASSO 2: Criar função para resetar senha para senha padrão
CREATE OR REPLACE FUNCTION public.reset_user_password_to_default(
    p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_default_password TEXT := 'afeet10';
    v_hash TEXT;
BEGIN
    -- Validar email
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email é obrigatório'
        );
    END IF;
    
    -- Buscar o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = LOWER(TRIM(p_email));
    
    -- Verificar se o usuário foi encontrado
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado com o email fornecido: ' || p_email
        );
    END IF;
    
    -- Gerar hash da senha usando bcrypt (formato usado pelo Supabase Auth)
    -- O Supabase Auth usa bcrypt com cost factor 10
    -- O formato do hash é: $2a$10$salt+hash
    v_hash := crypt(v_default_password, gen_salt('bf', 10));
    
    -- Atualizar a senha na tabela auth.users
    -- O campo encrypted_password armazena o hash da senha no formato bcrypt
    UPDATE auth.users
    SET 
        encrypted_password = v_hash,
        updated_at = NOW(),
        -- Garantir que o email esteja confirmado (se necessário)
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_user_id;
    
    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao atualizar a senha do usuário'
        );
    END IF;
    
    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'message', 'Senha resetada com sucesso para a senha padrão (afeet10)',
        'user_id', v_user_id,
        'email', p_email
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'detail', 'Erro ao resetar senha do usuário: ' || SQLERRM
        );
END;
$$;

-- PASSO 3: Conceder permissões à função
GRANT EXECUTE ON FUNCTION public.reset_user_password_to_default(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_password_to_default(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_user_password_to_default(TEXT) TO anon;

-- PASSO 4: Verificar se a função foi criada
SELECT 
    'Função RPC reset_user_password_to_default' AS tipo,
    routine_name AS nome,
    routine_schema AS schema,
    routine_type AS tipo_funcao,
    security_type AS tipo_seguranca,
    CASE 
        WHEN routine_name = 'reset_user_password_to_default' AND routine_schema = 'public' AND security_type = 'DEFINER'
        THEN '✅ CRIADA COM SUCESSO (SECURITY DEFINER)'
        ELSE '❌ NÃO CRIADA OU INSEGURA'
    END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'reset_user_password_to_default';

-- PASSO 5: Testar a função com um usuário existente (OPCIONAL)
-- Descomente as linhas abaixo para testar a função:
/*
DO $$
DECLARE
    test_email TEXT;
    test_result JSON;
BEGIN
    -- Pegar o primeiro usuário encontrado
    SELECT email INTO test_email
    FROM auth.users
    LIMIT 1;
    
    IF test_email IS NOT NULL THEN
        -- Testar a função (COMENTE ESTA LINHA EM PRODUÇÃO!)
        -- SELECT public.reset_user_password_to_default(test_email) INTO test_result;
        -- RAISE NOTICE '✅ Teste da função: %', test_result;
        RAISE NOTICE 'ℹ️ Para testar, descomente a linha acima e forneça um email válido';
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum usuário encontrado para testar';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao testar função: %', SQLERRM;
END $$;
*/
