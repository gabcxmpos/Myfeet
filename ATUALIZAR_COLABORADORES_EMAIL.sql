-- ============================================
-- ADICIONAR CAMPO EMAIL AOS COLABORADORES
-- ============================================

-- Adicionar coluna email na tabela collaborators (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collaborators' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.collaborators ADD COLUMN email VARCHAR(255);
    COMMENT ON COLUMN public.collaborators.email IS 'Email do colaborador para envio de informações de treinamento';
  END IF;
END $$;

-- Verificar se foi adicionado
SELECT 
  'Coluna email adicionada' AS status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'collaborators' AND column_name = 'email'
    ) THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END AS result;







