-- ============================================
-- CRIAR TABELA DE HISTÓRICO DE METAS
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
-- - Cria a tabela goals_history para armazenar histórico de mudanças de metas
-- - Cria índices para melhorar performance
-- - Configura RLS (Row Level Security) se necessário
-- ============================================

-- PASSO 1: Criar tabela goals_history
CREATE TABLE IF NOT EXISTS public.goals_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    goals JSONB NOT NULL DEFAULT '{}'::jsonb,
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    changed_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PASSO 2: Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_goals_history_store_id ON public.goals_history(store_id);
CREATE INDEX IF NOT EXISTS idx_goals_history_created_at ON public.goals_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_history_store_created ON public.goals_history(store_id, created_at DESC);

-- PASSO 3: Habilitar RLS (Row Level Security) - opcional
ALTER TABLE public.goals_history ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Criar políticas RLS básicas (ajustar conforme necessário)
-- Permitir que usuários autenticados leiam histórico
CREATE POLICY "Permitir leitura de histórico de metas para usuários autenticados"
    ON public.goals_history
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir que admins e supervisores criem histórico
CREATE POLICY "Permitir inserção de histórico de metas para admins e supervisores"
    ON public.goals_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('admin', 'supervisor')
        )
    );

-- PASSO 5: Criar função para salvar histórico automaticamente (opcional)
-- Esta função pode ser chamada via trigger ou diretamente
CREATE OR REPLACE FUNCTION public.save_goals_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se goals ou weights mudaram
    IF (OLD.goals IS DISTINCT FROM NEW.goals) OR (OLD.weights IS DISTINCT FROM NEW.weights) THEN
        INSERT INTO public.goals_history (store_id, goals, weights, changed_by)
        VALUES (
            NEW.id,
            NEW.goals,
            NEW.weights,
            auth.uid()::UUID
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 6: Criar trigger para salvar histórico automaticamente (opcional)
-- Comentado por padrão - descomente se quiser histórico automático via trigger
-- DROP TRIGGER IF EXISTS trigger_save_goals_history ON public.stores;
-- CREATE TRIGGER trigger_save_goals_history
--     AFTER UPDATE OF goals, weights ON public.stores
--     FOR EACH ROW
--     WHEN (
--         OLD.goals IS DISTINCT FROM NEW.goals OR
--         OLD.weights IS DISTINCT FROM NEW.weights
--     )
--     EXECUTE FUNCTION public.save_goals_history();

-- PASSO 7: Verificar estrutura criada
SELECT
    'Tabela goals_history criada com sucesso' AS status,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goals_history'
ORDER BY ordinal_position;

-- PASSO 8: Verificar índices criados
SELECT
    'Índices criados' AS status,
    indexname AS indice
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'goals_history';


