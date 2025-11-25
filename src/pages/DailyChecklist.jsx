import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Edit, Calendar, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';

const StoreChecklistView = ({ storeId, showHistory = false, selectedDate = null, onDateChange = null, checklistType = 'operacional', embedded = false }) => {
    const { dailyTasks, gerencialTasks, checklist, updateChecklist, stores, fetchChecklistHistory } = useData();
    const { toast } = useToast();
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedDateChecklist, setSelectedDateChecklist] = useState(null);
    const [loadingChecklist, setLoadingChecklist] = useState(false);
    const [currentAudit, setCurrentAudit] = useState(null);
    const [historyAudits, setHistoryAudits] = useState({});
    
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
    
    // Função para formatar timestamp de auditoria
    const formatAuditTimestamp = (timestamp) => {
        if (!timestamp) return '';
        try {
            const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
            return format(dateObj, "dd/MM/yyyy HH:mm", { locale: ptBR });
        } catch {
            return '';
        }
    };
    
    // Buscar checklist do dia selecionado (sempre carregar do banco para garantir dados atualizados)
    const storeChecklist = selectedDateChecklist?.tasks || {};
    const totalTasks = tasks.length;
    const completedTasks = Object.values(storeChecklist).filter(Boolean).length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const auditTimestamp = formatAuditTimestamp(currentAudit?.updated_at || currentAudit?.audited_at);
    const auditMessage = currentAudit
        ? `Auditado por ${currentAudit?.audited_by_name || 'Supervisor'}${auditTimestamp ? ` em ${auditTimestamp}` : ''}`
        : 'Sem auditoria registrada';

    const loadAuditStatus = useCallback(async (dateToLoad) => {
        if (!storeId || !dateToLoad) {
            setCurrentAudit(null);
            return;
        }
        try {
            const auditData = await api.fetchChecklistAudit(storeId, dateToLoad, checklistType);
            setCurrentAudit(auditData);
        } catch (error) {
            console.warn('Erro ao carregar auditoria do checklist:', error);
            setCurrentAudit(null);
        }
    }, [storeId, checklistType]);

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
            loadAuditStatus(currentDate);
        }
    }, [storeId, currentDate, checklistType, loadChecklistForDate, loadAuditStatus]);

    // Carregar histórico se necessário
    const loadHistory = useCallback(async () => {
        if (!storeId) return;
        setLoadingHistory(true);
        try {
            const endDate = format(new Date(), 'yyyy-MM-dd');
            const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd'); // Últimos 7 dias
            const history = await fetchChecklistHistory(storeId, startDate, endDate, checklistType);
            setHistoryData(history);
            try {
                const auditsRange = await api.fetchChecklistAuditsRange(storeId, startDate, endDate, checklistType);
                const auditsMap = {};
                (auditsRange || []).forEach((audit) => {
                    auditsMap[audit.date] = audit;
                });
                setHistoryAudits(auditsMap);
            } catch (auditError) {
                console.warn('Erro ao carregar auditorias do histórico:', auditError);
                setHistoryAudits({});
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        } finally {
            setLoadingHistory(false);
        }
    }, [storeId, checklistType, fetchChecklistHistory]);

    useEffect(() => {
        if (showHistory && storeId) {
            loadHistory();
        } else {
            setHistoryData([]);
            setHistoryAudits({});
        }
    }, [showHistory, storeId, loadHistory]);

    if (embedded) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico dos Últimos 7 Dias
                </h3>
                {showHistory && historyData.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {historyData.map((item) => {
                            let itemDate = item.date;
                            try {
                                const dateObj = item.date.includes('T') 
                                    ? parseISO(item.date) 
                                    : new Date(item.date + 'T00:00:00');
                                itemDate = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
                            } catch (e) {
                                itemDate = item.date;
                            }
                            
                            const itemTasks = item.tasks || {};
                            const itemCompleted = Object.values(itemTasks).filter(Boolean).length;
                            const itemPercentage = totalTasks > 0 ? (itemCompleted / totalTasks) * 100 : 0;
                            const historyAudit = historyAudits[item.date];
                            
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
                                        {historyAudit ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                                <CheckCircle className="w-3 h-3" />
                                                Auditado
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Sem auditoria</span>
                                        )}
                                        <span className="font-bold text-primary">{itemPercentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {showHistory && historyData.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Nenhum histórico encontrado.</p>
                )}
            </div>
        );
    }

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
                <div className="mt-3">
                    <Badge variant={currentAudit ? 'default' : 'outline'} className="flex items-center gap-2">
                        {currentAudit ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{auditMessage}</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Tarefas Pendentes */}
                    {tasks.filter(task => !storeChecklist[task.id]).length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-foreground mb-2">Tarefas Pendentes</h3>
                            {tasks.filter(task => !storeChecklist[task.id]).map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center space-x-3 bg-secondary/50 p-4 rounded-lg"
                                >
                                    <Checkbox
                                        id={task.id}
                                        checked={false}
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
                    )}
                    
                    {/* Tarefas Realizadas - Minimizadas */}
                    {tasks.filter(task => storeChecklist[task.id]).length > 0 && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Tarefas Realizadas ({tasks.filter(task => storeChecklist[task.id]).length})
                            </h3>
                            <div className="space-y-2">
                                {tasks.filter(task => storeChecklist[task.id]).map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 p-2 rounded-md"
                                    >
                                        <Checkbox
                                            id={`completed-${task.id}`}
                                            checked={true}
                                            onCheckedChange={(checked) => handleCheckChange(task.id, checked)}
                                            className="h-4 w-4"
                                            disabled={loadingChecklist || !isToday}
                                        />
                                        <Label htmlFor={`completed-${task.id}`} className="text-sm text-muted-foreground line-through cursor-pointer flex-grow">
                                            {task.text}
                                        </Label>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Histórico */}
                {showHistory && historyData.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Histórico dos Últimos 7 Dias
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
                                const historyAudit = historyAudits[item.date];
                                
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
                                            {historyAudit ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Auditado
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Sem auditoria</span>
                                            )}
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
    const { stores, dailyTasks, gerencialTasks, updateChecklist, checklistAudits, toggleChecklistAuditStatus, users } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    const tasks = checklistType === 'gerencial' ? gerencialTasks : dailyTasks;
    const [storeChecklists, setStoreChecklists] = useState({});
    const [loading, setLoading] = useState(true);
    const [historyViewer, setHistoryViewer] = useState({ open: false, store: null });
    const [historySelectedDate, setHistorySelectedDate] = useState(null);
    const [selectedAuditor, setSelectedAuditor] = useState({}); // { storeId-checklistType: userId }
    const [showHistoryForStore, setShowHistoryForStore] = useState({}); // { storeId: boolean }
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isAdmin = user?.role === 'admin';
    const isSupervisor = user?.role === 'supervisor';

    // Supervisores agora veem todas as lojas
    const filteredStores = useMemo(() => {
        if (!stores || stores.length === 0) return [];
        // Admin e supervisor veem todas as lojas
        if (isAdmin || isSupervisor) return stores;
        return [];
    }, [stores, isAdmin, isSupervisor]);

    const openHistoryForStore = (store) => {
        setHistoryViewer({ open: true, store });
        setHistorySelectedDate(null);
    };

    const closeHistoryViewer = () => {
        setHistoryViewer({ open: false, store: null });
        setHistorySelectedDate(null);
    };
    
    // Sincronizar selectedAuditor com auditorias existentes
    useEffect(() => {
        if (isAdmin && filteredStores.length > 0) {
            const newSelectedAuditor = {};
            filteredStores.forEach(store => {
                const auditKey = `${store.id}-${todayStr}-${checklistType}`;
                const auditInfo = checklistAudits[auditKey];
                if (auditInfo?.audited_by) {
                    newSelectedAuditor[`${store.id}-${checklistType}`] = auditInfo.audited_by;
                }
            });
            setSelectedAuditor(prev => ({ ...prev, ...newSelectedAuditor }));
        }
    }, [isAdmin, filteredStores, checklistAudits, todayStr, checklistType]);
    
    // Buscar checklists das lojas do contexto do usuário
    useEffect(() => {
        const fetchAllChecklists = async () => {
            if (!filteredStores || filteredStores.length === 0) {
                setStoreChecklists({});
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const checklistsPromises = filteredStores.map(async (store) => {
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
        
        const interval = setInterval(fetchAllChecklists, 30000);
        return () => clearInterval(interval);
    }, [filteredStores, checklistType, todayStr]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando checklists...</p>
            </div>
        );
    }

    if (!filteredStores || filteredStores.length === 0) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                        {isSupervisor
                            ? 'Nenhuma loja associada ao seu usuário. Solicite ao administrador para vincular suas lojas.'
                            : 'Nenhuma loja encontrada.'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {filteredStores.map(store => {
                    const storeTodayChecklist = storeChecklists[store.id] || {};
                    const totalTasks = tasks.length;
                    const completedTasks = Object.values(storeTodayChecklist).filter(Boolean).length;
                    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                    const pendingTasks = tasks.filter(task => !storeTodayChecklist[task.id]);
                    const auditKey = `${store.id}-${todayStr}-${checklistType}`;
                    const auditInfo = checklistAudits[auditKey];
                    const isAudited = Boolean(auditInfo);
                    const auditDescription = isAudited
                        ? `Auditado por ${auditInfo?.audited_by_name || 'Supervisor'}`
                        : 'Sem auditoria registrada';

                    return (
                        <Card key={store.id} className="bg-card border-border">
                            <CardHeader>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <CardTitle className="text-xl font-bold">
                                            {store.name}{' '}
                                            <span className="text-sm text-muted-foreground font-normal">
                                                ({store.code})
                                            </span>
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={isAudited ? 'default' : 'outline'}>
                                                {auditDescription}
                                            </Badge>
                                            {isAdmin && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Label htmlFor={`auditor-select-${store.id}-${checklistType}`} className="text-xs">
                                                        Auditado por:
                                                    </Label>
                                                    <Select
                                                        value={selectedAuditor[`${store.id}-${checklistType}`] !== undefined 
                                                            ? selectedAuditor[`${store.id}-${checklistType}`] 
                                                            : (auditInfo?.audited_by || 'none')}
                                                        onValueChange={(userId) => {
                                                            const key = `${store.id}-${checklistType}`;
                                                            if (userId === 'none') {
                                                                // Remover auditoria
                                                                setSelectedAuditor(prev => ({ ...prev, [key]: 'none' }));
                                                                toggleChecklistAuditStatus(
                                                                    store.id, 
                                                                    todayStr, 
                                                                    checklistType, 
                                                                    false
                                                                );
                                                            } else {
                                                                // Criar/atualizar auditoria
                                                                setSelectedAuditor(prev => ({ ...prev, [key]: userId }));
                                                                const selectedUser = users.find(u => u.id === userId);
                                                                if (selectedUser) {
                                                                    toggleChecklistAuditStatus(
                                                                        store.id, 
                                                                        todayStr, 
                                                                        checklistType, 
                                                                        true,
                                                                        selectedUser.id,
                                                                        selectedUser.username || selectedUser.email
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[180px] h-8 text-xs">
                                                            <SelectValue placeholder="Selecione o auditor" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">
                                                                <span className="text-muted-foreground">Nenhum</span>
                                                            </SelectItem>
                                                            {users.filter(u => u.role === 'supervisor' || u.role === 'admin').map((userOption) => (
                                                                <SelectItem key={userOption.id} value={userOption.id}>
                                                                    {userOption.username || userOption.email}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            {isSupervisor && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Checkbox
                                                        id={`audit-${store.id}-${checklistType}`}
                                                        checked={isAudited}
                                                        onCheckedChange={(checked) => {
                                                            // Supervisor apenas marca/desmarca - o sistema usa o login atual automaticamente
                                                            toggleChecklistAuditStatus(store.id, todayStr, checklistType, checked);
                                                        }}
                                                    />
                                                    <Label htmlFor={`audit-${store.id}-${checklistType}`} className="cursor-pointer">
                                                        Marcar como auditado
                                                    </Label>
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openHistoryForStore(store)}
                                            >
                                                Ver checklist completo
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowHistoryForStore(prev => ({
                                                    ...prev,
                                                    [store.id]: !prev[store.id]
                                                }))}
                                                className="flex items-center gap-2"
                                            >
                                                <History className="w-4 h-4" />
                                                {showHistoryForStore[store.id] ? 'Ocultar' : 'Ver'} Histórico
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                        <span className="font-medium text-primary">{completionPercentage.toFixed(0)}%</span>
                                        <div className="w-full bg-secondary rounded-full h-1.5">
                                            <motion.div
                                                className="bg-primary h-1.5 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${completionPercentage}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            {/* Histórico da loja específica */}
                            {showHistoryForStore[store.id] && (
                                <CardContent className="border-t border-border pt-4 mt-4">
                                    <StoreChecklistView
                                        storeId={store.id}
                                        showHistory={true}
                                        checklistType={checklistType}
                                        embedded={true}
                                    />
                                </CardContent>
                            )}
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
                            <CardContent>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">Tarefas:</h4>
                                    {tasks.map((task) => {
                                        const isChecked = storeTodayChecklist[task.id] || false;
                                        return (
                                            <div key={task.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`${store.id}-${task.id}`}
                                                    checked={isChecked}
                                                    onCheckedChange={async (checked) => {
                                                        try {
                                                            await updateChecklist(store.id, task.id, checked, checklistType, true);
                                                            setStoreChecklists(prev => ({
                                                                ...prev,
                                                                [store.id]: {
                                                                    ...prev[store.id],
                                                                    [task.id]: checked
                                                                }
                                                            }));
                                                            const checklistData = checklistType === 'gerencial'
                                                                ? await api.fetchGerencialChecklistByDate(store.id, todayStr)
                                                                : await api.fetchChecklistByDate(store.id, todayStr);
                                                            setStoreChecklists(prev => ({
                                                                ...prev,
                                                                [store.id]: checklistData?.tasks || {}
                                                            }));
                                                        } catch (error) {
                                                            console.error('Erro ao atualizar checklist:', error);
                                                            toast({
                                                                variant: 'destructive',
                                                                title: 'Erro',
                                                                description: 'Erro ao atualizar checklist. Tente novamente.'
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Label 
                                                    htmlFor={`${store.id}-${task.id}`}
                                                    className={`text-sm font-normal cursor-pointer ${
                                                        isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                                                    }`}
                                                >
                                                    {task.text}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Dialog
                open={historyViewer.open}
                onOpenChange={(open) => {
                    if (!open) {
                        closeHistoryViewer();
                    } else {
                        setHistoryViewer(prev => ({ ...prev, open: true }));
                    }
                }}
            >
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>
                            Histórico de Checklists - {historyViewer.store?.name}{' '}
                            {historyViewer.store?.code && (
                                <span className="text-sm text-muted-foreground">({historyViewer.store.code})</span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {historyViewer.store && (
                        <StoreChecklistView
                            storeId={historyViewer.store.id}
                            showHistory
                            selectedDate={historySelectedDate}
                            onDateChange={setHistorySelectedDate}
                            checklistType={checklistType}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

const DailyChecklist = () => {
    const { user } = useAuth();
    const { stores } = useData();
    const navigate = useNavigate();
    const isLoja = user?.role === 'loja';
    const isAdmin = user?.role === 'admin';
    const isSupervisor = user?.role === 'supervisor';
    const isAdminOrSupervisor = isAdmin || isSupervisor;
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
                {isLoja ? (
                    user?.storeId ? (
                        <StoreChecklistView 
                            storeId={user.storeId} 
                            showHistory={showHistory}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            checklistType={activeTab}
                        />
                    ) : (
                        <Card className="bg-card border-border">
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    Sua loja não foi configurada. Entre em contato com o administrador.
                                </p>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    isAdminOrSupervisor && (
                        <AdminSupervisorChecklistView checklistType={activeTab} />
                    )
                )}
            </div>
        </>
    );
};

export default DailyChecklist;