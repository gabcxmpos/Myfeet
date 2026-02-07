import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

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
    const { stores, dailyTasks, checklist } = useData();

    return (
        <div className="space-y-6">
            {stores.map(store => {
                const storeTodayChecklist = checklist[store.id]?.tasks || {};
                const totalTasks = dailyTasks.length;
                const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
                const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                const pendingTasks = dailyTasks.filter(task => !storeTodayChecklist[task.id]);

                return (
                    <Card key={store.id} className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span className="text-xl font-bold">{store.name} <span className="text-sm text-muted-foreground font-normal">({store.code})</span></span>
                                <span className="text-lg font-bold text-primary">{completionPercentage.toFixed(0)}%</span>
                            </CardTitle>
                             <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                <motion.div
                                    className="bg-primary h-1.5 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercentage}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </CardHeader>
                        {pendingTasks.length > 0 && (
                            <CardContent>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tarefas Pendentes:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {pendingTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-1.5 text-xs bg-destructive/10 text-destructive-foreground px-2 py-1 rounded-md">
                                            <XCircle className="w-3 h-3"/>
                                            <span>{task.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                        {pendingTasks.length === 0 && (
                             <CardContent>
                                 <div className="flex items-center justify-center gap-2 text-green-500 py-4">
                                     <CheckCircle className="w-5 h-5"/>
                                     <p className="font-semibold">Todas as tarefas foram concluídas!</p>
                                 </div>
                             </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
};

const DailyChecklist = () => {
    const { user } = useAuth();
    const isLoja = user.role === 'loja';
    const isAdminOrSupervisor = user.role === 'admin' || user.role === 'supervisor';

    return (
        <>
            <Helmet>
                <title>Checklist Diário - MYFEET</title>
            </Helmet>
            <div className="space-y-6">
                {isLoja && <StoreChecklistView storeId={user.storeId} />}
                {isAdminOrSupervisor && <AdminSupervisorChecklistView />}
            </div>
        </>
    );
};

export default DailyChecklist;