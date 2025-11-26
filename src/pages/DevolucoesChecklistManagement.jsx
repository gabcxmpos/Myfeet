import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, CheckSquare, X, GripVertical, RotateCcw } from 'lucide-react';
import * as checklistService from '@/lib/checklistService';

const DevolucoesChecklistManagement = () => {
  const { user } = useAuth();
  const { users } = useData();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [formData, setFormData] = useState({
    task_text: '',
    task_order: 0,
    user_id: ''
  });

  // Filtrar usuários do perfil devoluções
  const devolucoesUsers = users?.filter(u => u.role === 'devoluções') || [];

  // Carregar tarefas (filtradas por usuário se selecionado)
  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await checklistService.fetchAllDevolucoesTasks(selectedUserId || null);
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar tarefas do checklist.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadTasks();
    }
  }, [user, selectedUserId]);

  // Abrir dialog para criar nova tarefa
  const handleCreate = () => {
    if (!selectedUserId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um usuário antes de criar uma tarefa.',
      });
      return;
    }
    setEditingTask(null);
    setFormData({ task_text: '', task_order: tasks.length, user_id: selectedUserId });
    setIsDialogOpen(true);
  };

  // Abrir dialog para editar tarefa
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      task_text: task.task_text,
      task_order: task.task_order || 0,
      user_id: task.user_id || ''
    });
    setIsDialogOpen(true);
  };

  // Salvar tarefa (criar ou atualizar)
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.task_text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'O texto da tarefa é obrigatório.',
      });
      return;
    }

    try {
      if (!formData.user_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'É necessário selecionar um usuário.',
        });
        return;
      }

      if (editingTask) {
        // Atualizar
        await checklistService.updateDevolucoesTask(editingTask.id, {
          task_text: formData.task_text.trim(),
          task_order: parseInt(formData.task_order) || 0,
          user_id: formData.user_id
        });
        toast({
          title: 'Sucesso!',
          description: 'Tarefa atualizada com sucesso.',
        });
      } else {
        // Criar
        await checklistService.createDevolucoesTask({
          task_text: formData.task_text.trim(),
          task_order: parseInt(formData.task_order) || 0,
          user_id: formData.user_id,
          created_by: user?.id
        });
        toast({
          title: 'Sucesso!',
          description: 'Tarefa criada com sucesso.',
        });
      }
      
      setIsDialogOpen(false);
      loadTasks();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao salvar tarefa.',
      });
    }
  };

  // Confirmar exclusão
  const handleDelete = async () => {
    if (!deleteTaskId) return;
    
    try {
      await checklistService.deleteDevolucoesTask(deleteTaskId);
      toast({
        title: 'Sucesso!',
        description: 'Tarefa excluída com sucesso.',
      });
      setDeleteTaskId(null);
      loadTasks();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao excluir tarefa.',
      });
    }
  };

  // Alternar status ativo/inativo
  const handleToggleActive = async (task) => {
    try {
      await checklistService.updateDevolucoesTask(task.id, {
        is_active: !task.is_active
      });
      toast({
        title: 'Sucesso!',
        description: `Tarefa ${!task.is_active ? 'ativada' : 'desativada'} com sucesso.`,
      });
      loadTasks();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao alterar status da tarefa.',
      });
    }
  };

  const activeTasks = tasks.filter(t => t.is_active);
  const inactiveTasks = tasks.filter(t => !t.is_active);

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <X className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Checklist de Devoluções - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Checklist de Devoluções</h1>
            <p className="text-muted-foreground mt-2">
              Cadastre e gerencie as tarefas do checklist de devoluções por usuário
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2" disabled={!selectedUserId}>
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Seletor de Usuário */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="user-select" className="text-base font-medium">
                Selecionar Usuário:
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select" className="w-[300px]">
                  <SelectValue placeholder="Selecione um usuário do perfil devoluções" />
                </SelectTrigger>
                <SelectContent>
                  {devolucoesUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.username || u.email || u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUserId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId('');
                    setTasks([]);
                  }}
                >
                  Limpar Filtro
                </Button>
              )}
            </div>
            {!selectedUserId && (
              <p className="text-sm text-muted-foreground mt-2">
                Selecione um usuário para visualizar e gerenciar suas tarefas.
              </p>
            )}
          </CardContent>
        </Card>

        {!selectedUserId ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">Selecione um usuário para visualizar e gerenciar suas tarefas.</div>
          </Card>
        ) : loading ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">Carregando tarefas...</div>
          </Card>
        ) : (
          <>
            {/* Tarefas Ativas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Tarefas Ativas ({activeTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa ativa. Clique em "Nova Tarefa" para começar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{task.task_text}</p>
                          <p className="text-xs text-muted-foreground">Ordem: {task.task_order}</p>
                        </div>
                        <Badge variant="secondary">Ativa</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(task)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTaskId(task.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tarefas Inativas */}
            {inactiveTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Tarefas Inativas ({inactiveTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inactiveTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-muted-foreground line-through">{task.task_text}</p>
                          <p className="text-xs text-muted-foreground">Ordem: {task.task_order}</p>
                        </div>
                        <Badge variant="outline">Inativa</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(task)}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTaskId(task.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Dialog para criar/editar tarefa */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <form onSubmit={handleSave} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="task_text">Texto da Tarefa *</Label>
                    <Input
                      id="task_text"
                      value={formData.task_text}
                      onChange={(e) => setFormData({ ...formData, task_text: e.target.value })}
                      placeholder="Ex: Verificar devoluções pendentes"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task_order">Ordem</Label>
                    <Input
                      id="task_order"
                      type="number"
                      min="0"
                      value={formData.task_order}
                      onChange={(e) => setFormData({ ...formData, task_order: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define a ordem de exibição (menor número aparece primeiro)
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                    <AlertDialogAction type="submit">
                      {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default DevolucoesChecklistManagement;

