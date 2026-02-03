-- ============================================
-- CRIAR CHECKLISTS: DEVOLUÇÕES, MOTORISTA E COMUNICAÇÃO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CHECKLIST DE DEVOLUÇÕES
-- ============================================

-- Tabela de tarefas do checklist de devoluções (cadastradas pelo admin)
CREATE TABLE IF NOT EXISTS public.checklist_devolucoes_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_text TEXT NOT NULL,
    task_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de execução do checklist de devoluções (status das tarefas)
-- Não tem constraint única para permitir múltiplas execuções sem zerar
CREATE TABLE IF NOT EXISTS public.checklist_devolucoes_execution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tasks JSONB NOT NULL DEFAULT '{}'::jsonb, -- {task_id: true/false}
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint única para um checklist por usuário (não zera diariamente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_devolucoes_execution_user_unique 
    ON public.checklist_devolucoes_execution(user_id);

-- Índices para checklist de devoluções
CREATE INDEX IF NOT EXISTS idx_checklist_devolucoes_tasks_active ON public.checklist_devolucoes_tasks(is_active, task_order);
CREATE INDEX IF NOT EXISTS idx_checklist_devolucoes_execution_user ON public.checklist_devolucoes_execution(user_id);

-- ============================================
-- 2. CHECKLIST DE MOTORISTA (ROTAS)
-- ============================================

-- Tabela de rotas do checklist motorista (cadastradas pelo admin)
CREATE TABLE IF NOT EXISTS public.checklist_motorista_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_name TEXT NOT NULL, -- Nome da rota (ex: "Rota Sul", "Rota Centro")
    route_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de execução do checklist motorista (status das rotas)
-- Não tem constraint única para permitir múltiplas execuções sem zerar
CREATE TABLE IF NOT EXISTS public.checklist_motorista_execution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    routes JSONB NOT NULL DEFAULT '{}'::jsonb, -- {route_id: true/false}
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint única para um checklist por usuário (não zera diariamente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_motorista_execution_user_unique 
    ON public.checklist_motorista_execution(user_id);

-- Índices para checklist motorista
CREATE INDEX IF NOT EXISTS idx_checklist_motorista_routes_active ON public.checklist_motorista_routes(is_active, route_order);
CREATE INDEX IF NOT EXISTS idx_checklist_motorista_execution_user ON public.checklist_motorista_execution(user_id);

-- ============================================
-- 3. CHECKLIST DE COMUNICAÇÃO
-- ============================================

-- Tabela de tarefas do checklist de comunicação (criadas pelo próprio usuário)
CREATE TABLE IF NOT EXISTS public.checklist_comunicacao_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task_text TEXT NOT NULL,
    task_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de execução do checklist de comunicação (status das tarefas)
-- Não tem constraint única para permitir múltiplas execuções sem zerar
CREATE TABLE IF NOT EXISTS public.checklist_comunicacao_execution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tasks JSONB NOT NULL DEFAULT '{}'::jsonb, -- {task_id: true/false}
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint única para um checklist por usuário (não zera diariamente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_checklist_comunicacao_execution_user_unique 
    ON public.checklist_comunicacao_execution(user_id);

-- Índices para checklist comunicação
CREATE INDEX IF NOT EXISTS idx_checklist_comunicacao_tasks_user ON public.checklist_comunicacao_tasks(user_id, is_active, task_order);
CREATE INDEX IF NOT EXISTS idx_checklist_comunicacao_execution_user ON public.checklist_comunicacao_execution(user_id);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para checklist_devolucoes_tasks
DROP TRIGGER IF EXISTS update_checklist_devolucoes_tasks_updated_at ON public.checklist_devolucoes_tasks;
CREATE TRIGGER update_checklist_devolucoes_tasks_updated_at
    BEFORE UPDATE ON public.checklist_devolucoes_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para checklist_devolucoes_execution
DROP TRIGGER IF EXISTS update_checklist_devolucoes_execution_updated_at ON public.checklist_devolucoes_execution;
CREATE TRIGGER update_checklist_devolucoes_execution_updated_at
    BEFORE UPDATE ON public.checklist_devolucoes_execution
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para checklist_motorista_routes
DROP TRIGGER IF EXISTS update_checklist_motorista_routes_updated_at ON public.checklist_motorista_routes;
CREATE TRIGGER update_checklist_motorista_routes_updated_at
    BEFORE UPDATE ON public.checklist_motorista_routes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para checklist_motorista_execution
DROP TRIGGER IF EXISTS update_checklist_motorista_execution_updated_at ON public.checklist_motorista_execution;
CREATE TRIGGER update_checklist_motorista_execution_updated_at
    BEFORE UPDATE ON public.checklist_motorista_execution
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para checklist_comunicacao_tasks
DROP TRIGGER IF EXISTS update_checklist_comunicacao_tasks_updated_at ON public.checklist_comunicacao_tasks;
CREATE TRIGGER update_checklist_comunicacao_tasks_updated_at
    BEFORE UPDATE ON public.checklist_comunicacao_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para checklist_comunicacao_execution
DROP TRIGGER IF EXISTS update_checklist_comunicacao_execution_updated_at ON public.checklist_comunicacao_execution;
CREATE TRIGGER update_checklist_comunicacao_execution_updated_at
    BEFORE UPDATE ON public.checklist_comunicacao_execution
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.checklist_devolucoes_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_devolucoes_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_motorista_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_motorista_execution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_comunicacao_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_comunicacao_execution ENABLE ROW LEVEL SECURITY;

-- Políticas para checklist_devolucoes_tasks (admin pode tudo, devoluções pode ler)
CREATE POLICY "Admin pode gerenciar tarefas de devoluções"
    ON public.checklist_devolucoes_tasks
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Perfil devoluções pode ler tarefas"
    ON public.checklist_devolucoes_tasks
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'devoluções'));

-- Políticas para checklist_devolucoes_execution (admin pode tudo, devoluções pode ler/atualizar seu próprio)
CREATE POLICY "Admin pode gerenciar execução de devoluções"
    ON public.checklist_devolucoes_execution
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Perfil devoluções pode gerenciar seu próprio checklist"
    ON public.checklist_devolucoes_execution
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'devoluções' AND user_id::text = auth.jwt() ->> 'sub')
    WITH CHECK (auth.jwt() ->> 'role' = 'devoluções' AND user_id::text = auth.jwt() ->> 'sub');

-- Políticas para checklist_motorista_routes (admin pode tudo, motorista pode ler)
CREATE POLICY "Admin pode gerenciar rotas motorista"
    ON public.checklist_motorista_routes
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Motorista pode ler rotas"
    ON public.checklist_motorista_routes
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'motorista'));

-- Políticas para checklist_motorista_execution (admin pode tudo, motorista pode ler/atualizar seu próprio)
CREATE POLICY "Admin pode gerenciar execução motorista"
    ON public.checklist_motorista_execution
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Motorista pode gerenciar seu próprio checklist"
    ON public.checklist_motorista_execution
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'motorista' AND user_id::text = auth.jwt() ->> 'sub')
    WITH CHECK (auth.jwt() ->> 'role' = 'motorista' AND user_id::text = auth.jwt() ->> 'sub');

-- Políticas para checklist_comunicacao_tasks (comunicação pode tudo no seu próprio, admin pode tudo)
CREATE POLICY "Comunicação pode gerenciar suas tarefas"
    ON public.checklist_comunicacao_tasks
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() ->> 'role' = 'comunicação' AND user_id::text = auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() ->> 'role' = 'comunicação' AND user_id::text = auth.jwt() ->> 'sub')
    );

-- Políticas para checklist_comunicacao_execution (comunicação pode tudo no seu próprio, admin pode tudo)
CREATE POLICY "Comunicação pode gerenciar seu próprio checklist"
    ON public.checklist_comunicacao_execution
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() ->> 'role' = 'comunicação' AND user_id::text = auth.jwt() ->> 'sub')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' = 'admin' OR 
        (auth.jwt() ->> 'role' = 'comunicação' AND user_id::text = auth.jwt() ->> 'sub')
    );

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN (
        'checklist_devolucoes_tasks',
        'checklist_devolucoes_execution',
        'checklist_motorista_routes',
        'checklist_motorista_execution',
        'checklist_comunicacao_tasks',
        'checklist_comunicacao_execution'
    )
ORDER BY table_name, ordinal_position;

