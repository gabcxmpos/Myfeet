import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';

const PublicDashboard = () => {
  const mockPublicRanking = [
    { position: 1, store: 'Loja Shopping Center', score: 94 },
    { position: 2, store: 'Loja Plaza', score: 88 },
    { position: 3, store: 'Loja Boulevard', score: 85 },
  ];

  return (
    <>
      <Helmet>
        <title>Ranking Público - MYFEET Painel PPAD</title>
        <meta name="description" content="Visualização pública de resultados do ranking PPAD." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              MYFEET
            </h1>
            <p className="text-gray-600">Ranking Público de Desempenho PPAD</p>
          </motion.div>

          <div className="grid gap-6">
            {mockPublicRanking.map((item, index) => (
              <motion.div
                key={item.position}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
                      item.position === 1 ? 'bg-yellow-100' :
                      item.position === 2 ? 'bg-gray-100' :
                      'bg-orange-100'
                    }`}>
                      <Trophy className={`w-8 h-8 ${
                        item.position === 1 ? 'text-yellow-600' :
                        item.position === 2 ? 'text-gray-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">#{item.position}</div>
                      <h3 className="text-2xl font-bold text-gray-900">{item.store}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">+5.2%</span>
                    </div>
                    <div className="text-4xl font-bold text-purple-600">{item.score}</div>
                    <p className="text-sm text-gray-500">pontos</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            MYFEET Painel PPAD — Grupo Afeet © 2025
          </p>
        </div>
      </div>
    </>
  );
};

export default PublicDashboard;