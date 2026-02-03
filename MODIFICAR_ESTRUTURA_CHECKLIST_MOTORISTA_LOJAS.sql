-- ============================================
-- MODIFICAR ESTRUTURA CHECKLIST MOTORISTA PARA USAR LOJAS
-- Em vez de rotas genéricas, agora cada rota tem uma lista de lojas selecionadas
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar colunas para armazenar lojas selecionadas e data da rota
ALTER TABLE public.checklist_motorista_routes 
ADD COLUMN IF NOT EXISTS route_date DATE,
ADD COLUMN IF NOT EXISTS stores_selected JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentar: stores_selected é um array JSONB de store_ids
-- Exemplo: ["store-uuid-1", "store-uuid-2", "store-uuid-3"]

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checklist_motorista_routes_date ON public.checklist_motorista_routes(user_id, route_date);
CREATE INDEX IF NOT EXISTS idx_checklist_motorista_routes_stores ON public.checklist_motorista_routes USING GIN(stores_selected);

-- Modificar a tabela de execução para usar store_id em vez de route_id
-- O JSONB routes agora será {store_id: true/false} em vez de {route_id: true/false}
-- Isso mantém compatibilidade com a estrutura atual

-- Verificação
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'checklist_motorista_routes'
    AND (column_name IN ('route_date', 'stores_selected') OR column_name LIKE '%store%')
ORDER BY column_name;
