-- ============================================
-- CONFIGURAÇÃO DE RLS PARA TABELA alert_views
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Verificar se a tabela alert_views existe
-- Se não existir, criar a tabela
CREATE TABLE IF NOT EXISTS public.alert_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 2: Habilitar RLS na tabela
ALTER TABLE public.alert_views ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Remover políticas antigas se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir alert_views" ON public.alert_views;
DROP POLICY IF EXISTS "Usuários autenticados podem ler alert_views" ON public.alert_views;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias visualizações" ON public.alert_views;
DROP POLICY IF EXISTS "Usuários podem inserir visualizações" ON public.alert_views;

-- PASSO 4: Criar política para INSERT (inserção)
-- Permite que qualquer usuário autenticado insira registros de visualização
CREATE POLICY "Usuários autenticados podem inserir alert_views"
ON public.alert_views
FOR INSERT
TO authenticated
WITH CHECK (true);

-- PASSO 5: Criar política para SELECT (leitura)
-- Permite que usuários autenticados leiam visualizações relacionadas às suas lojas
-- ou visualizações gerais (ajuste conforme necessário)
CREATE POLICY "Usuários autenticados podem ler alert_views"
ON public.alert_views
FOR SELECT
TO authenticated
USING (true);

-- PASSO 6: Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_alert_views_alert_id ON public.alert_views(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_views_store_id ON public.alert_views(store_id);
CREATE INDEX IF NOT EXISTS idx_alert_views_user_id ON public.alert_views(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_views_viewed_at ON public.alert_views(viewed_at);

-- PASSO 7: Verificar se as políticas foram criadas corretamente
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
WHERE tablename = 'alert_views'
ORDER BY policyname;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute esta query para verificar se tudo está correto:
SELECT 
    'Tabela criada' AS verificação,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alert_views')
        THEN '✅ Tabela alert_views existe'
        ELSE '❌ Tabela alert_views NÃO existe'
    END AS status
UNION ALL
SELECT 
    'RLS habilitado' AS verificação,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'alert_views'
            AND rowsecurity = true
        )
        THEN '✅ RLS está habilitado'
        ELSE '❌ RLS NÃO está habilitado'
    END AS status
UNION ALL
SELECT 
    'Política INSERT' AS verificação,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'alert_views' 
            AND cmd = 'INSERT'
        )
        THEN '✅ Política INSERT existe'
        ELSE '❌ Política INSERT NÃO existe'
    END AS status
UNION ALL
SELECT 
    'Política SELECT' AS verificação,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'alert_views' 
            AND cmd = 'SELECT'
        )
        THEN '✅ Política SELECT existe'
        ELSE '❌ Política SELECT NÃO existe'
    END AS status;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. As políticas criadas permitem que QUALQUER usuário autenticado:
--    - Insira registros em alert_views (INSERT)
--    - Leia registros de alert_views (SELECT)
--
-- 2. Se você quiser restringir mais (por exemplo, apenas usuários podem ver
--    visualizações de suas próprias lojas), ajuste a política SELECT:
--
--    CREATE POLICY "Usuários podem ver visualizações de suas lojas"
--    ON public.alert_views
--    FOR SELECT
--    TO authenticated
--    USING (
--        store_id IN (
--            SELECT id FROM public.stores 
--            WHERE id IN (
--                SELECT store_id FROM public.app_users 
--                WHERE id = auth.uid()
--            )
--        )
--    );
--
-- 3. Após executar este script, os erros 403 devem desaparecer e a funcionalidade
--    de alertas deve funcionar normalmente.
