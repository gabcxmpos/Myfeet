-- ============================================
-- VERIFICAR TODOS OS USUÁRIOS E SUAS LOJAS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Contar total de usuários
SELECT 
  COUNT(*) as total_usuarios
FROM public.app_users;

-- 2. Contar usuários com loja atribuída
SELECT 
  COUNT(*) as usuarios_com_loja
FROM public.app_users
WHERE store_id IS NOT NULL;

-- 3. Contar usuários sem loja atribuída
SELECT 
  COUNT(*) as usuarios_sem_loja
FROM public.app_users
WHERE store_id IS NULL;

-- 4. Listar TODOS os usuários com suas lojas (sem LIMIT)
SELECT 
  au.id,
  au.username,
  au.role,
  au.store_id,
  s.name as store_name,
  s.code as store_code,
  CASE 
    WHEN au.store_id IS NULL THEN '❌ Sem loja'
    WHEN s.id IS NULL THEN '⚠️ Loja não encontrada'
    ELSE '✅ OK'
  END as status_relacionamento
FROM public.app_users au
LEFT JOIN public.stores s ON au.store_id = s.id
ORDER BY au.username;

-- 5. Verificar usuários com store_id inválido (loja não existe)
SELECT 
  au.id,
  au.username,
  au.role,
  au.store_id,
  '⚠️ Loja não existe no banco' as problema
FROM public.app_users au
WHERE au.store_id IS NOT NULL
  AND au.store_id NOT IN (SELECT id FROM public.stores);

-- 6. Listar todas as lojas disponíveis
SELECT 
  id,
  name,
  code,
  bandeira,
  tipo
FROM public.stores
ORDER BY code;

-- 7. Verificar usuários do tipo 'loja' que não têm store_id
SELECT 
  au.id,
  au.username,
  au.role,
  '⚠️ Usuário loja sem store_id atribuído' as problema
FROM public.app_users au
WHERE au.role IN ('loja', 'admin_loja', 'loja_franquia')
  AND au.store_id IS NULL;

-- 8. Estatísticas por role
SELECT 
  role,
  COUNT(*) as total,
  COUNT(store_id) as com_loja,
  COUNT(*) - COUNT(store_id) as sem_loja
FROM public.app_users
GROUP BY role
ORDER BY role;








