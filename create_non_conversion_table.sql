-- ============================================
-- CRIAÇÃO DA TABELA: non_conversion_records
-- Relatório de Não Conversão dos Colaboradores
-- ============================================

-- Criar tabela de registros de não conversão
CREATE TABLE IF NOT EXISTS public.non_conversion_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    situacao VARCHAR(50) NOT NULL CHECK (situacao IN ('GRADE', 'PREÇO', 'PRODUTO', 'OUTROS')),
    observacao TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_non_conversion_store_id ON public.non_conversion_records(store_id);
CREATE INDEX IF NOT EXISTS idx_non_conversion_collaborator_id ON public.non_conversion_records(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_non_conversion_date ON public.non_conversion_records(date);
CREATE INDEX IF NOT EXISTS idx_non_conversion_created_at ON public.non_conversion_records(created_at);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_non_conversion_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_non_conversion_records_updated_at ON public.non_conversion_records;
CREATE TRIGGER trigger_update_non_conversion_records_updated_at
    BEFORE UPDATE ON public.non_conversion_records
    FOR EACH ROW
    EXECUTE FUNCTION update_non_conversion_records_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.non_conversion_records ENABLE ROW LEVEL SECURITY;

-- Política: Usuários da loja podem ver apenas registros da sua loja
CREATE POLICY "Lojas podem ver seus próprios registros"
    ON public.non_conversion_records
    FOR SELECT
    USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE id = (SELECT store_id FROM public.app_users WHERE id = auth.uid())
        )
    );

-- Política: Usuários da loja podem criar registros para sua loja
CREATE POLICY "Lojas podem criar registros"
    ON public.non_conversion_records
    FOR INSERT
    WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE id = (SELECT store_id FROM public.app_users WHERE id = auth.uid())
        )
    );

-- Política: Admin e supervisores podem ver todos os registros
CREATE POLICY "Admin e supervisores podem ver todos os registros"
    ON public.non_conversion_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor', 'supervisor_franquia')
        )
    );

-- Comentários nas colunas
COMMENT ON TABLE public.non_conversion_records IS 'Registros de não conversão dos colaboradores';
COMMENT ON COLUMN public.non_conversion_records.collaborator_id IS 'ID do colaborador que teve não conversão';
COMMENT ON COLUMN public.non_conversion_records.store_id IS 'ID da loja onde ocorreu a não conversão';
COMMENT ON COLUMN public.non_conversion_records.situacao IS 'Tipo de situação: GRADE, PREÇO, PRODUTO ou OUTROS';
COMMENT ON COLUMN public.non_conversion_records.observacao IS 'Observação detalhada sobre o motivo da não conversão';
COMMENT ON COLUMN public.non_conversion_records.date IS 'Data em que ocorreu a não conversão';

