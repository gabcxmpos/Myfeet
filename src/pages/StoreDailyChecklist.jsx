import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';

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

const StoreDailyChecklist = ({ storeId }) => {
  const { dailyTasks, checklist, updateChecklist, stores } = useData();
  const [checklistHistory, setChecklistHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [localChecklist, setLocalChecklist] = useState({});
  const isUpdatingRef = useRef(false);
  
  const storeName = stores.find(s => s.id === storeId)?.name || "sua loja";
  
  // Carregar dados do banco quando componente monta ou storeId muda
  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!storeId) return;
      
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const dayChecklist = await api.fetchDailyChecklist(storeId, todayStr);
        
        if (dayChecklist && dayChecklist.tasks) {
          setLocalChecklist(dayChecklist.tasks);
          console.log('✅ [StoreDailyChecklist] Dados carregados do banco:', dayChecklist.tasks);
        } else {
          // Se não existe no banco, usar o contexto
          const storeChecklist = checklist[storeId]?.tasks || {};
          setLocalChecklist(storeChecklist);
          console.log('🔄 [StoreDailyChecklist] Estado inicializado do contexto:', storeChecklist);
        }
      } catch (error) {
        console.error('❌ [StoreDailyChecklist] Erro ao carregar do banco:', error);
        // Em caso de erro, usar contexto
        const storeChecklist = checklist[storeId]?.tasks || {};
        setLocalChecklist(storeChecklist);
      }
    };
    
    loadFromDatabase();
  }, [storeId]);
  
  // Sincronizar quando contexto mudar externamente (mas não por nossa atualização)
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    
    const storeChecklist = checklist[storeId]?.tasks || {};
    const contextStr = JSON.stringify(storeChecklist);
    const localStr = JSON.stringify(localChecklist);
    
    // Sincronizar apenas se realmente mudou e não está vazio
    if (contextStr !== localStr && Object.keys(storeChecklist).length > 0) {
      setLocalChecklist(storeChecklist);
      console.log('🔄 [StoreDailyChecklist] Estado sincronizado do contexto externo:', storeChecklist);
    }
  }, [checklist[storeId]?.tasks, storeId]);
  
  // Recarregar do banco quando checklist mudar no contexto (sincronização)
  useEffect(() => {
    const reloadFromDatabase = async () => {
      if (!storeId || isUpdatingRef.current) return;
      
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const dayChecklist = await api.fetchDailyChecklist(storeId, todayStr);
        
        if (dayChecklist && dayChecklist.tasks) {
          const dbStr = JSON.stringify(dayChecklist.tasks);
          const localStr = JSON.stringify(localChecklist);
          
          if (dbStr !== localStr) {
            setLocalChecklist(dayChecklist.tasks);
            console.log('🔄 [StoreDailyChecklist] Dados sincronizados do banco:', dayChecklist.tasks);
          }
        }
      } catch (error) {
        console.error('❌ [StoreDailyChecklist] Erro ao sincronizar do banco:', error);
      }
    };
    
    // Aguardar um pouco antes de sincronizar para evitar loops
    const timeoutId = setTimeout(reloadFromDatabase, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist[storeId]?.tasks, storeId]);
  
  const storeTodayChecklist = localChecklist;
  
  const tasksBySector = useMemo(() => organizeTasksBySector(dailyTasks), [dailyTasks]);
  const sectors = Object.keys(tasksBySector);
  
  const totalTasks = dailyTasks.length;
  const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleCheckChange = useCallback((taskId, checked) => {
    console.log('🔄 [StoreDailyChecklist] Atualizando checklist:', { storeId, taskId, checked });
    
    isUpdatingRef.current = true;
    const previousState = { ...localChecklist };
    
    const newState = checked 
      ? { ...localChecklist, [taskId]: true }
      : (() => {
          const updated = { ...localChecklist };
          delete updated[taskId];
          return updated;
        })();
    
    setLocalChecklist(newState);
    
    updateChecklist(storeId, taskId, checked)
      .then(() => {
        console.log('✅ [StoreDailyChecklist] Checklist salvo no banco com sucesso');
        isUpdatingRef.current = false;
      })
      .catch((error) => {
        console.error('❌ [StoreDailyChecklist] Erro ao salvar no banco:', error);
        setLocalChecklist(previousState);
        isUpdatingRef.current = false;
      });
  }, [storeId, updateChecklist, localChecklist]);

  // Carregar histórico
  useEffect(() => {
    const loadHistory = async () => {
      if (!storeId) return;
      setLoadingHistory(true);
      try {
        const history = await api.fetchChecklistHistory(storeId, 7);
        setChecklistHistory(history || []);
        console.log('✅ [StoreDailyChecklist] Histórico carregado:', history?.length || 0);
      } catch (error) {
        console.error('❌ [StoreDailyChecklist] Erro ao carregar histórico:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [storeId, checklist[storeId]]); // Recarregar quando checklist mudar

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Checklist Diário - {storeName}</CardTitle>
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
                tasks={dailyTasks}
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
                const dayTasks = dayChecklist.tasks || {};
                const dayCompleted = Object.values(dayTasks).filter(Boolean).length;
                const dayPercentage = totalTasks > 0 ? (dayCompleted / totalTasks) * 100 : 0;
                
                return (
                  <Card key={dayChecklist.date} className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="text-lg font-bold">
                          {isToday(date) ? 'Hoje' : isYesterday(date) ? 'Ontem' : format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <Badge variant={dayPercentage === 100 ? 'default' : 'secondary'}>
                          {dayCompleted}/{totalTasks} ({dayPercentage.toFixed(0)}%)
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreDailyChecklist;
