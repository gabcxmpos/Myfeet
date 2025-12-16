import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Target } from 'lucide-react';
import ResultsManagement from './ResultsManagement';
import GoalsPanel from './GoalsPanel';

const GestaoMetasPage = () => {
  const [activeTab, setActiveTab] = useState('gestao');

  return (
    <>
      <Helmet>
        <title>Gestão e Metas - MYFEET Painel PPAD</title>
        <meta name="description" content="Gestão de resultados e definição de metas" />
      </Helmet>
      
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 px-6 pt-6"
        >
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão e Metas</h1>
            <p className="text-muted-foreground">Gestão de resultados e definição de metas das lojas</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="gestao" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Gestão de Resultados
            </TabsTrigger>
            <TabsTrigger value="metas" className="gap-2">
              <Target className="w-4 h-4" />
              Definir Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="mt-0">
            <ResultsManagement />
          </TabsContent>

          <TabsContent value="metas" className="mt-0">
            <GoalsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default GestaoMetasPage;

