import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReturnsPending from './ReturnsPending';
import ReturnsPlanner from './ReturnsPlanner';
import PhysicalMissing from './PhysicalMissing';
import ReturnsCapacity from './ReturnsCapacity';
import { RotateCcw, Calendar, Package, BarChart3 } from 'lucide-react';

const ReturnsConsolidated = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Determinar qual aba mostrar baseado no perfil do usuário, rota ou parâmetro da URL
  const getInitialTab = () => {
    if (tabFromUrl) return tabFromUrl;
    if (location.pathname === '/returns-planner') return 'planner';
    if (!user) return 'pending';
    if (user?.role === 'devoluções') return 'planner';
    if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia' || user?.role === 'loja' || user?.role === 'loja_franquia' || user?.role === 'financeiro') return 'pending';
    return 'pending';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Atualizar aba quando o parâmetro da URL mudar
  React.useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Determinar qual aba mostrar baseado no perfil do usuário ou rota
  React.useEffect(() => {
    if (!user || tabFromUrl) return;
    
    if (location.pathname === '/returns-planner') {
      setActiveTab('planner');
    } else if (user?.role === 'devoluções') {
      setActiveTab('planner');
    } else if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia' || user?.role === 'loja' || user?.role === 'financeiro') {
      setActiveTab('pending');
    }
  }, [user, location.pathname, tabFromUrl]);

  if (!user) {
    return null;
  }

  // Definir variáveis de perfil ANTES de usar
  const isAdmin = user?.role === 'admin';
  const isDevolucoes = user?.role === 'devoluções';
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'supervisor_franquia';
  const isFinanceiro = user?.role === 'financeiro';
  const isLoja = user?.role === 'loja' || user?.role === 'admin_loja' || user?.role === 'loja_franquia';

  // Atualizar URL quando a aba mudar
  const handleTabChange = (value) => {
    // Se for loja, não permitir acessar abas de Falta Física ou Capacidade
    if (isLoja && (value === 'missing' || value === 'capacity')) {
      setActiveTab('pending');
      setSearchParams({ tab: 'pending' });
      return;
    }
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Garantir que loja não fique em aba inválida
  React.useEffect(() => {
    if (isLoja && (activeTab === 'missing' || activeTab === 'capacity')) {
      setActiveTab('pending');
      setSearchParams({ tab: 'pending' });
    }
  }, [isLoja, activeTab, setSearchParams]);


  return (
    <>
      <Helmet>
        <title>Devoluções - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devoluções</h1>
          <p className="text-muted-foreground mt-2">
            {isLoja 
              ? 'Gerencie devoluções pendentes'
              : 'Gerencie devoluções, planner e falta física'
            }
          </p>
        </div>


        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto overflow-x-auto scrollbar-hide">
            {/* Aba Devoluções (Pendentes) - Comunicativo com loja */}
            {(isAdmin || isSupervisor || isLoja || isDevolucoes || isFinanceiro) && (
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Devoluções</span>
              </TabsTrigger>
            )}

            {/* Aba Planner - Registro do time de devoluções */}
            {(isAdmin || isDevolucoes || isSupervisor) && (
              <TabsTrigger value="planner" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Planner</span>
              </TabsTrigger>
            )}

            {/* Aba Falta Física - Apenas para admin, devoluções e supervisor (loja tem aba dedicada) */}
            {(isAdmin || isDevolucoes || isSupervisor) && (
              <TabsTrigger value="missing" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Falta Física</span>
              </TabsTrigger>
            )}

            {/* Aba Capacidade de Processamento - Apenas para admin, devoluções e supervisor */}
            {(isAdmin || isDevolucoes || isSupervisor) && (
              <TabsTrigger value="capacity" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Capacidade</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Conteúdo das Abas */}
          {(isAdmin || isSupervisor || isLoja || isDevolucoes || isFinanceiro) && (
            <TabsContent value="pending" className="mt-6">
              {activeTab === 'pending' && <ReturnsPending />}
            </TabsContent>
          )}

          {(isAdmin || isDevolucoes || isSupervisor) && (
            <TabsContent value="planner" className="mt-6">
              {activeTab === 'planner' && <ReturnsPlanner />}
            </TabsContent>
          )}

          {/* Aba Falta Física - Apenas para admin, devoluções e supervisor (loja tem aba dedicada) */}
          {(isAdmin || isDevolucoes || isSupervisor) && (
            <TabsContent value="missing" className="mt-6">
              {activeTab === 'missing' && <PhysicalMissing />}
            </TabsContent>
          )}

          {/* Aba Capacidade - Apenas para admin, devoluções e supervisor */}
          {(isAdmin || isDevolucoes || isSupervisor) && (
            <TabsContent value="capacity" className="mt-6">
              {activeTab === 'capacity' && <ReturnsCapacity />}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default ReturnsConsolidated;

