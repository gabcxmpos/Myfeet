-- ============================================
-- CRIAR TABELA DE ACIONAMENTOS
-- Execute este script no Supabase SQL Editor
-- ============================================
-- Este script cria a tabela de acionamentos e suas políticas RLS

-- ============================================
-- PARTE 1: CRIAR TABELA acionamentos
-- ============================================

-- PASSO 1.1: Verificar se a tabela já existe
SELECT 
    'Verificação inicial' AS etapa,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'acionamentos'
        ) THEN '✅ Tabela já existe'
        ELSE '❌ Tabela não existe - será criada'
    END AS status;

-- PASSO 1.2: Criar tabela acionamentos
CREATE TABLE IF NOT EXISTS public.acionamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'em_tratativa' CHECK (status IN ('em_tratativa', 'finalizada')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 1.3: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_acionamentos_store_id ON public.acionamentos(store_id);
CREATE INDEX IF NOT EXISTS idx_acionamentos_status ON public.acionamentos(status);
CREATE INDEX IF NOT EXISTS idx_acionamentos_created_at ON public.acionamentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acionamentos_user_id ON public.acionamentos(user_id);

-- PASSO 1.4: Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_acionamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 1.5: Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_acionamentos_updated_at ON public.acionamentos;
CREATE TRIGGER trigger_update_acionamentos_updated_at
    BEFORE UPDATE ON public.acionamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_acionamentos_updated_at();

-- ============================================
-- PARTE 2: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

-- PASSO 2.1: Habilitar RLS
ALTER TABLE public.acionamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 3: CRIAR POLÍTICAS RLS
-- ============================================

-- PASSO 3.1: Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem ver acionamentos" ON public.acionamentos;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem criar acionamentos" ON public.acionamentos;
DROP POLICY IF EXISTS "Admin, supervisor e comunicação podem atualizar acionamentos" ON public.acionamentos;
DROP POLICY IF EXISTS "Admin pode excluir acionamentos" ON public.acionamentos;

-- PASSO 3.2: Criar política para SELECT (visualização)
-- Admin, supervisor e comunicação podem ver todos os acionamentos
CREATE POLICY "Admin, supervisor e comunicação podem ver acionamentos"
ON public.acionamentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- PASSO 3.3: Criar política para INSERT (criação)
-- Admin, supervisor e comunicação podem criar acionamentos
CREATE POLICY "Admin, supervisor e comunicação podem criar acionamentos"
ON public.acionamentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- PASSO 3.4: Criar política para UPDATE (atualização)
-- Admin, supervisor e comunicação podem atualizar acionamentos
CREATE POLICY "Admin, supervisor e comunicação podem atualizar acionamentos"
ON public.acionamentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role IN ('admin', 'supervisor', 'comunicação')
  )
);

-- PASSO 3.5: Criar política para DELETE (exclusão)
-- Apenas admin pode excluir acionamentos
CREATE POLICY "Admin pode excluir acionamentos"
ON public.acionamentos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users
    WHERE app_users.id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- ============================================
-- PARTE 4: VERIFICAR CRIAÇÃO
-- ============================================

-- PASSO 4.1: Verificar se a tabela foi criada
SELECT 
    'Tabela acionamentos' AS item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'acionamentos'
        ) THEN '✅ CRIADA'
        ELSE '❌ NÃO CRIADA'
    END AS status;

-- PASSO 4.2: Verificar colunas da tabela
SELECT 
    column_name AS "Coluna",
    data_type AS "Tipo",
    is_nullable AS "Pode ser NULL",
    column_default AS "Valor Padrão"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'acionamentos'
ORDER BY ordinal_position;

-- PASSO 4.3: Verificar índices criados
SELECT 
    indexname AS "Índice",
    indexdef AS "Definição"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'acionamentos';

-- PASSO 4.4: Verificar políticas RLS criadas
SELECT 
    policyname AS "Nome da Política",
    cmd AS "Operação",
    CASE 
        WHEN qual LIKE '%admin%' AND qual LIKE '%comunicação%' THEN '✅ Permite admin, supervisor e comunicação'
        WHEN qual LIKE '%admin%' THEN '⚠️ Permite apenas admin'
        ELSE '❓ Verificar condição'
    END AS "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'acionamentos'
ORDER BY cmd, policyname;

-- PASSO 4.5: Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'acionamentos';

-- ✅ Tabela de acionamentos criada com sucesso!
-- Agora os perfis admin, supervisor e comunicação podem:
-- - Visualizar todos os acionamentos
-- - Criar novos acionamentos
-- - Atualizar acionamentos existentes
-- - Apenas admin pode excluir acionamentos



























