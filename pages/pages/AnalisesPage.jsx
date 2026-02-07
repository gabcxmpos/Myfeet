import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileCheck, BarChart3 } from 'lucide-react';
import ChecklistAuditAnalytics from './ChecklistAuditAnalytics';
import Analytics from './Analytics';

const AnalisesPage = () => {
  const [activeTab, setActiveTab] = useState('auditorias');

  return (
    <>
      <Helmet>
        <title>Análises - MYFEET Painel PPAD</title>
        <meta name="description" content="Análises e auditorias do sistema" />
      </Helmet>
      
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6 px-6 pt-6"
        >
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Análises</h1>
            <p className="text-muted-foreground">Análises e auditorias do sistema</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="auditorias" className="gap-2">
              <FileCheck className="w-4 h-4" />
              Análise de Auditorias
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="auditorias" className="mt-0">
            <ChecklistAuditAnalytics />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AnalisesPage;

