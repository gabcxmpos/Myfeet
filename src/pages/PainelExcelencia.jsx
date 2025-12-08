import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Trophy, TrendingUp, TrendingDown, Award, Users, Building2 } from 'lucide-react';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PainelExcelencia = () => {
  const { stores, evaluations } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });
  const [periodFilter, setPeriodFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const filterOptions = useMemo(() => {
    const filtered = filterStoresByUserType(stores, user?.role, user?.storeId);
    return {
      stores: filtered.map(s => ({ value: s.id, label: s.name })),
      bandeiras: [...new Set(filtered.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      franqueados: [...new Set(filtered.map(s => s.franqueado || 'Loja Própria'))].map(f => ({ value: f, label: f })),
      supervisors: [...new Set(filtered.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s })),
      estados: [...new Set(filtered.map(s => s.estado).filter(Boolean))].map(e => ({ value: e, label: e })),
    };
  }, [stores, user?.role, user?.storeId]);
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };

  // Filtrar lojas por tipo (própria vs franquia) e filtros adicionais
  const filteredStores = useMemo(() => {
    let storesByType = filterStoresByUserType(stores, user?.role, user?.storeId);
    
    // Aplicar filtros adicionais
    return storesByType.filter(s => {
      return (filters.store.length === 0 || filters.store.includes(s.id)) &&
             (filters.bandeira.length === 0 || filters.bandeira.includes(s.bandeira)) &&
             (filters.franqueado.length === 0 || filters.franqueado.includes(s.franqueado || 'Loja Própria')) &&
             (filters.supervisor.length === 0 || filters.supervisor.includes(s.supervisor)) &&
             (filters.estado.length === 0 || filters.estado.includes(s.estado));
    });
  }, [stores, user?.role, user?.storeId, filters]);

  // Filtrar avaliações por período e status
  const filteredEvaluations = useMemo(() => {
    let filtered = evaluations.filter(e => e.status === 'approved');
    
    if (periodFilter.startDate) {
      const start = new Date(periodFilter.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(0, 0, 0, 0);
        return evalDate >= start;
      });
    }
    
    if (periodFilter.endDate) {
      const end = new Date(periodFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(23, 59, 59, 999);
        return evalDate <= end;
      });
    }
    
    return filtered;
  }, [evaluations, periodFilter]);

  // Calcular scores por pilar para cada loja
  const storeScores = useMemo(() => {
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    const scores = {};
    
    filteredStores.forEach(store => {
      const storeEvals = filteredEvaluations.filter(e => e.storeId === store.id);
      
      const pillarScores = {};
      let hasData = false;
      
      pillars.forEach(pillar => {
        if (pillar === 'Performance') {
          // Para o pilar Performance, calcular baseado em resultados vs metas
          const performanceKPIs = ['faturamento', 'pa', 'ticketMedio', 'prateleiraInfinita', 'conversao'];
          let totalWeightedScore = 0;
          let totalWeight = 0;
          
          // Determinar o mês baseado no filtro de data (usar o início do período ou mês atual)
          const getMonthFromFilter = () => {
            if (periodFilter.startDate) {
              const date = new Date(periodFilter.startDate);
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          };
          const targetMonth = getMonthFromFilter();
          
          // Buscar metas usando JSONB (goals[targetMonth])
          const storeGoals = store.goals || {};
          const goals = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
            ? (storeGoals[targetMonth] || {})
            : (storeGoals || {});
          
          // Buscar resultados usando JSONB (store_results[targetMonth])
          const storeResults = store.store_results || {};
          const results = typeof storeResults === 'object' && !Array.isArray(storeResults)
            ? (storeResults[targetMonth] || {})
            : {};
          
          // Buscar pesos usando JSONB (weights[targetMonth])
          const storeWeights = store.weights || {};
          const weights = typeof storeWeights === 'object' && !Array.isArray(storeWeights)
            ? (storeWeights[targetMonth] || {})
            : (storeWeights || {});
          
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
          const performanceScore = totalWeight > 0 
            ? Math.round(totalWeightedScore / totalWeight)
            : 0;
          
          pillarScores[pillar] = performanceScore;
          if (performanceScore > 0) hasData = true;
        } else {
          // Para outros pilares, usar média de avaliações aprovadas
          const pillarEvals = storeEvals.filter(e => e.pillar === pillar);
          if (pillarEvals.length > 0) {
            const validScores = pillarEvals
              .map(e => e.score)
              .filter(score => score !== null && score !== undefined && !isNaN(score) && score >= 0 && score <= 100);
            
            if (validScores.length > 0) {
              pillarScores[pillar] = Math.round(
                validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
              );
              hasData = true;
            } else {
              pillarScores[pillar] = 0;
            }
          } else {
            pillarScores[pillar] = 0;
          }
        }
      });
      
      scores[store.id] = {
        store: store,
        pillars: pillarScores,
        hasData: hasData || storeEvals.length > 0
      };
    });
    
    return scores;
  }, [filteredStores, filteredEvaluations]);

  // Agrupar lojas por franqueado
  const franqueadosData = useMemo(() => {
    const grouped = {};
    
    Object.values(storeScores).forEach(item => {
      if (!item.hasData) return;
      
      const franqueado = item.store.franqueado || 'Loja Própria';
      
      if (!grouped[franqueado]) {
        grouped[franqueado] = {
          franqueado: franqueado,
          stores: []
        };
      }
      
      grouped[franqueado].stores.push(item);
    });
    
    // Para cada franqueado, calcular melhor e pior por pilar
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    
    Object.keys(grouped).forEach(franqueado => {
      const stores = grouped[franqueado].stores;
      const pillarStats = {};
      
      pillars.forEach(pillar => {
        const scores = stores
          .map(item => ({
            store: item.store,
            score: item.pillars[pillar] || 0
          }))
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score);
        
        if (scores.length > 0) {
          pillarStats[pillar] = {
            best: scores[0], // Melhor
            worst: scores[scores.length - 1] // Pior
          };
        } else {
          pillarStats[pillar] = {
            best: null,
            worst: null
          };
        }
      });
      
      grouped[franqueado].pillarStats = pillarStats;
    });
    
    return grouped;
  }, [storeScores]);

  const pillarIcons = {
    'Pessoas': { icon: Users },
    'Performance': { icon: TrendingUp },
    'Ambientação': { icon: Trophy },
    'Digital': { icon: Award }
  };
  
  return (
    <>
      <Helmet>
        <title>Painel Excelência - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Painel Excelência</h1>
          <p className="text-muted-foreground mt-2">
            Tops e drops de desempenho por pilar - Análise de avaliações
          </p>
        </div>

        {/* Filtros - Igual ao Dashboard */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <MultiSelectFilter options={filterOptions.stores} selected={filters.store} onChange={(val) => handleFilterChange('store', val)} placeholder="Filtrar por Loja..." />
            <MultiSelectFilter options={filterOptions.bandeiras} selected={filters.bandeira} onChange={(val) => handleFilterChange('bandeira', val)} placeholder="Filtrar por Bandeira..." />
            <MultiSelectFilter options={filterOptions.franqueados} selected={filters.franqueado} onChange={(val) => handleFilterChange('franqueado', val)} placeholder="Filtrar por Franquia..." />
            <MultiSelectFilter options={filterOptions.supervisors} selected={filters.supervisor} onChange={(val) => handleFilterChange('supervisor', val)} placeholder="Filtrar por Supervisor..." />
            <MultiSelectFilter options={filterOptions.estados} selected={filters.estado} onChange={(val) => handleFilterChange('estado', val)} placeholder="Filtrar por Estado..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={periodFilter.startDate}
                onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={periodFilter.endDate}
                onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                className="bg-secondary"
              />
            </div>
          </div>
        </div>

        {/* Agrupado por Franqueado */}
        {Object.values(franqueadosData).map((franqueadoData, franqueadoIndex) => {
          const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
          
          return (
            <motion.div
              key={franqueadoData.franqueado}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: franqueadoIndex * 0.1 }}
            >
              <Card className="border-border mb-6 bg-card">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                    <span className="text-2xl font-bold">{franqueadoData.franqueado}</span>
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      ({franqueadoData.stores.length} loja{franqueadoData.stores.length !== 1 ? 's' : ''})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((pillar, pillarIndex) => {
                      const { best, worst } = franqueadoData.pillarStats[pillar] || { best: null, worst: null };
                      const Icon = pillarIcons[pillar].icon;
                      
                      return (
                        <motion.div
                          key={pillar}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (franqueadoIndex * 0.1) + (pillarIndex * 0.05) }}
                        >
                          <Card className="border border-border bg-card">
                            <CardHeader className="pb-3 border-b border-border">
                              <CardTitle className="flex items-center gap-2 text-foreground text-sm font-semibold">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span>{pillar}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                              {/* Melhor Desempenho */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                  <span>Melhor</span>
                                </div>
                                {best ? (
                                  <div className="bg-secondary/50 border border-border rounded-md p-3 hover:bg-secondary transition-colors">
                                    <p className="font-semibold text-foreground text-sm">{best.store.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{best.store.code}</p>
                                    <p className="text-base font-bold text-green-600 dark:text-green-400 mt-2">{best.score} pts</p>
                                  </div>
                                ) : (
                                  <div className="bg-secondary/30 border border-border rounded-md p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Sem dados</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Pior Desempenho */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                  <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  <span>Pior</span>
                                </div>
                                {worst ? (
                                  <div className="bg-secondary/50 border border-border rounded-md p-3 hover:bg-secondary transition-colors">
                                    <p className="font-semibold text-foreground text-sm">{worst.store.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{worst.store.code}</p>
                                    <p className="text-base font-bold text-red-600 dark:text-red-400 mt-2">{worst.score} pts</p>
                                  </div>
                                ) : (
                                  <div className="bg-secondary/30 border border-border rounded-md p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Sem dados</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        
        {Object.keys(franqueadosData).length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum dado encontrado</h3>
            <p className="text-muted-foreground">
              {periodFilter.startDate || periodFilter.endDate 
                ? 'Tente ajustar o filtro de período.' 
                : 'Nenhuma avaliação encontrada para as lojas filtradas.'}
            </p>
          </Card>
        )}
      </div>
    </>
  );
};

export default PainelExcelencia;

