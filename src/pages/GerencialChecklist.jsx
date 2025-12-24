import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { CheckCircle, XCircle, Calendar, TrendingUp, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';

// Cores para cada setor
const sectorColors = {
  PRODUTO: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500', header: 'bg-gray-800' },
  AMBIENTACAO: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', header: 'bg-gray-800' },
  DIGITAL: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', header: 'bg-gray-800' },
  ADMINISTRATIVO: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', header: 'bg-gray-800' },
  PESSOAS: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', header: 'bg-gray-800' },
  OUTROS: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-500', header: 'bg-gray-800' },
};

// Organizar tarefas por setor
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

// Componente de Setor com tarefas separadas (pendentes e realizadas)
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
          <p className="text-muted-foreground text-center py-4">Nenhuma tarefa neste setor.</p>
        )}
      </CardContent>
    </Card>
  );
};

// Visualização da Loja
const StoreGerencialChecklistView = ({ storeId }) => {
  const { gerencialTasks, checklist, updateGerencialChecklist, stores } = useData();
  const [checklistHistory, setChecklistHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [localChecklist, setLocalChecklist] = useState({});
  const isUpdatingRef = useRef(false); // Ref para rastrear se estamos atualizando
  
  const storeName = stores.find(s => s.id === storeId)?.name || "sua loja";
  
  // Inicializar estado local apenas uma vez quando componente monta ou storeId muda
  useEffect(() => {
    const storeChecklist = checklist[storeId]?.gerencialTasks || {};
    setLocalChecklist(storeChecklist);
    console.log('🔄 [StoreGerencialChecklistView] Estado local inicializado:', storeChecklist);
  }, [storeId]); // Apenas quando storeId muda
  
  // Sincronizar quando contexto mudar externamente (mas não por nossa atualização)
  useEffect(() => {
    if (isUpdatingRef.current) {
      // Se estamos atualizando, não sincronizar (evitar loop)
      isUpdatingRef.current = false; // Reset após verificação
      return;
    }
    
    const storeChecklist = checklist[storeId]?.gerencialTasks || {};
    const contextStr = JSON.stringify(storeChecklist);
    const localStr = JSON.stringify(localChecklist);
    
    // Só sincronizar se realmente mudou externamente e não está vazio
    if (contextStr !== localStr && Object.keys(storeChecklist).length > 0) {
      setLocalChecklist(storeChecklist);
      console.log('🔄 [StoreGerencialChecklistView] Estado sincronizado do contexto externo:', storeChecklist);
    }
  }, [checklist[storeId]?.gerencialTasks]);
  
  // Usar estado local como fonte principal - sempre usar estado local que é atualizado imediatamente
  const storeTodayChecklist = localChecklist;
  
  const tasksBySector = useMemo(() => organizeTasksBySector(gerencialTasks), [gerencialTasks]);
  const sectors = Object.keys(tasksBySector);
  
  const totalTasks = gerencialTasks?.length || 0;
  const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  console.log('🔍 [StoreGerencialChecklistView] Renderizando:', {
    storeId,
    storeName,
    gerencialTasksCount: gerencialTasks?.length || 0,
    checklistData: checklist[storeId],
    localChecklist,
    storeTodayChecklist,
    completedTasks,
    totalTasks
  });

  const handleCheckChange = useCallback((taskId, checked) => {
    console.log('🔄 [StoreGerencialChecklistView] Atualizando checklist:', { storeId, taskId, checked, currentState: localChecklist });
    
    // Marcar que estamos atualizando
    isUpdatingRef.current = true;
    
    // Salvar estado anterior para possível reversão
    const previousState = { ...localChecklist };
    
    // Atualizar estado local IMEDIATAMENTE para feedback visual instantâneo
    // Isso faz a tarefa mudar de seção instantaneamente (pendente -> realizada)
    const newState = checked 
      ? { ...localChecklist, [taskId]: true }
      : (() => {
          const updated = { ...localChecklist };
          delete updated[taskId];
          return updated;
        })();
    
    setLocalChecklist(newState);
    console.log('🔄 [StoreGerencialChecklistView] Estado local atualizado IMEDIATAMENTE:', newState);
    
    // Salvar no banco em segundo plano (não bloquear UI)
    updateGerencialChecklist(storeId, taskId, checked)
      .then(() => {
        console.log('✅ [StoreGerencialChecklistView] Checklist salvo no banco com sucesso');
        isUpdatingRef.current = false;
      })
      .catch((error) => {
        console.error('❌ [StoreGerencialChecklistView] Erro ao salvar no banco:', error);
        // Reverter mudança local em caso de erro
        setLocalChecklist(previousState);
        console.log('🔄 [StoreGerencialChecklistView] Estado revertido devido a erro:', previousState);
        isUpdatingRef.current = false;
      });
  }, [storeId, updateGerencialChecklist, localChecklist]);

  // Carregar histórico de TODOS os checklists (diário + gerencial)
  useEffect(() => {
    const loadHistory = async () => {
      if (!storeId) return;
      setLoadingHistory(true);
      try {
        const history = await api.fetchChecklistHistory(storeId, 7);
        setChecklistHistory(history || []);
        console.log('✅ [StoreGerencialChecklistView] Histórico carregado:', history?.length || 0);
      } catch (error) {
        console.error('❌ [StoreGerencialChecklistView] Erro ao carregar histórico:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [storeId]);

  if (!gerencialTasks || gerencialTasks.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">CHECK LIST PPAD GERENCIAL - {storeName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma tarefa configurada para o checklist gerencial.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">CHECK LIST PPAD GERENCIAL - {storeName}</CardTitle>
          <div className="flex items-center gap-4 text-muted-foreground mt-2">
            <span>Progresso de Hoje:</span>
            <div className="w-full bg-secondary rounded-full h-3">
              <motion.div
                className="bg-primary h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="font-bold text-primary min-w-[50px]">{completionPercentage.toFixed(0)}%</span>
            <span className="text-sm">({completedTasks}/{totalTasks})</span>
          </div>
        </CardHeader>
      </Card>

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

        <TabsContent value="hoje" className="space-y-4">
          {sectors.map((sector, index) => (
            <motion.div
              key={sector}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SectorSection
                sector={sector}
                tasks={gerencialTasks}
                storeTodayChecklist={storeTodayChecklist}
                onCheckChange={handleCheckChange}
                storeId={storeId}
              />
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {loadingHistory ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Carregando histórico...</p>
              </CardContent>
            </Card>
          ) : checklistHistory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum histórico encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {checklistHistory.map((dayChecklist) => {
                const date = parseISO(dayChecklist.date);
                const dayGerencialTasks = dayChecklist.gerencialTasks || {};
                const dayDailyTasks = dayChecklist.tasks || {};
                const dayCompletedGerencial = Object.values(dayGerencialTasks).filter(Boolean).length;
                const dayCompletedDaily = Object.values(dayDailyTasks).filter(Boolean).length;
                const dayPercentageGerencial = totalTasks > 0 ? (dayCompletedGerencial / totalTasks) * 100 : 0;
                
                return (
                  <Card key={dayChecklist.date} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-lg font-bold">
                          {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <div className="flex gap-2">
                          <Badge variant={dayPercentageGerencial === 100 ? 'default' : 'secondary'}>
                            PPAD: {dayCompletedGerencial}/{totalTasks} ({dayPercentageGerencial.toFixed(0)}%)
                          </Badge>
                          <Badge variant="outline">
                            Diário: {dayCompletedDaily}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {sectors.map((sector) => {
                          const sectorTasks = tasksBySector[sector] || [];
                          const sectorCompleted = sectorTasks.filter(task => dayGerencialTasks[task.id]).length;
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Visualização Admin/Supervisor
const AdminSupervisorGerencialChecklistView = () => {
  const { stores, gerencialTasks = [], checklist, updateGerencialChecklist, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklistHistories, setChecklistHistories] = useState({});
  const [loadingHistories, setLoadingHistories] = useState({});
  const [expandedStores, setExpandedStores] = useState(new Set());
  const [auditingChecklist, setAuditingChecklist] = useState(null);
  const [auditedStatus, setAuditedStatus] = useState({});
  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia';

  const tasksBySector = useMemo(() => organizeTasksBySector(gerencialTasks), [gerencialTasks]);
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

  const handleMarkAsAudited = async (storeId) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const checklistKey = `${storeId}-${todayStr}`;
      setAuditingChecklist(checklistKey);
      
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

  // Carregar histórico para todas as lojas
  useEffect(() => {
    const loadAllHistories = async () => {
      const histories = {};
      const loading = {};
      
      for (const store of stores) {
        loading[store.id] = true;
        try {
          const history = await api.fetchChecklistHistory(store.id, 7);
          histories[store.id] = history || [];
        } catch (error) {
          console.error(`Erro ao carregar histórico da loja ${store.id}:`, error);
          histories[store.id] = [];
        } finally {
          loading[store.id] = false;
        }
      }
      
      setChecklistHistories(histories);
      setLoadingHistories(loading);
    };
    
    if (stores.length > 0) {
      loadAllHistories();
    }
  }, [stores]);

  if (!gerencialTasks || gerencialTasks.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold">CHECK LIST PPAD GERENCIAL</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma tarefa configurada para o checklist gerencial.</p>
        </CardContent>
      </Card>
    );
  }

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
            const storeTodayChecklist = checklist[store.id]?.gerencialTasks || {};
            const totalTasks = gerencialTasks.length;
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
                        tasks={gerencialTasks}
                        storeTodayChecklist={storeTodayChecklist}
                        onCheckChange={(taskId, checked) => {
                          updateGerencialChecklist(store.id, taskId, checked);
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
                        const dayGerencialTasks = dayChecklist.gerencialTasks || {};
                        const dayDailyTasks = dayChecklist.tasks || {};
                        const dayCompleted = Object.values(dayGerencialTasks).filter(Boolean).length;
                        const dayCompletedDaily = Object.values(dayDailyTasks).filter(Boolean).length;
                        const dayPercentage = gerencialTasks.length > 0 ? (dayCompleted / gerencialTasks.length) * 100 : 0;
                        
                        return (
                          <Card key={dayChecklist.date} className="bg-secondary/50">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold">
                                  {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <div className="flex gap-2">
                                  <Badge variant={dayPercentage === 100 ? 'default' : 'secondary'}>
                                    PPAD: {dayCompleted}/{gerencialTasks.length} ({dayPercentage.toFixed(0)}%)
                                  </Badge>
                                  <Badge variant="outline">
                                    Diário: {dayCompletedDaily}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {sectors.map((sector) => {
                                  const sectorTasks = tasksBySector[sector] || [];
                                  const sectorCompleted = sectorTasks.filter(task => dayGerencialTasks[task.id]).length;
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
    </div>
  );
};

const GerencialChecklist = () => {
  const { user } = useAuth();
  const { gerencialTasks } = useData();
  const isLoja = user?.role === 'loja' || user?.role === 'loja_franquia';
  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia';

  console.log('🔍 [GerencialChecklist] Renderizando:', {
    userRole: user?.role,
    storeId: user?.storeId,
    isLoja,
    isAdminOrSupervisor,
    gerencialTasksCount: gerencialTasks?.length || 0,
    userObject: user
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

  // Se for loja mas não tiver storeId, mostrar mensagem de erro
  if (isLoja && !user?.storeId) {
    return (
      <>
        <Helmet>
          <title>CHECK LIST PPAD GERENCIAL - MYFEET</title>
        </Helmet>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">CHECK LIST PPAD GERENCIAL</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-destructive text-lg font-semibold">Erro: Loja não encontrada.</p>
            <p className="text-muted-foreground mt-2">Entre em contato com o administrador para vincular sua conta a uma loja.</p>
            <p className="text-xs text-muted-foreground mt-4">User ID: {user?.id}</p>
            <p className="text-xs text-muted-foreground">Role: {user?.role}</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>CHECK LIST PPAD GERENCIAL - MYFEET</title>
      </Helmet>
      <div className="space-y-6">
        {isLoja && user?.storeId && (
          <StoreGerencialChecklistView storeId={user.storeId} />
        )}
        {isAdminOrSupervisor && <AdminSupervisorGerencialChecklistView />}
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

export default GerencialChecklist;
export { AdminSupervisorGerencialChecklistView };
