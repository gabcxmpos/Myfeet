import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, Target } from 'lucide-react';

const FranchiseePanel = () => {
  const mockFranchisees = [
    { 
      id: 1, 
      name: 'Franquia Norte', 
      stores: 5, 
      avgScore: 89, 
      goalsAchieved: 4,
      totalGoals: 5 
    },
    { 
      id: 2, 
      name: 'Franquia Sul', 
      stores: 3, 
      avgScore: 92, 
      goalsAchieved: 3,
      totalGoals: 3 
    },
    { 
      id: 3, 
      name: 'Franquia Centro', 
      stores: 4, 
      avgScore: 85, 
      goalsAchieved: 3,
      totalGoals: 4 
    },
  ];

  return (
    <>
      <Helmet>
        <title>Painel de Franquias - Painel PPAD V1</title>
        <meta name="description" content="Visão consolidada por franquia" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de Franquias</h1>
          <p className="text-gray-600 mt-1">Visão consolidada por grupo de lojas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockFranchisees.map((franchisee, index) => (
            <motion.div
              key={franchisee.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{franchisee.name}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lojas</span>
                  <span className="text-lg font-bold text-gray-900">{franchisee.stores}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Média
                  </span>
                  <span className="text-lg font-bold text-purple-600">{franchisee.avgScore}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Metas
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {franchisee.goalsAchieved}/{franchisee.totalGoals}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(franchisee.goalsAchieved / franchisee.totalGoals) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {Math.round((franchisee.goalsAchieved / franchisee.totalGoals) * 100)}% das metas atingidas
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FranchiseePanel;