import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, CheckSquare, Calendar, User, TrendingUp, AlertCircle, CheckCircle2, Shield, Store } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ChecklistAuditAnalytics = () => {
  const { stores, fetchData, users } = useData();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checklistType, setChecklistType] = useState('operacional');
  const [checklistAudits, setChecklistAudits] = useState({});
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [supervisors, setSupervisors] = useState([]);

  // Verificar se é admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  // Carregar supervisors
  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        // Buscar todos os usuários com role supervisor
        const { data: supervisorsData, error } = await supabase
          .from('app_users')
          .select('id, username, role')
          .in('role', ['supervisor', 'admin'])
          .order('username');
        
        if (error) throw error;
        setSupervisors(supervisorsData || []);
      } catch (error) {
        console.error('Erro ao carregar supervisors:', error);
      }
    };
    
    loadSupervisors();
  }, []);

  // Carregar checklists auditados
  useEffect(() => {
    const loadChecklistAudits = async () => {
      setLoadingAudits(true);
      try {
        // Buscar checklists auditados com informações do supervisor
        const { data: simpleData, error: simpleError } = await supabase
          .from('daily_checklists')
          .select('*, stores(id, name, code)')
          .eq('is_audited', true)
          .not('audited_by', 'is', null)
          .order('date', { ascending: false })
          .limit(1000);
        
        if (simpleError) throw simpleError;
        
        // Buscar informações dos usuários separadamente (apenas username, sem email)
        const auditsWithUsers = await Promise.all((simpleData || []).map(async (item) => {
          if (item.audited_by) {
            try {
              const { data: userData } = await supabase
                .from('app_users')
                .select('id, username, role')
                .eq('id', item.audited_by)
                .maybeSingle();
              
              return { ...item, audited_by_user: userData };
            } catch {
              return item;
            }
          }
          return item;
        }));
        
        const auditsMap = {};
        auditsWithUsers.forEach(item => {
          const key = `${item.store_id}-${item.date}`;
          auditsMap[key] = item;
        });
        setChecklistAudits(auditsMap);
      } catch (error) {
        console.error('Erro ao carregar checklists auditados:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao carregar dados de auditoria.',
        });
      } finally {
        setLoadingAudits(false);
      }
    };
    
    loadChecklistAudits();
  }, [toast]);

  // Refresh automático otimizado
  useOptimizedRefresh(fetchData);

  // Filtrar checklists baseado nos filtros
  const filteredChecklists = useMemo(() => {
    if (!checklistAudits || Object.keys(checklistAudits).length === 0) return [];
    
    let filtered = Object.values(checklistAudits);
    
    if (selectedDate) {
      filtered = filtered.filter(c => c.date === selectedDate);
    }
    
    if (checklistType) {
      filtered = filtered.filter(c => (c.checklist_type || 'operacional') === checklistType);
    }
    
    return filtered;
  }, [checklistAudits, selectedDate, checklistType]);

  // Agrupar por supervisor e calcular produtividade
  const supervisorStats = useMemo(() => {
    if (!filteredChecklists.length || !supervisors.length) return [];

    const statsBySupervisor = {};

    // Inicializar estatísticas para cada supervisor
    supervisors.forEach(supervisor => {
      statsBySupervisor[supervisor.id] = {
        supervisor,
        totalAudited: 0,
        totalChecklists: 0,
        storesAudited: new Set(),
        dates: new Set(),
        lastAuditDate: null,
      };
    });

    // Processar checklists auditados
    filteredChecklists.forEach(checklist => {
      if (checklist.audited_by && checklist.is_audited) {
        const supervisorId = checklist.audited_by;
        
        if (statsBySupervisor[supervisorId]) {
          statsBySupervisor[supervisorId].totalAudited++;
          statsBySupervisor[supervisorId].storesAudited.add(checklist.store_id);
          statsBySupervisor[supervisorId].dates.add(checklist.date);
          
          const auditDate = checklist.audited_at ? new Date(checklist.audited_at) : new Date(checklist.date);
          if (!statsBySupervisor[supervisorId].lastAuditDate || 
              auditDate > statsBySupervisor[supervisorId].lastAuditDate) {
            statsBySupervisor[supervisorId].lastAuditDate = auditDate;
          }
        }
      }
    });

    // Converter para array e calcular métricas
    return Object.values(statsBySupervisor)
      .map(stat => ({
        ...stat,
        storesAuditedCount: stat.storesAudited.size,
        datesCount: stat.dates.size,
        averagePerDay: stat.datesCount > 0 ? (stat.totalAudited / stat.datesCount).toFixed(1) : '0',
      }))
      .sort((a, b) => b.totalAudited - a.totalAudited); // Ordenar por total auditado
  }, [filteredChecklists, supervisors]);

  // Calcular estatísticas gerais
  const stats = useMemo(() => {
    const totalAudited = filteredChecklists.filter(c => c.is_audited).length;
    const uniqueSupervisors = new Set(
      filteredChecklists
        .filter(c => c.audited_by)
        .map(c => c.audited_by)
    ).size;
    const uniqueStores = new Set(
      filteredChecklists
        .filter(c => c.is_audited)
        .map(c => c.store_id)
    ).size;

    return {
      totalAudited,
      uniqueSupervisors,
      uniqueStores,
      averagePerSupervisor: uniqueSupervisors > 0 ? (totalAudited / uniqueSupervisors).toFixed(1) : '0',
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
              <Shield className="w-8 h-8 text-primary" />
              Análise de Auditoria de Checklists
            </h1>
            <p className="text-muted-foreground mt-1">
              Produtividade por supervisor
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Auditado</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.totalAudited}</p>
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
                <p className="text-sm text-muted-foreground">Supervisores Ativos</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{stats.uniqueSupervisors}</p>
              </div>
              <User className="w-8 h-8 text-green-400 opacity-50" />
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
                <p className="text-sm text-muted-foreground">Lojas Auditadas</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{stats.uniqueStores}</p>
              </div>
              <Store className="w-8 h-8 text-blue-400 opacity-50" />
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
                <p className="text-sm text-muted-foreground">Média por Supervisor</p>
                <p className="text-2xl font-bold text-primary mt-1">{stats.averagePerSupervisor}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Produtividade por Supervisor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Produtividade por Supervisor ({supervisorStats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAudits ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregando dados de auditoria...</p>
              </div>
            ) : supervisorStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado de auditoria encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {supervisorStats.map((stat, index) => (
                  <motion.div
                    key={stat.supervisor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/30 rounded-lg p-6 border border-border/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-lg">
                            {stat.supervisor.username || 'Supervisor sem nome'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {stat.supervisor.role === 'admin' ? 'Administrador' : 'Supervisor'}
                          </p>
                        </div>
                      </div>
                      {stat.lastAuditDate && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Última auditoria</p>
                          <p className="text-sm font-medium text-foreground">
                            {format(stat.lastAuditDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Total Auditado</p>
                        <p className="text-2xl font-bold text-primary">{stat.totalAudited}</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Lojas Auditadas</p>
                        <p className="text-2xl font-bold text-blue-400">{stat.storesAuditedCount}</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Dias Ativos</p>
                        <p className="text-2xl font-bold text-green-400">{stat.datesCount}</p>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Média por Dia</p>
                        <p className="text-2xl font-bold text-purple-400">{stat.averagePerDay}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChecklistAuditAnalytics;
