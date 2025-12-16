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
import { CheckCircle, Calendar, TrendingUp, History, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Cores para cada categoria
const sectorColors = {
  ABERTURA: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', header: 'bg-gray-800' },
  OPERACIONAL: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', header: 'bg-gray-800' },
  'KPIS/RELATÓRIOS': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', header: 'bg-gray-800' },
  DIGITAL: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-500', header: 'bg-gray-800' },
  CRM: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500', header: 'bg-gray-800' },
  'VISUAL MERCHANDISING': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', header: 'bg-gray-800' },
  ATENDIMENTO: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-500', header: 'bg-gray-800' },
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
  const sectorTasks = tasks.filter(task => (task.sector || 'OUTROS') === sector);
  
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
  const sectors = Object.keys(tasksBySector);

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
    const { dailyTasks, checklist, updateChecklist, stores } = useData();
    
    const storeName = stores.find(s => s.id === storeId)?.name || "sua loja";
    
    const storeTodayChecklist = checklist[storeId]?.tasks || {};
    const totalTasks = dailyTasks.length;
    const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const handleCheckChange = (taskId, checked) => {
        updateChecklist(storeId, taskId, checked);
    };

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">Checklist Diário - {storeName}</CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground mt-2">
                    <span>Progresso de Hoje:</span>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                        <motion.div
                            className="bg-primary h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${completionPercentage}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <span className="font-bold text-primary">{completionPercentage.toFixed(0)}%</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {dailyTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg"
                        >
                            <Checkbox
                                id={task.id}
                                checked={!!storeTodayChecklist[task.id]}
                                onCheckedChange={(checked) => handleCheckChange(task.id, checked)}
                                className="h-5 w-5"
                            />
                            <Label htmlFor={task.id} className="text-base font-medium text-foreground cursor-pointer flex-grow">
                                {task.text}
                            </Label>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
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
    const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia';

    const tasksBySector = useMemo(() => organizeTasksBySector(dailyTasks), [dailyTasks]);
    const sectors = Object.keys(tasksBySector);

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

    // Função para marcar checklist como auditado
    const handleMarkAsAudited = async (storeId) => {
        try {
            const checklistKey = `${storeId}-${format(new Date(), 'yyyy-MM-dd')}`;
            setAuditingChecklist(checklistKey);
            
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const updateData = {
                is_audited: true,
                audited_by: user?.id,
                audited_at: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('daily_checklists')
                .update(updateData)
                .eq('store_id', storeId)
                .eq('date', todayStr);
            
            if (error) {
                if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
                    console.warn('Campos de auditoria não encontrados, tentando atualização simples...');
                    const { error: simpleError } = await supabase
                        .from('daily_checklists')
                        .update({ is_audited: true })
                        .eq('store_id', storeId)
                        .eq('date', todayStr);
                    
                    if (simpleError) throw simpleError;
                } else {
                    throw error;
                }
            }
            
            toast({
                title: 'Sucesso',
                description: 'Checklist marcado como auditado.',
            });
            
            // Atualizar status de auditoria localmente
            setAuditedStatus(prev => ({ ...prev, [storeId]: true }));
            
            // Recarregar dados
            await fetchData();
        } catch (error) {
            console.error('Erro ao marcar como auditado:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error.message || 'Não foi possível marcar o checklist como auditado.',
            });
        } finally {
            setAuditingChecklist(null);
        }
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
                        const isCompleted = completionPercentage === 100;
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
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
                                                {completionPercentage.toFixed(0)}%
                                            </Badge>
                                            {isAdminOrSupervisor && isCompleted && !isAudited && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkAsAudited(store.id)}
                                                    disabled={isAuditing}
                                                    className="flex items-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {isAuditing ? 'Marcando...' : 'Marcar como Auditado'}
                                                </Button>
                                            )}
                                            {isAudited && (
                                                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Auditado
                                                </Badge>
                                            )}
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
                                                
                                                return (
                                                    <Card key={dayChecklist.date} className="bg-secondary/50">
                                                        <CardHeader className="pb-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold">
                                                                    {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "dd/MM/yyyy", { locale: ptBR })}
                                                                </span>
                                                                <div className="flex gap-2">
                                                                    <Badge variant={dayPercentage === 100 ? 'default' : 'secondary'}>
                                                                        Diário: {dayCompleted}/{dailyTasks.length} ({dayPercentage.toFixed(0)}%)
                                                                    </Badge>
                                                                    {dayCompletedGerencial > 0 && (
                                                                        <Badge variant="outline">
                                                                            PPAD: {dayCompletedGerencial}
                                                                        </Badge>
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
    const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia';

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
                <title>Checklist Diário - MYFEET</title>
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
                {isAdminOrSupervisor && <AdminSupervisorChecklistView />}
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
