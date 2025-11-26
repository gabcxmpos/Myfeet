import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import * as checklistService from '@/lib/checklistService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DevolucoesChecklist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar tarefas e execução
  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [tasksData, executionData] = await Promise.all([
        checklistService.fetchDevolucoesTasks(user.id), // Buscar tarefas do usuário
        checklistService.fetchDevolucoesExecution(user.id)
      ]);
      
      setTasks(tasksData || []);
      setExecution(executionData);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar checklist.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'devoluções' || user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  // Status das tarefas (tasks é um JSONB {task_id: true/false})
  const tasksStatus = useMemo(() => {
    if (!execution || !execution.tasks) return {};
    return execution.tasks;
  }, [execution]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = Object.keys(tasksStatus).filter(taskId => tasksStatus[taskId] === true).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [tasks, tasksStatus]);

  // Alternar status de uma tarefa
  const handleToggleTask = async (taskId) => {
    if (saving) return;
    
    const newStatus = {
      ...tasksStatus,
      [taskId]: !tasksStatus[taskId]
    };

    setSaving(true);
    try {
      const updated = await checklistService.upsertDevolucoesExecution(user.id, newStatus);
      setExecution(updated);
      toast({
        title: 'Sucesso!',
        description: 'Checklist atualizado.',
      });
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar checklist.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'devoluções' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">Carregando checklist...</div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checklist de Devoluções - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checklist de Devoluções</h1>
            <p className="text-muted-foreground mt-2">
              Marque as tarefas conforme você as completa
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {stats.completed} de {stats.total} tarefas concluídas
                </span>
                <Badge variant={stats.percentage === 100 ? 'default' : 'secondary'}>
                  {stats.percentage.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={stats.percentage} className="h-2" />
              {execution?.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {format(new Date(execution.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa cadastrada ainda. O admin precisa cadastrar as tarefas primeiro.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => {
                  const isCompleted = tasksStatus[task.id] === true;
                  
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-card border-border hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleTask(task.id)}
                        disabled={saving}
                        className="w-5 h-5"
                      />
                      <Label
                        htmlFor={`task-${task.id}`}
                        className={`flex-1 cursor-pointer ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                        onClick={() => handleToggleTask(task.id)}
                      >
                        {task.task_text}
                      </Label>
                      {isCompleted && (
                        <Badge variant="default" className="gap-1">
                          <CheckSquare className="w-3 h-3" />
                          Concluída
                        </Badge>
                      )}
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

export default DevolucoesChecklist;

