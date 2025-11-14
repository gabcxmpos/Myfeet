import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, ArrowLeft, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ChecklistManagement = () => {
    const { dailyTasks, gerencialTasks, updateChecklistTasks, updateGerencialChecklistTasks } = useData();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('operacional'); // 'operacional' ou 'gerencial'
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Selecionar tarefas baseado na aba ativa
    const currentTasks = activeTab === 'gerencial' ? gerencialTasks : dailyTasks;
    const updateTasks = activeTab === 'gerencial' ? updateGerencialChecklistTasks : updateChecklistTasks;
    const checklistTitle = activeTab === 'gerencial' ? 'CHECK LIST PPAD GERENCIAL' : 'Checklist Operacional';

    // Carregar tarefas quando currentTasks mudar
    useEffect(() => {
        if (currentTasks && currentTasks.length > 0) {
            setTasks(currentTasks);
        } else {
            setTasks([]);
        }
    }, [currentTasks]);

    const handleAddTask = () => {
        if (!newTaskText.trim()) {
            toast({ 
                title: 'Erro', 
                description: 'Por favor, insira o texto da tarefa.', 
                variant: 'destructive' 
            });
            return;
        }

        const newTask = {
            id: `task-${Date.now()}`,
            text: newTaskText.trim()
        };

        setTasks([...tasks, newTask]);
        setNewTaskText('');
    };

    const handleDeleteTask = (taskId) => {
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    const handleUpdateTask = (taskId, newText) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, text: newText } : task
        ));
    };

    const handleSave = async () => {
        if (tasks.length === 0) {
            toast({ 
                title: 'Erro', 
                description: 'Você precisa ter pelo menos uma tarefa no checklist.', 
                variant: 'destructive' 
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateTasks(tasks);
            toast({ 
                title: 'Sucesso!', 
                description: `Tarefas do ${checklistTitle.toLowerCase()} atualizadas com sucesso.` 
            });
        } catch (error) {
            toast({ 
                title: 'Erro', 
                description: error.message || 'Erro ao salvar tarefas.', 
                variant: 'destructive' 
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Gerenciar Checklist Diário - MYFEET</title>
            </Helmet>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gerenciar Checklists</h1>
                        <p className="text-muted-foreground mt-1">
                            Adicione, edite ou remova tarefas dos checklists. As alterações serão aplicadas a todas as lojas.
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/checklist')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                </div>

                {/* Abas para alternar entre checklists */}
                <div className="border-b border-border">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setActiveTab('operacional');
                                setTasks(dailyTasks || []);
                            }}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'operacional'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Checklist Operacional
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('gerencial');
                                setTasks(gerencialTasks || []);
                            }}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'gerencial'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            CHECK LIST PPAD GERENCIAL
                        </button>
                    </div>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Tarefas do {checklistTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            Organize as tarefas do checklist. Você pode arrastar para reordenar (em breve).
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Lista de tarefas */}
                        <div className="space-y-2">
                            {tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-3 bg-secondary/50 p-4 rounded-lg"
                                >
                                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                                    <Input
                                        value={task.text}
                                        onChange={(e) => handleUpdateTask(task.id, e.target.value)}
                                        className="flex-1 bg-background"
                                        placeholder="Texto da tarefa"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Adicionar nova tarefa */}
                        <div className="flex gap-2 pt-4 border-t border-border">
                            <Input
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddTask();
                                    }
                                }}
                                placeholder="Digite o texto da nova tarefa..."
                                className="flex-1 bg-background"
                            />
                            <Button 
                                onClick={handleAddTask}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </Button>
                        </div>

                        {/* Botão salvar */}
                        <div className="flex justify-end pt-4 border-t border-border">
                            <Button 
                                onClick={handleSave}
                                disabled={isSaving || tasks.length === 0}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Informações importantes */}
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-foreground mb-2">Informações Importantes:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>As alterações serão aplicadas a todas as lojas imediatamente.</li>
                            <li>Os checklists preenchidos anteriormente não serão afetados.</li>
                            <li>Cada dia começa com um checklist em branco, mas o histórico é mantido.</li>
                            <li>As tarefas são ordenadas na ordem em que aparecem aqui.</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ChecklistManagement;

