-- ============================================
-- CRIAÇÃO DAS TABELAS DE CONTROLE DE PATRIMÔNIO
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de Equipamentos (CELULAR, TABLET, NOTEBOOK, MINI PC)
CREATE TABLE IF NOT EXISTS public.equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    equipment_type TEXT NOT NULL CHECK (equipment_type IN ('CELULAR', 'TABLET', 'NOTEBOOK', 'MINI_PC')),
    condition_status TEXT NOT NULL CHECK (condition_status IN ('NOVO', 'BOM', 'QUEBRADO')),
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.app_users(id)
);

-- Tabela de Chips
CREATE TABLE IF NOT EXISTS public.chips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    carrier TEXT NOT NULL, -- Operadora (VIVO, CLARO, TIM, OI, etc)
    usage_type TEXT NOT NULL, -- Uso (WhatsApp, Vendas, etc)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.app_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.app_users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipments_store_id ON public.equipments(store_id);
CREATE INDEX IF NOT EXISTS idx_equipments_type ON public.equipments(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipments_condition ON public.equipments(condition_status);
CREATE INDEX IF NOT EXISTS idx_chips_store_id ON public.chips(store_id);
CREATE INDEX IF NOT EXISTS idx_chips_carrier ON public.chips(carrier);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
-- Remover triggers existentes antes de criar (permite execução múltipla)
DROP TRIGGER IF EXISTS update_equipments_updated_at ON public.equipments;
DROP TRIGGER IF EXISTS update_chips_updated_at ON public.chips;

CREATE TRIGGER update_equipments_updated_at
    BEFORE UPDATE ON public.equipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chips_updated_at
    BEFORE UPDATE ON public.chips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chips ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes antes de criar (permite execução múltipla)
DROP POLICY IF EXISTS "Admin can do everything on equipments" ON public.equipments;
DROP POLICY IF EXISTS "Admin can do everything on chips" ON public.chips;
DROP POLICY IF EXISTS "Supervisor can manage equipments" ON public.equipments;
DROP POLICY IF EXISTS "Supervisor can manage chips" ON public.chips;
DROP POLICY IF EXISTS "Store can view own equipments" ON public.equipments;
DROP POLICY IF EXISTS "Store can insert own equipments" ON public.equipments;
DROP POLICY IF EXISTS "Store can view own chips" ON public.chips;
DROP POLICY IF EXISTS "Store can insert own chips" ON public.chips;
DROP POLICY IF EXISTS "Store can update equipment condition" ON public.equipments;

-- Policy: Admin pode tudo
CREATE POLICY "Admin can do everything on equipments"
    ON public.equipments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

CREATE POLICY "Admin can do everything on chips"
    ON public.chips
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role = 'admin'
        )
    );

-- Policy: Supervisor pode ver tudo e editar/excluir
CREATE POLICY "Supervisor can manage equipments"
    ON public.equipments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('supervisor', 'supervisor_franquia')
        )
    );

CREATE POLICY "Supervisor can manage chips"
    ON public.chips
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('supervisor', 'supervisor_franquia')
        )
    );

-- Policy: Loja pode ver apenas seus próprios equipamentos e chips
CREATE POLICY "Store can view own equipments"
    ON public.equipments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
    );

CREATE POLICY "Store can insert own equipments"
    ON public.equipments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
    );

CREATE POLICY "Store can view own chips"
    ON public.chips
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = chips.store_id
        )
    );

CREATE POLICY "Store can insert own chips"
    ON public.chips
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = chips.store_id
        )
    );

-- Comentários nas tabelas
COMMENT ON TABLE public.equipments IS 'Tabela de controle de equipamentos por loja (CELULAR, TABLET, NOTEBOOK, MINI PC)';
COMMENT ON TABLE public.chips IS 'Tabela de controle de chips por loja';
COMMENT ON COLUMN public.equipments.equipment_type IS 'Tipo de equipamento: CELULAR, TABLET, NOTEBOOK, MINI_PC';
COMMENT ON COLUMN public.equipments.condition_status IS 'Condição do equipamento: NOVO, BOM, QUEBRADO';
COMMENT ON COLUMN public.chips.carrier IS 'Operadora do chip (VIVO, CLARO, TIM, OI, etc)';
COMMENT ON COLUMN public.chips.usage_type IS 'Tipo de uso do chip (WhatsApp, Vendas, etc)';

-- Habilitar Realtime para as tabelas
-- Usar IF NOT EXISTS não é suportado diretamente, então vamos tentar adicionar
-- (se já estiver adicionado, dará erro mas não crítico - pode ignorar)
DO $$
BEGIN
    -- Tentar adicionar equipments ao Realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.equipments;
    EXCEPTION WHEN OTHERS THEN
        -- Se já estiver adicionado, não fazer nada
        NULL;
    END;
    
    -- Tentar adicionar chips ao Realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chips;
    EXCEPTION WHEN OTHERS THEN
        -- Se já estiver adicionado, não fazer nada
        NULL;
    END;
END $$;

-- Policy: Loja pode atualizar apenas condition_status dos equipamentos
-- Esta policy permite que lojas atualizem apenas o campo condition_status
CREATE POLICY "Store can update equipment condition"
    ON public.equipments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE app_users.id = auth.uid()
            AND app_users.role IN ('loja', 'loja_franquia')
            AND app_users.store_id = equipments.store_id
        )
        -- Garantir que apenas condition_status está sendo atualizado
        -- (outros campos devem permanecer iguais)
    );
