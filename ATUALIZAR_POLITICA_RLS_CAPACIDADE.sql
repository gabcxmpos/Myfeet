-- ============================================
-- ATUALIZAR POLÍTICA RLS PARA PERMITIR EXCLUSÃO POR DEVOLUÇÕES
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Remover a política antiga que só permite admin excluir
DROP POLICY IF EXISTS "Admin pode excluir capacidades" ON public.returns_processing_capacity;

-- Criar nova política que permite admin e devoluções excluir
CREATE POLICY "Admin e Devoluções podem excluir capacidades"
    ON public.returns_processing_capacity FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.app_users
            WHERE id = auth.uid()
            AND role IN ('admin', 'devoluções')
        )
    );

-- Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Política RLS atualizada com sucesso!';
    RAISE NOTICE '✅ Agora admin e devoluções podem excluir capacidades!';
END $$;






















