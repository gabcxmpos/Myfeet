-- ============================================
-- CRIAR TABELAS DE DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- ============================================
-- TABELA: returns (Devoluções)
-- ============================================
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    nf_number TEXT NOT NULL,
    volume_quantity INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    admin_status TEXT NOT NULL DEFAULT 'aguardando_coleta' CHECK (admin_status IN ('reabertura', 'nota_emitida', 'aguardando_coleta', 'coleta_infrutifera')),
    collected_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_returns_store_id ON public.returns(store_id);
CREATE INDEX IF NOT EXISTS idx_returns_date ON public.returns(date);
CREATE INDEX IF NOT EXISTS idx_returns_admin_status ON public.returns(admin_status);
CREATE INDEX IF NOT EXISTS idx_returns_collected_at ON public.returns(collected_at);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_returns_updated_at
    BEFORE UPDATE ON public.returns
    FOR EACH ROW
    EXECUTE FUNCTION update_returns_updated_at();

-- ============================================
-- TABELA: returns_status_history (Histórico de Status)
-- ============================================
CREATE TABLE IF NOT EXISTS public.returns_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_returns_status_history_return_id ON public.returns_status_history(return_id);
CREATE INDEX IF NOT EXISTS idx_returns_status_history_changed_at ON public.returns_status_history(changed_at);

-- ============================================
-- TABELA: physical_missing (Falta Física)
-- ============================================
CREATE TABLE IF NOT EXISTS public.physical_missing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_code TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'processo_aberto' CHECK (status IN ('movimentado', 'processo_aberto', 'nota_finalizada')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_physical_missing_store_id ON public.physical_missing(store_id);
CREATE INDEX IF NOT EXISTS idx_physical_missing_status ON public.physical_missing(status);
CREATE INDEX IF NOT EXISTS idx_physical_missing_created_at ON public.physical_missing(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_physical_missing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_physical_missing_updated_at
    BEFORE UPDATE ON public.physical_missing
    FOR EACH ROW
    EXECUTE FUNCTION update_physical_missing_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_missing ENABLE ROW LEVEL SECURITY;

-- Política para returns: Admin e Supervisor veem tudo, Loja vê apenas suas devoluções
CREATE POLICY "Admin e Supervisor podem ver todas as devoluções"
    ON public.returns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "Lojas podem ver apenas suas devoluções"
    ON public.returns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = returns.store_id
        )
    );

CREATE POLICY "Lojas podem criar devoluções"
    ON public.returns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = returns.store_id
        )
    );

CREATE POLICY "Admin e Supervisor podem atualizar devoluções"
    ON public.returns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "Lojas podem atualizar suas devoluções (apenas collected_at)"
    ON public.returns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = returns.store_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = returns.store_id
        )
    );

CREATE POLICY "Admin pode excluir devoluções"
    ON public.returns FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Política para returns_status_history: Admin e Supervisor veem tudo
CREATE POLICY "Admin e Supervisor podem ver histórico"
    ON public.returns_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "Sistema pode criar histórico"
    ON public.returns_status_history FOR INSERT
    WITH CHECK (true);

-- Política para physical_missing: Admin e Supervisor veem tudo, Loja vê apenas suas faltas
CREATE POLICY "Admin e Supervisor podem ver todas as faltas físicas"
    ON public.physical_missing FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "Lojas podem ver apenas suas faltas físicas"
    ON public.physical_missing FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = physical_missing.store_id
        )
    );

CREATE POLICY "Lojas podem criar faltas físicas"
    ON public.physical_missing FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role = 'loja'
            AND store_id = physical_missing.store_id
        )
    );

CREATE POLICY "Admin e Supervisor podem atualizar faltas físicas"
    ON public.physical_missing FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'supervisor')
        )
    );

CREATE POLICY "Admin pode excluir faltas físicas"
    ON public.physical_missing FOR DELETE
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
    RAISE NOTICE '✅ Tabelas de devoluções criadas com sucesso!';
    RAISE NOTICE '✅ Políticas RLS configuradas!';
    RAISE NOTICE '✅ Índices criados!';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Verifique se as tabelas foram criadas corretamente';
    RAISE NOTICE '2. Teste criar uma devolução como loja';
    RAISE NOTICE '3. Verifique se aparece para admin';
END $$;






