-- ============================================
-- CORRIGIR RLS MOTORISTA - ADMIN PODE CRIAR PARA QUALQUER USER_ID
-- Execute este script no Supabase SQL Editor
-- ============================================

-- PASSO 1: Remover políticas antigas do motorista
DROP POLICY IF EXISTS "Admin acesso total rotas" ON public.checklist_motorista_routes;
DROP POLICY IF EXISTS "Motorista acesso próprio rotas" ON public.checklist_motorista_routes;

-- PASSO 2: Recriar política para ADMIN (pode criar para qualquer user_id)
CREATE POLICY "Admin acesso total rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (public.user_role() = 'admin')
    WITH CHECK (public.user_role() = 'admin');

-- PASSO 3: Recriar política para MOTORISTA (pode criar apenas para si mesmo)
CREATE POLICY "Motorista acesso próprio rotas"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (
        public.user_role() = 'motorista'
        AND user_id = auth.uid()
    )
    WITH CHECK (
        public.user_role() = 'motorista'
        AND user_id = auth.uid()
    );

-- PASSO 4: Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'checklist_motorista_routes'
ORDER BY policyname;





























