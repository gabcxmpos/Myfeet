import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, TrendingUp, History, ChevronDown, ChevronUp, CheckCircle2, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';
import { AdminSupervisorGerencialChecklistView } from '@/pages/GerencialChecklist';
import StoreDailyChecklist from './StoreDailyChecklist';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Cores para cada setor (mesmos do PPAD Gerencial)
const sectorColors = {
  PRODUTO: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500', header: 'bg-gray-800' },
  AMBIENTACAO: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', header: 'bg-gray-800' },
  DIGITAL: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', header: 'bg-gray-800' },
  ADMINISTRATIVO: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', header: 'bg-gray-800' },
  PESSOAS: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', header: 'bg-gray-800' },
  OUTROS: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500', header: 'bg-gray-800' },
};

// Organizar tarefas por categoria
const organizeTasksBySector = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) return {};
  
  const sectors = {};
  tasks.forEach(task => {
    const sector = task.sector || 'OUTROS';
    if (!sectors[sector]) {
      sectors[sector] = [];
    }
    sectors[sector].push(task);
  });
  
  return sectors;
};

// Componente de Categoria com tarefas separadas (pendentes e realizadas)
const SectorSection = ({ sector, tasks, storeTodayChecklist, onCheckChange, storeId }) => {
  const colors = sectorColors[sector] || sectorColors.OUTROS;
  const sectorTasks = (tasks && Array.isArray(tasks)) ? tasks.filter(task => (task.sector || 'OUTROS') === sector) : [];
  
  // Separar tarefas pendentes e realizadas
  const pendingTasks = sectorTasks.filter(task => !storeTodayChecklist[task.id]);
  const completedTasks = sectorTasks.filter(task => storeTodayChecklist[task.id]);
  
  const completedInSector = completedTasks.length;
  const sectorPercentage = sectorTasks.length > 0 ? (completedInSector / sectorTasks.length) * 100 : 0;

  return (
    <Card className={`${colors.border} border-2`}>
      <CardHeader className={`${colors.header} border-b ${colors.border}`}>
        <div className="flex justify-between items-center">
          <CardTitle className={`text-xl font-bold uppercase ${colors.text}`}>
            {sector}
          </CardTitle>
          <Badge variant="outline" className={colors.text}>
            {completedInSector}/{sectorTasks.length}
          </Badge>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 mt-2">
          <motion.div
            className={`${colors.text.replace('text-', 'bg-')} h-2 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${sectorPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Tarefas Pendentes */}
        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Tarefas Pendentes:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center space-x-2 ${colors.bg} p-3 rounded-lg border ${colors.border} hover:opacity-80 transition-opacity`}
                >
                  <Checkbox
                    id={`${storeId}-${task.id}`}
                    checked={false}
                    onCheckedChange={(checked) => onCheckChange(task.id, checked)}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor={`${storeId}-${task.id}`} 
                    className="text-sm font-medium cursor-pointer flex-grow"
                  >
                    {task.text}
                  </Label>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tarefas Realizadas */}
        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-500 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tarefas Realizadas:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center space-x-2 bg-green-500/10 p-3 rounded-lg border border-green-500/30 opacity-75`}
                >
                  <Checkbox
                    id={`${storeId}-${task.id}-completed`}
                    checked={true}
                    onCheckedChange={(checked) => onCheckChange(task.id, checked)}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor={`${storeId}-${task.id}-completed`} 
                    className="text-sm font-medium cursor-pointer flex-grow line-through text-muted-foreground"
                  >
                    {task.text}
                  </Label>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length === 0 && completedTasks.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Nenhuma tarefa nesta categoria.</p>
        )}
      </CardContent>
    </Card>
  );
};

// Modal de histórico por loja
const StoreHistoryModal = ({ store, isOpen, onClose, dailyTasks }) => {
  const [checklistHistory, setChecklistHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const tasksBySector = useMemo(() => organizeTasksBySector(dailyTasks), [dailyTasks]);
  const sectors = useMemo(() => {
    if (!tasksBySector || typeof tasksBySector !== 'object') return [];
    return Object.keys(tasksBySector);
  }, [tasksBySector]);

  useEffect(() => {
    if (isOpen && store?.id) {
      const loadHistory = async () => {
        setLoadingHistory(true);
        try {
          const history = await api.fetchChecklistHistory(store.id, 7);
          setChecklistHistory(history || []);
        } catch (error) {
          console.error('❌ Erro ao carregar histórico:', error);
        } finally {
          setLoadingHistory(false);
        }
      };
      loadHistory();
    }
  }, [isOpen, store?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Histórico - {store?.name} ({store?.code})
          </DialogTitle>
        </DialogHeader>
        {loadingHistory ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        ) : checklistHistory.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum histórico encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checklistHistory.map((dayChecklist) => {
              const date = parseISO(dayChecklist.date);
              const dayTasks = dayChecklist.tasks || {};
              const dayCompleted = Object.values(dayTasks).filter(Boolean).length;
              const dayPercentage = dailyTasks.length > 0 ? (dayCompleted / dailyTasks.length) * 100 : 0;
              
              return (
                <Card key={dayChecklist.date} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-lg font-bold">
                        {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                      <Badge variant={dayPercentage === 100 ? 'default' : 'secondary'}>
                        {dayCompleted}/{dailyTasks.length} ({dayPercentage.toFixed(0)}%)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {sectors.map((sector) => {
                        const sectorTasks = tasksBySector[sector] || [];
                        const sectorCompleted = sectorTasks.filter(task => dayTasks[task.id]).length;
                        const sectorTotal = sectorTasks.length;
                        const sectorPct = sectorTotal > 0 ? (sectorCompleted / sectorTotal) * 100 : 0;
                        const colors = sectorColors[sector] || sectorColors.OUTROS;
                        
                        return (
                          <div key={sector} className={`${colors.bg} p-3 rounded-lg border ${colors.border}`}>
                            <div className="text-xs font-semibold uppercase mb-1">{sector}</div>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {sectorCompleted}/{sectorTotal}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sectorPct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const StoreChecklistView = ({ storeId }) => {
    // Usar o componente StoreDailyChecklist que já tem setores implementados
    return <StoreDailyChecklist storeId={storeId} />;
};

const AdminSupervisorChecklistView = () => {
    const { stores, dailyTasks, checklist, updateChecklist, fetchData } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const [checklistHistories, setChecklistHistories] = useState({});
    const [loadingHistories, setLoadingHistories] = useState({});
    const [selectedStoreForHistory, setSelectedStoreForHistory] = useState(null);
    const [expandedStores, setExpandedStores] = useState(new Set());
    const [auditingChecklist, setAuditingChecklist] = useState(null);
    const [auditedStatus, setAuditedStatus] = useState({});
    const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';

    const tasksBySector = useMemo(() => organizeTasksBySector(dailyTasks), [dailyTasks]);
    const sectors = useMemo(() => {
      if (!tasksBySector || typeof tasksBySector !== 'object') return [];
      return Object.keys(tasksBySector);
    }, [tasksBySector]);

    const toggleStore = (storeId) => {
        setExpandedStores(prev => {
            const newSet = new Set(prev);
            if (newSet.has(storeId)) {
                newSet.delete(storeId);
            } else {
                newSet.add(storeId);
            }
            return newSet;
        });
    };

    // Função para marcar/desmarcar checklist como auditado (aceita data específica)
    const handleToggleAudit = async (storeId, dateStr = null, isAudited) => {
        if (isAudited) {
            // Se já está auditado, remover auditoria
            await handleRemoveAudit(storeId, dateStr);
        } else {
            // Se não está auditado, marcar como auditado
            await handleMarkAsAudited(storeId, dateStr);
        }
    };

    // Função para marcar checklist como auditado (aceita data específica)
    const handleMarkAsAudited = async (storeId, dateStr = null) => {
        const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');
        const checklistKey = `${storeId}-${targetDate}`;
        const statusKey = dateStr ? `${storeId}-${dateStr}` : storeId;
        
        // Atualização otimista - atualizar UI imediatamente
        setAuditingChecklist(checklistKey);
        setAuditedStatus(prev => ({ ...prev, [statusKey]: true }));
        
        // Operação assíncrona em background
        (async () => {
            try {
                // Tentar atualizar com campos de auditoria
                let updateData = {
                    is_audited: true,
                    audited_by: user?.id,
                    audited_at: new Date().toISOString()
                };
                
                let { error } = await supabase
                    .from('daily_checklists')
                    .update(updateData)
                    .eq('store_id', storeId)
                    .eq('date', targetDate);
                
                // Se as colunas não existem ou schema cache não atualizado, tentar apenas is_audited
                if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
                    updateData = { is_audited: true };
                    const { error: simpleError } = await supabase
                        .from('daily_checklists')
                        .update(updateData)
                        .eq('store_id', storeId)
                        .eq('date', targetDate);
                    
                    if (simpleError && simpleError.code !== 'PGRST204' && simpleError.code !== '42703') {
                        throw simpleError;
                    }
                } else if (error) {
                    throw error;
                }
                
                // Recarregar dados em background (sem bloquear UI)
                fetchData().catch(console.error);
                
                // Recarregar histórico em background
                api.fetchChecklistHistory(storeId, 7).then(history => {
                    if (history) {
                        setChecklistHistories(prev => ({ ...prev, [storeId]: history || [] }));
                        const updatedAudited = {};
                        for (const dayChecklist of (history || [])) {
                            const dateKey = `${storeId}-${dayChecklist.date}`;
                            updatedAudited[dateKey] = dayChecklist.is_audited === true;
                        }
                        setAuditedStatus(prev => ({ ...prev, ...updatedAudited }));
                    }
                }).catch(console.error);
                
            } catch (error) {
                console.error('Erro ao marcar como auditado:', error);
                // Reverter estado em caso de erro
                setAuditedStatus(prev => ({ ...prev, [statusKey]: false }));
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: error.message || 'Não foi possível marcar o checklist como auditado.',
                });
            } finally {
                setAuditingChecklist(null);
            }
        })();
    };

    // Função para remover auditoria
    const handleRemoveAudit = async (storeId, dateStr = null) => {
        const targetDate = dateStr || format(new Date(), 'yyyy-MM-dd');
        const checklistKey = `${storeId}-${targetDate}`;
        const statusKey = dateStr ? `${storeId}-${dateStr}` : storeId;
        
        // Atualização otimista - atualizar UI imediatamente
        setAuditingChecklist(checklistKey);
        setAuditedStatus(prev => ({ ...prev, [statusKey]: false }));
        
        // Operação assíncrona em background
        (async () => {
            try {
                // Tentar remover campos de auditoria
                let updateData = {
                    is_audited: false,
                    audited_by: null,
                    audited_at: null
                };
                
                let { error } = await supabase
                    .from('daily_checklists')
                    .update(updateData)
                    .eq('store_id', storeId)
                    .eq('date', targetDate);
                
                // Se as colunas não existem ou schema cache não atualizado, tentar apenas is_audited
                if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist') || error.message?.includes('schema cache'))) {
                    updateData = { is_audited: false };
                    const { error: simpleError } = await supabase
                        .from('daily_checklists')
                        .update(updateData)
                        .eq('store_id', storeId)
                        .eq('date', targetDate);
                    
                    if (simpleError && simpleError.code !== 'PGRST204' && simpleError.code !== '42703') {
                        throw simpleError;
                    }
                } else if (error) {
                    throw error;
                }
                
                // Recarregar dados em background (sem bloquear UI)
                fetchData().catch(console.error);
                
                // Recarregar histórico em background
                api.fetchChecklistHistory(storeId, 7).then(history => {
                    if (history) {
                        setChecklistHistories(prev => ({ ...prev, [storeId]: history || [] }));
                        const updatedAudited = {};
                        for (const dayChecklist of (history || [])) {
                            const dateKey = `${storeId}-${dayChecklist.date}`;
                            updatedAudited[dateKey] = dayChecklist.is_audited === true;
                        }
                        setAuditedStatus(prev => ({ ...prev, ...updatedAudited }));
                    }
                }).catch(console.error);
                
            } catch (error) {
                console.error('Erro ao remover auditoria:', error);
                // Reverter estado em caso de erro
                setAuditedStatus(prev => ({ ...prev, [statusKey]: true }));
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: error.message || 'Não foi possível remover a auditoria.',
                });
            } finally {
                setAuditingChecklist(null);
            }
        })();
    };

    // Carregar histórico e status de auditoria para todas as lojas
    useEffect(() => {
        const loadAllHistories = async () => {
            const histories = {};
            const loading = {};
            const audited = {};
            
            for (const store of stores) {
                loading[store.id] = true;
                try {
                    const history = await api.fetchChecklistHistory(store.id, 7);
                    histories[store.id] = history || [];
                    
                    // Buscar status de auditoria do dia atual
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const checklistData = await api.fetchDailyChecklist(store.id, todayStr);
                    audited[store.id] = checklistData?.is_audited === true;
                    
                    // Buscar status de auditoria para cada dia do histórico
                    for (const dayChecklist of (history || [])) {
                        const dateKey = `${store.id}-${dayChecklist.date}`;
                        audited[dateKey] = dayChecklist.is_audited === true;
                    }
                } catch (error) {
                    console.error(`Erro ao carregar histórico da loja ${store.id}:`, error);
                    histories[store.id] = [];
                    audited[store.id] = false;
                } finally {
                    loading[store.id] = false;
                }
            }
            
            setChecklistHistories(histories);
            setLoadingHistories(loading);
            setAuditedStatus(audited);
        };
        
        if (stores.length > 0) {
            loadAllHistories();
        }
    }, [stores]);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="hoje" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="hoje" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Hoje</span>
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Histórico (7 dias)</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="hoje" className="space-y-6">
                    {stores.map(store => {
                        const storeTodayChecklist = checklist[store.id]?.tasks || {};
                        const totalTasks = dailyTasks.length;
                        const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
                        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                        const isExpanded = expandedStores.has(store.id);
                        const canAudit = completionPercentage >= 5; // Pelo menos 5% das tarefas devem estar completas
                        const isAudited = auditedStatus[store.id] === true;
                        const todayStr = format(new Date(), 'yyyy-MM-dd');
                        const checklistKey = `${store.id}-${todayStr}`;
                        const isAuditing = auditingChecklist === checklistKey;

                        return (
                            <Card key={store.id} className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleStore(store.id)}
                                                className="p-1 h-auto"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </Button>
                                            <span className="text-xl font-bold">
                                                {store.name} <span className="text-sm text-muted-foreground font-normal">({store.code})</span>
                                            </span>
                                            {isAdminOrSupervisor && (
                                                <div className="flex items-center gap-2 ml-3">
                                                    <Checkbox
                                                        id={`audit-${store.id}`}
                                                        checked={isAudited}
                                                        onCheckedChange={(checked) => {
                                                            if (!isExpanded && checked) toggleStore(store.id);
                                                            if (checked && !canAudit) {
                                                                toast({
                                                                    variant: 'destructive',
                                                                    title: 'Atenção',
                                                                    description: 'Complete pelo menos 5% das tarefas para auditar.',
                                                                });
                                                                return;
                                                            }
                                                            handleToggleAudit(store.id, null, isAudited);
                                                        }}
                                                        disabled={isAuditing || (!isAudited && !canAudit)}
                                                        className="h-5 w-5"
                                                    />
                                                    <Label 
                                                        htmlFor={`audit-${store.id}`}
                                                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                                                        title={isAudited ? 'Desmarcar para remover auditoria' : (!canAudit ? 'Complete pelo menos 5% das tarefas para auditar' : 'Marcar como auditado')}
                                                    >
                                                        <CheckCircle2 className={`w-4 h-4 ${isAudited ? 'text-purple-400' : 'text-muted-foreground'}`} />
                                                        {isAudited ? 'Auditado' : 'Auditar'}
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
                                                {completionPercentage.toFixed(0)}%
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedStoreForHistory(store)}
                                                className="flex items-center gap-2"
                                            >
                                                <History className="w-4 h-4" />
                                                Histórico
                                            </Button>
                                        </div>
                                    </CardTitle>
                                    <div className="w-full bg-secondary rounded-full h-2 mt-2">
                                        <motion.div
                                            className="bg-primary h-2 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${completionPercentage}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="space-y-4 pt-4">
                                        {sectors.map((sector) => (
                                            <SectorSection
                                                key={sector}
                                                sector={sector}
                                                tasks={dailyTasks}
                                                storeTodayChecklist={storeTodayChecklist}
                                                onCheckChange={(taskId, checked) => {
                                                    updateChecklist(store.id, taskId, checked);
                                                }}
                                                storeId={store.id}
                                            />
                                        ))}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </TabsContent>

                <TabsContent value="historico" className="space-y-6">
                    {stores.map(store => {
                        const history = checklistHistories[store.id] || [];
                        const loading = loadingHistories[store.id];

                        return (
                            <Card key={store.id} className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">
                                        {store.name} <span className="text-sm text-muted-foreground font-normal">({store.code})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <p className="text-muted-foreground text-center py-4">Carregando histórico...</p>
                                    ) : history.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">Nenhum histórico encontrado.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {history.map((dayChecklist) => {
                                                const date = parseISO(dayChecklist.date);
                                                const dayTasks = dayChecklist.tasks || {};
                                                const dayGerencialTasks = dayChecklist.gerencialTasks || {};
                                                const dayCompleted = Object.values(dayTasks).filter(Boolean).length;
                                                const dayCompletedGerencial = Object.values(dayGerencialTasks).filter(Boolean).length;
                                                const dayPercentage = dailyTasks.length > 0 ? (dayCompleted / dailyTasks.length) * 100 : 0;
                                                // Definir canAudit ANTES de qualquer uso
                                                const canAudit = dayPercentage >= 5; // Pelo menos 5% das tarefas devem estar completas
                                                const dateKey = `${store.id}-${dayChecklist.date}`;
                                                const isAudited = auditedStatus[dateKey] === true || dayChecklist.is_audited === true;
                                                const checklistKey = `${store.id}-${dayChecklist.date}`;
                                                const isAuditing = auditingChecklist === checklistKey;
                                                
                                                return (
                                                    <Card key={dayChecklist.date} className="bg-secondary/50">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold">
                                                                    {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "dd/MM/yyyy", { locale: ptBR })}
                                                                </span>
                                                                <div className="flex gap-2 items-center">
                                                                    <Badge variant={dayPercentage === 100 ? 'default' : 'secondary'}>
                                                                        Diário: {dayCompleted}/{dailyTasks.length} ({dayPercentage.toFixed(0)}%)
                                                                    </Badge>
                                                                    {dayCompletedGerencial > 0 && (
                                                                        <Badge variant="outline">
                                                                            PPAD: {dayCompletedGerencial}
                                                                        </Badge>
                                                                    )}
                                                                    {isAdminOrSupervisor && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Checkbox
                                                                                id={`audit-hist-${store.id}-${dayChecklist.date}`}
                                                                                checked={isAudited}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (checked && !canAudit) {
                                                                                        toast({
                                                                                            variant: 'destructive',
                                                                                            title: 'Atenção',
                                                                                            description: 'Complete pelo menos 5% das tarefas para auditar.',
                                                                                        });
                                                                                        return;
                                                                                    }
                                                                                    // checked = true significa que queremos auditar (isAudited atual é false)
                                                                                    // checked = false significa que queremos remover (isAudited atual é true)
                                                                                    handleToggleAudit(store.id, dayChecklist.date, isAudited);
                                                                                }}
                                                                                disabled={isAuditing || (!isAudited && !canAudit)}
                                                                                className="h-4 w-4"
                                                                            />
                                                                            <Label 
                                                                                htmlFor={`audit-hist-${store.id}-${dayChecklist.date}`}
                                                                                className="text-xs cursor-pointer flex items-center gap-1"
                                                                                title={isAudited ? 'Desmarcar para remover auditoria' : (!canAudit ? 'Complete pelo menos 5% das tarefas para auditar' : 'Marcar como auditado')}
                                                                            >
                                                                                <CheckCircle2 className={`w-3 h-3 ${isAudited ? 'text-purple-400' : 'text-muted-foreground'}`} />
                                                                                {isAudited ? 'Auditado' : 'Auditar'}
                                                                            </Label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-2">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                {sectors.map((sector) => {
                                                                    const sectorTasks = tasksBySector[sector] || [];
                                                                    const sectorCompleted = sectorTasks.filter(task => dayTasks[task.id]).length;
                                                                    const sectorTotal = sectorTasks.length;
                                                                    const sectorPct = sectorTotal > 0 ? (sectorCompleted / sectorTotal) * 100 : 0;
                                                                    const colors = sectorColors[sector] || sectorColors.OUTROS;
                                                                    
                                                                    return (
                                                                        <div key={sector} className={`${colors.bg} p-2 rounded border ${colors.border}`}>
                                                                            <div className="text-xs font-semibold uppercase mb-1">{sector}</div>
                                                                            <div className="flex items-center justify-between">
                                                                                <span className={`text-xs font-bold ${colors.text}`}>
                                                                                    {sectorCompleted}/{sectorTotal}
                                                                                </span>
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {sectorPct.toFixed(0)}%
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </TabsContent>
            </Tabs>

            {/* Modal de histórico individual por loja */}
            {selectedStoreForHistory && (
                <StoreHistoryModal
                    store={selectedStoreForHistory}
                    isOpen={!!selectedStoreForHistory}
                    onClose={() => setSelectedStoreForHistory(null)}
                    dailyTasks={dailyTasks}
                />
            )}
        </div>
    );
};

const DailyChecklist = () => {
    const { user } = useAuth();
    const isLoja = user?.role === 'loja' || user?.role === 'loja_franquia';
    const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';
    const [activeTab, setActiveTab] = useState('diario');

    console.log('🔍 [DailyChecklist] Renderizando:', {
        userRole: user?.role,
        storeId: user?.storeId,
        isLoja,
        isAdminOrSupervisor
    });

    if (!user) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Carregando...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Helmet>
                <title>Checklists - MYFEET</title>
            </Helmet>
            <div className="space-y-6">
                {isLoja && user?.storeId && <StoreChecklistView storeId={user.storeId} />}
                {isLoja && !user?.storeId && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-destructive">Erro: Loja não encontrada. Entre em contato com o administrador.</p>
                        </CardContent>
                    </Card>
                )}
                {isAdminOrSupervisor && (
                    <div className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
                                <TabsTrigger value="diario" className="gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Checklist Diário
                                </TabsTrigger>
                                <TabsTrigger value="gerencial" className="gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    PPAD Gerencial
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="diario" className="mt-0">
                                <AdminSupervisorChecklistView />
                            </TabsContent>
                            <TabsContent value="gerencial" className="mt-0">
                                <AdminSupervisorGerencialChecklistView />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
                {!isLoja && !isAdminOrSupervisor && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">Você não tem permissão para acessar este checklist.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
};

export default DailyChecklist;
