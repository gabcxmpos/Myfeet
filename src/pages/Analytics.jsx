import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';
import { Gem, Award, Users, Target, Download, Trophy, Flag } from 'lucide-react';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const patentColors = {
    platina: '#E5E7EB', // Slate 200 - Visible on dark
    ouro: '#FBBF24',   // Amber 400
    prata: '#9CA3AF',   // Gray 400
    bronze: '#F59E0B'  // Amber 500
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-2 border border-border rounded-lg shadow-lg">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-primary">{`Pontuação Média: ${payload[0].value.toFixed(1)}`}</p>
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { stores, evaluations, patentSettings, fetchData } = useData();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });

  // Refresh automático a cada 30 segundos para ver dados atualizados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchData]);

  const filterOptions = useMemo(() => ({
    stores: stores.map(s => ({ value: s.id, label: s.name })),
    bandeiras: [...new Set(stores.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
    franqueados: [...new Set(stores.map(s => s.franqueado))].map(f => ({ value: f, label: f })),
    supervisors: [...new Set(stores.map(s => s.supervisor))].map(s => ({ value: s, label: s })),
    estados: [...new Set(stores.map(s => s.estado))].map(e => ({ value: e, label: e })),
  }), [stores]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const filteredData = useMemo(() => {
    const filteredStores = stores.filter(s =>
      (filters.store.length === 0 || filters.store.includes(s.id)) &&
      (filters.bandeira.length === 0 || filters.bandeira.includes(s.bandeira)) &&
      (filters.franqueado.length === 0 || filters.franqueado.includes(s.franqueado)) &&
      (filters.supervisor.length === 0 || filters.supervisor.includes(s.supervisor)) &&
      (filters.estado.length === 0 || filters.estado.includes(s.estado))
    );
    const filteredStoreIds = new Set(filteredStores.map(s => s.id));
    const filteredEvaluations = evaluations.filter(e => filteredStoreIds.has(e.storeId) && e.status === 'approved');
    return { filteredStores, filteredEvaluations };
  }, [stores, evaluations, filters]);

  const analyticsData = useMemo(() => {
    const { filteredStores, filteredEvaluations } = filteredData;
    if (filteredStores.length === 0) {
      return { radarData: [], brandPerformance: [], franchiseeRanking: [], patentDistribution: [] };
    }

    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    const radarData = pillars.map(pillar => {
      const pillarEvals = filteredEvaluations.filter(e => e.pillar === pillar);
      const avgScore = pillarEvals.length > 0 ? pillarEvals.reduce((acc, curr) => acc + curr.score, 0) / pillarEvals.length : 0;
      return { subject: pillar, score: avgScore, fullMark: 100 };
    });

    const getAvgScoreForStores = (storeSet) => {
        const storeIds = new Set(storeSet.map(s => s.id));
        const relevantEvals = filteredEvaluations.filter(e => storeIds.has(e.storeId));
        return relevantEvals.length > 0 ? relevantEvals.reduce((acc, curr) => acc + curr.score, 0) / relevantEvals.length : 0;
    }

    const brands = [...new Set(filteredStores.map(s => s.bandeira).filter(Boolean))];
    const brandPerformance = brands.map(brand => ({
        name: brand,
        score: getAvgScoreForStores(filteredStores.filter(s => s.bandeira === brand)),
    }));
    
    const franchisees = [...new Set(filteredStores.map(s => s.franqueado))];
    const franchiseeRanking = franchisees.map(franchisee => ({
        name: franchisee,
        score: getAvgScoreForStores(filteredStores.filter(s => s.franqueado === franchisee)),
        storeCount: filteredStores.filter(s => s.franqueado === franchisee).length,
    })).sort((a,b) => b.score - a.score);

    const patentDistribution = { platina: 0, ouro: 0, prata: 0, bronze: 0 };
    filteredStores.forEach(store => {
      const score = getAvgScoreForStores([store]);
      if (score >= patentSettings.platina) patentDistribution.platina++;
      else if (score >= patentSettings.ouro) patentDistribution.ouro++;
      else if (score >= patentSettings.prata) patentDistribution.prata++;
      else patentDistribution.bronze++;
    });
    const patentDistributionData = Object.entries(patentDistribution).map(([name, count]) => ({ name, count, fill: patentColors[name.toLowerCase()] }));


    return { radarData, brandPerformance, franchiseeRanking, patentDistributionData };
  }, [filteredData, patentSettings]);

  const getRankColor = (index) => {
    if (index === 0) return 'text-amber-400';
    if (index === 1) return 'text-slate-400';
    if (index === 2) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Analytics - MYFEET Painel PPAD</title>
        <meta name="description" content="Análise detalhada da performance da rede." />
      </Helmet>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Analytics PPAD</h1>
                    <p className="text-muted-foreground mt-1">Visão estratégica da performance da rede.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Extrair PDF
                </Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                <MultiSelectFilter options={filterOptions.stores} selected={filters.store} onChange={(val) => handleFilterChange('store', val)} placeholder="Filtrar por Loja..." />
                <MultiSelectFilter options={filterOptions.bandeiras} selected={filters.bandeira} onChange={(val) => handleFilterChange('bandeira', val)} placeholder="Filtrar por Bandeira..." />
                <MultiSelectFilter options={filterOptions.franqueados} selected={filters.franqueado} onChange={(val) => handleFilterChange('franqueado', val)} placeholder="Filtrar por Franquia..." />
                <MultiSelectFilter options={filterOptions.supervisors} selected={filters.supervisor} onChange={(val) => handleFilterChange('supervisor', val)} placeholder="Filtrar por Supervisor..." />
                <MultiSelectFilter options={filterOptions.estados} selected={filters.estado} onChange={(val) => handleFilterChange('estado', val)} placeholder="Filtrar por Estado..." />
            </div>
        </div>
        
        {filteredData.filteredStores.length === 0 ? (
             <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                <p className="text-lg">Nenhum dado encontrado para os filtros aplicados.</p>
                <p className="text-sm">Tente selecionar outros filtros para visualizar os analytics.</p>
            </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Target className="text-primary" />Radar de Pilares</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analyticsData.radarData}>
                        <PolarGrid stroke="hsla(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsla(var(--muted-foreground))', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Pontuação" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}/>
                    </RadarChart>
                </ResponsiveContainer>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.1}} className="bg-card rounded-xl shadow-lg border border-border p-6">
                 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Flag className="text-green-500" />Performance por Bandeira</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.brandPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="hsla(var(--muted-foreground))" fontSize={12} tick={{ fill: 'hsla(var(--muted-foreground))' }} />
                        <YAxis stroke="hsla(var(--muted-foreground))" tick={{ fill: 'hsla(var(--muted-foreground))' }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(var(--accent))' }}/>
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {analyticsData.brandPerformance.map((entry, index) => (
                                <Cell key={`cell-${index}`} className={cn(
                                    entry.name === 'ARTWALK' ? 'fill-artwalk' :
                                    entry.name === 'AUTHENTIC FEET' ? 'fill-authentic-feet' :
                                    entry.name === 'MAGICFEET' ? 'fill-magic-feet' :
                                    'fill-primary'
                                )}/>
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-lg border border-border p-6 lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Gem className="text-cyan-400" />Distribuição de Patentes</h2>
                 <div className="space-y-4 pt-4">
                    {analyticsData.patentDistributionData.map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize flex items-center gap-2 text-foreground">
                                <Award style={{color: item.fill}} />
                                {item.name}
                            </span>
                            <span className="font-bold text-lg" style={{color: item.fill}}>{item.count}</span>
                        </div>
                    ))}
                 </div>
            </motion.div>
        
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl shadow-lg border border-border p-6 lg:col-span-1">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4"><Users className="text-blue-400" />Ranking de Franqueados</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {analyticsData.franchiseeRanking.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3 bg-secondary/50 p-2 rounded-lg">
                            <Trophy className={cn("w-6 h-6 shrink-0", getRankColor(index))} />
                            <div className="flex-grow truncate">
                                <p className="font-semibold text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.storeCount} {item.storeCount > 1 ? 'lojas' : 'loja'}</p>
                            </div>
                            <p className="font-bold text-lg text-foreground">{item.score.toFixed(1)}<span className="text-sm"> pts</span></p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
        )}
      </div>
    </>
  );
};

export default Analytics;