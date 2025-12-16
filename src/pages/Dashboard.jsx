import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Users, TrendingUp, Sparkles, Smartphone, Award, ArrowUp, ArrowDown, AlertCircle, Shield, Diamond, Frown, Meh, Smile, Laugh, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const pillarIcons = {
  Pessoas: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-900/50' },
  Performance: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/50' },
  Ambientação: { icon: Sparkles, color: 'text-orange-400', bg: 'bg-orange-900/50' },
  Digital: { icon: Smartphone, color: 'text-purple-400', bg: 'bg-purple-900/50' },
};

const satisfactionIcons = {
  1: { icon: Frown, color: 'text-red-400', label: 'Ruim' },
  2: { icon: Meh, color: 'text-orange-400', label: 'Razoável' },
  3: { icon: Smile, color: 'text-yellow-400', label: 'Bom' },
  4: { icon: Laugh, color: 'text-green-400', label: 'Excelente' },
};

const KpiCard = ({ title, score, trend, icon: Icon, color, className }) => (
  <motion.div 
    className={cn("bg-card p-5 rounded-2xl border border-border/50 flex flex-col justify-between", className)}
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
  >
    <div className="flex items-center justify-between text-muted-foreground">
      <span className="text-md font-medium">{title}</span>
      <Icon className={cn("w-6 h-6", color)} />
    </div>
    <div className="mt-4">
      <span className="font-bold text-4xl text-foreground">{score}</span>
    </div>
    {trend != null && (
      <div className="flex items-center gap-1 text-sm mt-2">
        <span className={trend >= 0 ? 'text-green-400' : 'text-red-400'}>
          {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {Math.abs(trend)}%
        </span>
        <span className="text-muted-foreground ml-1">vs mês anterior</span>
      </div>
    )}
  </motion.div>
);

const FeedbackSummaryCard = ({ summary, className }) => (
  <motion.div
    className={cn("bg-card p-4 rounded-xl border border-border/50 h-full flex flex-col justify-center", className)}
    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
  >
    <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">Resumo de Feedbacks</h3>
    <div className="flex justify-around items-center">
      {Object.entries(satisfactionIcons).map(([level, {icon: Icon, color}]) => (
        <div key={level} className="flex flex-col items-center gap-1">
          <Icon className={cn("w-6 h-6", color)} />
          <span className="font-bold text-lg text-foreground">{summary[level] || 0}</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-1">
        <Diamond className="w-6 h-6 text-yellow-300"/>
        <span className="font-bold text-lg text-foreground">{summary.highlights || 0}</span>
      </div>
    </div>
  </motion.div>
);

const GapCard = ({ pillar, gaps }) => (
  <div className="bg-card p-5 rounded-xl border border-border/50 h-full">
    <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
      <AlertCircle className={cn("w-5 h-5", pillarIcons[pillar]?.color)} /> Gaps em {pillar}
    </h3>
    <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
      {gaps.length > 0 ? gaps.map((gap, i) => <li key={i}>{gap}</li>) : <li>Nenhum gap identificado.</li>}
    </ul>
  </div>
);

const SupervisorAnalysisRow = ({ supervisor, stores, score }) => {
  const progress = score;
  let progressColor;
  if (progress > 85) progressColor = 'bg-green-500';
  else if (progress > 70) progressColor = 'bg-yellow-500';
  else progressColor = 'bg-red-500';

  return (
    <tr className="border-b border-border/50 hover:bg-accent/50 transition-colors">
      <td className="p-4 font-medium">{supervisor}</td>
      <td className="p-4 text-center text-muted-foreground">{stores}</td>
      <td className="p-4">
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div className={cn("h-2.5 rounded-full", progressColor)} style={{ width: `${progress}%` }}></div>
        </div>
      </td>
      <td className="p-4 text-right font-bold text-foreground">{score}</td>
    </tr>
  );
};

const Dashboard = () => {
  const { stores, feedbacks, evaluations } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });
  const [dateStart, setDateStart] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [dateEnd, setDateEnd] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const filterOptions = useMemo(() => {
    return {
      stores: stores.map(s => ({ value: s.id, label: s.name })),
      bandeiras: [...new Set(stores.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      franqueados: [...new Set(stores.map(s => s.franqueado))].map(f => ({ value: f, label: f })),
      supervisors: [...new Set(stores.map(s => s.supervisor))].map(s => ({ value: s, label: s })),
      estados: [...new Set(stores.map(s => s.estado))].map(e => ({ value: e, label: e })),
    }
  }, [stores]);
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const filteredData = useMemo(() => {
    const filteredStores = stores.filter(s => {
      return (filters.store.length === 0 || filters.store.includes(s.id)) &&
             (filters.bandeira.length === 0 || filters.bandeira.includes(s.bandeira)) &&
             (filters.franqueado.length === 0 || filters.franqueado.includes(s.franqueado)) &&
             (filters.supervisor.length === 0 || filters.supervisor.includes(s.supervisor)) &&
             (filters.estado.length === 0 || filters.estado.includes(s.estado));
    });

    const filteredStoreIds = new Set(filteredStores.map(s => s.id));
    
    // Filtrar avaliações e feedbacks por período (data início e data fim)
    const filteredEvaluations = evaluations.filter(e => {
      const evalStoreId = e.storeId || e.store_id;
      if (!filteredStoreIds.has(evalStoreId)) return false;
      
      // Se tiver data, filtrar por intervalo de datas
      if (e.created_at || e.date) {
        const evalDate = e.created_at || e.date;
        const evalDateStr = evalDate.split('T')[0]; // YYYY-MM-DD
        return evalDateStr >= dateStart && evalDateStr <= dateEnd;
      }
      return true; // Se não tiver data, incluir
    });
    
    const filteredFeedbacks = feedbacks.filter(f => {
      if (!filteredStoreIds.has(f.storeId)) return false;
      
      // Se tiver data, filtrar por intervalo de datas
      if (f.created_at || f.date) {
        const feedbackDate = f.created_at || f.date;
        const feedbackDateStr = feedbackDate.split('T')[0]; // YYYY-MM-DD
        return feedbackDateStr >= dateStart && feedbackDateStr <= dateEnd;
      }
      return true; // Se não tiver data, incluir
    });
    
    return { filteredStores, filteredEvaluations, filteredFeedbacks };
  }, [stores, evaluations, feedbacks, filters, dateStart, dateEnd]);

  const dashboardData = useMemo(() => {
    const { filteredStores, filteredEvaluations, filteredFeedbacks } = filteredData;
    
    console.log('📊 [Dashboard] Dados recebidos:', {
      stores: filteredStores.length,
      evaluations: filteredEvaluations.length,
      feedbacks: filteredFeedbacks.length,
      allEvaluations: evaluations.length,
      allFeedbacks: feedbacks.length
    });
    
    const isLoja = user.role === 'loja' || user.role === 'loja_franquia';
    const isFinanceiro = user.role === 'financeiro';
    const isDigital = user.role === 'digital';
    const isSupervisor = user.role === 'supervisor' || user.role === 'supervisor_franquia';
    
    const relevantFeedbacks = isLoja ? feedbacks.filter(fb => fb.storeId === user.storeId) : filteredFeedbacks;
    const feedbackSummary = relevantFeedbacks.reduce((acc, fb) => {
        acc[fb.satisfaction] = (acc[fb.satisfaction] || 0) + 1;
        if(fb.isPromotionCandidate) {
            acc.highlights = (acc.highlights || 0) + 1;
        }
        return acc;
    }, {});

    // Buscar apenas avaliações aprovadas
    const approvedEvaluations = filteredEvaluations.filter(e => e.status === 'approved');
    
    console.log('✅ [Dashboard] Avaliações aprovadas:', approvedEvaluations.length);

    if (isLoja) {
        // Calcular dados reais para loja
        const storeEvals = approvedEvaluations.filter(e => {
          const evalStoreId = e.storeId || e.store_id;
          return evalStoreId === user.storeId;
        });
        const overallScore = storeEvals.length > 0 
          ? Math.round(storeEvals.reduce((sum, e) => sum + e.score, 0) / storeEvals.length)
          : 0;
        
        // Calcular por pilar
        const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
        const pillarScores = pillars.map(pillar => {
          const pillarEvals = storeEvals.filter(e => e.pillar === pillar);
          const score = pillarEvals.length > 0
            ? Math.round(pillarEvals.reduce((sum, e) => sum + e.score, 0) / pillarEvals.length)
            : 0;
          return { name: pillar, score };
        });
        
        return {
            overallScore,
            pillars: pillarScores,
            gaps: {
              Pessoas: [],
              Performance: [],
              Ambientação: [],
              Digital: [],
            },
            feedbackSummary,
        }
    }

    // Admin/Supervisor/Financeiro/Digital logic with filters - CALCULAR DADOS REAIS
    const storeScores = filteredStores.map(store => {
        const storeEvals = approvedEvaluations.filter(e => {
          // Aceitar tanto camelCase quanto snake_case
          const evalStoreId = e.storeId || e.store_id;
          return evalStoreId === store.id;
        });
        const avgScore = storeEvals.length > 0 
          ? Math.round(storeEvals.reduce((sum, e) => sum + e.score, 0) / storeEvals.length)
          : 0;
        return { ...store, score: avgScore };
    });

    // Calcular pontuação geral
    const allScores = storeScores.map(s => s.score).filter(s => s > 0);
    const overallScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
      : 0;

    // Calcular por pilar
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    const pillarScores = pillars.map(pillar => {
      const pillarEvals = approvedEvaluations.filter(e => e.pillar === pillar);
      const score = pillarEvals.length > 0
        ? Math.round(pillarEvals.reduce((sum, e) => sum + e.score, 0) / pillarEvals.length)
        : 0;
      return { name: pillar, score, trend: null }; // Trend pode ser calculado depois
    });

    const supervisorsList = [...new Set(filteredStores.map(s => s.supervisor).filter(Boolean))];
    const supervisorAnalysis = supervisorsList.map(sup => {
        const supStores = storeScores.filter(s => s.supervisor === sup);
        const totalScore = supStores.reduce((sum, s) => sum + s.score, 0);
        const avgScore = supStores.length > 0 ? Math.round(totalScore / supStores.length) : 0;
        return {
            name: sup,
            stores: supStores.length,
            score: avgScore,
        };
    });

    console.log('📊 [Dashboard] Dados calculados:', {
      overallScore,
      pillarScores,
      supervisorAnalysis: supervisorAnalysis.length
    });

    return {
        overallScore,
        overallTrend: null, // Pode ser calculado depois comparando com mês anterior
        pillars: pillarScores,
        gaps: {
          Pessoas: [],
          Performance: [],
          Ambientação: [],
          Digital: [],
        },
        supervisorAnalysis,
        feedbackSummary,
    };
  }, [user, filteredData, feedbacks, evaluations]);

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada. Mas não se preocupe, você pode solicitá-la no próximo prompt! 🚀',
    });
  };

  const isLoja = user.role === 'loja' || user.role === 'loja_franquia';
  const isFinanceiro = user.role === 'financeiro';
  const isDigital = user.role === 'digital';
  const isSupervisor = user.role === 'supervisor' || user.role === 'supervisor_franquia';
  
  if (isLoja) {
    const storeInfo = stores.find(s => s.id === user.storeId);
    return (
        <>
            <Helmet><title>{`Meu Dashboard - ${storeInfo?.name || ''}`}</title></Helmet>
            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Meu Desempenho</h1>
                        <p className="text-muted-foreground mt-1">Análise de performance da sua loja: {storeInfo?.name}.</p>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Extrair PDF
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <KpiCard title="Pontuação Geral" score={dashboardData.overallScore} icon={Award} color="text-yellow-400" className="lg:col-span-1" />
                    {dashboardData.pillars.map(pillar => (
                      <KpiCard key={pillar.name} title={pillar.name} score={pillar.score} icon={pillarIcons[pillar.name].icon} color={pillarIcons[pillar.name].color} />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <FeedbackSummaryCard summary={dashboardData.feedbackSummary} className="lg:col-span-2" />
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GapCard pillar="Pessoas" gaps={dashboardData.gaps.Pessoas || []} />
                        <GapCard pillar="Ambientação" gaps={dashboardData.gaps.Ambientação || []} />
                        <GapCard pillar="Digital" gaps={dashboardData.gaps.Digital || []} />
                    </div>
                </div>
            </div>
        </>
    )
  }

  return (
    <>
      <Helmet><title>Dashboard - MYFEET Painel PPAD</title></Helmet>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Análise de performance consolidada.</p>
              </div>
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Extrair PDF
              </Button>
            </div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <KpiCard title="Pontuação Geral" score={dashboardData.overallScore} trend={dashboardData.overallTrend} icon={Award} color="text-yellow-400" className="lg:col-span-1"/>
            {dashboardData.pillars.map(pillar => (
              <KpiCard key={pillar.name} title={pillar.name} score={pillar.score} trend={pillar.trend} icon={pillarIcons[pillar.name].icon} color={pillarIcons[pillar.name].color} />
            ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
           <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.keys(pillarIcons).map(pillar => (
                    <GapCard key={pillar} pillar={pillar} gaps={dashboardData.gaps[pillar] || []} />
                ))}
            </div>
            <FeedbackSummaryCard summary={dashboardData.feedbackSummary} className="lg:col-span-1" />
        </div>
        
        { (user.role === 'admin' || isSupervisor) && dashboardData.supervisorAnalysis && dashboardData.supervisorAnalysis.length > 0 && (
          <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Shield className="text-primary"/>Análise por Supervisor</h2>
                <p className="text-sm text-muted-foreground">Performance média da equipe de supervisão.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase">
                  <tr className="border-t border-border/50">
                    <th scope="col" className="p-4 text-left font-medium">Supervisor</th>
                    <th scope="col" className="p-4 text-center font-medium">Lojas</th>
                    <th scope="col" className="p-4 text-left font-medium">Performance</th>
                    <th scope="col" className="p-4 text-right font-medium">Pontuação</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.supervisorAnalysis.sort((a,b) => b.score - a.score).map(sup => <SupervisorAnalysisRow key={sup.name} supervisor={sup.name} stores={sup.stores} score={sup.score} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;