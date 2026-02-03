-- ============================================
-- HABILITAR REALTIME NA TABELA STORES
-- Para atualizações em tempo real dos resultados
-- ============================================

-- Habilitar publicação para a tabela stores
ALTER PUBLICATION supabase_realtime ADD TABLE stores;

-- Verificar se está habilitado
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'stores';

-- Se a query acima retornar uma linha, o Realtime está habilitado!
-- Caso contrário, execute o ALTER PUBLICATION acima.
























