-- ============================================
-- CRIAR TABELA DE CAPACIDADE DE PROCESSAMENTO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- ============================================
-- TABELA: returns_processing_capacity (Capacidade de Processamento)
-- ============================================
CREATE TABLE IF NOT EXISTS public.returns_processing_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    mu TEXT NOT NULL, -- Unidade de Material (ex: FTW, APP/EQ)
    capacidade_estoque INTEGER NOT NULL DEFAULT 0, -- Capacidade máxima de estoque
    estoque_atual INTEGER DEFAULT 0, -- Volume atual parado na loja
    sku INTEGER DEFAULT 0, -- Quantidade de SKUs
    ate_4_pecas INTEGER DEFAULT 0, -- Quantidade de SKUs com até 4 peças
    percentual_ultimas_pecas NUMERIC(5,2) DEFAULT 0, -- % de últimas peças
    capacidade_estoque_venda NUMERIC(5,2) DEFAULT 0, -- % de capacidade de estoque venda
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE, -- Data de referência do estoque
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que não haja duplicatas por loja + MU + data
    UNIQUE(store_id, mu, data_referencia)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_returns_capacity_store_id ON public.returns_processing_capacity(store_id);
CREATE INDEX IF NOT EXISTS idx_returns_capacity_mu ON public.returns_processing_capacity(mu);
CREATE INDEX IF NOT EXISTS idx_returns_capacity_data_referencia ON public.returns_processing_capacity(data_referencia);
CREATE INDEX IF NOT EXISTS idx_returns_capacity_created_at ON public.returns_processing_capacity(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_returns_capacity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_returns_capacity_updated_at
    BEFORE UPDATE ON public.returns_processing_capacity
    FOR EACH ROW
    EXECUTE FUNCTION update_returns_capacity_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS na tabela
ALTER TABLE public.returns_processing_capacity ENABLE ROW LEVEL SECURITY;

-- Política: Admin, Supervisor e Devoluções veem tudo
CREATE POLICY "Admin, Supervisor e Devoluções podem ver todas as capacidades"
    ON public.returns_processing_capacity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor', 'devoluções')
        )
    );

-- Política: Lojas podem ver apenas suas capacidades
CREATE POLICY "Lojas podem ver apenas suas capacidades"
    ON public.returns_processing_capacity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('loja', 'admin_loja')
            AND store_id = returns_processing_capacity.store_id
        )
    );

-- Política: Admin, Supervisor e Devoluções podem criar/atualizar capacidades
CREATE POLICY "Admin, Supervisor e Devoluções podem criar capacidades"
    ON public.returns_processing_capacity FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor', 'devoluções')
        )
    );

CREATE POLICY "Admin, Supervisor e Devoluções podem atualizar capacidades"
    ON public.returns_processing_capacity FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor', 'devoluções')
        )
    );

-- Política: Admin pode excluir capacidades
CREATE POLICY "Admin pode excluir capacidades"
    ON public.returns_processing_capacity FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================
-- VERIFICAÇÃO
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela de capacidade de processamento criada com sucesso!';
    RAISE NOTICE '✅ Políticas RLS configuradas!';
    RAISE NOTICE '✅ Índices criados!';
END $$;






















