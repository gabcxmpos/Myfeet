import React from 'react';
import { Helmet } from 'react-helmet';
import { Trophy } from 'lucide-react';

const PainelExcelencia = () => {
  return (
    <>
      <Helmet>
        <title>Painel Excelência - MYFEET Painel PPAD</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Excelência</h1>
            <p className="text-muted-foreground mt-1">Visualize e gerencie o painel de excelência.</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <p className="text-muted-foreground text-center">
            Conteúdo do Painel Excelência será implementado aqui.
          </p>
        </div>
      </div>
    </>
  );
};

export default PainelExcelencia;
