-- ============================================
-- VERIFICAR POLÍTICA DE INSERT PARA TREINAMENTOS
-- Execute este script para verificar se a política está correta
-- ============================================

-- Verificar a definição completa da política de INSERT
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd AS operacao,
    qual AS condicao_using,
    with_check AS condicao_with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'trainings'
AND cmd = 'INSERT';

-- Verificar se a política permite "comunicação"
SELECT 
    policyname,
    CASE 
        WHEN (with_check::text LIKE '%comunicação%' OR with_check::text LIKE '%comunicacao%') 
             AND with_check::text LIKE '%admin%' THEN '✅ Inclui admin e comunicação'
        WHEN with_check::text LIKE '%comunicação%' OR with_check::text LIKE '%comunicacao%' THEN '✅ Inclui comunicação'
        WHEN with_check::text LIKE '%admin%' THEN '⚠️ Apenas admin'
        ELSE '❓ Verificar manualmente'
    END AS status,
    with_check::text AS condicao_completa
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'trainings'
AND cmd = 'INSERT';

-- Testar se um usuário com role "comunicação" poderia inserir (simulação)
-- Substitua o UUID abaixo pelo ID de um usuário com role "comunicação"
SELECT 
    'Teste de permissão' AS tipo,
    au.id AS user_id,
    au.role AS user_role,
    CASE 
        WHEN au.role IN ('admin', 'comunicação') THEN '✅ Pode criar treinamentos'
        ELSE '❌ Não pode criar treinamentos'
    END AS permissao
FROM public.app_users au
WHERE au.role = 'comunicação'
LIMIT 1;

