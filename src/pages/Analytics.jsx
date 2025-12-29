import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';
import { Gem, Award, Users, Target, Download, Trophy, Flag, AlertCircle, TrendingDown, BarChart3 } from 'lucide-react';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
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
  const { stores, evaluations, patentSettings, forms, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({ store: [], bandeira: [], franqueado: [], supervisor: [], estado: [] });
  const [periodFilter, setPeriodFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

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
    // Primeiro filtrar por tipo de loja (própria vs franquia)
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
      const storeId = e.storeId || e.store_id;
      return filteredStoreIds.has(storeId) && e.status === 'approved';
    });
    
    // Debug: Log para verificar dados
    console.log('📊 [Analytics] Dados filtrados:', {
      totalStores: stores.length,
      filteredStores: filteredStores.length,
      totalEvaluations: evaluations.length,
      approvedEvaluations: evaluations.filter(e => e.status === 'approved').length,
      filteredEvaluations: filteredEvaluations.length,
      forms: forms.length
    });
    
    // Filtrar por período de data
    if (periodFilter.startDate) {
      const start = new Date(periodFilter.startDate);
      start.setHours(0, 0, 0, 0);
      filteredEvaluations = filteredEvaluations.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(0, 0, 0, 0);
        return evalDate >= start;
      });
    }
    
    if (periodFilter.endDate) {
      const end = new Date(periodFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filteredEvaluations = filteredEvaluations.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(23, 59, 59, 999);
        return evalDate <= end;
      });
    }
    
    return { filteredStores, filteredEvaluations };
  }, [stores, evaluations, filters, periodFilter, user?.role, user?.storeId]);

  // Função para calcular pontuação de uma pergunta individual
  const calculateQuestionScore = (question, answer) => {
    if (!question || answer === undefined || answer === null) return null;
    
    if (question.type === 'satisfaction') {
      return (answer / 10) * 100;
    } else if (question.type === 'multiple-choice') {
      const selectedOption = question.options?.find(opt => opt.text === answer);
      if (!selectedOption) return null;
      const maxValue = Math.max(...(question.options?.map(o => o.value || 0) || [0]), 10);
      return maxValue > 0 ? (selectedOption.value / maxValue) * 100 : null;
    } else if (question.type === 'checkbox') {
      if (!Array.isArray(answer) || answer.length === 0) return null;
      let totalValue = 0;
      answer.forEach(ans => {
        const option = question.options?.find(opt => opt.text === ans);
        if (option) totalValue += option.value || 0;
      });
      const maxValue = question.options?.reduce((sum, opt) => sum + Math.max(opt.value || 0, 0), 0) || 1;
      return maxValue > 0 ? (totalValue / maxValue) * 100 : null;
    }
    return null;
  };

  // Função para calcular gaps completos com análises aprofundadas
  const calculateDetailedGaps = (approvedEvals, formsList) => {
    const gapsByPillar = {
      Pessoas: [],
      Performance: [],
      Ambientação: [],
      Digital: [],
    };

    if (!approvedEvals || approvedEvals.length === 0 || !formsList || formsList.length === 0) {
      console.log('⚠️ [calculateDetailedGaps] Sem dados suficientes:', {
        evaluations: approvedEvals?.length || 0,
        forms: formsList?.length || 0
      });
      return gapsByPillar;
    }

    const questionScores = {};

    approvedEvals.forEach(evaluation => {
      const formId = evaluation.form_id || evaluation.formId;
      const form = formsList.find(f => f.id === formId);
      if (!form) return;

      // Parsear questions se for string JSON
      let questions = form.questions;
      if (typeof questions === 'string') {
        try {
          questions = JSON.parse(questions);
        } catch (e) {
          console.warn('⚠️ Erro ao parsear questions do formulário:', e);
          return;
        }
      }

      if (!questions || !Array.isArray(questions)) return;

      // Parsear answers se for string JSON
      let answers = evaluation.answers;
      if (typeof answers === 'string') {
        try {
          answers = JSON.parse(answers);
        } catch (e) {
          console.warn('⚠️ Erro ao parsear answers da avaliação:', e);
          return;
        }
      }

      if (!answers) return;

      questions.forEach(question => {
        if (question.type === 'text') return;
        if (!question.id) {
          console.warn('⚠️ [calculateDetailedGaps] Pergunta sem ID:', question);
          return;
        }

        const answer = answers[question.id];
        const questionScore = calculateQuestionScore(question, answer);
        
        if (questionScore === null) return;

        const pillar = form.pillar || evaluation.pillar;
        if (!pillar || !gapsByPillar[pillar]) {
          console.warn('⚠️ [calculateDetailedGaps] Pilar inválido:', pillar, 'Form:', form.title);
          return;
        }

        const questionKey = question.id;
        if (!questionScores[pillar]) questionScores[pillar] = {};
        if (!questionScores[pillar][questionKey]) {
          questionScores[pillar][questionKey] = {
            title: question.text || question.question || 'Pergunta sem título',
            subtitle: question.subtitle || '',
            scores: [],
            formTitle: form.title || ''
          };
        }
        questionScores[pillar][questionKey].scores.push({
          score: questionScore,
          storeId: evaluation.storeId || evaluation.store_id,
          evaluationId: evaluation.id,
          date: evaluation.date || evaluation.created_at
        });
      });
    });

    // Calcular análises aprofundadas
    Object.keys(questionScores).forEach(pillar => {
      Object.keys(questionScores[pillar]).forEach(questionKey => {
        const questionData = questionScores[pillar][questionKey];
        const scores = questionData.scores.map(s => s.score);
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        
        if (avgScore < 70) {
          // Calcular estatísticas
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          const medianScore = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];
          
          // Contar quantas avaliações estão abaixo de 70
          const belowThreshold = scores.filter(s => s < 70).length;
          const percentageBelowThreshold = (belowThreshold / scores.length) * 100;

          gapsByPillar[pillar].push({
            title: questionData.title,
            subtitle: questionData.subtitle,
            formTitle: questionData.formTitle,
            avgScore: Math.round(avgScore),
            minScore: Math.round(minScore),
            maxScore: Math.round(maxScore),
            medianScore: Math.round(medianScore),
            totalAnswers: scores.length,
            belowThresholdCount: belowThreshold,
            percentageBelowThreshold: Math.round(percentageBelowThreshold),
            scores: questionData.scores
          });
        }
      });
      
      // Ordenar por score médio (piores primeiro)
      gapsByPillar[pillar].sort((a, b) => a.avgScore - b.avgScore);
    });

    return gapsByPillar;
  };

  const analyticsData = useMemo(() => {
    const { filteredStores, filteredEvaluations } = filteredData;
    if (filteredStores.length === 0) {
      return { radarData: [], brandPerformance: [], franchiseeRanking: [], patentDistribution: [], gaps: {} };
    }

    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    const radarData = pillars.map(pillar => {
      if (pillar === 'Performance') {
        // Para o pilar Performance, calcular baseado em resultados vs metas usando JSONB
        const performanceKPIs = ['faturamento', 'pa', 'ticketMedio', 'prateleiraInfinita', 'conversao'];
        let totalWeightedScore = 0;
        let totalWeight = 0;
        let storesWithData = 0;
        
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
        
        filteredStores.forEach(store => {
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
          
          let storeScore = 0;
          let storeWeight = 0;
          let hasData = false;
          
          performanceKPIs.forEach(kpi => {
            const goal = goals[kpi] || 0;
            const result = results[kpi] || 0;
            const weight = weights[kpi] || 0;
            
            if (goal > 0) {
              // Calcular % de atingimento (limitado a 100% se ultrapassar)
              const achievement = Math.min((result / goal) * 100, 100);
              // Multiplicar achievement pelo peso (em decimal) e somar
              storeScore += achievement * (weight / 100);
              storeWeight += weight / 100;
              hasData = true;
            }
          });
          
          if (hasData && storeWeight > 0) {
            // Normalizar pelo peso total
            const normalizedScore = storeScore / storeWeight;
            totalWeightedScore += normalizedScore;
            totalWeight += 1;
            storesWithData++;
          }
        });
        
        // Calcular média ponderada entre todas as lojas
        const avgScore = storesWithData > 0 && totalWeight > 0 
          ? Math.round(totalWeightedScore / storesWithData)
          : 0;
        
        return { subject: pillar, score: avgScore, fullMark: 100 };
      } else {
        // Para outros pilares, usar média de avaliações aprovadas
        const pillarEvals = filteredEvaluations.filter(e => e.pillar === pillar);
        const avgScore = pillarEvals.length > 0 ? pillarEvals.reduce((acc, curr) => acc + (curr.score || 0), 0) / pillarEvals.length : 0;
        return { subject: pillar, score: Math.round(avgScore), fullMark: 100 };
      }
    });

    const getAvgScoreForStores = (storeSet) => {
        const storeIds = new Set(storeSet.map(s => s.id));
        const relevantEvals = filteredEvaluations.filter(e => {
          const storeId = e.storeId || e.store_id;
          return storeIds.has(storeId);
        });
        return relevantEvals.length > 0 ? relevantEvals.reduce((acc, curr) => acc + (curr.score || 0), 0) / relevantEvals.length : 0;
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

    // Calcular gaps com análises aprofundadas
    const detailedGaps = calculateDetailedGaps(filteredEvaluations, forms);
    
    console.log('📊 [Analytics] Dados finais:', {
      radarData: radarData,
      brandPerformance: brandPerformance,
      franchiseeRanking: franchiseeRanking.length,
      patentDistribution: patentDistributionData,
      totalGaps: Object.values(detailedGaps).reduce((sum, pillarGaps) => sum + pillarGaps.length, 0),
      byPillar: Object.keys(detailedGaps).map(p => ({
        pillar: p,
        count: detailedGaps[p].length
      })),
      sampleGap: detailedGaps.Pessoas?.[0] || detailedGaps.Performance?.[0] || null
    });

    return { radarData, brandPerformance, franchiseeRanking, patentDistributionData, gaps: detailedGaps };
  }, [filteredData, patentSettings, forms, periodFilter]);

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

        {/* Seção de Gaps com Análises Aprofundadas */}
        {filteredData.filteredStores.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                Análise de Gaps - Perguntas Mal Avaliadas
              </h2>
              <p className="text-muted-foreground">
                Análise detalhada das perguntas com pontuação abaixo de 70 pontos, incluindo estatísticas e tendências.
              </p>
            </div>

            {!analyticsData.gaps || Object.values(analyticsData.gaps).every(pillarGaps => pillarGaps.length === 0) ? (
              <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">Nenhum gap identificado</p>
                <p className="text-sm text-muted-foreground">
                  Todas as perguntas estão com pontuação acima de 70 pontos. Parabéns! 🎉
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['Pessoas', 'Performance', 'Ambientação', 'Digital'].map(pillar => {
                  const pillarGaps = analyticsData.gaps?.[pillar] || [];
                  if (pillarGaps.length === 0) return null;

                const pillarColors = {
                  Pessoas: 'text-blue-400',
                  Performance: 'text-green-400',
                  Ambientação: 'text-orange-400',
                  Digital: 'text-purple-400',
                };

                return (
                  <motion.div
                    key={pillar}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-xl shadow-lg border border-border p-6"
                  >
                    <h3 className={`text-lg font-semibold text-foreground flex items-center gap-2 mb-4 ${pillarColors[pillar]}`}>
                      <AlertCircle className="w-5 h-5" />
                      Gaps em {pillar}
                      <span className="text-sm text-muted-foreground font-normal">
                        ({pillarGaps.length} {pillarGaps.length === 1 ? 'pergunta' : 'perguntas'})
                      </span>
                    </h3>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {pillarGaps.map((gap, index) => (
                        <div
                          key={index}
                          className="bg-secondary/50 rounded-lg p-4 border border-border/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{gap.title}</h4>
                              {gap.subtitle && (
                                <p className="text-sm text-muted-foreground mb-2">{gap.subtitle}</p>
                              )}
                              {gap.formTitle && (
                                <p className="text-xs text-muted-foreground italic">Formulário: {gap.formTitle}</p>
                              )}
                            </div>
                            <div className={`text-right ${gap.avgScore < 50 ? 'text-red-400' : 'text-orange-400'}`}>
                              <div className="text-2xl font-bold">{gap.avgScore}</div>
                              <div className="text-xs text-muted-foreground">pontos</div>
                            </div>
                          </div>

                          {/* Estatísticas */}
                          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Média</div>
                                <div className="font-semibold text-foreground">{gap.avgScore} pts</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingDown className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Abaixo de 70</div>
                                <div className="font-semibold text-foreground">
                                  {gap.belowThresholdCount} ({gap.percentageBelowThreshold}%)
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Mínimo</div>
                                <div className="font-semibold text-foreground">{gap.minScore} pts</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="text-xs text-muted-foreground">Máximo</div>
                                <div className="font-semibold text-foreground">{gap.maxScore} pts</div>
                              </div>
                            </div>
                          </div>

                          {/* Barra de progresso visual */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Pontuação média</span>
                              <span>{gap.totalAnswers} respostas</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  gap.avgScore < 50
                                    ? 'bg-red-500'
                                    : gap.avgScore < 60
                                    ? 'bg-orange-500'
                                    : 'bg-yellow-500'
                                }`}
                                style={{ width: `${gap.avgScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}

            {/* Resumo geral */}
            {analyticsData.gaps && Object.values(analyticsData.gaps).some(pillarGaps => pillarGaps.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl shadow-lg border border-border p-6"
              >
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Resumo Geral de Gaps
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Pessoas', 'Performance', 'Ambientação', 'Digital'].map(pillar => {
                    const pillarGaps = analyticsData.gaps[pillar] || [];
                    const totalGaps = pillarGaps.length;
                    const avgGapScore = totalGaps > 0
                      ? Math.round(pillarGaps.reduce((sum, gap) => sum + gap.avgScore, 0) / totalGaps)
                      : 0;

                    return (
                      <div key={pillar} className="bg-secondary/50 rounded-lg p-4 text-center">
                        <div className="text-sm text-muted-foreground mb-1">{pillar}</div>
                        <div className="text-2xl font-bold text-foreground">{totalGaps}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalGaps > 0 && `Média: ${avgGapScore} pts`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Analytics;