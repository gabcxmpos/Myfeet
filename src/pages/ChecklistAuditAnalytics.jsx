import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Store, 
  User,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, Tooltip, PieChart, Pie, Legend } from 'recharts';
import * as api from '@/lib/supabaseService';

const ChecklistAuditAnalytics = () => {
  const { stores, users } = useData();
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [checklistType, setChecklistType] = useState('operacional');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedAuditor, setSelectedAuditor] = useState('all');

  // Carregar auditorias
  useEffect(() => {
    const loadAudits = async () => {
      setLoading(true);
      try {
        const data = await api.fetchAllChecklistAudits(startDate, endDate, checklistType);
        setAudits(data || []);
      } catch (error) {
        console.error('Erro ao carregar auditorias:', error);
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };
    loadAudits();
  }, [startDate, endDate, checklistType]);

  // Filtrar auditorias
  const filteredAudits = useMemo(() => {
    let filtered = audits;
    
    if (selectedStore !== 'all') {
      filtered = filtered.filter(a => a.store_id === selectedStore);
    }
    
    if (selectedAuditor !== 'all') {
      filtered = filtered.filter(a => a.audited_by === selectedAuditor);
    }
    
    return filtered;
  }, [audits, selectedStore, selectedAuditor]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalAudits = filteredAudits.length;
    const uniqueStores = new Set(filteredAudits.map(a => a.store_id)).size;
    const uniqueAuditors = new Set(filteredAudits.map(a => a.audited_by).filter(Boolean)).size;
    const auditsByType = {
      operacional: filteredAudits.filter(a => a.checklist_type === 'operacional').length,
      gerencial: filteredAudits.filter(a => a.checklist_type === 'gerencial').length,
    };
    
    return {
      totalAudits,
      uniqueStores,
      uniqueAuditors,
      auditsByType,
    };
  }, [filteredAudits]);

  // Dados para gráfico de auditorias por auditor
  const auditsByAuditorData = useMemo(() => {
    const auditorMap = {};
    filteredAudits.forEach(audit => {
      const auditorName = audit.audited_by_name || 'Não informado';
      if (!auditorMap[auditorName]) {
        auditorMap[auditorName] = 0;
      }
      auditorMap[auditorName]++;
    });
    
    return Object.entries(auditorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [filteredAudits]);

  // Dados para gráfico de auditorias por loja
  const auditsByStoreData = useMemo(() => {
    const storeMap = {};
    filteredAudits.forEach(audit => {
      const storeName = audit.stores?.name || 'Loja desconhecida';
      if (!storeMap[storeName]) {
        storeMap[storeName] = 0;
      }
      storeMap[storeName]++;
    });
    
    return Object.entries(storeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [filteredAudits]);

  // Dados para gráfico de auditorias por data
  const auditsByDateData = useMemo(() => {
    const dateMap = {};
    filteredAudits.forEach(audit => {
      const date = format(new Date(audit.date + 'T00:00:00'), 'dd/MM', { locale: ptBR });
      if (!dateMap[date]) {
        dateMap[date] = 0;
      }
      dateMap[date]++;
    });
    
    return Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-'));
        const dateB = new Date(b.date.split('/').reverse().join('-'));
        return dateA - dateB;
      });
  }, [filteredAudits]);

  // Lista de lojas auditadas com detalhes
  const storesAuditDetails = useMemo(() => {
    const storeMap = {};
    filteredAudits.forEach(audit => {
      const storeId = audit.store_id;
      if (!storeMap[storeId]) {
        storeMap[storeId] = {
          store: audit.stores,
          audits: [],
          auditors: new Set(),
        };
      }
      storeMap[storeId].audits.push(audit);
      if (audit.audited_by_name) {
        storeMap[storeId].auditors.add(audit.audited_by_name);
      }
    });
    
    return Object.values(storeMap).map(item => ({
      store: item.store,
      totalAudits: item.audits.length,
      auditors: Array.from(item.auditors),
      auditorsCount: item.auditors.size,
      lastAudit: item.audits.sort((a, b) => new Date(b.date) - new Date(a.date))[0],
    })).sort((a, b) => b.totalAudits - a.totalAudits);
  }, [filteredAudits]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando análise de auditorias...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Análise de Auditorias - MYFEET</title>
      </Helmet>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Análise de Auditorias
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize a performance das lojas e análise das auditorias realizadas
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Checklist</Label>
                <Select value={checklistType} onValueChange={setChecklistType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="gerencial">Gerencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loja</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as lojas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Auditor</Label>
                <Select value={selectedAuditor} onValueChange={setSelectedAuditor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os auditores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os auditores</SelectItem>
                    {users.filter(u => u.role === 'supervisor' || u.role === 'admin').map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Auditorias</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.totalAudits}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lojas Auditadas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.uniqueStores}</p>
                </div>
                <Store className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auditores Ativos</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.uniqueAuditors}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Operacional / Gerencial</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {stats.auditsByType.operacional} / {stats.auditsByType.gerencial}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Auditorias por Auditor */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Top 10 Auditores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditsByAuditorData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Auditorias por Loja */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Top 10 Lojas Mais Auditadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditsByStoreData}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Auditorias por Data */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Auditorias por Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={auditsByDateData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de Lojas Auditadas */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Lojas Auditadas - Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {storesAuditDetails.length > 0 ? (
                storesAuditDetails.map((item, index) => (
                  <motion.div
                    key={item.store?.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/50 p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {item.store?.name || 'Loja desconhecida'}
                          </h3>
                          {item.store?.code && (
                            <Badge variant="outline">{item.store.code}</Badge>
                          )}
                          {item.store?.bandeira && (
                            <Badge variant="secondary">{item.store.bandeira}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Total de Auditorias</p>
                            <p className="text-lg font-bold text-primary">{item.totalAudits}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Auditores Diferentes</p>
                            <p className="text-lg font-bold text-blue-500">{item.auditorsCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Última Auditoria</p>
                            <p className="text-sm font-medium text-foreground">
                              {item.lastAudit ? format(new Date(item.lastAudit.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Último Auditor</p>
                            <p className="text-sm font-medium text-foreground">
                              {item.lastAudit?.audited_by_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        {item.auditors.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">Auditores:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.auditors.map((auditor, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <User className="w-3 h-3 mr-1" />
                                  {auditor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma auditoria encontrada para os filtros selecionados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChecklistAuditAnalytics;

