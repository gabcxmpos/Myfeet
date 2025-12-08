import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Percent, Hash, Truck, BarChart, Save, TrendingUp, TrendingDown, Target, Users, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { format } from 'date-fns';

const StoreResults = () => {
  const { user } = useAuth();
  const { stores, collaborators, updateStore, fetchData } = useData();
  const { toast } = useToast();
  
  const currentStore = useMemo(() => {
    return stores.find(s => s.id === user?.storeId);
  }, [stores, user?.storeId]);
  
  const [resultMonth, setResultMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Refresh automático otimizado
  useOptimizedRefresh(fetchData);
  
  // Forçar recarregamento dos dados quando voltar para a aba ou quando a página carregar
  useEffect(() => {
    // Sempre recarregar dados quando o componente montar ou quando currentStore mudar
    if (currentStore) {
      console.log('🔄 [StoreResults] Recarregando dados do servidor ao montar/atualizar componente');
      fetchData().then(() => {
        console.log('✅ [StoreResults] Dados recarregados do servidor');
      }).catch(err => {
        console.error('❌ [StoreResults] Erro ao recarregar dados:', err);
      });
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        console.log('👁️ [StoreResults] Aba voltou ao foco - recarregando dados do servidor');
        // Forçar recarregamento dos dados do servidor
        fetchData().then(() => {
          console.log('✅ [StoreResults] Dados recarregados após voltar para a aba');
        }).catch(err => {
          console.error('❌ [StoreResults] Erro ao recarregar dados:', err);
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentStore?.id]); // Recarregar quando a loja mudar

  // Buscar metas do mês selecionado usando JSONB (goals[resultMonth])
  const goals = useMemo(() => {
    if (!currentStore) return {};
    const storeGoals = currentStore.goals || {};
    // Se goals é um objeto JSONB, buscar pelo mês
    if (typeof storeGoals === 'object' && !Array.isArray(storeGoals)) {
      return storeGoals[resultMonth] || {};
    }
    // Fallback para formato antigo (se existir)
    return storeGoals || {};
  }, [currentStore, resultMonth]);

  // Buscar resultados do mês selecionado
  const [storeResults, setStoreResults] = useState({
    conversao: 0,
    pa: 0,
    faturamento: 0,
    prateleiraInfinita: 0,
    ticketMedio: 0
  });

  // Buscar resultados individuais dos colaboradores
  const [collaboratorResults, setCollaboratorResults] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastLoadedMonth, setLastLoadedMonth] = useState(null);
  const [lastLoadedStoreId, setLastLoadedStoreId] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  // Carregar dados quando o mês ou store mudar (mas não quando o usuário está editando ou acabou de salvar)
  useEffect(() => {
    if (!currentStore) {
      console.log('⏸️ [StoreResults] Aguardando currentStore...');
      return;
    }
    
    // Verificar se mudou o mês ou a loja (ou se é a primeira vez carregando)
    const isFirstLoad = lastLoadedMonth === null && lastLoadedStoreId === null;
    const monthOrStoreChanged = isFirstLoad || lastLoadedMonth !== resultMonth || lastLoadedStoreId !== currentStore.id;
    
    console.log('🔍 [StoreResults] Verificando carregamento:', {
      isFirstLoad,
      monthOrStoreChanged,
      lastLoadedMonth,
      resultMonth,
      lastLoadedStoreId,
      currentStoreId: currentStore.id,
      justSaved,
      isEditing,
      hasStoreResults: !!currentStore.store_results,
      hasCollaboratorResults: !!currentStore.collaborator_results,
      storeResultsValue: currentStore.store_results,
      collaboratorResultsValue: currentStore.collaborator_results
    });
    
    // Se acabou de salvar recentemente e não mudou mês/loja, não resetar
    if (justSaved && !monthOrStoreChanged) {
      console.log('⏸️ [StoreResults] Ignorando atualização - acabou de salvar');
      return;
    }
    
    // Se o usuário está editando e não mudou o mês ou a loja, não resetar
    if (isEditing && !monthOrStoreChanged) {
      console.log('⏸️ [StoreResults] Ignorando atualização - usuário está editando');
      return;
    }
    
    // SEMPRE carregar dados do servidor quando mudar mês/loja OU na primeira carga
    // Isso garante que os dados salvos sejam sempre exibidos
    if (monthOrStoreChanged) {
      // IMPORTANTE: Sempre usar os dados mais recentes do currentStore (que vem do contexto atualizado)
      // Carregar resultados gerais da loja (usando JSONB store_results)
      const storeResultsData = currentStore.store_results || {};
      const monthResults = storeResultsData[resultMonth] || {};
      
      const newStoreResults = {
        conversao: monthResults.conversao ?? 0,
        pa: monthResults.pa ?? 0,
        faturamento: monthResults.faturamento ?? 0,
        prateleiraInfinita: monthResults.prateleiraInfinita ?? 0,
        ticketMedio: monthResults.ticketMedio ?? 0
      };
      
      console.log('📥 [StoreResults] Carregando dados do servidor:', {
        month: resultMonth,
        storeResultsData,
        monthResults,
        newStoreResults,
        storeResultsKeys: Object.keys(storeResultsData),
        isEmpty: Object.keys(monthResults).length === 0,
        currentStoreId: currentStore.id,
        currentStoreName: currentStore.name
      });
      
      // IMPORTANTE: Sempre atualizar quando mudar mês/loja OU na primeira carga
      // Isso garante que dados salvos sejam sempre exibidos quando disponíveis
      console.log('📥 [StoreResults] Atualizando storeResults do servidor:', { isFirstLoad, monthOrStoreChanged, newStoreResults });
      setStoreResults(newStoreResults);

      // Carregar resultados individuais dos colaboradores (usando JSONB collaborator_results)
      const collaboratorResultsData = currentStore.collaborator_results || {};
      const individualResults = collaboratorResultsData[resultMonth] || {};
      
      console.log('📥 [StoreResults] Carregando collaboratorResults do servidor:', {
        month: resultMonth,
        collaboratorResultsData,
        individualResults,
        collaboratorResultsKeys: Object.keys(collaboratorResultsData),
        isEmpty: Object.keys(individualResults).length === 0
      });
      
      // IMPORTANTE: Sempre atualizar quando mudar mês/loja OU na primeira carga
      console.log('📥 [StoreResults] Atualizando collaboratorResults do servidor:', { isFirstLoad, monthOrStoreChanged });
      setCollaboratorResults(individualResults);
      
      // Atualizar flags de controle APENAS após carregar os dados
      // Isso evita loops infinitos
      setLastLoadedMonth(resultMonth);
      setLastLoadedStoreId(currentStore.id);
    }

    // Verificar se está bloqueado (usando JSONB results_locks)
    const resultsLocks = currentStore.results_locks || {};
    setIsLocked(resultsLocks[resultMonth] === true);
  }, [currentStore, resultMonth, lastLoadedMonth, lastLoadedStoreId, justSaved, isEditing]); // Incluir todas as dependências relevantes

  // Colaboradores da loja
  const storeCollaborators = useMemo(() => {
    if (!collaborators) return [];
    return collaborators.filter(c => 
      (c.storeId === user?.storeId || c.store_id === user?.storeId) && 
      (c.status === 'ativo' || !c.status)
    );
  }, [collaborators, user?.storeId]);

  // Calcular faturamento total automaticamente (soma dos colaboradores)
  const calculatedFaturamento = useMemo(() => {
    return Object.values(collaboratorResults).reduce((sum, result) => {
      return sum + (parseFloat(result?.faturamento) || 0);
    }, 0);
  }, [collaboratorResults]);

  // Calcular prateleira total automaticamente (soma dos colaboradores)
  const calculatedPrateleira = useMemo(() => {
    return Object.values(collaboratorResults).reduce((sum, result) => {
      return sum + (parseFloat(result?.prateleiraInfinita) || 0);
    }, 0);
  }, [collaboratorResults]);

  // Calcular ticket médio automaticamente (APENAS faturamento / número de vendas)
  // IMPORTANTE: Prateleira infinita (plataforma digital) NÃO entra no cálculo do ticket médio
  const calculatedTicketMedio = useMemo(() => {
    // Usar APENAS faturamento (não incluir prateleira infinita)
    const totalFaturamento = calculatedFaturamento;
    
    // Calcular total de vendas baseado apenas no faturamento dos colaboradores
    const totalVendas = Object.values(collaboratorResults).reduce((sum, result) => {
      // Se tiver número de vendas, usar diretamente
      if (result?.numeroVendas && parseFloat(result.numeroVendas) > 0) {
        return sum + parseFloat(result.numeroVendas);
      }
      // Se não tiver número de vendas, estimar pelo PA usando APENAS faturamento
      const pa = parseFloat(result?.pa) || 0;
      const faturamento = parseFloat(result?.faturamento) || 0;
      // IMPORTANTE: Usar apenas faturamento, não prateleira
      if (pa > 0 && faturamento > 0) {
        // Estimar número de vendas: faturamento / PA
        return sum + Math.round(faturamento / pa);
      }
      return sum;
    }, 0);
    
    // Ticket médio = faturamento total / número total de vendas
    // Prateleira infinita NÃO entra neste cálculo
    return totalVendas > 0 ? totalFaturamento / totalVendas : 0;
  }, [calculatedFaturamento, collaboratorResults]);

  // Atualizar faturamento, prateleira e ticket médio automaticamente quando colaboradores mudarem
  // IMPORTANTE: Sempre atualizar automaticamente se houver dados de colaboradores
  useEffect(() => {
    // Verificar se há pelo menos um colaborador com dados
    const hasCollaboratorData = Object.values(collaboratorResults).some(
      result => result && (
        (parseFloat(result.faturamento) || 0) > 0 ||
        (parseFloat(result.prateleiraInfinita) || 0) > 0
      )
    );
    
    if (hasCollaboratorData) {
      // Atualizar faturamento se calculado for maior que o atual ou se o atual for 0
      if (calculatedFaturamento > 0 && (storeResults.faturamento === 0 || calculatedFaturamento !== storeResults.faturamento)) {
        console.log('🔄 [StoreResults] Atualizando faturamento automático:', calculatedFaturamento);
        setStoreResults(prev => ({ ...prev, faturamento: calculatedFaturamento }));
      }
      
      // Atualizar prateleira se calculada for maior que a atual ou se a atual for 0
      if (calculatedPrateleira > 0 && (storeResults.prateleiraInfinita === 0 || calculatedPrateleira !== storeResults.prateleiraInfinita)) {
        console.log('🔄 [StoreResults] Atualizando prateleira automática:', calculatedPrateleira);
        setStoreResults(prev => ({ ...prev, prateleiraInfinita: calculatedPrateleira }));
      }
      
      // Atualizar ticket médio se calculado for maior que o atual ou se o atual for 0
      if (calculatedTicketMedio > 0 && (storeResults.ticketMedio === 0 || Math.abs(calculatedTicketMedio - storeResults.ticketMedio) > 0.01)) {
        console.log('🔄 [StoreResults] Atualizando ticket médio automático:', calculatedTicketMedio);
        setStoreResults(prev => ({ ...prev, ticketMedio: calculatedTicketMedio }));
      }
    }
  }, [calculatedFaturamento, calculatedPrateleira, calculatedTicketMedio, collaboratorResults, storeResults.faturamento, storeResults.prateleiraInfinita, storeResults.ticketMedio]);

  const handleStoreResultChange = (field, value) => {
    if (isLocked) return;
    setIsEditing(true);
    setStoreResults(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCollaboratorResultChange = (collaboratorId, field, value) => {
    if (isLocked) return;
    setIsEditing(true);
    const newValue = parseFloat(value) || 0;
    setCollaboratorResults(prev => {
      const updated = {
        ...prev,
        [collaboratorId]: {
          ...prev[collaboratorId],
          [field]: newValue
        }
      };
      
      // Se mudou faturamento ou prateleira, recalcular totais automaticamente
      if (field === 'faturamento' || field === 'prateleiraInfinita') {
        const newFaturamento = Object.values(updated).reduce((sum, result) => {
          return sum + (parseFloat(result?.faturamento) || 0);
        }, 0);
        const newPrateleira = Object.values(updated).reduce((sum, result) => {
          return sum + (parseFloat(result?.prateleiraInfinita) || 0);
        }, 0);
        
        // Atualizar totais da loja automaticamente
        setStoreResults(prevStore => ({
          ...prevStore,
          faturamento: newFaturamento,
          prateleiraInfinita: newPrateleira
        }));
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!currentStore) {
      toast({
        title: 'Erro',
        description: 'Loja não encontrada.',
        variant: 'destructive'
      });
      return;
    }

    if (isLocked) {
      toast({
        title: 'Bloqueado',
        description: 'A edição está bloqueada para este período. Entre em contato com o administrador.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Garantir que os valores sejam números válidos
      const sanitizedStoreResults = {
        conversao: parseFloat(storeResults.conversao) || 0,
        pa: parseFloat(storeResults.pa) || 0,
        faturamento: parseFloat(storeResults.faturamento) || 0,
        prateleiraInfinita: parseFloat(storeResults.prateleiraInfinita) || 0,
        ticketMedio: parseFloat(storeResults.ticketMedio) || 0
      };
      
      // Sanitizar resultados dos colaboradores
      const sanitizedCollaboratorResults = {};
      Object.keys(collaboratorResults).forEach(collabId => {
        const collabData = collaboratorResults[collabId];
        if (collabData && (collabData.faturamento || collabData.prateleiraInfinita || collabData.pa || collabData.ticketMedio || collabData.numeroVendas)) {
          const faturamento = parseFloat(collabData.faturamento) || 0;
          const numeroVendas = parseFloat(collabData.numeroVendas) || 0;
          const ticketMedio = collabData.ticketMedio 
            ? parseFloat(collabData.ticketMedio) 
            : (faturamento > 0 && numeroVendas > 0 ? faturamento / numeroVendas : 0);
          
          sanitizedCollaboratorResults[collabId] = {
            faturamento,
            prateleiraInfinita: parseFloat(collabData.prateleiraInfinita) || 0,
            pa: parseFloat(collabData.pa) || 0,
            ticketMedio,
            numeroVendas
          };
        }
      });
      
      // Atualizar store_results usando JSONB
      const currentStoreResults = currentStore.store_results || {};
      const updatedStoreResults = {
        ...currentStoreResults,
        [resultMonth]: sanitizedStoreResults
      };
      
      // Atualizar collaborator_results usando JSONB
      const currentCollaboratorResults = currentStore.collaborator_results || {};
      const updatedCollaboratorResults = {
        ...currentCollaboratorResults,
        [resultMonth]: sanitizedCollaboratorResults
      };
      
      console.log('💾 [StoreResults] Salvando dados:', {
        storeId: currentStore.id,
        month: resultMonth,
        sanitizedStoreResults,
        sanitizedCollaboratorResults,
        updatedStoreResults,
        updatedStoreResultsKeys: Object.keys(updatedStoreResults),
        updatedStoreResultsStringified: JSON.stringify(updatedStoreResults),
        updatedCollaboratorResults,
        updatedCollaboratorResultsKeys: Object.keys(updatedCollaboratorResults),
        updatedCollaboratorResultsStringified: JSON.stringify(updatedCollaboratorResults)
      });
      
      const updatedStore = await updateStore(currentStore.id, {
        store_results: updatedStoreResults,
        collaborator_results: updatedCollaboratorResults
      });

      console.log('✅ [StoreResults] Dados salvos no servidor. Store atualizada:', updatedStore);
      console.log('📊 [StoreResults] Verificando dados salvos no servidor:', {
        store_results: updatedStore?.store_results,
        store_results_type: typeof updatedStore?.store_results,
        store_results_keys: updatedStore?.store_results ? Object.keys(updatedStore.store_results) : [],
        month: resultMonth,
        monthData: updatedStore?.store_results?.[resultMonth],
        monthDataKeys: updatedStore?.store_results?.[resultMonth] ? Object.keys(updatedStore.store_results[resultMonth]) : [],
        collaborator_results: updatedStore?.collaborator_results,
        collaborator_results_keys: updatedStore?.collaborator_results ? Object.keys(updatedStore.collaborator_results) : [],
        collaborator_monthData: updatedStore?.collaborator_results?.[resultMonth],
        collaborator_monthDataKeys: updatedStore?.collaborator_results?.[resultMonth] ? Object.keys(updatedStore.collaborator_results[resultMonth]) : []
      });

      // IMPORTANTE: Usar os dados retornados do servidor (fonte da verdade)
      const serverStoreResults = updatedStore?.store_results?.[resultMonth] || sanitizedStoreResults;
      const serverCollaboratorResults = updatedStore?.collaborator_results?.[resultMonth] || sanitizedCollaboratorResults;

      // Atualizar estado local com os dados confirmados do servidor
      setStoreResults({
        conversao: serverStoreResults.conversao ?? 0,
        pa: serverStoreResults.pa ?? 0,
        faturamento: serverStoreResults.faturamento ?? 0,
        prateleiraInfinita: serverStoreResults.prateleiraInfinita ?? 0,
        ticketMedio: serverStoreResults.ticketMedio ?? 0
      });
      setCollaboratorResults(serverCollaboratorResults);
      
      // IMPORTANTE: Forçar recarregamento completo dos dados do servidor após salvar
      // Isso garante que quando o usuário voltar, os dados estarão atualizados
      console.log('🔄 [StoreResults] Forçando recarregamento completo dos dados após salvamento...');
      fetchData().then(() => {
        console.log('✅ [StoreResults] Dados recarregados do servidor após salvamento');
      }).catch(err => {
        console.error('⚠️ [StoreResults] Erro ao recarregar dados:', err);
      });
      
      // Atualizar lastLoadedMonth e lastLoadedStoreId para evitar reset
      setLastLoadedMonth(resultMonth);
      setLastLoadedStoreId(currentStore.id);
      
      // Marcar que acabou de salvar e não está mais editando
      setJustSaved(true);
      setIsEditing(false);

      toast({
        title: 'Sucesso!',
        description: 'Resultados salvos com sucesso no servidor. Os dados estão persistidos e serão mantidos após sair do sistema.'
      });

      // Resetar flag após um tempo maior
      setTimeout(() => {
        setJustSaved(false);
        console.log('✅ [StoreResults] Flag justSaved resetada - atualizações permitidas novamente');
      }, 5000);
    } catch (error) {
      console.error('❌ [StoreResults] Erro completo ao salvar:', error);
      console.error('❌ [StoreResults] Código do erro:', error.code);
      console.error('❌ [StoreResults] Mensagem:', error.message);
      console.error('❌ [StoreResults] Detalhes:', JSON.stringify(error, null, 2));
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao salvar resultados.';
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage = 'Erro de permissão: Você não tem permissão para salvar resultados. Verifique as políticas RLS no Supabase.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao Salvar',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Função para calcular porcentagem de atingimento da meta
  const getGoalPercentage = (result, goal) => {
    if (!goal || goal === 0) return null;
    return ((result / goal) * 100).toFixed(1);
  };

  // Função para obter cor baseada no desempenho
  const getPerformanceColor = (percentage) => {
    if (!percentage) return 'text-muted-foreground';
    const perc = parseFloat(percentage);
    if (perc >= 100) return 'text-green-400';
    if (perc >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const metricFields = [
    { name: 'conversao', label: 'Taxa de Conversão (%)', icon: Percent, placeholder: 'Ex: 15' },
    { name: 'pa', label: 'P.A.', icon: Hash, placeholder: 'Ex: 2.8' },
    { name: 'faturamento', label: 'Faturamento', icon: DollarSign, placeholder: 'Ex: 150000', autoCalculated: true },
    { name: 'prateleiraInfinita', label: 'Prateleira Infinita', icon: Truck, placeholder: 'Ex: 15000', autoCalculated: true },
    { name: 'ticketMedio', label: 'Ticket Médio', icon: BarChart, placeholder: 'Ex: 250.50' }
  ];

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loja não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Resultados - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resultados da Loja</h1>
            <p className="text-muted-foreground mt-1">
              {currentStore.name} - {currentStore.code}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLocked && (
              <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-500/50 px-3 py-2 rounded-lg">
                <Lock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-200">Edição bloqueada</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
              <Label htmlFor="resultMonth" className="text-sm text-muted-foreground whitespace-nowrap">Período:</Label>
              <Input
                id="resultMonth"
                type="month"
                value={resultMonth}
                min="2020-01"
                onChange={(e) => {
                  setIsEditing(false); // Permitir recarregar ao mudar o mês
                  setResultMonth(e.target.value);
                }}
                className="w-36 bg-background border-0 h-9 text-sm font-medium"
              />
            </div>
            <Button onClick={handleSave} className="gap-2 h-9">
              <Save className="w-4 h-4" /> Salvar Resultados
            </Button>
          </div>
        </div>

        {/* Métricas Gerais da Loja - 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Métricas Principais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Resultado Geral da Loja</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {metricFields.map((field) => {
                const result = storeResults[field.name] || 0;
                const goal = goals[field.name] || 0;
                const percentage = getGoalPercentage(result, goal);
                
                return (
                  <div key={field.name} className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <Label htmlFor={field.name} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground flex-1 min-w-0">
                        <field.icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{field.label}</span>
                        {field.autoCalculated && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">(auto)</span>
                        )}
                      </Label>
                      {goal > 0 && percentage && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className={cn("text-xs font-semibold whitespace-nowrap", getPerformanceColor(percentage))}>
                            {percentage}%
                          </span>
                          {parseFloat(percentage) >= 100 ? (
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Input
                        id={field.name}
                        type="number"
                        step="any"
                        value={field.autoCalculated ? (field.name === 'faturamento' ? calculatedFaturamento : calculatedPrateleira) : (storeResults[field.name] || '')}
                        onChange={(e) => !field.autoCalculated && handleStoreResultChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="h-9 sm:h-10 text-sm bg-secondary/30 border-border/50 flex-1 min-w-[120px]"
                        disabled={field.autoCalculated || isLocked}
                      />
                      {goal > 0 && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          Meta: {field.name === 'faturamento' || field.name === 'prateleiraInfinita' || field.name === 'ticketMedio' 
                            ? `R$ ${goal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : field.name === 'conversao' 
                            ? `${goal}%`
                            : goal.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Card 2: Comparação com Metas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Comparação com Metas</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {metricFields.map((field) => {
                const result = storeResults[field.name] || 0;
                const goal = goals[field.name] || 0;
                const percentage = getGoalPercentage(result, goal);
                
                if (!goal || goal === 0) {
                  return (
                    <div key={field.name} className="text-xs sm:text-sm text-muted-foreground">
                      {field.label}: Meta não definida
                    </div>
                  );
                }

                return (
                  <div key={field.name} className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs sm:text-sm font-medium text-foreground truncate flex-1">{field.label}</span>
                      <span className={cn("text-xs sm:text-sm font-bold whitespace-nowrap", getPerformanceColor(percentage))}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          parseFloat(percentage) >= 100 ? 'bg-green-500' : parseFloat(percentage) >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(parseFloat(percentage) || 0, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground flex-wrap gap-1">
                      <span className="truncate">Resultado: {field.name === 'faturamento' || field.name === 'prateleiraInfinita' || field.name === 'ticketMedio' 
                        ? `R$ ${result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : field.name === 'conversao' 
                        ? `${result}%`
                        : result.toFixed(2)}</span>
                      <span className="whitespace-nowrap">Meta: {field.name === 'faturamento' || field.name === 'prateleiraInfinita' || field.name === 'ticketMedio' 
                        ? `R$ ${goal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : field.name === 'conversao' 
                        ? `${goal}%`
                        : goal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Dashboard de Resultados dos Colaboradores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border/50 shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Dashboard de Resultados dos Colaboradores</h2>
          </div>
          {storeCollaborators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {storeCollaborators.map((collaborator) => {
                const collabResults = collaboratorResults[collaborator.id] || {};
                const faturamento = parseFloat(collabResults.faturamento) || 0;
                const prateleira = parseFloat(collabResults.prateleiraInfinita) || 0;
                const pa = parseFloat(collabResults.pa) || 0;
                const ticketMedio = parseFloat(collabResults.ticketMedio) || 0;
                
                // Calcular participação em relação às metas da loja (apenas para Faturamento e Prateleira)
                // P.A. e Ticket Médio são individuais, não comparam com meta da loja
                const goalFaturamento = goals.faturamento || 0;
                const goalPrateleira = goals.prateleiraInfinita || 0;
                
                const participacaoFaturamento = goalFaturamento > 0 
                  ? ((faturamento / goalFaturamento) * 100).toFixed(1) 
                  : '0.0';
                const participacaoPrateleira = goalPrateleira > 0 
                  ? ((prateleira / goalPrateleira) * 100).toFixed(1) 
                  : '0.0';
                
                const getParticipacaoColor = (perc) => {
                  const p = parseFloat(perc);
                  if (p >= 100) return 'text-green-400';
                  if (p >= 80) return 'text-yellow-400';
                  return 'text-red-400';
                };
                
                return (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-secondary/30 rounded-xl p-4 border border-border/30"
                  >
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {collaborator.name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Faturamento:</span>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-foreground">
                            R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={cn("text-xs", getParticipacaoColor(participacaoFaturamento))}>
                            {participacaoFaturamento}% da meta
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Prateleira:</span>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-foreground">
                            R$ {prateleira.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className={cn("text-xs", getParticipacaoColor(participacaoPrateleira))}>
                            {participacaoPrateleira}% da meta
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">P.A.:</span>
                        <span className="font-semibold text-foreground">{pa.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ticket Médio:</span>
                        <span className="font-semibold text-foreground">
                          R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 mb-6">
              Nenhum colaborador cadastrado para esta loja.
            </p>
          )}
        </motion.div>

        {/* Resultados Individuais dos Colaboradores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Preenchimento Individual por Colaborador</h2>
          </div>

          {storeCollaborators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum colaborador cadastrado para esta loja.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {storeCollaborators.map((collaborator) => {
                const collabResults = collaboratorResults[collaborator.id] || {};
                
                return (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-secondary/30 rounded-xl p-4 border border-border/30"
                  >
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {collaborator.name}
                      {collaborator.role && (
                        <span className="text-xs text-muted-foreground font-normal">({collaborator.role})</span>
                      )}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3" /> Faturamento Individual
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={collabResults.faturamento || ''}
                          onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'faturamento', e.target.value)}
                          placeholder="Ex: 50000"
                          className="h-9 text-sm"
                          disabled={isLocked}
                        />
                        {collabResults.faturamento > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Alimenta total da loja automaticamente
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Truck className="w-3 h-3" /> Prateleira Individual
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={collabResults.prateleiraInfinita || ''}
                          onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'prateleiraInfinita', e.target.value)}
                          placeholder="Ex: 5000"
                          className="h-9 text-sm"
                          disabled={isLocked}
                        />
                        {collabResults.prateleiraInfinita > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Alimenta total da loja automaticamente
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Hash className="w-3 h-3" /> P.A. Individual
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={collabResults.pa || ''}
                          onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'pa', e.target.value)}
                          placeholder="Ex: 2.5"
                          className="h-9 text-sm"
                          disabled={isLocked}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <BarChart className="w-3 h-3" /> Número de Vendas
                        </Label>
                        <Input
                          type="number"
                          step="1"
                          value={collabResults.numeroVendas || ''}
                          onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'numeroVendas', e.target.value)}
                          placeholder="Ex: 150"
                          className="h-9 text-sm"
                          disabled={isLocked}
                        />
                        <p className="text-xs text-muted-foreground">
                          Usado para calcular ticket médio
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <BarChart className="w-3 h-3" /> Ticket Médio Individual
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={collabResults.ticketMedio || (collabResults.faturamento && collabResults.numeroVendas ? (collabResults.faturamento / collabResults.numeroVendas).toFixed(2) : '') || ''}
                          onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'ticketMedio', e.target.value)}
                          placeholder="Auto-calculado"
                          className="h-9 text-sm"
                          disabled={isLocked || (collabResults.faturamento && collabResults.numeroVendas)}
                        />
                        {collabResults.faturamento && collabResults.numeroVendas && (
                          <p className="text-xs text-green-400">
                            Auto: R$ {(collabResults.faturamento / collabResults.numeroVendas).toFixed(2)}
                            <span className="text-muted-foreground ml-1">(apenas faturamento)</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculado apenas com faturamento (prateleira não entra)
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default StoreResults;

