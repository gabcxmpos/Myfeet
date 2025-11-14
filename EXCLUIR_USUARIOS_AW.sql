-- ============================================
-- EXCLUIR TODOS OS USUÁRIOS DE LOJA COM USERNAME COMEÇANDO COM "AW"
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
-- - Verifica quais usuários serão excluídos (role='loja' e username LIKE 'AW%')
-- - Cria uma função RPC para excluir os usuários de forma segura
-- - Exclui os usuários de auth.users (app_users será excluído automaticamente devido ao CASCADE)
-- - Verifica se a exclusão foi bem-sucedida
-- 
-- IMPORTANTE:
-- - A exclusão é PERMANENTE e não pode ser desfeita
-- - Certifique-se de que realmente deseja excluir esses usuários
-- - A foreign key app_users.id -> auth.users.id deve estar configurada com ON DELETE CASCADE
-- ============================================

-- PASSO 1: Verificar quais usuários serão excluídos
SELECT 
    'Usuários que serão excluídos' AS tipo,
    apu.id,
    apu.username,
    apu.role,
    apu.status,
    au.email,
    au.created_at
FROM public.app_users apu
LEFT JOIN auth.users au ON au.id = apu.id
WHERE apu.role = 'loja'
  AND apu.username LIKE 'AW%'
ORDER BY apu.username;

-- PASSO 2: Contar quantos usuários serão excluídos
SELECT 
    'Total de usuários a excluir' AS tipo,
    COUNT(*) AS total
FROM public.app_users apu
WHERE apu.role = 'loja'
  AND apu.username LIKE 'AW%';

-- PASSO 3: Excluir usuários
-- IMPORTANTE: A foreign key app_users_id_fkey está configurada com ON DELETE CASCADE
-- Isso significa que ao excluir de auth.users, os registros de app_users serão excluídos automaticamente
-- OU ao excluir de app_users, os registros de auth.users serão excluídos automaticamente (dependendo da configuração)

-- Verificar a configuração da foreign key
SELECT 
    'Configuração da Foreign Key' AS tipo,
    tc.constraint_name,
    tc.table_name,
    ccu.table_schema AS schema_ref,
    ccu.table_name AS tabela_ref,
    rc.delete_rule AS regra_delete
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'app_users'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- PASSO 4: Criar função para excluir usuários
-- Esta função exclui usuários de auth.users (app_users será excluído automaticamente devido ao CASCADE)
CREATE OR REPLACE FUNCTION public.delete_users_by_username_pattern(
    p_role TEXT,
    p_username_pattern TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_ids UUID[];
    user_count INTEGER;
    deleted_count INTEGER := 0;
BEGIN
    -- Coletar IDs dos usuários a excluir
    SELECT array_agg(id), COUNT(*) INTO user_ids, user_count
    FROM public.app_users
    WHERE role = p_role
      AND username LIKE p_username_pattern;
    
    -- Verificar se há usuários para excluir
    IF user_count > 0 AND user_ids IS NOT NULL THEN
        -- Excluir de auth.users (app_users será excluído automaticamente devido ao CASCADE)
        DELETE FROM auth.users
        WHERE id = ANY(user_ids);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN json_build_object(
            'success', true,
            'message', 'Usuários excluídos com sucesso',
            'deleted_count', deleted_count,
            'total_found', user_count
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'message', 'Nenhum usuário encontrado para excluir',
            'deleted_count', 0,
            'total_found', 0
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- PASSO 4.1: Conceder permissões à função
GRANT EXECUTE ON FUNCTION public.delete_users_by_username_pattern TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_users_by_username_pattern TO service_role;

-- PASSO 5: Excluir usuários usando a função
SELECT public.delete_users_by_username_pattern('loja', 'AW%');

-- PASSO 6: Alternativa - Excluir diretamente (se a função não funcionar)
-- Descomente as linhas abaixo se a função não funcionar:
/*
DO $$
DECLARE
    user_ids UUID[];
    user_count INTEGER;
BEGIN
    -- Coletar IDs dos usuários a excluir
    SELECT array_agg(id), COUNT(*) INTO user_ids, user_count
    FROM public.app_users
    WHERE role = 'loja'
      AND username LIKE 'AW%';
    
    IF user_count > 0 THEN
        RAISE NOTICE 'Excluindo % usuários com username começando com AW', user_count;
        
        -- Excluir de auth.users (app_users será excluído automaticamente devido ao CASCADE)
        DELETE FROM auth.users
        WHERE id = ANY(user_ids);
        
        RAISE NOTICE 'Usuários excluídos com sucesso';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para excluir';
    END IF;
END $$;
*/

-- PASSO 7: Verificar se todos foram excluídos de app_users
SELECT 
    'Verificação final - app_users' AS tipo,
    COUNT(*) AS usuarios_restantes_com_AW
FROM public.app_users
WHERE role = 'loja'
  AND username LIKE 'AW%';

-- PASSO 8: Verificar se há registros órfãos em auth.users
-- Nota: Se a foreign key estiver com CASCADE corretamente, não deveria haver registros órfãos
-- Esta query verifica se há usuários em auth.users que não existem mais em app_users
-- Se houver, significa que a exclusão não funcionou corretamente
SELECT 
    'Verificação de registros órfãos' AS tipo,
    COUNT(*) AS registros_orfaos_em_auth_users
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1
    FROM public.app_users apu
    WHERE apu.id = au.id
)
AND au.email LIKE '%@%';  -- Apenas usuários com email (para evitar contar outros tipos de registros)

-- PASSO 9: Listar usuários de loja restantes (para confirmar)
SELECT 
    'Usuários de loja restantes' AS tipo,
    username,
    role,
    status,
    created_at
FROM public.app_users
WHERE role = 'loja'
ORDER BY username;

