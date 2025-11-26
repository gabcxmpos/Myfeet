import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DevolucoesChecklistManagement from './DevolucoesChecklistManagement';
import ComunicacaoChecklistManagement from './ComunicacaoChecklistManagement';
import ClearChecklists from './ClearChecklists';
import DevolucoesChecklist from './DevolucoesChecklist';
import MotoristaChecklist from './MotoristaChecklist';
import ComunicacaoChecklist from './ComunicacaoChecklist';
import DailyChecklist from './DailyChecklist';
import { CheckSquare, Route, MessageCircle, Settings, RotateCcw } from 'lucide-react';

const ChecklistsManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('devolucoes');

  // Determinar qual aba mostrar baseado no perfil do usuário
  React.useEffect(() => {
    if (!user) return;
    
    if (user?.role === 'admin') {
      setActiveTab('diario');
    } else if (user?.role === 'devoluções') {
      setActiveTab('exec-devolucoes');
    } else if (user?.role === 'motorista') {
      setActiveTab('exec-motorista');
    } else if (user?.role === 'comunicação') {
      setActiveTab('exec-comunicacao');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const isAdmin = user?.role === 'admin';
  const isDevolucoes = user?.role === 'devoluções';
  const isMotorista = user?.role === 'motorista';
  const isComunicacao = user?.role === 'comunicação';

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto">
            {/* Abas para Admin */}
            {isAdmin && (
              <>
                <TabsTrigger value="diario" className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Checklist Diário</span>
                </TabsTrigger>
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
          </TabsList>

          {/* Conteúdo das Abas */}
          {isAdmin && (
            <>
              <TabsContent value="diario" className="mt-6">
                <DailyChecklist />
              </TabsContent>
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
        </Tabs>
      </div>
    </>
  );
};

export default ChecklistsManagement;

