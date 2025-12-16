import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, CheckSquare, Calendar, Store, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ChecklistAuditAnalytics = () => {
  const { stores, checklistAudits, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checklistType, setChecklistType] = useState('operacional');
  const [auditingChecklist, setAuditingChecklist] = useState(null);

  // Refresh automático otimizado
  useOptimizedRefresh(fetchData);

  const handleMarkAsAudited = async (checklistItem) => {
    try {
      setAuditingChecklist(`${checklistItem.store_id}-${checklistItem.date}-${checklistItem.checklist_type || 'operacional'}`);
      
      // Preparar dados para atualização
      const updateData = {
        is_audited: true,
        audited_by: user?.id,
        audited_at: new Date().toISOString()
      };
      
      // Atualizar o checklist como auditado
      const { error } = await supabase
        .from('daily_checklists')
        .update(updateData)
        .eq('store_id', checklistItem.store_id)
        .eq('date', checklistItem.date);
      
      if (error) {
        // Se o erro for de coluna não encontrada, tentar sem os campos extras
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('Campos de auditoria não encontrados, tentando atualização simples...');
          const { error: simpleError } = await supabase
            .from('daily_checklists')
            .update({ is_audited: true })
            .eq('store_id', checklistItem.store_id)
            .eq('date', checklistItem.date);
          
          if (simpleError) throw simpleError;
        } else {
          throw error;
        }
      }
      
      toast({
        title: 'Sucesso',
        description: 'Checklist marcado como auditado.',
      });
      
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

  // Filtrar checklists baseado nos filtros
  const filteredChecklists = useMemo(() => {
    if (!checklistAudits || Object.keys(checklistAudits).length === 0) return [];
    
    let filtered = Object.values(checklistAudits);
    
    if (selectedStore && selectedStore !== 'all') {
      filtered = filtered.filter(c => c.store_id === selectedStore);
    }
    
    if (selectedDate) {
      filtered = filtered.filter(c => c.date === selectedDate);
    }
    
    if (checklistType) {
      filtered = filtered.filter(c => (c.checklist_type || 'operacional') === checklistType);
    }
    
    return filtered;
  }, [checklistAudits, selectedStore, selectedDate, checklistType]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = filteredChecklists.length;
    
    // Verificar se está completo baseado nas tarefas
    const completed = filteredChecklists.filter(c => {
      if (!c.tasks || typeof c.tasks !== 'object') return false;
      const tasks = Object.values(c.tasks);
      // Considerar completo se houver pelo menos uma tarefa marcada
      // ou se todas as tarefas estiverem marcadas (dependendo da lógica de negócio)
      return tasks.some(task => task === true);
    }).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      pending: total - completed,
      completionRate: completionRate.toFixed(1)
    };
  }, [filteredChecklists]);

  return (
    <>
      <Helmet>
        <title>Análise de Auditoria de Checklists - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Análise de Auditoria de Checklists
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize e analise o desempenho dos checklists
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store">Loja</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger id="store">
                    <SelectValue placeholder="Todas as lojas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} - {store.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Checklist</Label>
                <Select value={checklistType} onValueChange={setChecklistType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="gerencial">Gerencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Checklists</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.completionRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Lista de Checklists */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Checklists Encontrados ({filteredChecklists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredChecklists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum checklist encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredChecklists.map((checklistItem) => {
                  const store = stores.find(s => s.id === checklistItem.store_id);
                  return (
                    <motion.div
                      key={`${checklistItem.store_id}-${checklistItem.date}-${checklistItem.checklist_type || 'operacional'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-secondary/30 rounded-lg p-4 border border-border/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Store className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {store?.name || 'Loja não encontrada'} - {store?.code || ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(checklistItem.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • 
                            Tipo: {(checklistItem.checklist_type || 'operacional').charAt(0).toUpperCase() + (checklistItem.checklist_type || 'operacional').slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const hasTasks = checklistItem.tasks && typeof checklistItem.tasks === 'object';
                          const completedTasks = hasTasks ? Object.values(checklistItem.tasks).filter(t => t === true).length : 0;
                          const totalTasks = hasTasks ? Object.keys(checklistItem.tasks).length : 0;
                          const isCompleted = hasTasks && completedTasks > 0 && completedTasks === totalTasks;
                          const hasProgress = hasTasks && completedTasks > 0 && completedTasks < totalTasks;
                          const isAudited = checklistItem.is_audited === true;
                          const checklistKey = `${checklistItem.store_id}-${checklistItem.date}-${checklistItem.checklist_type || 'operacional'}`;
                          const isAuditing = auditingChecklist === checklistKey;
                          
                          return (
                            <>
                              {isCompleted && !isAudited && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsAudited(checklistItem)}
                                  disabled={isAuditing}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {isAuditing ? 'Marcando...' : 'Marcar como Auditado'}
                                </Button>
                              )}
                              {isAudited && (
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Auditado
                                </span>
                              )}
                              {isCompleted && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                                  Concluído ({completedTasks}/{totalTasks})
                                </span>
                              )}
                              {hasProgress && !isCompleted && (
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                  Em Progresso ({completedTasks}/{totalTasks})
                                </span>
                              )}
                              {!hasProgress && !isCompleted && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                                  Pendente
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChecklistAuditAnalytics;
