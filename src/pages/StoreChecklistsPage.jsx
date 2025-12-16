import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Briefcase } from 'lucide-react';
import StoreDailyChecklist from './StoreDailyChecklist';
import StoreGerencialChecklist from './StoreGerencialChecklist';

const StoreChecklistsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('diario');

  const isLoja = user?.role === 'loja' || user?.role === 'loja_franquia';

  if (!user || !isLoja) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user?.storeId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Erro: Loja não encontrada. Entre em contato com o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checklists - MYFEET Painel PPAD</title>
        <meta name="description" content="Gerencie e execute seus checklists" />
      </Helmet>
      
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 px-6 pt-6"
        >
          <CheckSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Checklists</h1>
            <p className="text-muted-foreground">Gerencie e execute seus checklists</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="diario" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Checklist Diário
            </TabsTrigger>
            <TabsTrigger value="gerencial" className="gap-2">
              <Briefcase className="w-4 h-4" />
              PPAD Gerencial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diario" className="mt-0">
            <StoreDailyChecklist storeId={user.storeId} />
          </TabsContent>

          <TabsContent value="gerencial" className="mt-0">
            <StoreGerencialChecklist storeId={user.storeId} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default StoreChecklistsPage;

