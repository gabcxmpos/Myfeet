-- ============================================
-- CRIAR CONSTRAINT ÚNICA PARA daily_checklists
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Verificar se já existe uma constraint única
SELECT 
  'VERIFICAÇÃO' AS etapa,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.daily_checklists'::regclass
  AND contype = 'u';

-- Criar constraint única se não existir
-- Isso garante que não pode haver dois registros com o mesmo store_id e date
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'public.daily_checklists'::regclass 
      AND conname = 'daily_checklists_store_id_date_key'
      AND contype = 'u'
  ) THEN
    -- Criar constraint única
    ALTER TABLE public.daily_checklists
    ADD CONSTRAINT daily_checklists_store_id_date_key 
    UNIQUE (store_id, date);
    
    RAISE NOTICE '✅ Constraint única criada com sucesso!';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint única já existe.';
  END IF;
END $$;

-- Verificar se foi criada corretamente
SELECT 
  'VERIFICAÇÃO FINAL' AS etapa,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  CASE 
    WHEN conname = 'daily_checklists_store_id_date_key' 
    THEN '✅ Constraint criada corretamente'
    ELSE '⚠️ Verifique manualmente'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.daily_checklists'::regclass
  AND contype = 'u';


