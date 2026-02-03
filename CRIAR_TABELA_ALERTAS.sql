-- Criar tabela de alertas/comunicados
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  -- Destinatários: array de IDs de lojas ou null para todas
  store_ids UUID[],
  -- Destinatários por franqueado: array de nomes de franqueados ou null para todos
  franqueado_names TEXT[],
  -- Destinatários por bandeira: array de nomes de bandeiras ou null para todas
  bandeira_names TEXT[]
);

-- Criar tabela de visualizações de alertas (confirmação de leitura)
CREATE TABLE IF NOT EXISTS alert_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alert_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_views_alert_id ON alert_views(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_views_user_id ON alert_views(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_views_store_id ON alert_views(store_id);

-- RLS Policies para alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Criar função auxiliar para buscar role da tabela app_users
CREATE OR REPLACE FUNCTION public.get_user_role_from_table()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_user_id UUID;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Buscar role da tabela app_users
  SELECT role INTO v_role
  FROM public.app_users
  WHERE id = v_user_id;
  
  RETURN COALESCE(v_role, NULL);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Política: Comunicação pode criar, editar e excluir alertas
CREATE POLICY "comunicação_full_access_alerts"
  ON alerts
  FOR ALL
  USING (
    COALESCE(
      (auth.jwt() ->> 'role')::text,
      public.get_user_role_from_table()
    ) IN ('comunicação', 'admin')
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() ->> 'role')::text,
      public.get_user_role_from_table()
    ) IN ('comunicação', 'admin')
  );

-- Função auxiliar para obter store_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_store_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_store_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT store_id INTO v_store_id
  FROM public.app_users
  WHERE id = v_user_id;
  
  RETURN v_store_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Política: Todos podem ler alertas ativos destinados a eles
CREATE POLICY "users_read_alerts"
  ON alerts
  FOR SELECT
  USING (
    is_active = true AND
    (
      -- Alertas sem destinatários específicos (para todas as lojas)
      (store_ids IS NULL AND franqueado_names IS NULL AND bandeira_names IS NULL) OR
      -- Verificar se o usuário pertence a uma loja destinatária
      (
        EXISTS (
          SELECT 1 FROM stores s
          WHERE s.id = ANY(store_ids)
          AND (
            (
              COALESCE(
                (auth.jwt() ->> 'role')::text,
                public.get_user_role_from_table()
              ) IN ('loja', 'loja_franquia', 'admin_loja')
              AND s.id = public.get_user_store_id()
            )
            OR
            COALESCE(
              (auth.jwt() ->> 'role')::text,
              public.get_user_role_from_table()
            ) IN ('admin', 'supervisor', 'supervisor_franquia', 'comunicação')
          )
        )
      ) OR
      -- Verificar se a loja do usuário pertence a um franqueado destinatário
      (
        EXISTS (
          SELECT 1 FROM stores s
          WHERE s.franqueado = ANY(franqueado_names)
          AND (
            (
              COALESCE(
                (auth.jwt() ->> 'role')::text,
                public.get_user_role_from_table()
              ) IN ('loja', 'loja_franquia', 'admin_loja')
              AND s.id = public.get_user_store_id()
            )
            OR
            COALESCE(
              (auth.jwt() ->> 'role')::text,
              public.get_user_role_from_table()
            ) IN ('admin', 'supervisor', 'supervisor_franquia', 'comunicação')
          )
        )
      ) OR
      -- Verificar se a loja do usuário pertence a uma bandeira destinatária
      (
        EXISTS (
          SELECT 1 FROM stores s
          WHERE s.bandeira = ANY(bandeira_names)
          AND (
            (
              COALESCE(
                (auth.jwt() ->> 'role')::text,
                public.get_user_role_from_table()
              ) IN ('loja', 'loja_franquia', 'admin_loja')
              AND s.id = public.get_user_store_id()
            )
            OR
            COALESCE(
              (auth.jwt() ->> 'role')::text,
              public.get_user_role_from_table()
            ) IN ('admin', 'supervisor', 'supervisor_franquia', 'comunicação')
          )
        )
      )
    )
  );

-- RLS Policies para alert_views
ALTER TABLE alert_views ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem criar suas próprias visualizações
CREATE POLICY "users_create_own_views"
  ON alert_views
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- Política: Usuários podem ler suas próprias visualizações
CREATE POLICY "users_read_own_views"
  ON alert_views
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
  );

-- Política: Comunicação e admin podem ler todas as visualizações
CREATE POLICY "comunicação_read_all_views"
  ON alert_views
  FOR SELECT
  USING (
    COALESCE(
      (auth.jwt() ->> 'role')::text,
      public.get_user_role_from_table()
    ) IN ('comunicação', 'admin')
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alerts_updated_at();

