-- ============================================
-- VERIFICAR E CRIAR COLUNAS DA TABELA FEEDBACKS
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
-- - Verifica quais colunas existem na tabela feedbacks
-- - Adiciona as colunas que faltam (development_point, satisfaction, is_promotion_candidate)
-- - Garante que a tabela tenha todas as colunas necessárias
-- ============================================

-- PASSO 1: Verificar estrutura atual da tabela feedbacks
SELECT 
    'Estrutura atual da tabela feedbacks' AS tipo,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null,
    column_default AS valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- PASSO 2: Verificar se as colunas opcionais existem
SELECT 
    'Verificação de colunas opcionais' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'development_point'
    ) THEN '✅ development_point existe' ELSE '❌ development_point NÃO existe' END AS development_point,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'satisfaction'
    ) THEN '✅ satisfaction existe' ELSE '❌ satisfaction NÃO existe' END AS satisfaction,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'is_promotion_candidate'
    ) THEN '✅ is_promotion_candidate existe' ELSE '❌ is_promotion_candidate NÃO existe' END AS is_promotion_candidate;

-- PASSO 3: Adicionar coluna development_point se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'development_point'
    ) THEN
        ALTER TABLE public.feedbacks
        ADD COLUMN development_point TEXT;
        
        RAISE NOTICE '✅ Coluna development_point adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna development_point já existe';
    END IF;
END $$;

-- PASSO 4: Adicionar coluna satisfaction se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'satisfaction'
    ) THEN
        ALTER TABLE public.feedbacks
        ADD COLUMN satisfaction INTEGER DEFAULT 3;
        
        RAISE NOTICE '✅ Coluna satisfaction adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna satisfaction já existe';
    END IF;
END $$;

-- PASSO 5: Adicionar coluna is_promotion_candidate se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'is_promotion_candidate'
    ) THEN
        ALTER TABLE public.feedbacks
        ADD COLUMN is_promotion_candidate BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Coluna is_promotion_candidate adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna is_promotion_candidate já existe';
    END IF;
END $$;

-- PASSO 6: Verificar estrutura final da tabela feedbacks
SELECT 
    'Estrutura final da tabela feedbacks' AS tipo,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null,
    column_default AS valor_padrao,
    CASE 
        WHEN column_name IN ('feedback_text', 'store_id', 'collaborator_id') THEN '✅ Obrigatória'
        ELSE 'ℹ️ Opcional'
    END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedbacks'
ORDER BY ordinal_position;

-- PASSO 7: Verificar se todas as colunas foram criadas
SELECT 
    'Verificação final' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'feedback_text'
    ) THEN '✅' ELSE '❌' END AS feedback_text,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'store_id'
    ) THEN '✅' ELSE '❌' END AS store_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'collaborator_id'
    ) THEN '✅' ELSE '❌' END AS collaborator_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'development_point'
    ) THEN '✅' ELSE '❌' END AS development_point,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'satisfaction'
    ) THEN '✅' ELSE '❌' END AS satisfaction,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'feedbacks'
          AND column_name = 'is_promotion_candidate'
    ) THEN '✅' ELSE '❌' END AS is_promotion_candidate;











