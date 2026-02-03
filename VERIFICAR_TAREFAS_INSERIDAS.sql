-- ============================================
-- VERIFICAR SE TAREFAS FORAM INSERIDAS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se existe registro de gerencial_tasks
SELECT 
  'VERIFICAÇÃO GERAL' AS etapa,
  key,
  CASE 
    WHEN value IS NULL THEN '❌ Valor NULL'
    WHEN jsonb_typeof(value) = 'array' THEN '✅ É um array JSON'
    ELSE '⚠️ Tipo: ' || jsonb_typeof(value)
  END AS tipo_valor,
  CASE 
    WHEN jsonb_typeof(value) = 'array' THEN jsonb_array_length(value)
    ELSE NULL
  END AS total_tarefas
FROM app_settings
WHERE key = 'gerencial_tasks';

-- 2. Verificar tarefas por setor
SELECT 
  'TAREFAS POR SETOR' AS etapa,
  task->>'sector' AS setor,
  COUNT(*) AS quantidade,
  STRING_AGG(task->>'text', ', ' ORDER BY task->>'text') AS tarefas
FROM app_settings,
  jsonb_array_elements(value) AS task
WHERE key = 'gerencial_tasks'
GROUP BY task->>'sector'
ORDER BY task->>'sector';

-- 3. Listar todas as tarefas
SELECT 
  'LISTA COMPLETA' AS etapa,
  task->>'id' AS id,
  task->>'text' AS texto,
  task->>'sector' AS setor
FROM app_settings,
  jsonb_array_elements(value) AS task
WHERE key = 'gerencial_tasks'
ORDER BY task->>'sector', task->>'text';

-- 4. Verificar se há duplicatas
SELECT 
  'VERIFICAÇÃO DUPLICATAS' AS etapa,
  task->>'id' AS id,
  COUNT(*) AS ocorrencias
FROM app_settings,
  jsonb_array_elements(value) AS task
WHERE key = 'gerencial_tasks'
GROUP BY task->>'id'
HAVING COUNT(*) > 1;

-- 5. Resumo final
SELECT 
  'RESUMO FINAL' AS etapa,
  (SELECT COUNT(*) FROM app_settings WHERE key = 'gerencial_tasks') AS registros_encontrados,
  (SELECT jsonb_array_length(value) FROM app_settings WHERE key = 'gerencial_tasks') AS total_tarefas,
  (SELECT COUNT(DISTINCT task->>'sector') FROM app_settings, jsonb_array_elements(value) AS task WHERE key = 'gerencial_tasks') AS total_setores,
  CASE 
    WHEN (SELECT jsonb_array_length(value) FROM app_settings WHERE key = 'gerencial_tasks') = 32 
    THEN '✅ Todas as 32 tarefas estão presentes'
    WHEN (SELECT jsonb_array_length(value) FROM app_settings WHERE key = 'gerencial_tasks') IS NULL
    THEN '❌ Nenhuma tarefa encontrada - Execute INSERIR_TAREFAS_PPAD_GERENCIAL.sql'
    ELSE '⚠️ Número de tarefas diferente de 32'
  END AS status;
