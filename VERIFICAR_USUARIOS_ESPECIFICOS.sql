-- ============================================
-- APENAS VERIFICAR USUÁRIOS (SEM EXCLUIR)
-- Execute este script primeiro para verificar se os usuários existem
-- ============================================

-- Verificar em auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data,
    'auth.users' AS tabela
FROM auth.users
WHERE email IN (
    'gabriel.moraes@grupoafeet.com.br',
    'daniele.silva@grupoafeet.com.br'
)
ORDER BY email;

-- Verificar em app_users
SELECT 
    au.id,
    au.username,
    au.role,
    au.status,
    au.store_id,
    s.name AS store_name,
    au.created_at,
    'app_users' AS tabela
FROM public.app_users au
LEFT JOIN public.stores s ON s.id = au.store_id
WHERE au.id IN (
    SELECT id 
    FROM auth.users 
    WHERE email IN (
        'gabriel.moraes@grupoafeet.com.br',
        'daniele.silva@grupoafeet.com.br'
    )
)
ORDER BY au.username;

-- Contar quantos usuários foram encontrados
SELECT 
    COUNT(*) AS total_usuarios_encontrados,
    STRING_AGG(email, ', ') AS emails_encontrados
FROM auth.users
WHERE email IN (
    'gabriel.moraes@grupoafeet.com.br',
    'daniele.silva@grupoafeet.com.br'
);






























