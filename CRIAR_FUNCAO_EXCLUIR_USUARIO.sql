-- ============================================
-- CRIAR FUNÇÃO RPC PARA EXCLUIR USUÁRIO COMPLETAMENTE
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
-- - Cria uma função RPC que exclui o usuário de auth.users
-- - A foreign key app_users.id -> auth.users.id está configurada com ON DELETE CASCADE
-- - Isso significa que ao excluir de auth.users, o registro de app_users será excluído automaticamente
-- - O usuário será excluído completamente do sistema (tanto do servidor quanto do web)
-- ============================================

-- PASSO 1: Criar função para excluir usuário completamente
CREATE OR REPLACE FUNCTION public.delete_user_completely(
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_exists BOOLEAN := false;
    v_user_email TEXT;
    v_deleted_count INTEGER := 0;
BEGIN
    -- Validar ID do usuário
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'ID do usuário é obrigatório'
        );
    END IF;
    
    -- Verificar se o usuário existe em auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
    
    IF NOT v_user_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado com o ID fornecido: ' || p_user_id::TEXT
        );
    END IF;
    
    -- Buscar o email do usuário (para log)
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;
    
    -- Excluir o usuário de auth.users
    -- A foreign key app_users.id -> auth.users.id está configurada com ON DELETE CASCADE
    -- Isso significa que ao excluir de auth.users, o registro de app_users será excluído automaticamente
    DELETE FROM auth.users
    WHERE id = p_user_id;
    
    -- Verificar se a exclusão foi bem-sucedida
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    IF v_deleted_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao excluir o usuário. Nenhum registro foi excluído.'
        );
    END IF;
    
    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'message', 'Usuário excluído com sucesso do sistema',
        'user_id', p_user_id,
        'email', v_user_email,
        'deleted_count', v_deleted_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'detail', 'Erro ao excluir usuário: ' || SQLERRM
        );
END;
$$;

-- PASSO 2: Conceder permissões à função
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_completely(UUID) TO anon;

-- PASSO 3: Verificar se a função foi criada
SELECT 
    'Função RPC delete_user_completely' AS tipo,
    routine_name AS nome,
    routine_schema AS schema,
    routine_type AS tipo_funcao,
    security_type AS tipo_seguranca,
    CASE 
        WHEN routine_name = 'delete_user_completely' AND routine_schema = 'public' AND security_type = 'DEFINER'
        THEN '✅ CRIADA COM SUCESSO (SECURITY DEFINER)'
        ELSE '❌ NÃO CRIADA OU INSEGURA'
    END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'delete_user_completely';

-- PASSO 4: Verificar a configuração da foreign key
SELECT 
    'Configuração da Foreign Key' AS tipo,
    tc.constraint_name,
    tc.table_name,
    ccu.table_schema AS schema_ref,
    ccu.table_name AS tabela_ref,
    rc.delete_rule AS regra_delete,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
        THEN '✅ CORRETO (CASCADE configurado)'
        ELSE '❌ INCORRETO - Verifique a configuração da foreign key'
    END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 5: Testar a função com um usuário existente (OPCIONAL)
-- Descomente as linhas abaixo para testar a função:
/*
DO $$
DECLARE
    test_user_id UUID;
    test_result JSON;
BEGIN
    -- Pegar o primeiro usuário encontrado
    SELECT id INTO test_user_id
    FROM auth.users
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Testar a função (COMENTE ESTA LINHA EM PRODUÇÃO!)
        -- SELECT public.delete_user_completely(test_user_id) INTO test_result;
        -- RAISE NOTICE '✅ Teste da função: %', test_result;
        RAISE NOTICE 'ℹ️ Para testar, descomente a linha acima e forneça um UUID de usuário válido';
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum usuário encontrado para testar';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️ Erro ao testar função: %', SQLERRM;
END $$;
*/


