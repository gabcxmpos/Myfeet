import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Edit, Calendar, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';

const StoreChecklistView = ({ storeId, showHistory = false, selectedDate = null, onDateChange = null, checklistType = 'operacional' }) => {
    const { dailyTasks, gerencialTasks, checklist, updateChecklist, stores, fetchChecklistHistory } = useData();
    const { toast } = useToast();
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedDateChecklist, setSelectedDateChecklist] = useState(null);
    const [loadingChecklist, setLoadingChecklist] = useState(false);
    
    // Selecionar tarefas baseado no tipo de checklist
    const tasks = checklistType === 'gerencial' ? gerencialTasks : dailyTasks;
    
    const storeName = stores.find(s => s.id === storeId)?.name || "sua loja";
    const checklistTitle = checklistType === 'gerencial' ? 'CHECK LIST PPAD GERENCIAL' : 'Checklist Diário';
    
    // Usar data selecionada ou data atual
    const currentDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
    const isToday = !selectedDate || selectedDate === format(new Date(), 'yyyy-MM-dd');
    
    // Formatar data para exibição
    let displayDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    if (selectedDate) {
        try {
            // Tentar parsear a data (pode vir como string ISO ou formato yyyy-MM-dd)
            const dateObj = selectedDate.includes('T') ? parseISO(selectedDate) : new Date(selectedDate + 'T00:00:00');
            displayDate = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
        } catch (e) {
            displayDate = selectedDate;
        }
    }
    
    // Buscar checklist do dia selecionado (sempre carregar do banco para garantir dados atualizados)
    const storeChecklist = selectedDateChecklist?.tasks || {};
    const totalTasks = tasks.length;
    const completedTasks = Object.values(storeChecklist).filter(Boolean).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Carregar checklist para uma data específica
    const loadChecklistForDate = useCallback(async (date) => {
        if (!storeId || !date) return;
        setLoadingChecklist(true);
        try {
            // Buscar checklist baseado no tipo
            const checklistData = checklistType === 'gerencial' 
                ? await api.fetchGerencialChecklistByDate(storeId, date)
                : await api.fetchChecklistByDate(storeId, date);
            setSelectedDateChecklist(checklistData);
        } catch (error) {
            console.error('Erro ao carregar checklist:', error);
            setSelectedDateChecklist(null);
        } finally {
            setLoadingChecklist(false);
        }
    }, [storeId, checklistType]);

    const handleCheckChange = async (taskId, checked) => {
        // Só permitir editar o checklist do dia atual
        if (!isToday) {
            toast({ 
                title: 'Atenção', 
                description: 'Você só pode editar o checklist do dia atual.', 
                variant: 'default' 
            });
            return;
        }
        try {
            await updateChecklist(storeId, taskId, checked, checklistType);
            // Recarregar checklist após atualizar
            await loadChecklistForDate(currentDate);
        } catch (error) {
            console.error('Erro ao atualizar checklist:', error);
        }
    };

    // Carregar checklist quando a data mudar ou quando selectedDate ou checklistType mudar
    useEffect(() => {
        if (storeId && currentDate) {
            loadChecklistForDate(currentDate);
        }
    }, [storeId, currentDate, checklistType, loadChecklistForDate]);

    // Carregar histórico se necessário
    const loadHistory = useCallback(async () => {
        if (!storeId) return;
        setLoadingHistory(true);
        try {
            const endDate = format(new Date(), 'yyyy-MM-dd');
            const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd'); // Últimos 30 dias
            const history = await fetchChecklistHistory(storeId, startDate, endDate, checklistType);
            setHistoryData(history);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [storeId, checklistType, fetchChecklistHistory]);

    useEffect(() => {
        if (showHistory && storeId) {
            loadHistory();
        }
    }, [showHistory, storeId, loadHistory]);

    return (
        <Card className="bg-card border-border">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                    {checklistTitle} - {storeName}
                    {selectedDate && <span className="text-lg text-muted-foreground ml-2">({displayDate})</span>}
                </CardTitle>
                <div className="flex items-center gap-4 text-muted-foreground mt-2">
                    <span>Progresso:</span>
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
                    {tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg"
                        >
                            <Checkbox
                                id={task.id}
                                checked={!!storeChecklist[task.id]}
                                onCheckedChange={(checked) => handleCheckChange(task.id, checked)}
                                className="h-5 w-5"
                                disabled={loadingChecklist || !isToday}
                            />
                            <Label htmlFor={task.id} className="text-base font-medium text-foreground cursor-pointer flex-grow">
                                {task.text}
                            </Label>
                        </motion.div>
                    ))}
                </div>

                {/* Histórico */}
                {showHistory && historyData.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Histórico dos Últimos 30 Dias
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {historyData.map((item) => {
                                // Formatar data (pode vir como string ISO ou formato yyyy-MM-dd)
                                let itemDate = item.date;
                                try {
                                    const dateObj = item.date.includes('T') 
                                        ? parseISO(item.date) 
                                        : new Date(item.date + 'T00:00:00');
                                    itemDate = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                                } catch (e) {
                                    // Se não conseguir parsear, usar a data original
                                    itemDate = item.date;
                                }
                                
                                const itemTasks = item.tasks || {};
                                const itemCompleted = Object.values(itemTasks).filter(Boolean).length;
                                const itemPercentage = totalTasks > 0 ? (itemCompleted / totalTasks) * 100 : 0;
                                
                                return (
                                    <div 
                                        key={item.date} 
                                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                                        onClick={() => {
                                            if (onDateChange) {
                                                onDateChange(item.date);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{itemDate}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">
                                                {itemCompleted}/{totalTasks} tarefas
                                            </span>
                                            <span className="font-bold text-primary">{itemPercentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const AdminSupervisorChecklistView = ({ checklistType = 'operacional' }) => {
    const { stores, dailyTasks, gerencialTasks } = useData();
    const tasks = checklistType === 'gerencial' ? gerencialTasks : dailyTasks;
    const checklistTitle = checklistType === 'gerencial' ? 'CHECK LIST PPAD GERENCIAL' : 'Checklist Diário';
    const [storeChecklists, setStoreChecklists] = useState({});
    const [loading, setLoading] = useState(true);

    // Buscar checklists de todas as lojas para o dia atual
    useEffect(() => {
        const fetchAllChecklists = async () => {
            if (!stores || stores.length === 0) return;
            setLoading(true);
            try {
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const checklistsPromises = stores.map(async (store) => {
                    try {
                        const checklistData = checklistType === 'gerencial'
                            ? await api.fetchGerencialChecklistByDate(store.id, todayStr)
                            : await api.fetchChecklistByDate(store.id, todayStr);
                        return { storeId: store.id, checklist: checklistData };
                    } catch (error) {
                        console.error(`Erro ao buscar checklist da loja ${store.id}:`, error);
                        return { storeId: store.id, checklist: null };
                    }
                });
                
                const results = await Promise.all(checklistsPromises);
                const checklistsMap = {};
                results.forEach(({ storeId, checklist }) => {
                    checklistsMap[storeId] = checklist?.tasks || {};
                });
                setStoreChecklists(checklistsMap);
            } catch (error) {
                console.error('Erro ao buscar checklists:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllChecklists();
        
        // Atualizar checklists a cada 30 segundos para garantir sincronização
        const interval = setInterval(fetchAllChecklists, 30000);
        
        return () => clearInterval(interval);
    }, [stores, checklistType]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando checklists...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {stores.map(store => {
                const storeTodayChecklist = storeChecklists[store.id] || {};
                const totalTasks = tasks.length;
                const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
                const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                const pendingTasks = tasks.filter(task => !storeTodayChecklist[task.id]);

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
    const navigate = useNavigate();
    const isLoja = user.role === 'loja';
    const isAdmin = user.role === 'admin';
    const isAdminOrSupervisor = user.role === 'admin' || user.role === 'supervisor';
    const [showHistory, setShowHistory] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [activeTab, setActiveTab] = useState('operacional'); // 'operacional' ou 'gerencial'

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setShowHistory(false);
        // O StoreChecklistView vai recarregar automaticamente via useEffect
    };

    const handleViewToday = () => {
        setSelectedDate(null);
        setShowHistory(false);
    };

    return (
        <>
            <Helmet>
                <title>Checklist Diário - MYFEET</title>
            </Helmet>
            <div className="space-y-6">
                {/* Cabeçalho com botões */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Checklists Diários</h1>
                        <p className="text-muted-foreground mt-1">
                            {isLoja ? 'Complete as tarefas diárias da sua loja' : 'Acompanhe o progresso das lojas'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Button 
                                onClick={() => navigate('/checklist/management')}
                                className="flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Gerenciar Checklists
                            </Button>
                        )}
                        {isLoja && (
                            <>
                                <Button 
                                    variant="outline"
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="flex items-center gap-2"
                                >
                                    <History className="w-4 h-4" />
                                    {showHistory ? 'Ocultar' : 'Ver'} Histórico
                                </Button>
                                {selectedDate && (
                                    <Button 
                                        variant="outline"
                                        onClick={handleViewToday}
                                        className="flex items-center gap-2"
                                    >
                                        Ver Hoje
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Abas para alternar entre checklists */}
                <div className="border-b border-border">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setActiveTab('operacional');
                                setSelectedDate(null);
                                setShowHistory(false);
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
                                setSelectedDate(null);
                                setShowHistory(false);
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

                {/* Conteúdo */}
                {isLoja && (
                    <StoreChecklistView 
                        storeId={user.storeId} 
                        showHistory={showHistory}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        checklistType={activeTab}
                    />
                )}
                {isAdminOrSupervisor && !isLoja && (
                    <AdminSupervisorChecklistView checklistType={activeTab} />
                )}
            </div>
        </>
    );
};

export default DailyChecklist;
