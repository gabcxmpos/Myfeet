import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Award, TrendingUp, Users, Smartphone, BarChart3, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const pillarIcons = {
  Pessoas: { icon: Users, color: 'text-blue-400' },
  Performance: { icon: TrendingUp, color: 'text-green-400' },
  Ambientação: { icon: Award, color: 'text-orange-400' },
  Digital: { icon: Smartphone, color: 'text-purple-400' },
};

const PainelExcelencia = () => {
  const { stores, evaluations, patentSettings } = useData();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });
  const [dateStart, setDateStart] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

  const filterOptions = useMemo(() => ({
    stores: stores.map(s => ({ value: s.id, label: s.name })),
    bandeiras: [...new Set(stores.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
    franqueados: [...new Set(stores.map(s => s.franqueado))].map(f => ({ value: f, label: f })),
    supervisors: [...new Set(stores.map(s => s.supervisor))].map(s => ({ value: s, label: s })),
    estados: [...new Set(stores.map(s => s.estado))].map(e => ({ value: e, label: e })),
  }), [stores]);

  const filteredData = useMemo(() => {
    let storesByType = filterStoresByUserType(stores, user?.role, user?.storeId);
    
    const filteredStores = storesByType.filter(s =>
      (filters.store.length === 0 || filters.store.includes(s.id)) &&
      (filters.bandeira.length === 0 || filters.bandeira.includes(s.bandeira)) &&
      (filters.franqueado.length === 0 || filters.franqueado.includes(s.franqueado)) &&
      (filters.supervisor.length === 0 || filters.supervisor.includes(s.supervisor)) &&
      (filters.estado.length === 0 || filters.estado.includes(s.estado))
    );
    
    const filteredStoreIds = new Set(filteredStores.map(s => s.id));
    
    let filteredEvaluations = evaluations.filter(e => {
      const evalStoreId = e.storeId || e.store_id;
      if (!filteredStoreIds.has(evalStoreId)) return false;
      if (e.status !== 'approved') return false;
      
      // Filtrar por período
      if (e.created_at || e.date) {
        const evalDate = e.created_at || e.date;
        const evalDateStr = evalDate.split('T')[0];
        return evalDateStr >= dateStart && evalDateStr <= dateEnd;
      }
      return true;
    });
    
    return { filteredStores, filteredEvaluations };
  }, [stores, evaluations, filters, dateStart, dateEnd, user?.role, user?.storeId]);

  const excelenciaData = useMemo(() => {
    const { filteredStores, filteredEvaluations } = filteredData;
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    
    // Agrupar lojas por franqueado
    const storesByFranqueado = {};
    filteredStores.forEach(store => {
      const franqueado = store.franqueado || 'Sem Franqueado';
      if (!storesByFranqueado[franqueado]) {
        storesByFranqueado[franqueado] = [];
      }
      storesByFranqueado[franqueado].push(store);
    });
    
    // Para cada franqueado e cada pilar, calcular melhor e pior loja
    const excelenciaPorFranqueado = {};
    
    Object.keys(storesByFranqueado).forEach(franqueado => {
      excelenciaPorFranqueado[franqueado] = {};
      
      pillars.forEach(pillar => {
        const pillarEvals = filteredEvaluations.filter(e => e.pillar === pillar);
        const franqueadoStores = storesByFranqueado[franqueado];
        
        // Calcular pontuação média de cada loja do franqueado neste pilar
        const storeScores = franqueadoStores.map(store => {
          const storeEvals = pillarEvals.filter(e => {
            const evalStoreId = e.storeId || e.store_id;
            return evalStoreId === store.id;
          });
          
          if (storeEvals.length === 0) return null;
          
          const avgScore = Math.round(
            storeEvals.reduce((sum, e) => sum + e.score, 0) / storeEvals.length
          );
          
          return {
            ...store,
            score: avgScore,
            evaluationsCount: storeEvals.length
          };
        }).filter(s => s !== null);
        
        if (storeScores.length > 0) {
          // Ordenar por pontuação
          storeScores.sort((a, b) => b.score - a.score);
          
          const melhor = storeScores[0];
          const pior = storeScores[storeScores.length - 1];
          
          excelenciaPorFranqueado[franqueado][pillar] = {
            melhor: melhor,
            pior: pior,
            totalLojas: storeScores.length
          };
        }
      });
    });
    
    // Calcular estatísticas gerais
    const overallScore = filteredEvaluations.length > 0
      ? Math.round(filteredEvaluations.reduce((sum, e) => sum + e.score, 0) / filteredEvaluations.length)
      : 0;
    
    return {
      excelenciaPorFranqueado,
      overallScore,
      totalStores: filteredStores.length,
      totalEvaluations: filteredEvaluations.length,
      franqueados: Object.keys(storesByFranqueado).sort()
    };
  }, [filteredData]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

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
            <p className="text-muted-foreground mt-1">Análise de desempenho e excelência das lojas.</p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dateStart" className="text-xs text-muted-foreground">Data Início</Label>
                <Input
                  id="dateStart"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  max={dateEnd}
                  className="w-full bg-secondary h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateEnd" className="text-xs text-muted-foreground">Data Fim</Label>
                <Input
                  id="dateEnd"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  min={dateStart}
                  className="w-full bg-secondary h-9 text-sm"
                />
              </div>
              <MultiSelectFilter options={filterOptions.stores} selected={filters.store} onChange={(val) => handleFilterChange('store', val)} placeholder="Filtrar por Loja..." />
              <MultiSelectFilter options={filterOptions.bandeiras} selected={filters.bandeira} onChange={(val) => handleFilterChange('bandeira', val)} placeholder="Filtrar por Bandeira..." />
              <MultiSelectFilter options={filterOptions.franqueados} selected={filters.franqueado} onChange={(val) => handleFilterChange('franqueado', val)} placeholder="Filtrar por Franquia..." />
              <MultiSelectFilter options={filterOptions.supervisors} selected={filters.supervisor} onChange={(val) => handleFilterChange('supervisor', val)} placeholder="Filtrar por Supervisor..." />
              <MultiSelectFilter options={filterOptions.estados} selected={filters.estado} onChange={(val) => handleFilterChange('estado', val)} placeholder="Filtrar por Estado..." />
            </div>
          </CardContent>
        </Card>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" /> Pontuação Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{excelenciaData.overallScore}</div>
              <p className="text-xs text-muted-foreground mt-1">Média de todas as avaliações</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Lojas Avaliadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{excelenciaData.totalStores}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de lojas no período</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Avaliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{excelenciaData.totalEvaluations}</div>
              <p className="text-xs text-muted-foreground mt-1">Total de avaliações aprovadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Excelência por Franqueado e Pilar */}
        <div className="space-y-6">
          {excelenciaData.franqueados.map(franqueado => {
            const dadosFranqueado = excelenciaData.excelenciaPorFranqueado[franqueado];
            if (!dadosFranqueado) return null;
            
            const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
            const hasData = pillars.some(pillar => dadosFranqueado[pillar]);
            
            if (!hasData) return null;
            
            return (
              <Card key={franqueado} className="bg-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    {franqueado}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pillars.map(pillar => {
                      const dadosPilar = dadosFranqueado[pillar];
                      if (!dadosPilar) return null;
                      
                      const Icon = pillarIcons[pillar]?.icon || Award;
                      const color = pillarIcons[pillar]?.color || 'text-primary';
                      
                      return (
                        <div key={pillar} className="space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={`w-5 h-5 ${color}`} />
                            <h3 className="text-lg font-semibold text-foreground">{pillar}</h3>
                            <Badge variant="outline" className="ml-auto">
                              {dadosPilar.totalLojas} lojas
                            </Badge>
                          </div>
                          
                          {/* Melhor Loja */}
                          {dadosPilar.melhor && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <ArrowUp className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-semibold text-green-400">Melhor Desempenho</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-foreground">{dadosPilar.melhor.name}</p>
                                  <p className="text-xs text-muted-foreground">{dadosPilar.melhor.code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-400">{dadosPilar.melhor.score}</p>
                                  <p className="text-xs text-muted-foreground">{dadosPilar.melhor.evaluationsCount} avaliações</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Pior Loja */}
                          {dadosPilar.pior && dadosPilar.pior.id !== dadosPilar.melhor?.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <ArrowDown className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-semibold text-red-400">Pior Desempenho</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-foreground">{dadosPilar.pior.name}</p>
                                  <p className="text-xs text-muted-foreground">{dadosPilar.pior.code}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-red-400">{dadosPilar.pior.score}</p>
                                  <p className="text-xs text-muted-foreground">{dadosPilar.pior.evaluationsCount} avaliações</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {excelenciaData.franqueados.length === 0 && (
            <Card className="bg-card border-border/50">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default PainelExcelencia;
