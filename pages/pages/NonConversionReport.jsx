import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye, X, BarChart3, TrendingUp, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as api from '@/lib/supabaseService';
import { motion } from 'framer-motion';

const SITUACOES = [
  { value: 'GRADE', label: 'Grade' },
  { value: 'PREÇO', label: 'Preço' },
  { value: 'PRODUTO', label: 'Produto' },
  { value: 'OUTROS', label: 'Outros' },
];

const NonConversionReport = () => {
  const { user } = useAuth();
  const { collaborators } = useData();
  const { toast } = useToast();

  // Debug
  useEffect(() => {
    console.log('🔍 [NonConversionReport] Componente montado');
    console.log('🔍 [NonConversionReport] User:', user);
    console.log('🔍 [NonConversionReport] User role:', user?.role);
    console.log('🔍 [NonConversionReport] User storeId:', user?.storeId);
    console.log('🔍 [NonConversionReport] Collaborators:', collaborators?.length || 0);
  }, [user, collaborators]);

  const [selectedCollaborator, setSelectedCollaborator] = useState('');
  const [situacao, setSituacao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [records, setRecords] = useState([]);
  const [showRecords, setShowRecords] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [collaboratorFilter, setCollaboratorFilter] = useState('');
  const [dateError, setDateError] = useState('');

  // Filtrar colaboradores da loja
  const storeCollaborators = useMemo(() => {
    return collaborators.filter(
      c => c.storeId === user?.storeId || c.store_id === user?.storeId
    );
  }, [collaborators, user?.storeId]);

  // Carregar registros
  const loadRecords = async () => {
    if (!user?.storeId) {
      console.warn('⚠️ [NonConversionReport] Sem storeId, não é possível carregar registros');
      return;
    }

    console.log('🔄 [NonConversionReport] Carregando registros para storeId:', user.storeId);
    try {
      setLoadingRecords(true);
      // Se tiver filtro de dia específico, usar ele como início e fim
      let startDate = null;
      let endDate = null;
      
      if (dayFilter) {
        startDate = new Date(dayFilter);
        endDate = new Date(dayFilter);
      } else {
        startDate = dateFilter ? new Date(dateFilter) : null;
        endDate = dateFilterEnd ? new Date(dateFilterEnd) : null;
      }
      
      console.log('🔄 [NonConversionReport] Parâmetros:', { startDate, endDate, dayFilter });
      const data = await api.fetchNonConversionRecords(user.storeId, startDate, endDate);
      console.log('✅ [NonConversionReport] Registros carregados:', data?.length || 0);
      setRecords(data || []);
    } catch (error) {
      console.error('❌ [NonConversionReport] Erro ao carregar registros:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os registros.',
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  // Validar datas quando mudarem
  useEffect(() => {
    if (dateFilter && dateFilterEnd) {
      if (dateFilter > dateFilterEnd) {
        setDateError('Data início deve ser menor ou igual à data fim');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [dateFilter, dateFilterEnd]);

  useEffect(() => {
    loadRecords();
  }, [user?.storeId, dateFilter, dateFilterEnd, dayFilter]);

  const handleNonConversionSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCollaborator) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um colaborador.',
      });
      return;
    }

    if (!situacao) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma situação.',
      });
      return;
    }

    if (!observacao.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Digite uma observação.',
      });
      return;
    }

    try {
      setLoadingRecords(true);
      await api.createNonConversionRecord({
        collaborator_id: selectedCollaborator,
        store_id: user?.storeId,
        situacao,
        observacao: observacao.trim(),
        date: new Date().toISOString().split('T')[0],
      });

      toast({
        title: 'Sucesso!',
        description: 'Registro de não conversão salvo com sucesso.',
      });

      setSelectedCollaborator('');
      setSituacao('');
      setObservacao('');

      await loadRecords();
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o registro.',
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  const getCollaboratorName = (collaboratorId) => {
    const collaborator = storeCollaborators.find(c => c.id === collaboratorId);
    return collaborator?.name || 'Colaborador não encontrado';
  };

  // Filtrar registros
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filtro por dia específico (tem prioridade sobre período)
    if (dayFilter) {
      filtered = filtered.filter(r => r.date === dayFilter);
    } else {
      // Filtro por período (só aplicar se não houver erro de validação)
      if (!dateError) {
        // Filtro por data início (só se não tiver filtro de dia)
        if (dateFilter) {
          filtered = filtered.filter(r => r.date >= dateFilter);
        }

        // Filtro por data fim (só se não tiver filtro de dia)
        if (dateFilterEnd) {
          filtered = filtered.filter(r => r.date <= dateFilterEnd);
        }
      }
    }

    // Filtro por colaborador
    if (collaboratorFilter) {
      filtered = filtered.filter(r => r.collaborator_id === collaboratorFilter);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [records, dateFilter, dateFilterEnd, dayFilter, collaboratorFilter, dateError]);

  // Calcular estatísticas do dashboard
  const dashboardStats = useMemo(() => {
    const total = filteredRecords.length;
    const bySituacao = {
      GRADE: filteredRecords.filter(r => r.situacao === 'GRADE').length,
      PREÇO: filteredRecords.filter(r => r.situacao === 'PREÇO').length,
      PRODUTO: filteredRecords.filter(r => r.situacao === 'PRODUTO').length,
      OUTROS: filteredRecords.filter(r => r.situacao === 'OUTROS').length,
    };

    // Colaboradores com mais registros
    const collaboratorCounts = {};
    filteredRecords.forEach(record => {
      const collabId = record.collaborator_id;
      if (!collaboratorCounts[collabId]) {
        collaboratorCounts[collabId] = 0;
      }
      collaboratorCounts[collabId]++;
    });

    const topCollaborators = Object.entries(collaboratorCounts)
      .map(([id, count]) => ({
        id,
        name: getCollaboratorName(id),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Registros por mês (últimos 6 meses)
    const monthlyData = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
      monthlyData[monthKey] = 0;
    }

    filteredRecords.forEach(record => {
      const recordDate = new Date(record.date);
      const monthKey = format(recordDate, 'MMM/yyyy', { locale: ptBR });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return {
      total,
      bySituacao,
      topCollaborators,
      monthlyData: Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
    };
  }, [filteredRecords, storeCollaborators]);

  const getSituacaoBadgeColor = (sit) => {
    switch (sit) {
      case 'GRADE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PREÇO':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'PRODUTO':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'OUTROS':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  // Debug de permissões
  useEffect(() => {
    console.log('🔍 [NonConversionReport] Verificando permissões');
    console.log('🔍 [NonConversionReport] User:', user);
    console.log('🔍 [NonConversionReport] User role:', user?.role);
    console.log('🔍 [NonConversionReport] Permissão:', user?.role === 'loja' || user?.role === 'loja_franquia');
  }, [user]);

  if (!user || (user.role !== 'loja' && user.role !== 'loja_franquia')) {
    console.warn('⚠️ [NonConversionReport] Acesso negado. User:', user, 'Role:', user?.role);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
            <p className="text-xs text-muted-foreground mt-2">Role atual: {user?.role || 'Não definido'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Relatório de Não Conversão - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Relatório de Não Conversão</h1>
              <p className="text-muted-foreground">Registro de não conversão dos colaboradores</p>
            </div>
          </div>
          <Button
            onClick={() => setShowRecords(!showRecords)}
            variant={showRecords ? 'default' : 'outline'}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showRecords ? 'Ocultar Registros' : 'Ver Registros'}
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card Total de Registros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 rounded-xl border border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total de Registros</span>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{dashboardStats.total}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dateFilter || dateFilterEnd || collaboratorFilter || dayFilter ? 'Com filtros aplicados' : 'Todos os registros'}
            </p>
          </motion.div>

          {/* Card GRADE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card p-6 rounded-xl border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Grade</span>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-3xl font-bold text-blue-400">{dashboardStats.bySituacao.GRADE}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats.total > 0 
                ? `${((dashboardStats.bySituacao.GRADE / dashboardStats.total) * 100).toFixed(1)}% do total`
                : '0% do total'}
            </p>
          </motion.div>

          {/* Card PREÇO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border border-orange-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Preço</span>
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            </div>
            <p className="text-3xl font-bold text-orange-400">{dashboardStats.bySituacao.PREÇO}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats.total > 0 
                ? `${((dashboardStats.bySituacao.PREÇO / dashboardStats.total) * 100).toFixed(1)}% do total`
                : '0% do total'}
            </p>
          </motion.div>

          {/* Card PRODUTO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card p-6 rounded-xl border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Produto</span>
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            </div>
            <p className="text-3xl font-bold text-purple-400">{dashboardStats.bySituacao.PRODUTO}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats.total > 0 
                ? `${((dashboardStats.bySituacao.PRODUTO / dashboardStats.total) * 100).toFixed(1)}% do total`
                : '0% do total'}
            </p>
          </motion.div>

          {/* Card OUTROS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card p-6 rounded-xl border border-gray-500/30"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Outros</span>
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            </div>
            <p className="text-3xl font-bold text-gray-400">{dashboardStats.bySituacao.OUTROS}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardStats.total > 0 
                ? `${((dashboardStats.bySituacao.OUTROS / dashboardStats.total) * 100).toFixed(1)}% do total`
                : '0% do total'}
            </p>
          </motion.div>
        </div>

        {/* Cards de Estatísticas Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                Colaboradores com Mais Registros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardStats.topCollaborators.length > 0 ? (
                <div className="space-y-3">
                  {dashboardStats.topCollaborators.map((collab, index) => (
                    <div key={collab.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{collab.name}</p>
                          <p className="text-xs text-muted-foreground">{collab.count} registro{collab.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(collab.count / (dashboardStats.topCollaborators[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum registro encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Registros por Mês */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Registros por Mês (Últimos 6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardStats.monthlyData.some(m => m.count > 0) ? (
                <div className="space-y-3">
                  {dashboardStats.monthlyData.map((monthData) => {
                    const maxCount = Math.max(...dashboardStats.monthlyData.map(m => m.count), 1);
                    return (
                      <div key={monthData.month} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{monthData.month}</span>
                          <span className="font-semibold text-foreground">{monthData.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(monthData.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum registro nos últimos 6 meses</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Registro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Novo Registro de Não Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNonConversionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collaborator">Colaborador *</Label>
                  <Select
                    value={selectedCollaborator}
                    onValueChange={setSelectedCollaborator}
                  >
                    <SelectTrigger id="collaborator">
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeCollaborators.map(collab => (
                        <SelectItem key={collab.id} value={collab.id}>
                          {collab.name} {collab.role && `- ${collab.role}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="situacao">Situação *</Label>
                  <Select value={situacao} onValueChange={setSituacao}>
                    <SelectTrigger id="situacao">
                      <SelectValue placeholder="Selecione a situação" />
                    </SelectTrigger>
                    <SelectContent>
                      {SITUACOES.map(sit => (
                        <SelectItem key={sit.value} value={sit.value}>
                          {sit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação *</Label>
                <Textarea
                  id="observacao"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Descreva detalhadamente o motivo da não conversão..."
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Descreva em detalhes o motivo da não conversão do colaborador.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedCollaborator('');
                    setSituacao('');
                    setObservacao('');
                  }}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={loadingRecords}>
                  {loadingRecords ? 'Salvando...' : 'Salvar Registro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Registros */}
        {showRecords && (
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Registros de Não Conversão
                </CardTitle>
                
                {/* Filtros */}
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Filtro por Colaborador */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filter-collaborator" className="text-sm whitespace-nowrap">Colaborador:</Label>
                    <Select
                      value={collaboratorFilter || undefined}
                      onValueChange={(value) => setCollaboratorFilter(value === 'all' ? '' : value)}
                    >
                      <SelectTrigger id="filter-collaborator" className="w-[200px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {storeCollaborators.map(collab => (
                          <SelectItem key={collab.id} value={collab.id}>
                            {collab.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Dia Específico */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="day-filter" className="text-sm whitespace-nowrap">Dia:</Label>
                    <Input
                      id="day-filter"
                      type="date"
                      value={dayFilter}
                      onChange={(e) => {
                        setDayFilter(e.target.value);
                        setDateError('');
                        // Limpar filtros de período quando selecionar dia específico
                        if (e.target.value) {
                          setDateFilter('');
                          setDateFilterEnd('');
                        }
                      }}
                      className="w-[180px]"
                    />
                  </div>

                  {/* Filtro por Período */}
                  <div className="flex items-center gap-2 border-l pl-4 ml-2">
                    <Label className="text-sm whitespace-nowrap text-muted-foreground">Período:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="date-start"
                        type="date"
                        value={dateFilter}
                        max={dateFilterEnd || undefined}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setDateFilter(newStartDate);
                          setDayFilter('');
                          setDateError('');
                          
                          // Validar se data início é maior que data fim
                          if (newStartDate && dateFilterEnd && newStartDate > dateFilterEnd) {
                            setDateError('Data início deve ser menor ou igual à data fim');
                          }
                        }}
                        disabled={!!dayFilter}
                        className={`w-[150px] ${dateError && dateFilter && dateFilterEnd ? 'border-destructive' : ''}`}
                        placeholder="Início"
                      />
                      <span className="text-muted-foreground text-sm">até</span>
                      <Input
                        id="date-end"
                        type="date"
                        value={dateFilterEnd}
                        min={dateFilter || undefined}
                        onChange={(e) => {
                          const newEndDate = e.target.value;
                          setDateFilterEnd(newEndDate);
                          setDayFilter('');
                          setDateError('');
                          
                          // Validar se data fim é menor que data início
                          if (dateFilter && newEndDate && dateFilter > newEndDate) {
                            setDateError('Data fim deve ser maior ou igual à data início');
                          }
                        }}
                        disabled={!!dayFilter}
                        className={`w-[150px] ${dateError && dateFilter && dateFilterEnd ? 'border-destructive' : ''}`}
                        placeholder="Fim"
                      />
                    </div>
                  </div>

                  {/* Botão Limpar Filtros */}
                  {(dateFilter || dateFilterEnd || collaboratorFilter || dayFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFilter('');
                        setDateFilterEnd('');
                        setDayFilter('');
                        setCollaboratorFilter('');
                        setDateError('');
                      }}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>
                
                {/* Mensagem de erro de validação */}
                {dateError && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                    {dateError}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando registros...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {dateFilter || dateFilterEnd || collaboratorFilter || dayFilter
                      ? 'Nenhum registro encontrado com os filtros aplicados.'
                      : 'Nenhum registro encontrado.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((record, index) => (
                    <motion.div
                      key={record.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-secondary/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant="outline"
                                  className={getSituacaoBadgeColor(record.situacao)}
                                >
                                  {SITUACOES.find(s => s.value === record.situacao)?.label ||
                                    record.situacao}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(record.date),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                  )}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {getCollaboratorName(record.collaborator_id)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {record.observacao}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default NonConversionReport;
