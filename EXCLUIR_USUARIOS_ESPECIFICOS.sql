-- ============================================
-- VERIFICAR E EXCLUIR USUÁRIOS ESPECÍFICOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se os usuários existem em auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    'auth.users' AS tabela
FROM auth.users
WHERE email IN (
    'gabriel.moraes@grupoafeet.com.br',
    'daniele.silva@grupoafeet.com.br'
);

-- PASSO 2: Verificar se os usuários existem em app_users
SELECT 
    id,
    username,
    role,
    status,
    store_id,
    'app_users' AS tabela
FROM public.app_users
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email IN (
        'gabriel.moraes@grupoafeet.com.br',
        'daniele.silva@grupoafeet.com.br'
    )
);

-- PASSO 3: Excluir os usuários de app_users primeiro (se existirem)
-- Isso remove o perfil do usuário
DELETE FROM public.app_users
WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email IN (
        'gabriel.moraes@grupoafeet.com.br',
        'daniele.silva@grupoafeet.com.br'
    )
);

-- PASSO 4: Excluir os usuários de auth.users
-- Isso remove completamente o usuário do sistema de autenticação
DELETE FROM auth.users
WHERE email IN (
    'gabriel.moraes@grupoafeet.com.br',
    'daniele.silva@grupoafeet.com.br'
);

-- PASSO 5: Verificar se os usuários foram excluídos
SELECT 
    'Verificação Final' AS status,
    COUNT(*) AS usuarios_encontrados
FROM auth.users
WHERE email IN (
    'gabriel.moraes@grupoafeet.com.br',
    'daniele.silva@grupoafeet.com.br'
);

-- Se retornar 0, significa que os usuários foram excluídos com sucesso
-- Se retornar algum número, significa que ainda existem usuários com esses emails






























