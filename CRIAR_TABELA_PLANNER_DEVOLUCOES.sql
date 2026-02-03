-- ============================================
-- CRIAR TABELA PARA PLANNER DE DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Criar tabela para registro de planner de devoluções
CREATE TABLE IF NOT EXISTS public.returns_planner (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    supervisor TEXT,
    return_type TEXT NOT NULL CHECK (return_type IN ('COMERCIAL', 'DEFEITO', 'FALTA_FISICA')),
    opening_date DATE NOT NULL,
    case_number TEXT,
    invoice_number TEXT,
    invoice_issue_date DATE,
    return_value DECIMAL(10, 2),
    items_quantity INTEGER,
    status TEXT NOT NULL DEFAULT 'Aguardando aprovação da marca' 
        CHECK (status IN ('Aguardando aprovação da marca', 'Aguardando coleta', 'Coletado')),
    responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_returns_planner_store_id ON public.returns_planner(store_id);
CREATE INDEX IF NOT EXISTS idx_returns_planner_status ON public.returns_planner(status);
CREATE INDEX IF NOT EXISTS idx_returns_planner_responsible ON public.returns_planner(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_returns_planner_opening_date ON public.returns_planner(opening_date);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_returns_planner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_returns_planner_updated_at ON public.returns_planner;
CREATE TRIGGER trigger_update_returns_planner_updated_at
    BEFORE UPDATE ON public.returns_planner
    FOR EACH ROW
    EXECUTE FUNCTION update_returns_planner_updated_at();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.returns_planner ENABLE ROW LEVEL SECURITY;

-- Política: Usuários com perfil 'devoluções', 'admin' e 'supervisor' podem ver todos os registros
CREATE POLICY "returns_planner_select_all"
    ON public.returns_planner
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('devoluções', 'admin', 'supervisor')
        )
    );

-- Política: Usuários com perfil 'devoluções', 'admin' e 'supervisor' podem inserir
CREATE POLICY "returns_planner_insert"
    ON public.returns_planner
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('devoluções', 'admin', 'supervisor')
        )
    );

-- Política: Usuários com perfil 'devoluções', 'admin' e 'supervisor' podem atualizar
CREATE POLICY "returns_planner_update"
    ON public.returns_planner
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('devoluções', 'admin', 'supervisor')
        )
    );

-- Política: Apenas admin pode deletar
CREATE POLICY "returns_planner_delete"
    ON public.returns_planner
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- ============================================
-- Verificação: Listar a tabela criada
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'returns_planner'
ORDER BY ordinal_position;

