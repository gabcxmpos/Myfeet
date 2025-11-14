import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Trophy, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const patentIcons = {
  'Platina': { icon: Trophy, color: 'text-cyan-400' },
  'Ouro': { icon: Trophy, color: 'text-yellow-400' },
  'Prata': { icon: Trophy, color: 'text-gray-400' },
  'Bronze': { icon: Trophy, color: 'text-orange-400' },
};

const PatentSummaryCard = ({ summary, className }) => (
  <motion.div
    className={cn("bg-card p-4 rounded-xl border border-border/50 h-full flex flex-col justify-center", className)}
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
  >
    <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">Resumo de Patentes</h3>
    <div className="flex justify-around items-center">
      {Object.entries(patentIcons).map(([level, {icon: Icon, color}]) => (
        <div key={level} className="flex flex-col items-center gap-1">
          <Icon className={cn("w-6 h-6", color)} />
          <span className="font-bold text-lg text-foreground">{summary[level] || 0}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const MonthlyRanking = () => {
  const { stores, patentSettings } = useData();
  const [nameFilter, setNameFilter] = useState('');
  const [franquiaFilter, setFranquiaFilter] = useState('all');

  const franqueados = useMemo(() => ['Loja Própria', ...new Set(stores.map(s => s.franqueado).filter(f => f !== 'Loja Própria'))], [stores]);

  const getPatent = (score) => {
    if (score >= patentSettings.platina) return { name: 'Platina', color: patentIcons['Platina'].color, icon: <Trophy /> };
    if (score >= patentSettings.ouro) return { name: 'Ouro', color: patentIcons['Ouro'].color, icon: <Trophy /> };
    if (score >= patentSettings.prata) return { name: 'Prata', color: patentIcons['Prata'].color, icon: <Trophy /> };
    return { name: 'Bronze', color: patentIcons['Bronze'].color, icon: <Trophy /> };
  };

  const mockRanking = useMemo(() => stores.map((store, index) => ({
    id: store.id,
    store: store.name,
    manager: store.manager,
    franqueado: store.franqueado,
    p_pessoas: 80 + index * 2,
    p_performance: 85 - index,
    p_ambientacao: 75 + index * 3,
    p_digital: 90 - index * 2,
    finalScore: Math.floor(Math.random() * 40 + 60),
  })).sort((a, b) => b.finalScore - a.finalScore), [stores]);

  const filteredRanking = mockRanking.filter(item => {
    const nameMatch = item.store.toLowerCase().includes(nameFilter.toLowerCase()) ||
                      item.manager.toLowerCase().includes(nameFilter.toLowerCase());
    const franquiaMatch = franquiaFilter === 'all' || item.franqueado === franquiaFilter;
    return nameMatch && franquiaMatch;
  });

  const patentSummary = useMemo(() => {
    return filteredRanking.reduce((acc, item) => {
        const patentName = getPatent(item.finalScore).name;
        acc[patentName] = (acc[patentName] || 0) + 1;
        return acc;
    }, {});
  }, [filteredRanking]);


  return (
    <>
      <Helmet>
        <title>Ranking Mensal - MYFEET Painel PPAD</title>
        <meta name="description" content="Ranking de desempenho de todas as lojas" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ranking PPAD</h1>
            <p className="text-muted-foreground mt-1">Classificação geral de desempenho das lojas.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filtrar por loja ou gestor..." 
                className="pl-9 w-48 bg-card border-border"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <Select onValueChange={setFranquiaFilter} value={franquiaFilter}>
              <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="Filtrar por franquia..." /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todas as Franquias</SelectItem>
                  {franqueados.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <PatentSummaryCard summary={patentSummary} />

        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3">Pos.</th>
                  <th scope="col" className="px-6 py-3">Loja</th>
                  <th scope="col" className="px-6 py-3 text-center">Pessoas</th>
                  <th scope="col" className="px-6 py-3 text-center">Performance</th>
                  <th scope="col" className="px-6 py-3 text-center">Ambientação</th>
                  <th scope="col" className="px-6 py-3 text-center">Digital</th>
                  <th scope="col" className="px-6 py-3 text-center">Patente</th>
                  <th scope="col" className="px-6 py-3 text-right">Pontuação Final</th>
                </tr>
              </thead>
              <motion.tbody
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {filteredRanking.map((item, index) => {
                  const patent = getPatent(item.finalScore);
                  const Icon = patentIcons[patent.name].icon;
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-lg text-foreground">#{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{item.store}</div>
                        <div className="text-xs text-muted-foreground">{item.manager}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-foreground">{item.p_pessoas}</td>
                      <td className="px-6 py-4 text-center text-foreground">{item.p_performance}</td>
                      <td className="px-6 py-4 text-center text-foreground">{item.p_ambientacao}</td>
                      <td className="px-6 py-4 text-center text-foreground">{item.p_digital}</td>
                      <td className="px-6 py-4 text-center">
                        <div className={`flex items-center justify-center gap-2 font-bold ${patent.color}`}>
                          <Icon />
                          <span>{patent.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-2xl text-primary">{item.finalScore}</td>
                    </tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonthlyRanking;