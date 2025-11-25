import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Users, TrendingUp, Sparkles, Smartphone, Award, ArrowUp, ArrowDown, AlertCircle, Shield, Diamond, Frown, Meh, Smile, Laugh, Download, GraduationCap, UserCheck, Building2, Percent, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { useToast } from '@/components/ui/use-toast';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { stores, feedbacks, evaluations, trainings, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  // Função para calcular dias até o treinamento
  const getDaysUntilTraining = (trainingDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const training = new Date(trainingDate);
    training.setHours(0, 0, 0, 0);
    
    const days = differenceInDays(training, today);
    
    if (days < 0) return null; // Treinamento já passou
    if (isToday(training)) return 'Hoje';
    if (isTomorrow(training)) return 'Amanhã';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };
  
  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });

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
    const filteredEvaluations = evaluations.filter(e => filteredStoreIds.has(e.storeId));
    const filteredFeedbacks = feedbacks.filter(f => filteredStoreIds.has(f.storeId));
    
    return { filteredStores, filteredEvaluations, filteredFeedbacks };
  }, [stores, evaluations, feedbacks, filters]);

  const dashboardData = useMemo(() => {
    const { filteredStores, filteredEvaluations, filteredFeedbacks } = filteredData;
    
    const isLoja = user.role === 'loja';
    
    const relevantFeedbacks = isLoja ? feedbacks.filter(fb => fb.storeId === user.storeId) : filteredFeedbacks;
    const feedbackSummary = relevantFeedbacks.reduce((acc, fb) => {
        acc[fb.satisfaction] = (acc[fb.satisfaction] || 0) + 1;
        if(fb.isPromotionCandidate) {
            acc.highlights = (acc.highlights || 0) + 1;
        }
        return acc;
    }, {});


    // Filtrar apenas avaliações aprovadas
    const approvedEvaluations = filteredEvaluations.filter(e => e.status === 'approved');
    
    // Calcular pontuação geral e por pilares baseado em avaliações aprovadas
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    
    // Calcular pontuação por pilar (média de todas as avaliações aprovadas)
    const pillarScores = {};
    pillars.forEach(pillar => {
      const pillarEvals = approvedEvaluations.filter(e => e.pillar === pillar);
      if (pillarEvals.length > 0) {
        pillarScores[pillar] = Math.round(
          pillarEvals.reduce((acc, curr) => acc + curr.score, 0) / pillarEvals.length
        );
      } else {
        pillarScores[pillar] = 0;
      }
    });
    
    // Calcular pontuação geral (média de todas as avaliações aprovadas)
    const overallScore = approvedEvaluations.length > 0
      ? Math.round(approvedEvaluations.reduce((sum, e) => sum + e.score, 0) / approvedEvaluations.length)
      : 0;

    if (isLoja) {
        // Logic for single store view - usar apenas avaliações aprovadas da loja
        const storeEvaluations = approvedEvaluations.filter(e => e.storeId === user.storeId);
        
        const storePillarScores = {};
        pillars.forEach(pillar => {
          const pillarEvals = storeEvaluations.filter(e => e.pillar === pillar);
          if (pillarEvals.length > 0) {
            storePillarScores[pillar] = Math.round(
              pillarEvals.reduce((acc, curr) => acc + curr.score, 0) / pillarEvals.length
            );
          } else {
            storePillarScores[pillar] = 0;
          }
        });
        
        const storeOverallScore = storeEvaluations.length > 0
          ? Math.round(storeEvaluations.reduce((sum, e) => sum + e.score, 0) / storeEvaluations.length)
          : 0;
        
        return {
            overallScore: storeOverallScore,
            pillars: pillars.map(pillar => ({
              name: pillar,
              score: storePillarScores[pillar] || 0,
            })),
            gaps: {
              Pessoas: [],
              Performance: [],
              Ambientação: [],
              Digital: [],
            },
            feedbackSummary,
        }
    }

    // Admin/Supervisor logic with filters
    const storeScores = filteredStores.map(store => {
        const storeEvals = approvedEvaluations.filter(e => e.storeId === store.id);
        const avgScore = storeEvals.length > 0 ? storeEvals.reduce((sum, e) => sum + e.score, 0) / storeEvals.length : 0;
        return { ...store, score: Math.round(avgScore) };
    });

    const supervisorsList = [...new Set(filteredStores.map(s => s.supervisor))];
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

    return {
        overallScore,
        overallTrend: null, // Removido trend mockado - pode ser implementado no futuro com histórico
        pillars: pillars.map(pillar => ({
          name: pillar,
          score: pillarScores[pillar] || 0,
          trend: null, // Removido trend mockado - pode ser implementado no futuro com histórico
        })),
        gaps: {
          Pessoas: [],
          Performance: [],
          Ambientação: [],
          Digital: [],
        },
        supervisorAnalysis,
        feedbackSummary,
    };
  }, [user, filteredData, feedbacks]);

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada. Mas não se preocupe, você pode solicitá-la no próximo prompt! 🚀',
    });
  };

  if (user.role === 'loja') {
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

                {/* Próximos Treinamentos para Loja */}
                {trainings && trainings.length > 0 && (() => {
                  const upcomingTrainings = trainings
                    .filter(t => {
                      // Verificar se a loja está nas lojas do treinamento
                      let storeMatch = true;
                      
                      // Se o treinamento não tem lojas específicas, está disponível para todos
                      if (!t.store_ids || t.store_ids === null || t.store_ids === '') {
                        storeMatch = true;
                      } else {
                        try {
                          const storeIds = typeof t.store_ids === 'string' 
                            ? JSON.parse(t.store_ids) 
                            : t.store_ids;
                          if (Array.isArray(storeIds) && storeIds.length > 0) {
                            storeMatch = storeIds.includes(user.storeId);
                          } else {
                            storeMatch = false;
                          }
                        } catch {
                          storeMatch = false;
                        }
                      }
                      
                      // Filtrar apenas futuros
                      const trainingDate = new Date(t.training_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isFuture = trainingDate >= today;
                      
                      return storeMatch && isFuture;
                    })
                    .sort((a, b) => new Date(a.training_date) - new Date(b.training_date))
                    .slice(0, 3); // Apenas os 3 próximos
                  
                  if (upcomingTrainings.length === 0) return null;
                  
                  return (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-6 h-6" />
                        Próximos Treinamentos
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingTrainings.map(training => {
                          const daysUntil = getDaysUntilTraining(training.training_date);
                          return (
                            <motion.div
                              key={training.id}
                              className="bg-card p-4 rounded-xl border border-border"
                              whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg text-foreground">{training.title}</h3>
                                {daysUntil && (
                                  <div className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                                    daysUntil === 'Hoje' 
                                      ? "bg-red-500/20 text-red-500"
                                      : daysUntil === 'Amanhã'
                                      ? "bg-orange-500/20 text-orange-500"
                                      : "bg-blue-500/20 text-blue-500"
                                  )}>
                                    <Clock className="w-3 h-3" />
                                    <span>{daysUntil}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {format(new Date(training.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    {training.time && ` às ${training.time}`}
                                  </span>
                                </div>
                                {training.format && (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" />
                                    <span>{training.format === 'presencial' ? 'Presencial' : training.format === 'online' ? 'Online' : 'Híbrido'}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
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
        
        { user.role === 'admin' && (
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