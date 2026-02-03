-- ============================================
-- ATUALIZAR TAREFAS DIÁRIAS COM SETORES
-- Execute este script no SQL Editor do Supabase
-- Mapeia tarefas para os mesmos setores do PPAD Gerencial
-- ============================================

-- Verificar tarefas atuais
SELECT 
  'VERIFICAÇÃO ATUAL' AS etapa,
  key,
  jsonb_array_length(value) AS total_tarefas
FROM app_settings
WHERE key = 'daily_tasks';

-- Atualizar tarefas diárias com setores
-- Setores: PRODUTO, AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS, OUTROS

DELETE FROM app_settings WHERE key = 'daily_tasks';

INSERT INTO app_settings (key, value)
VALUES (
  'daily_tasks',
  '[
    {
      "id": "task-1",
      "text": "Abertura Operacional",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-2",
      "text": "Limpeza da loja",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "task-3",
      "text": "Five Minutes - KPIs",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-4",
      "text": "Pedidos SFS - Manhã",
      "sector": "OUTROS"
    },
    {
      "id": "task-5",
      "text": "Caixa dia anterior e Depósito",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-6",
      "text": "Relatório de Performance KPIs",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-7",
      "text": "Relatório de Performance Produto",
      "sector": "PRODUTO"
    },
    {
      "id": "task-8",
      "text": "Acompanhamento Planilha Chegada de Pedidos",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-9",
      "text": "Ativações CRM",
      "sector": "DIGITAL"
    },
    {
      "id": "task-10",
      "text": "Organização de Loja Operacional durante dia",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "task-11",
      "text": "Organização de Loja Visual Merchandising",
      "sector": "AMBIENTACAO"
    },
    {
      "id": "task-12",
      "text": "Pedidos SFS - Tarde",
      "sector": "OUTROS"
    },
    {
      "id": "task-13",
      "text": "Jornada de atendimento",
      "sector": "PESSOAS"
    },
    {
      "id": "task-14",
      "text": "Pedidos Digital Haass noite",
      "sector": "DIGITAL"
    },
    {
      "id": "task-15",
      "text": "Pedidos Digital Haass fechamento",
      "sector": "DIGITAL"
    },
    {
      "id": "task-16",
      "text": "Virtual Gate",
      "sector": "DIGITAL"
    },
    {
      "id": "task-17",
      "text": "Perdas e Danos",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-18",
      "text": "Tom Ticket",
      "sector": "ADMINISTRATIVO"
    },
    {
      "id": "task-19",
      "text": "SLA/NPS Digital",
      "sector": "DIGITAL"
    }
  ]'::jsonb
)
ON CONFLICT (key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verificar tarefas por setor
SELECT 
  'TAREFAS POR SETOR' AS etapa,
  task->>'sector' AS setor,
  COUNT(*) AS quantidade,
  STRING_AGG(task->>'text', ', ' ORDER BY task->>'text') AS tarefas
FROM app_settings,
  jsonb_array_elements(value) AS task
WHERE key = 'daily_tasks'
GROUP BY task->>'sector'
ORDER BY task->>'sector';

-- Verificação final
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  jsonb_array_length(value) AS total_tarefas,
  CASE 
    WHEN jsonb_array_length(value) = 19 THEN '✅ Todas as 19 tarefas atualizadas com setores'
    ELSE '⚠️ Verifique o número de tarefas'
  END AS status
FROM app_settings
WHERE key = 'daily_tasks';


