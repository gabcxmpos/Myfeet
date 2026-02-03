-- ============================================
-- TESTAR FUNÇÃO user_role()
-- Execute este script estando logado como admin
-- ============================================

-- Testar a função user_role()
SELECT 
    auth.uid() as meu_user_id,
    public.user_role() as meu_role,
    (SELECT role FROM public.app_users WHERE id = auth.uid()) as role_da_tabela;

-- Verificar se o usuário logado está na tabela app_users
SELECT 
    id,
    username,
    role,
    status
FROM public.app_users
WHERE id = auth.uid();

-- Verificar todas as políticas ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('checklist_devolucoes_tasks', 'checklist_motorista_routes')
ORDER BY tablename, policyname;





























