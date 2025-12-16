import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CheckSquare, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import * as api from '@/lib/supabaseService';

const SECTORS = [
  'ABERTURA',
  'OPERACIONAL',
  'KPIS/RELATÓRIOS',
  'DIGITAL',
  'CRM',
  'VISUAL MERCHANDISING',
  'ATENDIMENTO',
  'OUTROS',
  'AMBIENTACAO',
  'ADMINISTRATIVO',
  'PESSOAS'
];

const ManageChecklists = () => {
  const { user } = useAuth();
  const { dailyTasks: contextDailyTasks, gerencialTasks, updateDailyTasks, updateGerencialTasks } = useData();
  const { toast } = useToast();
  
  const [dailyTasks, setDailyTasks] = useState([]);
  const [gerencialTasksState, setGerencialTasksState] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ text: '', sector: 'OUTROS' });
  const [activeTab, setActiveTab] = useState('diario');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar tarefas do contexto
    if (contextDailyTasks && Array.isArray(contextDailyTasks)) {
      setDailyTasks([...contextDailyTasks]);
    }
    if (gerencialTasks && Array.isArray(gerencialTasks)) {
      setGerencialTasksState([...gerencialTasks]);
    }
  }, [contextDailyTasks, gerencialTasks]);

  const handleAddTask = async () => {
    if (!newTask.text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, preencha o texto da tarefa.'
      });
      return;
    }

    setLoading(true);
    try {
      const tasks = activeTab === 'diario' ? dailyTasks : gerencialTasksState;
      const newId = activeTab === 'diario' 
        ? `task-${Date.now()}`
        : `${newTask.sector.toLowerCase().substring(0, 3)}-${Date.now()}`;
      
      const taskToAdd = {
        id: newId,
        text: newTask.text.trim(),
        sector: newTask.sector
      };

      const updatedTasks = [...tasks, taskToAdd];
      
      if (activeTab === 'diario') {
        setDailyTasks(updatedTasks);
        await api.upsertAppSettings('daily_tasks', updatedTasks);
        if (updateDailyTasks) {
          updateDailyTasks(updatedTasks);
        }
      } else {
        setGerencialTasksState(updatedTasks);
        await api.upsertAppSettings('gerencial_tasks', updatedTasks);
        if (updateGerencialTasks) {
          updateGerencialTasks(updatedTasks);
        }
      }

      setNewTask({ text: '', sector: 'OUTROS' });
      toast({
        title: 'Sucesso',
        description: 'Tarefa adicionada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao adicionar tarefa. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({ ...task });
  };

  const handleSaveEdit = async () => {
    if (!editingTask.text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, preencha o texto da tarefa.'
      });
      return;
    }

    setLoading(true);
    try {
      const tasks = activeTab === 'diario' ? dailyTasks : gerencialTasksState;
      const updatedTasks = tasks.map(t => 
        t.id === editingTask.id ? { ...editingTask } : t
      );

      if (activeTab === 'diario') {
        setDailyTasks(updatedTasks);
        await api.upsertAppSettings('daily_tasks', updatedTasks);
        if (updateDailyTasks) {
          updateDailyTasks(updatedTasks);
        }
      } else {
        setGerencialTasksState(updatedTasks);
        await api.upsertAppSettings('gerencial_tasks', updatedTasks);
        if (updateGerencialTasks) {
          updateGerencialTasks(updatedTasks);
        }
      }

      setEditingTask(null);
      toast({
        title: 'Sucesso',
        description: 'Tarefa atualizada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar tarefa. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return;
    }

    setLoading(true);
    try {
      const tasks = activeTab === 'diario' ? dailyTasks : gerencialTasksState;
      const updatedTasks = tasks.filter(t => t.id !== taskId);

      if (activeTab === 'diario') {
        setDailyTasks(updatedTasks);
        await api.upsertAppSettings('daily_tasks', updatedTasks);
        if (updateDailyTasks) {
          updateDailyTasks(updatedTasks);
        }
      } else {
        setGerencialTasksState(updatedTasks);
        await api.upsertAppSettings('gerencial_tasks', updatedTasks);
        if (updateGerencialTasks) {
          updateGerencialTasks(updatedTasks);
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Tarefa excluída com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao excluir tarefa. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTasksBySector = (tasks) => {
    const grouped = {};
    tasks.forEach(task => {
      if (!grouped[task.sector]) {
        grouped[task.sector] = [];
      }
      grouped[task.sector].push(task);
    });
    return grouped;
  };

  const renderTasksList = (tasks) => {
    const groupedTasks = getTasksBySector(tasks);
    const sectors = Object.keys(groupedTasks).sort();

    return (
      <div className="space-y-6">
        {sectors.map(sector => (
          <Card key={sector}>
            <CardHeader>
              <CardTitle className="text-lg">{sector}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedTasks[sector].map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {editingTask?.id === task.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingTask.text}
                          onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
                          className="flex-1"
                        />
                        <Select
                          value={editingTask.sector}
                          onValueChange={(value) => setEditingTask({ ...editingTask, sector: value })}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SECTORS.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={loading}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingTask(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1">{task.text}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Acesso negado. Apenas administradores podem gerenciar checklists.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Checklists - MYFEET</title>
      </Helmet>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <CheckSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Checklists</h1>
            <p className="text-muted-foreground">Edite, adicione ou remova tarefas dos checklists diário e PPAD gerencial.</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diario">Checklist Diário</TabsTrigger>
            <TabsTrigger value="gerencial">PPAD Gerencial</TabsTrigger>
          </TabsList>

          <TabsContent value="diario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Tarefa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="task-text">Texto da Tarefa</Label>
                    <Input
                      id="task-text"
                      value={newTask.text}
                      onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                      placeholder="Ex: Abertura Operacional"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask();
                        }
                      }}
                    />
                  </div>
                  <div className="w-[200px]">
                    <Label htmlFor="task-sector">Setor</Label>
                    <Select
                      value={newTask.sector}
                      onValueChange={(value) => setNewTask({ ...newTask, sector: value })}
                    >
                      <SelectTrigger id="task-sector">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(sector => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddTask} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {renderTasksList(dailyTasks)}
          </TabsContent>

          <TabsContent value="gerencial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Tarefa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="gerencial-task-text">Texto da Tarefa</Label>
                    <Input
                      id="gerencial-task-text"
                      value={newTask.text}
                      onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
                      placeholder="Ex: TAG SIZE"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask();
                        }
                      }}
                    />
                  </div>
                  <div className="w-[200px]">
                    <Label htmlFor="gerencial-task-sector">Setor</Label>
                    <Select
                      value={newTask.sector}
                      onValueChange={(value) => setNewTask({ ...newTask, sector: value })}
                    >
                      <SelectTrigger id="gerencial-task-sector">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(sector => (
                          <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddTask} disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {renderTasksList(gerencialTasksState)}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ManageChecklists;

