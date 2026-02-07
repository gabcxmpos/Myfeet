import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DevolucoesChecklistManagement from './DevolucoesChecklistManagement';
import ComunicacaoChecklistManagement from './ComunicacaoChecklistManagement';
import ClearChecklists from './ClearChecklists';
import DevolucoesChecklist from './DevolucoesChecklist';
import MotoristaChecklist from './MotoristaChecklist';
import ComunicacaoChecklist from './ComunicacaoChecklist';
import DailyChecklist from './DailyChecklist';
import GerencialChecklist from './GerencialChecklist';
import { CheckSquare, Route, MessageCircle, Settings, RotateCcw, Briefcase } from 'lucide-react';

const ChecklistsManagement = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Determinar qual aba mostrar baseado no perfil do usuário ou parâmetro da URL
  const getInitialTab = () => {
    if (tabFromUrl) return tabFromUrl;
    if (!user) return 'devolucoes';
    if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia') return 'diario';
    // Para loja, mostrar PPAD GERENCIAL por padrão (mas também pode acessar diário)
    if (user?.role === 'loja' || user?.role === 'loja_franquia') return 'gerencial';
    if (user?.role === 'devoluções') return 'exec-devolucoes';
    if (user?.role === 'motorista') return 'exec-motorista';
    if (user?.role === 'comunicação' || user?.role === 'digital') return 'exec-comunicacao';
    return 'devolucoes';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Atualizar aba quando o parâmetro da URL mudar
  React.useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Determinar qual aba mostrar baseado no perfil do usuário
  React.useEffect(() => {
    if (!user || tabFromUrl) return;
    
    if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia') {
      setActiveTab('diario');
    } else if (user?.role === 'loja' || user?.role === 'loja_franquia') {
      // Para loja, mostrar PPAD GERENCIAL por padrão
      setActiveTab('gerencial');
    } else if (user?.role === 'devoluções') {
      setActiveTab('exec-devolucoes');
    } else if (user?.role === 'motorista') {
      setActiveTab('exec-motorista');
    } else if (user?.role === 'comunicação' || user?.role === 'digital') {
      setActiveTab('exec-comunicacao');
    }
  }, [user, tabFromUrl]);

  // Atualizar URL quando a aba mudar
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  if (!user) {
    return null;
  }

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'supervisor_franquia';
  const isLoja = user?.role === 'loja' || user?.role === 'loja_franquia';
  const isDevolucoes = user?.role === 'devoluções';
  const isMotorista = user?.role === 'motorista';
  const isComunicacao = user?.role === 'comunicação';

  console.log('🔍 [ChecklistsManagement] Renderizando:', {
    userRole: user?.role,
    isAdmin,
    isSupervisor,
    isLoja,
    activeTab,
    tabFromUrl,
    storeId: user?.storeId
  });

  return (
    <>
      <Helmet>
        <title>Checklists - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checklists</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e execute seus checklists
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto">
            {/* Abas para Admin e Supervisor */}
            {(isAdmin || isSupervisor) && (
              <>
                <TabsTrigger value="diario" className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Checklist Diário</span>
                </TabsTrigger>
                <TabsTrigger value="gerencial" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>PPAD GERENCIAL</span>
                </TabsTrigger>
                {isAdmin && (
                  <>
                    <TabsTrigger value="devolucoes" className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Gerenciar Devoluções</span>
                    </TabsTrigger>
                    <TabsTrigger value="limpar" className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>Limpar Checklists</span>
                    </TabsTrigger>
                    <TabsTrigger value="exec-devolucoes" className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Executar Devoluções</span>
                    </TabsTrigger>
                  </>
                )}
              </>
            )}

            {/* Abas para Devoluções */}
            {isDevolucoes && (
              <>
                <TabsTrigger value="exec-devolucoes" className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Meu Checklist</span>
                </TabsTrigger>
              </>
            )}

            {/* Abas para Motorista */}
            {isMotorista && (
              <>
                <TabsTrigger value="exec-motorista" className="flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  <span>Minhas Rotas</span>
                </TabsTrigger>
              </>
            )}

            {/* Abas para Comunicação */}
            {isComunicacao && (
              <>
                <TabsTrigger value="exec-comunicacao" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Meu Checklist</span>
                </TabsTrigger>
                <TabsTrigger value="gerenciar-comunicacao" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Gerenciar</span>
                </TabsTrigger>
              </>
            )}

            {/* Abas para Loja */}
            {isLoja && (
              <>
                <TabsTrigger value="diario" className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Checklist Diário</span>
                </TabsTrigger>
                <TabsTrigger value="gerencial" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>PPAD GERENCIAL</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Conteúdo das Abas */}
          {(isAdmin || isSupervisor) && (
            <>
              <TabsContent value="diario" className="mt-6">
                <DailyChecklist />
              </TabsContent>
              <TabsContent value="gerencial" className="mt-6">
                <GerencialChecklist />
              </TabsContent>
            </>
          )}

          {/* Conteúdo das Abas - Apenas Admin */}
          {isAdmin && (
            <>
              <TabsContent value="devolucoes" className="mt-6">
                <DevolucoesChecklistManagement />
              </TabsContent>
              <TabsContent value="limpar" className="mt-6">
                <ClearChecklists />
              </TabsContent>
            </>
          )}

          {/* Execução - Devoluções */}
          {(isAdmin || isDevolucoes) && (
            <TabsContent value="exec-devolucoes" className="mt-6">
              <DevolucoesChecklist />
            </TabsContent>
          )}

          {/* Execução - Motorista */}
          {(isAdmin || isMotorista) && (
            <TabsContent value="exec-motorista" className="mt-6">
              <MotoristaChecklist />
            </TabsContent>
          )}

          {/* Comunicação - apenas para perfil comunicação, não para admin */}
          {isComunicacao && (
            <>
              <TabsContent value="exec-comunicacao" className="mt-6">
                <ComunicacaoChecklist />
              </TabsContent>
              <TabsContent value="gerenciar-comunicacao" className="mt-6">
                <ComunicacaoChecklistManagement />
              </TabsContent>
            </>
          )}

          {/* Conteúdo das Abas - Loja */}
          {isLoja && (
            <>
              <TabsContent value="diario" className="mt-6">
                <DailyChecklist />
              </TabsContent>
              <TabsContent value="gerencial" className="mt-6">
                <GerencialChecklist />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default ChecklistsManagement;

