import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReturnsManagement from './ReturnsManagement';
import ReturnsPlanner from './ReturnsPlanner';
import { RotateCcw, Calendar } from 'lucide-react';

const ReturnsConsolidated = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('management');

  // Determinar qual aba mostrar baseado no perfil do usuário ou rota
  React.useEffect(() => {
    if (!user) return;
    
    // Se está na rota /returns-planner, abrir direto no planner
    if (location.pathname === '/returns-planner') {
      setActiveTab('planner');
    } else if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'loja') {
      setActiveTab('management');
    } else if (user?.role === 'devoluções') {
      setActiveTab('planner');
    }
  }, [user, location.pathname]);

  if (!user) {
    return null;
  }

  const isAdmin = user?.role === 'admin';
  const isDevolucoes = user?.role === 'devoluções';
  const isSupervisor = user?.role === 'supervisor';
  const isLoja = user?.role === 'loja';

  return (
    <>
      <Helmet>
        <title>Devoluções - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Devoluções</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie devoluções e o planner de devoluções
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex flex-wrap gap-2 h-auto">
            {/* Abas para Admin, Supervisor e Loja */}
            {(isAdmin || isSupervisor || isLoja) && (
              <TabsTrigger value="management" className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Gestão de Devoluções</span>
              </TabsTrigger>
            )}

            {/* Abas para Admin e Devoluções */}
            {(isAdmin || isDevolucoes) && (
              <TabsTrigger value="planner" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Planner de Devoluções</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Conteúdo das Abas */}
          {(isAdmin || isSupervisor || isLoja) && (
            <TabsContent value="management" className="mt-6">
              <ReturnsManagement />
            </TabsContent>
          )}

          {(isAdmin || isDevolucoes) && (
            <TabsContent value="planner" className="mt-6">
              <ReturnsPlanner />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};

export default ReturnsConsolidated;

