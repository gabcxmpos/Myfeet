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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Percent, Hash, Truck, BarChart, Save, Lock, Unlock, Store, Users, TrendingUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import * as api from '@/lib/supabaseService';

const ResultsManagement = () => {
  const { user } = useAuth();
  const { stores, collaborators, updateStore, fetchData } = useData();
  const { toast } = useToast();
  
  const [resultMonth, setResultMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [filters, setFilters] = useState({
    store: [],
    bandeira: [],
    franqueado: [],
    supervisor: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingStore, setEditingStore] = useState(null);
  const [storeResults, setStoreResults] = useState({});
  const [collaboratorResults, setCollaboratorResults] = useState({});
  const [isLocked, setIsLocked] = useState(false);

  // Refresh automático otimizado
  useOptimizedRefresh(fetchData);

  // Filtrar lojas por tipo de usuário
  const filteredStoresByType = useMemo(() => {
    return filterStoresByUserType(stores, user?.role, user?.storeId);
  }, [stores, user?.role, user?.storeId]);

  // Aplicar filtros adicionais
  const filteredStores = useMemo(() => {
    return filteredStoresByType.filter(store => {
      const matchesStore = filters.store.length === 0 || filters.store.includes(store.id);
      const matchesBandeira = filters.bandeira.length === 0 || filters.bandeira.includes(store.bandeira);
      const matchesFranqueado = filters.franqueado.length === 0 || filters.franqueado.includes(store.franqueado);
      const matchesSupervisor = filters.supervisor.length === 0 || filters.supervisor.includes(store.supervisor);
      const matchesSearch = !searchTerm || 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStore && matchesBandeira && matchesFranqueado && matchesSupervisor && matchesSearch;
    });
  }, [filteredStoresByType, filters, searchTerm]);

  // Opções de filtro
  const filterOptions = useMemo(() => {
    return {
      stores: filteredStoresByType.map(s => ({ value: s.id, label: s.name })),
      bandeiras: [...new Set(filteredStoresByType.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      franqueados: [...new Set(filteredStoresByType.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      supervisors: [...new Set(filteredStoresByType.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s }))
    };
  }, [filteredStoresByType]);

  // Carregar estado de bloqueio do mês (usando JSONB results_locks)
  useEffect(() => {
    if (!stores.length) return;
    
    // Verificar bloqueio global no primeiro store (todos compartilham o mesmo lock)
    const firstStore = stores[0];
    const resultsLocks = firstStore.results_locks || {};
    setIsLocked(resultsLocks[resultMonth] === true);
  }, [stores, resultMonth]);

  // Função para carregar dados de uma loja
  const loadStoreData = (store) => {
    if (!store) return;
    
    // Carregar resultados gerais da loja (usando JSONB store_results)
    const storeResultsData = store.store_results || {};
    const monthResults = storeResultsData[resultMonth] || store.results || {};
    setStoreResults({
      conversao: monthResults.conversao || 0,
      pa: monthResults.pa || 0,
      faturamento: monthResults.faturamento || 0,
      prateleiraInfinita: monthResults.prateleiraInfinita || 0,
      ticketMedio: monthResults.ticketMedio || 0
    });

    // Carregar resultados individuais dos colaboradores (usando JSONB collaborator_results)
    const collaboratorResultsData = store.collaborator_results || {};
    const individualResults = collaboratorResultsData[resultMonth] || {};
    setCollaboratorResults(individualResults);
  };

  // Carregar resultados quando selecionar uma loja
  const handleStoreSelect = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    setEditingStore(store);
    loadStoreData(store);
  };

  // Recarregar dados quando o mês mudar e uma loja estiver selecionada
  useEffect(() => {
    if (editingStore && stores.length > 0) {
      const store = stores.find(s => s.id === editingStore.id);
      if (store) {
        loadStoreData(store);
      }
    }
  }, [resultMonth, stores]); // Quando resultMonth ou stores mudarem

  // Colaboradores da loja selecionada
  const storeCollaborators = useMemo(() => {
    if (!editingStore || !collaborators) return [];
    return collaborators.filter(c => 
      (c.storeId === editingStore.id || c.store_id === editingStore.id) && 
      (c.status === 'ativo' || !c.status)
    );
  }, [collaborators, editingStore]);

  // Calcular faturamento e prateleira total automaticamente
  const calculatedFaturamento = useMemo(() => {
    return Object.values(collaboratorResults).reduce((sum, result) => {
      return sum + (parseFloat(result?.faturamento) || 0);
    }, 0);
  }, [collaboratorResults]);

  const calculatedPrateleira = useMemo(() => {
    return Object.values(collaboratorResults).reduce((sum, result) => {
      return sum + (parseFloat(result?.prateleiraInfinita) || 0);
    }, 0);
  }, [collaboratorResults]);

  // Atualizar faturamento e prateleira automaticamente
  useEffect(() => {
    if (calculatedFaturamento > 0) {
      setStoreResults(prev => ({ ...prev, faturamento: calculatedFaturamento }));
    }
  }, [calculatedFaturamento]);

  useEffect(() => {
    if (calculatedPrateleira > 0) {
      setStoreResults(prev => ({ ...prev, prateleiraInfinita: calculatedPrateleira }));
    }
  }, [calculatedPrateleira]);

  const handleStoreResultChange = (field, value) => {
    if (isLocked && user?.role !== 'admin') return;
    setStoreResults(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleCollaboratorResultChange = (collaboratorId, field, value) => {
    if (isLocked && user?.role !== 'admin') return;
    setCollaboratorResults(prev => ({
      ...prev,
      [collaboratorId]: {
        ...prev[collaboratorId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = async () => {
    if (!editingStore) {
      toast({
        title: 'Erro',
        description: 'Selecione uma loja para editar.',
        variant: 'destructive'
      });
      return;
    }

    if (isLocked && user?.role !== 'admin') {
      toast({
        title: 'Bloqueado',
        description: 'A edição está bloqueada para este período.',
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
        if (collabData && (collabData.faturamento || collabData.prateleiraInfinita || collabData.pa || collabData.ticketMedio)) {
          sanitizedCollaboratorResults[collabId] = {
            faturamento: parseFloat(collabData.faturamento) || 0,
            prateleiraInfinita: parseFloat(collabData.prateleiraInfinita) || 0,
            pa: parseFloat(collabData.pa) || 0,
            ticketMedio: parseFloat(collabData.ticketMedio) || 0
          };
        }
      });
      
      // Atualizar store_results usando JSONB
      const currentStoreResults = editingStore.store_results || {};
      const updatedStoreResults = {
        ...currentStoreResults,
        [resultMonth]: sanitizedStoreResults
      };
      
      // Atualizar collaborator_results usando JSONB
      const currentCollaboratorResults = editingStore.collaborator_results || {};
      const updatedCollaboratorResults = {
        ...currentCollaboratorResults,
        [resultMonth]: sanitizedCollaboratorResults
      };
      
      console.log('💾 [ResultsManagement] Salvando dados:', {
        storeId: editingStore.id,
        month: resultMonth,
        sanitizedStoreResults,
        sanitizedCollaboratorResults,
        updatedStoreResults,
        updatedCollaboratorResults
      });
      
      const updatedStore = await updateStore(editingStore.id, {
        store_results: updatedStoreResults,
        collaborator_results: updatedCollaboratorResults
      });

      console.log('✅ [ResultsManagement] Dados salvos. Store atualizada:', updatedStore);

      // Recarregar dados após salvar
      await fetchData();
      
      // Recarregar dados da loja editada
      const refreshedStores = await api.fetchStores();
      const refreshedStore = refreshedStores.find(s => s.id === editingStore.id);
      if (refreshedStore) {
        setEditingStore(refreshedStore);
        loadStoreData(refreshedStore);
      }
      console.log('🔄 [ResultsManagement] Dados recarregados após salvamento');

      toast({
        title: 'Sucesso!',
        description: `Resultados de ${editingStore.name} salvos com sucesso.`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar resultados.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleLock = async () => {
    if (user?.role !== 'admin') return;

    try {
      const newLockState = !isLocked;

      // Atualizar bloqueio em todas as lojas usando JSONB results_locks
      const updatePromises = filteredStores.map(store => {
        const currentLocks = store.results_locks || {};
        const updatedLocks = {
          ...currentLocks,
          [resultMonth]: newLockState
        };
        return updateStore(store.id, { results_locks: updatedLocks });
      });

      await Promise.all(updatePromises);
      setIsLocked(newLockState);

      toast({
        title: newLockState ? 'Bloqueado' : 'Desbloqueado',
        description: `Edição de resultados ${newLockState ? 'bloqueada' : 'liberada'} para ${resultMonth}.`
      });
      
      // Recarregar dados para atualizar o estado
      fetchData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar bloqueio.',
        variant: 'destructive'
      });
    }
  };

  // Buscar metas para comparação usando JSONB (goals[resultMonth])
  const goals = useMemo(() => {
    if (!editingStore) return {};
    const storeGoals = editingStore.goals || {};
    // Se goals é um objeto JSONB, buscar pelo mês
    if (typeof storeGoals === 'object' && !Array.isArray(storeGoals)) {
      return storeGoals[resultMonth] || {};
    }
    // Fallback para formato antigo (se existir)
    return storeGoals || {};
  }, [editingStore, resultMonth]);

  const getGoalPercentage = (result, goal) => {
    if (!goal || goal === 0) return null;
    return ((result / goal) * 100).toFixed(1);
  };

  const getPerformanceColor = (percentage) => {
    if (!percentage) return 'text-muted-foreground';
    const perc = parseFloat(percentage);
    if (perc >= 100) return 'text-green-400';
    if (perc >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const metricFields = [
    { name: 'conversao', label: 'Taxa de Conversão (%)', icon: Percent },
    { name: 'pa', label: 'P.A.', icon: Hash },
    { name: 'faturamento', label: 'Faturamento', icon: DollarSign, autoCalculated: true },
    { name: 'prateleiraInfinita', label: 'Prateleira Infinita', icon: Truck, autoCalculated: true },
    { name: 'ticketMedio', label: 'Ticket Médio', icon: BarChart }
  ];

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor' || user?.role === 'supervisor_franquia';

  return (
    <>
      <Helmet>
        <title>Gestão de Resultados - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Resultados</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e edite resultados de todas as lojas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
              <Label htmlFor="resultMonth" className="text-sm text-muted-foreground whitespace-nowrap">Período:</Label>
              <Input
                id="resultMonth"
                type="month"
                value={resultMonth}
                min="2020-01"
                onChange={(e) => {
                  setResultMonth(e.target.value);
                  setEditingStore(null);
                  setStoreResults({});
                  setCollaboratorResults({});
                }}
                className="w-36 bg-background border-0 h-9 text-sm font-medium"
              />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
                <Switch
                  checked={isLocked}
                  onCheckedChange={handleToggleLock}
                  id="lock-results"
                />
                <Label htmlFor="lock-results" className="text-sm flex items-center gap-2 cursor-pointer">
                  {isLocked ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                  <span>{isLocked ? 'Bloqueado' : 'Liberado'}</span>
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
              <MultiSelectFilter
                label="Loja"
                options={filterOptions.stores}
                selected={filters.store}
                onSelectionChange={(selected) => setFilters(prev => ({ ...prev, store: selected }))}
              />
              <MultiSelectFilter
                label="Bandeira"
                options={filterOptions.bandeiras}
                selected={filters.bandeira}
                onSelectionChange={(selected) => setFilters(prev => ({ ...prev, bandeira: selected }))}
              />
              <MultiSelectFilter
                label="Franqueado"
                options={filterOptions.franqueados}
                selected={filters.franqueado}
                onSelectionChange={(selected) => setFilters(prev => ({ ...prev, franqueado: selected }))}
              />
              <MultiSelectFilter
                label="Supervisor"
                options={filterOptions.supervisors}
                selected={filters.supervisor}
                onSelectionChange={(selected) => setFilters(prev => ({ ...prev, supervisor: selected }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Lojas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: Lista de Lojas */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Lojas ({filteredStores.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 max-h-[calc(100vh-300px)] md:max-h-[calc(100vh-400px)] overflow-y-auto overscroll-contain">
                  {filteredStores.map(store => {
                    const storeResultsData = store.store_results || {};
                    const monthResults = storeResultsData[resultMonth] || store.results || {};
                    const hasResults = Object.values(monthResults).some(v => v > 0);
                    
                    return (
                      <motion.div
                        key={store.id}
                        whileHover={{ x: 5 }}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          editingStore?.id === store.id
                            ? "bg-primary/10 border-primary"
                            : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                        )}
                        onClick={() => handleStoreSelect(store.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{store.name}</p>
                            <p className="text-xs text-muted-foreground">{store.code}</p>
                          </div>
                          {hasResults && (
                            <div className="w-2 h-2 bg-green-400 rounded-full ml-2" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo: Formulário de Resultados */}
          <div className="lg:col-span-2">
            {editingStore ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Alerta de bloqueio */}
                {isLocked && user?.role !== 'admin' && (
                  <Card className="bg-yellow-900/20 border-yellow-500/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Lock className="w-5 h-5 text-yellow-400" />
                      <p className="text-sm text-yellow-200">
                        A edição está bloqueada para este período. Entre em contato com o administrador.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Métricas Gerais */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Resultados Gerais - {editingStore.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {metricFields.map((field) => {
                        const result = storeResults[field.name] || 0;
                        const goal = goals[field.name] || 0;
                        const percentage = getGoalPercentage(result, goal);
                        
                        return (
                          <div key={field.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2 text-sm font-medium">
                                <field.icon className="w-4 h-4 text-primary" />
                                {field.label}
                                {field.autoCalculated && (
                                  <span className="text-xs text-muted-foreground">(auto)</span>
                                )}
                              </Label>
                              {goal > 0 && percentage && (
                                <span className={cn("text-xs font-semibold", getPerformanceColor(percentage))}>
                                  {percentage}%
                                </span>
                              )}
                            </div>
                            <Input
                              type="number"
                              step="any"
                              value={field.autoCalculated 
                                ? (field.name === 'faturamento' ? calculatedFaturamento : calculatedPrateleira) 
                                : (storeResults[field.name] || '')}
                              onChange={(e) => !field.autoCalculated && handleStoreResultChange(field.name, e.target.value)}
                              placeholder="0"
                              className="h-10 text-sm"
                              disabled={field.autoCalculated || (isLocked && user?.role !== 'admin')}
                            />
                            {goal > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Meta: {field.name === 'faturamento' || field.name === 'prateleiraInfinita' || field.name === 'ticketMedio' 
                                  ? `R$ ${goal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : field.name === 'conversao' 
                                  ? `${goal}%`
                                  : goal.toFixed(2)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Resultados Individuais */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Resultados Individuais por Colaborador
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {storeCollaborators.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum colaborador cadastrado para esta loja.
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-[60vh] md:max-h-none overflow-y-auto overscroll-contain">
                        {storeCollaborators.map((collaborator) => {
                          const collabResults = collaboratorResults[collaborator.id] || {};
                          
                          return (
                            <div
                              key={collaborator.id}
                              className="bg-secondary/30 rounded-xl p-3 sm:p-4 border border-border/30"
                            >
                              <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                <Users className="w-4 h-4 text-primary" />
                                {collaborator.name}
                                {collaborator.role && (
                                  <span className="text-xs text-muted-foreground font-normal">({collaborator.role})</span>
                                )}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-3 h-3" /> Faturamento
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    value={collabResults.faturamento || ''}
                                    onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'faturamento', e.target.value)}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                    disabled={isLocked && user?.role !== 'admin'}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Truck className="w-3 h-3" /> Prateleira
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    value={collabResults.prateleiraInfinita || ''}
                                    onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'prateleiraInfinita', e.target.value)}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                    disabled={isLocked && user?.role !== 'admin'}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Hash className="w-3 h-3" /> P.A.
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    value={collabResults.pa || ''}
                                    onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'pa', e.target.value)}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                    disabled={isLocked && user?.role !== 'admin'}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <BarChart className="w-3 h-3" /> Ticket Médio
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    value={collabResults.ticketMedio || ''}
                                    onChange={(e) => handleCollaboratorResultChange(collaborator.id, 'ticketMedio', e.target.value)}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                    disabled={isLocked && user?.role !== 'admin'}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botão Salvar */}
                <Button 
                  onClick={handleSave} 
                  className="w-full gap-2 h-11"
                  disabled={isLocked && user?.role !== 'admin'}
                >
                  <Save className="w-4 h-4" /> Salvar Resultados
                </Button>
              </motion.div>
            ) : (
              <Card className="bg-card border-border/50">
                <CardContent className="p-10 text-center">
                  <Store className="w-20 h-20 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma loja selecionada</h3>
                  <p className="text-muted-foreground">Selecione uma loja na barra lateral para visualizar e editar seus resultados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsManagement;

