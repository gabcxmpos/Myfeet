import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Users, TrendingUp, Sparkles, Smartphone, Award, ArrowUp, ArrowDown, AlertCircle, Shield, Diamond, Frown, Meh, Smile, Laugh, Download, GraduationCap, UserCheck, Building2, Percent, Clock, Calendar, Calculator, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { useToast } from '@/components/ui/use-toast';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';

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

const GapCard = ({ pillar, gaps }) => {
  const MAX_GAPS = 10;
  const displayedGaps = gaps.slice(0, MAX_GAPS);
  const remainingCount = gaps.length - MAX_GAPS;
  
  return (
    <div className="bg-card p-5 rounded-xl border border-border/50 h-full">
      <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
        <AlertCircle className={cn("w-5 h-5", pillarIcons[pillar]?.color)} /> Gaps em {pillar}
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside">
        {gaps.length > 0 ? (
          <>
            {displayedGaps.map((gap, i) => <li key={i}>{gap}</li>)}
            {remainingCount > 0 && (
              <li className="text-primary font-medium">
                +{remainingCount} gap{remainingCount > 1 ? 's' : ''} adicional{remainingCount > 1 ? 'is' : ''}
              </li>
            )}
          </>
        ) : (
          <li>Nenhum gap identificado.</li>
        )}
      </ul>
    </div>
  );
};

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
  const { stores, feedbacks, evaluations, trainings, forms, users, returnsPlanner, returns, fetchData } = useData();
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
  const [periodFilter, setPeriodFilter] = useState({
    startDate: '',
    endDate: ''
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
    // Primeiro filtrar por tipo de loja (própria vs franquia)
    let storesByType = filterStoresByUserType(stores, user?.role, user?.storeId);
    
    // Depois aplicar filtros adicionais
    const filteredStores = storesByType.filter(s => {
      return (filters.store.length === 0 || filters.store.includes(s.id)) &&
             (filters.bandeira.length === 0 || filters.bandeira.includes(s.bandeira)) &&
             (filters.franqueado.length === 0 || filters.franqueado.includes(s.franqueado)) &&
             (filters.supervisor.length === 0 || filters.supervisor.includes(s.supervisor)) &&
             (filters.estado.length === 0 || filters.estado.includes(s.estado));
    });

    const filteredStoreIds = new Set(filteredStores.map(s => s.id));
    let filteredEvaluations = evaluations.filter(e => filteredStoreIds.has(e.storeId));
    let filteredFeedbacks = feedbacks.filter(f => filteredStoreIds.has(f.storeId));
    
    // Aplicar filtro de período nas avaliações
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
    
    // Aplicar filtro de período nos feedbacks
    if (periodFilter.startDate) {
      const start = new Date(periodFilter.startDate);
      start.setHours(0, 0, 0, 0);
      filteredFeedbacks = filteredFeedbacks.filter(f => {
        const feedbackDate = new Date(f.created_at);
        feedbackDate.setHours(0, 0, 0, 0);
        return feedbackDate >= start;
      });
    }
    
    if (periodFilter.endDate) {
      const end = new Date(periodFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filteredFeedbacks = filteredFeedbacks.filter(f => {
        const feedbackDate = new Date(f.created_at);
        feedbackDate.setHours(23, 59, 59, 999);
        return feedbackDate <= end;
      });
    }
    
    return { filteredStores, filteredEvaluations, filteredFeedbacks };
  }, [stores, evaluations, feedbacks, filters, periodFilter, user?.role, user?.storeId]);

  // Função para calcular pontuação de uma pergunta individual
  const calculateQuestionScore = (question, answer) => {
    if (!question || answer === undefined || answer === null) return null;
    
    if (question.type === 'satisfaction') {
      // Satisfação: 0-10, converter para 0-100
      return (answer / 10) * 100;
    } else if (question.type === 'multiple-choice') {
      // Multiple choice: buscar valor da opção selecionada
      const selectedOption = question.options?.find(opt => opt.text === answer);
      if (!selectedOption) return null;
      // Assumir que o valor máximo é 10 (como satisfaction)
      const maxValue = Math.max(...(question.options?.map(o => o.value || 0) || [0]), 10);
      return maxValue > 0 ? (selectedOption.value / maxValue) * 100 : null;
    } else if (question.type === 'checkbox') {
      // Checkbox: somar valores das opções selecionadas
      if (!Array.isArray(answer) || answer.length === 0) return null;
      let totalValue = 0;
      answer.forEach(ans => {
        const option = question.options?.find(opt => opt.text === ans);
        if (option) totalValue += option.value || 0;
      });
      // Calcular máximo possível (soma de todos os valores positivos)
      const maxValue = question.options?.reduce((sum, opt) => sum + Math.max(opt.value || 0, 0), 0) || 1;
      return maxValue > 0 ? (totalValue / maxValue) * 100 : null;
    }
    return null;
  };

  // Função para calcular gaps (apenas títulos principais para Dashboard)
  const calculateGaps = (approvedEvals, formsList, onlyTitles = true) => {
    const gapsByPillar = {
      Pessoas: [],
      Performance: [],
      Ambientação: [],
      Digital: [],
    };

    // Agrupar avaliações por formulário e pilar
    const questionScores = {}; // { pillar: { questionId: { title, subtitle, scores: [] } } }

    approvedEvals.forEach(evaluation => {
      const form = formsList.find(f => f.id === evaluation.formId);
      if (!form || !form.questions) return;

      form.questions.forEach(question => {
        if (question.type === 'text') return; // Ignorar perguntas de texto

        const answer = evaluation.answers?.[question.id];
        const questionScore = calculateQuestionScore(question, answer);
        
        if (questionScore === null) return;

        const pillar = form.pillar || evaluation.pillar;
        if (!gapsByPillar[pillar]) return;

        const questionKey = question.id;
        if (!questionScores[pillar]) questionScores[pillar] = {};
        if (!questionScores[pillar][questionKey]) {
          questionScores[pillar][questionKey] = {
            title: question.text || '',
            subtitle: question.subtitle || '',
            scores: []
          };
        }
        questionScores[pillar][questionKey].scores.push(questionScore);
      });
    });

    // Calcular média de cada pergunta e identificar gaps (score < 70)
    Object.keys(questionScores).forEach(pillar => {
      Object.keys(questionScores[pillar]).forEach(questionKey => {
        const questionData = questionScores[pillar][questionKey];
        const avgScore = questionData.scores.reduce((sum, s) => sum + s, 0) / questionData.scores.length;
        
        if (avgScore < 70) {
          // Adicionar apenas título principal para Dashboard
          if (onlyTitles) {
            if (!gapsByPillar[pillar].includes(questionData.title)) {
              gapsByPillar[pillar].push(questionData.title);
            }
          } else {
            // Para Analytics: adicionar objeto completo com análises
            gapsByPillar[pillar].push({
              title: questionData.title,
              subtitle: questionData.subtitle,
              avgScore: Math.round(avgScore),
              totalAnswers: questionData.scores.length,
              scores: questionData.scores
            });
          }
        }
      });
    });

    return gapsByPillar;
  };

  const dashboardData = useMemo(() => {
    const { filteredStores, filteredEvaluations, filteredFeedbacks } = filteredData;
    
    const isLoja = user.role === 'loja' || user.role === 'loja_franquia' || user.role === 'admin_loja';
    
    const relevantFeedbacks = isLoja ? feedbacks.filter(fb => fb.storeId === user.storeId) : filteredFeedbacks;
    const feedbackSummary = relevantFeedbacks.reduce((acc, fb) => {
        acc[fb.satisfaction] = (acc[fb.satisfaction] || 0) + 1;
        if(fb.isPromotionCandidate) {
            acc.highlights = (acc.highlights || 0) + 1;
        }
        return acc;
    }, {});


    // Filtrar apenas avaliações aprovadas
    // Para loja, garantir que só veja avaliações da própria loja
    let approvedEvaluations = filteredEvaluations.filter(e => e.status === 'approved');
    if (isLoja) {
      approvedEvaluations = approvedEvaluations.filter(e => e.storeId === user.storeId);
    }
    
    // Calcular pontuação geral e por pilares baseado em avaliações aprovadas
    const pillars = ['Pessoas', 'Performance', 'Ambientação', 'Digital'];
    
    // Calcular pontuação por pilar
    const pillarScores = {};
    pillars.forEach(pillar => {
      if (pillar === 'Performance') {
        // Para o pilar Performance, calcular baseado em resultados vs metas
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
            // Normalizar pelo peso total (caso os pesos não somem 100%)
            // storeScore já está em 0-100 (porque achievement é 0-100 e weight/100 é 0-1)
            // storeWeight é a soma dos pesos em decimal (0-1)
            // Então storeScore/storeWeight já dá o score normalizado em 0-100
            const normalizedScore = storeScore / storeWeight;
            totalWeightedScore += normalizedScore;
            totalWeight += 1;
            storesWithData++;
          }
        });
        
        // Calcular média ponderada entre todas as lojas
        pillarScores[pillar] = storesWithData > 0 && totalWeight > 0 
          ? Math.round(totalWeightedScore / storesWithData)
          : 0;
      } else {
        // Para outros pilares, usar média de avaliações aprovadas
        const pillarEvals = approvedEvaluations.filter(e => e.pillar === pillar);
        if (pillarEvals.length > 0) {
          // Validar scores antes de calcular média
          const validScores = pillarEvals
            .map(e => e.score)
            .filter(score => score !== null && score !== undefined && !isNaN(score) && score >= 0 && score <= 100);
          
          if (validScores.length > 0) {
            const avgScore = validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length;
            pillarScores[pillar] = Math.round(avgScore);
            
            // Log para debug se houver scores inválidos
            if (validScores.length < pillarEvals.length) {
              console.warn(`⚠️ [Dashboard] Pilar ${pillar}: ${pillarEvals.length - validScores.length} avaliação(ões) com score inválido foram ignoradas`);
            }
          } else {
            pillarScores[pillar] = 0;
            console.warn(`⚠️ [Dashboard] Pilar ${pillar}: Nenhuma avaliação válida encontrada`);
          }
        } else {
          pillarScores[pillar] = 0;
        }
      }
    });
    
    // Calcular pontuação geral (média dos 4 pilares)
    const overallScore = pillars.length > 0
      ? Math.round(pillars.reduce((sum, pillar) => sum + (pillarScores[pillar] || 0), 0) / pillars.length)
      : 0;

    if (isLoja) {
        // Logic for single store view - usar apenas avaliações aprovadas da loja
        const storeEvaluations = approvedEvaluations.filter(e => e.storeId === user.storeId);
        
        const storePillarScores = {};
        const currentStore = stores.find(s => s.id === user.storeId);
        
        pillars.forEach(pillar => {
          if (pillar === 'Performance') {
            // Para o pilar Performance, calcular baseado em resultados vs metas da loja
            const performanceKPIs = ['faturamento', 'pa', 'ticketMedio', 'prateleiraInfinita', 'conversao'];
            let totalWeightedScore = 0;
            let totalWeight = 0;
            
            if (currentStore) {
              // Determinar o mês baseado no filtro de data
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
              const storeGoals = currentStore.goals || {};
              const goals = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
                ? (storeGoals[targetMonth] || {})
                : (storeGoals || {});
              
              // Buscar resultados usando JSONB (store_results[targetMonth])
              const storeResults = currentStore.store_results || {};
              const results = typeof storeResults === 'object' && !Array.isArray(storeResults)
                ? (storeResults[targetMonth] || {})
                : {};
              
              // Buscar pesos usando JSONB (weights[targetMonth])
              const storeWeights = currentStore.weights || {};
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
                  totalWeightedScore += achievement * (weight / 100);
                  totalWeight += weight / 100;
                }
              });
            }
            
            // Calcular score final (normalizado se os pesos não somarem 100%)
            // totalWeightedScore já está em 0-100 (porque achievement é 0-100 e weight/100 é 0-1)
            // totalWeight é a soma dos pesos em decimal (0-1)
            // Então totalWeightedScore/totalWeight já dá o score normalizado em 0-100
            storePillarScores[pillar] = totalWeight > 0 
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
                storePillarScores[pillar] = Math.round(
                  validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
                );
              } else {
                storePillarScores[pillar] = 0;
              }
            } else {
              storePillarScores[pillar] = 0;
            }
          }
        });
        
        // Calcular pontuação geral da loja (média dos 4 pilares)
        const storeOverallScore = pillars.length > 0
          ? Math.round(pillars.reduce((sum, pillar) => sum + (storePillarScores[pillar] || 0), 0) / pillars.length)
          : 0;
        
        // Calcular gaps para loja (apenas títulos principais)
        const storeGaps = calculateGaps(storeEvaluations, forms, true);
        
        return {
            overallScore: storeOverallScore,
            pillars: pillars.map(pillar => ({
              name: pillar,
              score: storePillarScores[pillar] || 0,
            })),
            gaps: storeGaps,
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

    // Calcular gaps para admin/supervisor (apenas títulos principais)
    const adminGaps = calculateGaps(approvedEvaluations, forms, true);

    return {
        overallScore,
        overallTrend: null, // Removido trend mockado - pode ser implementado no futuro com histórico
        pillars: pillars.map(pillar => ({
          name: pillar,
          score: pillarScores[pillar] || 0,
          trend: null, // Removido trend mockado - pode ser implementado no futuro com histórico
        })),
        gaps: adminGaps,
        supervisorAnalysis,
        feedbackSummary,
    };
  }, [user, filteredData, feedbacks, forms]);

  // Calcular produtividade por perfil
  const productivityByRole = useMemo(() => {
    const roleStats = {};
    
    // Inicializar todos os perfis conhecidos
    const knownRoles = ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'admin_loja', 'devoluções', 'comunicação', 'colaborador'];
    knownRoles.forEach(role => {
      roleStats[role] = {
        role,
        evaluations: 0,
        feedbacks: 0,
        returns: 0,
        returnsPlanner: 0,
        total: 0
      };
    });

    // Contar avaliações por perfil
    const { filteredEvaluations } = filteredData;
    filteredEvaluations.forEach(evaluation => {
      if (evaluation.created_by) {
        const creator = users?.find(u => u.id === evaluation.created_by);
        if (creator && creator.role) {
          const role = creator.role;
          if (!roleStats[role]) {
            roleStats[role] = {
              role,
              evaluations: 0,
              feedbacks: 0,
              returns: 0,
              returnsPlanner: 0,
              total: 0
            };
          }
          roleStats[role].evaluations++;
          roleStats[role].total++;
        }
      }
    });

    // Contar feedbacks por perfil (filtrar por período)
    let filteredFeedbacks = feedbacks || [];
    if (periodFilter.startDate) {
      const start = new Date(periodFilter.startDate);
      start.setHours(0, 0, 0, 0);
      filteredFeedbacks = filteredFeedbacks.filter(f => {
        const feedbackDate = new Date(f.created_at);
        feedbackDate.setHours(0, 0, 0, 0);
        return feedbackDate >= start;
      });
    }
    if (periodFilter.endDate) {
      const end = new Date(periodFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filteredFeedbacks = filteredFeedbacks.filter(f => {
        const feedbackDate = new Date(f.created_at);
        feedbackDate.setHours(23, 59, 59, 999);
        return feedbackDate <= end;
      });
    }

    filteredFeedbacks.forEach(feedback => {
      if (feedback.created_by) {
        const creator = users?.find(u => u.id === feedback.created_by);
        if (creator && creator.role) {
          const role = creator.role;
          if (!roleStats[role]) {
            roleStats[role] = {
              role,
              evaluations: 0,
              feedbacks: 0,
              returns: 0,
              returnsPlanner: 0,
              total: 0
            };
          }
          roleStats[role].feedbacks++;
          roleStats[role].total++;
        }
      }
    });

    // Contar devoluções por perfil
    if (returns && returns.length > 0) {
      let filteredReturns = returns;
      if (periodFilter.startDate) {
        const start = new Date(periodFilter.startDate);
        start.setHours(0, 0, 0, 0);
        filteredReturns = filteredReturns.filter(r => {
          const returnDate = new Date(r.created_at || r.date);
          returnDate.setHours(0, 0, 0, 0);
          return returnDate >= start;
        });
      }
      if (periodFilter.endDate) {
        const end = new Date(periodFilter.endDate);
        end.setHours(23, 59, 59, 999);
        filteredReturns = filteredReturns.filter(r => {
          const returnDate = new Date(r.created_at || r.date);
          returnDate.setHours(23, 59, 59, 999);
          return returnDate <= end;
        });
      }

      filteredReturns.forEach(ret => {
        if (ret.created_by) {
          const creator = users?.find(u => u.id === ret.created_by);
          if (creator && creator.role) {
            const role = creator.role;
            if (!roleStats[role]) {
              roleStats[role] = {
                role,
                evaluations: 0,
                feedbacks: 0,
                returns: 0,
                returnsPlanner: 0,
                total: 0
              };
            }
            roleStats[role].returns++;
            roleStats[role].total++;
          }
        }
      });
    }

    // Contar planner de devoluções por perfil
    if (returnsPlanner && returnsPlanner.length > 0) {
      let filteredPlanner = returnsPlanner;
      if (periodFilter.startDate) {
        const start = new Date(periodFilter.startDate);
        start.setHours(0, 0, 0, 0);
        filteredPlanner = filteredPlanner.filter(r => {
          const plannerDate = new Date(r.created_at || r.opening_date);
          plannerDate.setHours(0, 0, 0, 0);
          return plannerDate >= start;
        });
      }
      if (periodFilter.endDate) {
        const end = new Date(periodFilter.endDate);
        end.setHours(23, 59, 59, 999);
        filteredPlanner = filteredPlanner.filter(r => {
          const plannerDate = new Date(r.created_at || r.opening_date);
          plannerDate.setHours(23, 59, 59, 999);
          return plannerDate <= end;
        });
      }

      filteredPlanner.forEach(planner => {
        if (planner.created_by) {
          const creator = users?.find(u => u.id === planner.created_by);
          if (creator && creator.role) {
            const role = creator.role;
            if (!roleStats[role]) {
              roleStats[role] = {
                role,
                evaluations: 0,
                feedbacks: 0,
                returns: 0,
                returnsPlanner: 0,
                total: 0
              };
            }
            roleStats[role].returnsPlanner++;
            roleStats[role].total++;
          }
        }
      });
    }

    // Converter para array e filtrar apenas perfis com atividade
    return Object.values(roleStats)
      .filter(stat => stat.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [evaluations, feedbacks, returns, returnsPlanner, users, filteredData, periodFilter]);

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada. Mas não se preocupe, você pode solicitá-la no próximo prompt! 🚀',
    });
  };

  if (user.role === 'loja' || user.role === 'loja_franquia' || user.role === 'admin_loja') {
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
        
        { (user.role === 'admin' || user.role === 'comunicação') && (
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

        {/* Produtividade por Perfil */}
        { (user.role === 'admin' || user.role === 'supervisor' || user.role === 'supervisor_franquia') && productivityByRole.length > 0 && (
          <div className="bg-card rounded-xl shadow-lg border border-border/50 overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="text-primary"/>Produtividade por Perfil
              </h2>
              <p className="text-sm text-muted-foreground">Registros criados por perfil de usuário no período selecionado.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase">
                  <tr className="border-t border-border/50">
                    <th scope="col" className="p-4 text-left font-medium">Perfil</th>
                    <th scope="col" className="p-4 text-center font-medium">Avaliações</th>
                    <th scope="col" className="p-4 text-center font-medium">Feedbacks</th>
                    <th scope="col" className="p-4 text-center font-medium">Devoluções</th>
                    <th scope="col" className="p-4 text-center font-medium">Planner</th>
                    <th scope="col" className="p-4 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityByRole.map(stat => {
                    const roleLabels = {
                      'admin': 'Administrador',
                      'supervisor': 'Supervisor',
                      'supervisor_franquia': 'Supervisor Franquia',
                      'loja': 'Loja',
                      'loja_franquia': 'Loja Franquia',
                      'admin_loja': 'Admin Loja',
                      'devoluções': 'Devoluções',
                      'comunicação': 'Comunicação',
                      'colaborador': 'Colaborador'
                    };
                    return (
                      <tr key={stat.role} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="p-4 font-medium">{roleLabels[stat.role] || stat.role}</td>
                        <td className="p-4 text-center text-muted-foreground">{stat.evaluations}</td>
                        <td className="p-4 text-center text-muted-foreground">{stat.feedbacks}</td>
                        <td className="p-4 text-center text-muted-foreground">{stat.returns}</td>
                        <td className="p-4 text-center text-muted-foreground">{stat.returnsPlanner}</td>
                        <td className="p-4 text-right font-bold text-foreground">{stat.total}</td>
                      </tr>
                    );
                  })}
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