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
  const { stores, patentSettings, evaluations } = useData();
  const [nameFilter, setNameFilter] = useState('');
  const [franquiaFilter, setFranquiaFilter] = useState('all');

  const franqueados = useMemo(() => ['Loja Própria', ...new Set(stores.map(s => s.franqueado).filter(f => f !== 'Loja Própria'))], [stores]);

  const getPatent = (score) => {
    if (score >= patentSettings.platina) return { name: 'Platina', color: patentIcons['Platina'].color, icon: <Trophy /> };
    if (score >= patentSettings.ouro) return { name: 'Ouro', color: patentIcons['Ouro'].color, icon: <Trophy /> };
    if (score >= patentSettings.prata) return { name: 'Prata', color: patentIcons['Prata'].color, icon: <Trophy /> };
    return { name: 'Bronze', color: patentIcons['Bronze'].color, icon: <Trophy /> };
  };

  // Calcular ranking baseado em avaliações aprovadas reais
  const approvedEvaluations = useMemo(() => 
    evaluations.filter(e => e.status === 'approved'), 
    [evaluations]
  );

  const realRanking = useMemo(() => {
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    
    return stores.map((store) => {
      // Buscar avaliações aprovadas desta loja
      const storeEvaluations = approvedEvaluations.filter(e => e.storeId === store.id);
      
      // Calcular pontuação por pilar
      const pillarScores = {};
      pillars.forEach(pillar => {
        if (pillar === 'Performance') {
          // Para o pilar Performance, calcular baseado em resultados vs metas
          const performanceKPIs = ['faturamento', 'pa', 'ticketMedio', 'prateleiraInfinita', 'conversao'];
          let totalWeightedScore = 0;
          let totalWeight = 0;
          
          const goals = store.goals || {};
          const results = store.results || {};
          const weights = store.weights || {};
          
          performanceKPIs.forEach(kpi => {
            const goal = goals[kpi] || 0;
            const result = results[kpi] || 0;
            const weight = weights[kpi] || 0;
            
            if (goal > 0) {
              // Calcular % de atingimento (limitado a 100% se ultrapassar)
              const achievement = Math.min((result / goal) * 100, 100);
              // Multiplicar achievement pelo peso (em decimal) e somar
              totalWeightedScore += achievement * (weight / 100);
              totalWeight += weight / 100;
            }
          });
          
          // Calcular score final (normalizado se os pesos não somarem 100%)
          pillarScores[pillar] = totalWeight > 0 
            ? Math.round(totalWeightedScore / totalWeight)
            : 0;
        } else {
          // Para outros pilares, usar média de avaliações aprovadas
          const pillarEvals = storeEvaluations.filter(e => e.pillar === pillar);
          if (pillarEvals.length > 0) {
            // Validar scores antes de calcular média
            const validScores = pillarEvals
              .map(e => e.score)
              .filter(score => score !== null && score !== undefined && !isNaN(score) && score >= 0 && score <= 100);
            
            if (validScores.length > 0) {
              pillarScores[pillar] = Math.round(
                validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
              );
            } else {
              pillarScores[pillar] = 0;
            }
          } else {
            pillarScores[pillar] = 0;
          }
        }
      });
      
      // Calcular pontuação final (média dos 4 pilares)
      const finalScore = pillars.length > 0
        ? Math.round(pillars.reduce((sum, pillar) => sum + (pillarScores[pillar] || 0), 0) / pillars.length)
        : 0;
      
      // Considerar que a loja tem dados se tiver pelo menos um pilar com score > 0
      const hasData = pillars.some(pillar => (pillarScores[pillar] || 0) > 0);
      
      return {
        id: store.id,
        store: store.name,
        manager: store.manager,
        franqueado: store.franqueado,
        p_pessoas: pillarScores['Pessoas'] || 0,
        p_performance: pillarScores['Performance'] || 0,
        p_ambientacao: pillarScores['Ambientação'] || 0,
        p_digital: pillarScores['Digital'] || 0,
        finalScore: finalScore,
        hasEvaluations: hasData, // Para filtrar lojas sem dados
      };
    }).sort((a, b) => {
      // Ordenar: primeiro por pontuação final, depois por lojas sem dados por último
      if (a.hasEvaluations && !b.hasEvaluations) return -1;
      if (!a.hasEvaluations && b.hasEvaluations) return 1;
      return b.finalScore - a.finalScore;
    });
  }, [stores, approvedEvaluations]);

  // Filtrar apenas lojas com dados e aplicar filtros
  const filteredRanking = realRanking.filter(item => {
    // Mostrar apenas lojas que têm dados (avaliações ou resultados de performance)
    if (!item.hasEvaluations) return false;
    
    const nameMatch = item.store.toLowerCase().includes(nameFilter.toLowerCase()) ||
                      (item.manager && item.manager.toLowerCase().includes(nameFilter.toLowerCase()));
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
                {filteredRanking.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-muted-foreground">
                      Nenhuma loja encontrada com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredRanking.map((item, index) => {
                    const patent = getPatent(item.finalScore);
                    const Icon = patentIcons[patent.name].icon;
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-lg text-foreground">#{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{item.store}</div>
                          {item.manager && (
                            <div className="text-xs text-muted-foreground">{item.manager}</div>
                          )}
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
                  })
                )}
              </motion.tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default MonthlyRanking;