-- ============================================
-- SCRIPT PARA CRIAR TABELAS DE TREINAMENTOS
-- ============================================

-- 1. Adicionar coluna CPF na tabela collaborators (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collaborators' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE public.collaborators ADD COLUMN cpf VARCHAR(14);
    COMMENT ON COLUMN public.collaborators.cpf IS 'CPF do colaborador (formato: XXX.XXX.XXX-XX)';
  END IF;
END $$;

-- 2. Criar tabela de treinamentos
CREATE TABLE IF NOT EXISTS public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  training_date DATE NOT NULL,
  format VARCHAR(50) NOT NULL, -- 'presencial', 'online', 'hibrido'
  brand VARCHAR(100), -- 'ARTWALK', 'AUTHENTIC FEET', 'MAGICFEET', ou NULL para todos
  location VARCHAR(255), -- Local do treinamento (obrigatório se presencial)
  max_participants INTEGER, -- Limite de participantes (opcional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de inscrições em treinamentos
CREATE TABLE IF NOT EXISTS public.training_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registered_by UUID REFERENCES auth.users(id),
  notes TEXT, -- Observações adicionais
  UNIQUE(training_id, collaborator_id) -- Evitar inscrições duplicadas
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_trainings_date ON public.trainings(training_date);
CREATE INDEX IF NOT EXISTS idx_trainings_brand ON public.trainings(brand);
CREATE INDEX IF NOT EXISTS idx_training_registrations_training_id ON public.training_registrations(training_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_collaborator_id ON public.training_registrations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_store_id ON public.training_registrations(store_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_status ON public.training_registrations(status);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para atualizar updated_at em trainings
DROP TRIGGER IF EXISTS update_trainings_updated_at ON public.trainings;
CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Configurar RLS (Row Level Security)
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_registrations ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para trainings
-- Admin e supervisor podem ver todos os treinamentos
CREATE POLICY "Admin e supervisor podem ver todos os treinamentos"
  ON public.trainings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'supervisor')
    )
  );

-- Admin pode criar, atualizar e excluir treinamentos
CREATE POLICY "Admin pode gerenciar treinamentos"
  ON public.trainings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'admin'
    )
  );

-- Lojas podem ver treinamentos da sua marca ou sem marca específica
CREATE POLICY "Lojas podem ver treinamentos da sua marca"
  ON public.trainings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users au
      JOIN public.stores s ON s.id = au.store_id
      WHERE au.id = auth.uid()
      AND au.role = 'loja'
      AND (
        trainings.brand IS NULL 
        OR trainings.brand = s.bandeira
      )
    )
  );

-- 9. Políticas RLS para training_registrations
-- Admin e supervisor podem ver todas as inscrições
CREATE POLICY "Admin e supervisor podem ver todas as inscrições"
  ON public.training_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role IN ('admin', 'supervisor')
    )
  );

-- Lojas podem ver apenas suas próprias inscrições
CREATE POLICY "Lojas podem ver suas próprias inscrições"
  ON public.training_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'loja'
      AND app_users.store_id = training_registrations.store_id
    )
  );

-- Lojas podem criar inscrições para seus colaboradores
CREATE POLICY "Lojas podem criar inscrições"
  ON public.training_registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users au
      JOIN public.collaborators c ON c.store_id = au.store_id
      WHERE au.id = auth.uid()
      AND au.role = 'loja'
      AND au.store_id = training_registrations.store_id
      AND c.id = training_registrations.collaborator_id
    )
  );

-- Lojas podem cancelar suas próprias inscrições
CREATE POLICY "Lojas podem cancelar suas inscrições"
  ON public.training_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'loja'
      AND app_users.store_id = training_registrations.store_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'loja'
      AND app_users.store_id = training_registrations.store_id
    )
  );

-- Admin pode gerenciar todas as inscrições
CREATE POLICY "Admin pode gerenciar todas as inscrições"
  ON public.training_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'admin'
    )
  );

-- 10. Comentários nas tabelas
COMMENT ON TABLE public.trainings IS 'Tabela de treinamentos disponíveis';
COMMENT ON TABLE public.training_registrations IS 'Tabela de inscrições de colaboradores em treinamentos';

-- 11. Verificar se tudo foi criado corretamente
SELECT 
  'Tabelas criadas' AS status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainings') 
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_registrations')
    THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END AS result;

SELECT 
  'Coluna CPF adicionada' AS status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collaborators' AND column_name = 'cpf')
    THEN '✅ SUCESSO'
    ELSE '❌ ERRO'
  END AS result;







