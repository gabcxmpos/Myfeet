-- ============================================
-- INSERIR TAREFAS PPAD GERENCIAL NO BANCO
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verificar se já existe registro
SELECT 
  'VERIFICAÇÃO' AS etapa,
  key,
  value
FROM app_settings
WHERE key = 'gerencial_tasks';

-- Inserir ou atualizar tarefas PPAD Gerencial
-- Baseado nas categorias: PRODUTO, AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS
-- Total: 32 tarefas distribuídas em 5 setores
-- IMPORTANTE: Este checklist é SEPARADO do checklist diário (daily_tasks)

-- Primeiro, remover registro existente se houver (para garantir dados limpos)
DELETE FROM app_settings WHERE key = 'gerencial_tasks';

-- Inserir tarefas PPAD Gerencial
INSERT INTO app_settings (key, value)
VALUES (
  'gerencial_tasks',
  '[
    {
      "id": "prod-score",
      "text": "SCORE",
      "sector": "PRODUTO"
    },
    {
      "id": "prod-rank",
      "text": "RANK. PRODUTOS",
      "sector": "PRODUTO"
    },
    {
      "id": "prod-bestsellers",
      "text": "BEST SELLERS",
      "sector": "PRODUTO"
    },
    {
      "id": "prod-pontas",
      "text": "PONTAS",
      "sector": "PRODUTO"
    },
    {
      "id": "prod-tag-size",
      "text": "TAG SIZE",
      "sector": "PRODUTO"
    },
    {
      "id": "prod-tag-price",
      "text": "TAG PRICE",
      "sector": "PRODUTO"
    },
    {
      "id": "amb-twall",
      "text": "TWALL",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-som",
      "text": "SOM",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-uniforme",
      "text": "UNIFORME",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-engage",
      "text": "ENGAGE",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-passadoria",
      "text": "PASSADORIA",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-limpeza",
      "text": "LIMPEZA",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-reposicao",
      "text": "REPOSICAO",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "amb-telas-digitais",
      "text": "TELAS DIGITAIS",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "dig-sla",
      "text": "SLA",
      "sector": "DIGITAL"
    },
    {
      "id": "dig-cancelamentos",
      "text": "CANCELAMENTOS",
      "sector": "DIGITAL"
    },
    {
      "id": "dig-clientes",
      "text": "CLIENTES",
      "sector": "DIGITAL"
    },
    {
      "id": "dig-devolucoes",
      "text": "DEVOLUCOES",
      "sector": "DIGITAL"
    },
    {
      "id": "adm-recebimento",
      "text": "RECEBIMENTO",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-devolucoes",
      "text": "DEVOLUCOES",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-depositos",
      "text": "DEPOSITOS",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-notas-transf-pendentes",
      "text": "NOTAS TRANSF PENDENTES",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-notas-consumo",
      "text": "NOTAS CONSUMO",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-fechamento-caixa",
      "text": "FECHAMENTO CAIXA",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-inventario",
      "text": "INVENTARIO",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "adm-malotes",
      "text": "MALOTES",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "pessoas-escala",
      "text": "ESCALA",
      "sector": "PESSOAS"
    },
    {
      "id": "pessoas-headcount",
      "text": "HEADCOUNT",
      "sector": "PESSOAS"
    },
    {
      "id": "pessoas-ferias",
      "text": "FÉRIAS",
      "sector": "PESSOAS"
    },
    {
      "id": "pessoas-beneficios",
      "text": "BENEFICIOS",
      "sector": "PESSOAS"
    },
    {
      "id": "pessoas-premiacoes",
      "text": "PREMIACOES",
      "sector": "PESSOAS"
    },
    {
      "id": "pessoas-fb-lideranca",
      "text": "FB LIDERANÇA",
      "sector": "PESSOAS"
    }
  ]'::jsonb
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verificar se foi inserido corretamente
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  key,
  jsonb_array_length(value) AS total_tarefas,
  CASE 
    WHEN jsonb_array_length(value) = 32 THEN '✅ Todas as 32 tarefas inseridas'
    ELSE '⚠️ Verifique o número de tarefas'
  END AS status
FROM app_settings
WHERE key = 'gerencial_tasks';

-- Mostrar tarefas por setor
SELECT 
  'TAREFAS POR SETOR' AS etapa,
  task->>'sector' AS setor,
  COUNT(*) AS quantidade
FROM app_settings,
  jsonb_array_elements(value) AS task
WHERE key = 'gerencial_tasks'
GROUP BY task->>'sector'
ORDER BY task->>'sector';

