-- ============================================
-- ADICIONAR CAMPO checklist_type NA TABELA daily_checklists
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
-- - Verifica se a coluna checklist_type existe na tabela daily_checklists
-- - Adiciona a coluna se não existir
-- - Define valores padrão para checklists existentes (operacional)
-- - Permite que o sistema diferencie entre checklists operacionais e gerenciais
-- ============================================

-- PASSO 1: Verificar se a coluna checklist_type existe
SELECT
    'Verificação da coluna checklist_type' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_checklists'
          AND column_name = 'checklist_type'
    ) THEN '✅ checklist_type existe' ELSE '❌ checklist_type NÃO existe' END AS status;

-- PASSO 2: Adicionar coluna checklist_type se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_checklists'
          AND column_name = 'checklist_type'
    ) THEN
        -- Adicionar a coluna como TEXT (pode ser 'operacional' ou 'gerencial')
        ALTER TABLE public.daily_checklists
        ADD COLUMN checklist_type TEXT;

        RAISE NOTICE '✅ Coluna checklist_type adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna checklist_type já existe';
    END IF;
END $$;

-- PASSO 3: Definir valor padrão 'operacional' para registros existentes (que estão sem tipo)
DO $$
BEGIN
    UPDATE public.daily_checklists
    SET checklist_type = 'operacional'
    WHERE checklist_type IS NULL;
    
    RAISE NOTICE '✅ Valores padrão definidos para checklists existentes';
END $$;

-- PASSO 4: Verificar estrutura final da tabela
SELECT
    'Estrutura final da tabela daily_checklists' AS tipo,
    column_name AS coluna,
    data_type AS tipo_dado,
    is_nullable AS permite_null,
    column_default AS valor_padrao
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_checklists'
ORDER BY ordinal_position;

-- PASSO 5: Verificar registros com tipos diferentes
SELECT
    'Distribuição de tipos de checklist' AS tipo,
    COALESCE(checklist_type, 'NULL (legado)') AS tipo_checklist,
    COUNT(*) AS quantidade
FROM public.daily_checklists
GROUP BY checklist_type
ORDER BY checklist_type;

-- PASSO 6: Verificação final
SELECT
    'Verificação final' AS tipo,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'daily_checklists'
          AND column_name = 'checklist_type'
    ) THEN '✅ Coluna checklist_type criada' ELSE '❌ ERRO: Coluna não foi criada' END AS status,
    (SELECT COUNT(*) FROM public.daily_checklists WHERE checklist_type IS NULL) AS registros_sem_tipo,
    (SELECT COUNT(*) FROM public.daily_checklists WHERE checklist_type = 'operacional') AS checklists_operacionais,
    (SELECT COUNT(*) FROM public.daily_checklists WHERE checklist_type = 'gerencial') AS checklists_gerenciais;

