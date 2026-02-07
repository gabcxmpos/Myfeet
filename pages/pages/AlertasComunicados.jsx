import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Edit, Trash2, Eye, Calendar, Store, Building2, Tag, CheckCircle2, XCircle, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import StoreMultiSelect from '@/components/StoreMultiSelect';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { fetchAlerts, createAlert, updateAlert, deleteAlert, fetchAlertViews, fetchAlertRecipients } from '@/lib/supabaseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AlertasComunicados = () => {
  const { stores, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingAlert, setEditingAlert] = useState(null);
  const [viewingViews, setViewingViews] = useState(null);
  const [alertViews, setAlertViews] = useState({});
  const [alertRecipients, setAlertRecipients] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    expires_at: '',
    is_active: true,
    store_ids: [],
    franqueado_names: [],
    bandeira_names: []
  });

  const [filters, setFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: []
  });

  // Filtrar lojas disponíveis
  const availableStores = useMemo(() => {
    if (!stores || !Array.isArray(stores)) return [];
    return stores.filter(store => {
      if (filters.franqueado.length > 0 && !filters.franqueado.includes(store.franqueado)) return false;
      if (filters.bandeira.length > 0 && !filters.bandeira.includes(store.bandeira)) return false;
      return true;
    });
  }, [stores, filters]);

  const franqueados = useMemo(() => {
    if (!stores || !Array.isArray(stores)) return [];
    return [...new Set(stores.map(s => s.franqueado).filter(Boolean))];
  }, [stores]);
  
  const bandeiras = useMemo(() => {
    if (!stores || !Array.isArray(stores)) return [];
    return [...new Set(stores.map(s => s.bandeira).filter(Boolean))];
  }, [stores]);

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar alertas:', err);
      setError(err.message || 'Erro ao carregar alertas');
      // Se a tabela não existir, apenas mostrar array vazio
      if (err.code === '42P01' || err.code === 'PGRST116') {
        setAlerts([]);
        setError(null); // Não mostrar erro se a tabela não existir
      } else {
        toast({
          title: 'Erro',
          description: err.message || 'Não foi possível carregar os alertas.',
          variant: 'destructive'
        });
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAlertViews = async (alertId) => {
    try {
      const [views, recipients] = await Promise.all([
        fetchAlertViews(alertId),
        fetchAlertRecipients(alertId)
      ]);
      setAlertViews(prev => ({ ...prev, [alertId]: views || [] }));
      setAlertRecipients(prev => ({ ...prev, [alertId]: recipients || [] }));
    } catch (error) {
      console.error('Erro ao carregar visualizações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as visualizações.',
        variant: 'destructive'
      });
    }
  };

  const filteredAlerts = useMemo(() => {
    let filtered = alerts;
    
    if (filters.store.length > 0) {
      filtered = filtered.filter(alert => 
        alert.store_ids && alert.store_ids.some(id => filters.store.includes(id))
      );
    }
    
    if (filters.franqueado.length > 0) {
      filtered = filtered.filter(alert => 
        alert.franqueado_names && alert.franqueado_names.some(f => filters.franqueado.includes(f))
      );
    }
    
    if (filters.bandeira.length > 0) {
      filtered = filtered.filter(alert => 
        alert.bandeira_names && alert.bandeira_names.some(b => filters.bandeira.includes(b))
      );
    }
    
    return filtered;
  }, [alerts, filters]);

  const handleOpenDialog = (alert = null) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        title: alert.title || '',
        message: alert.message || '',
        expires_at: alert.expires_at ? format(new Date(alert.expires_at), "yyyy-MM-dd'T'HH:mm") : '',
        is_active: alert.is_active !== undefined ? alert.is_active : true,
        store_ids: alert.store_ids || [],
        franqueado_names: alert.franqueado_names || [],
        bandeira_names: alert.bandeira_names || []
      });
    } else {
      setEditingAlert(null);
      setFormData({
        title: '',
        message: '',
        expires_at: '',
        is_active: true,
        store_ids: [],
        franqueado_names: [],
        bandeira_names: []
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAlert(null);
    setFormData({
      title: '',
      message: '',
      expires_at: '',
      is_active: true,
      store_ids: [],
      franqueado_names: [],
      bandeira_names: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha título e mensagem.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const alertData = {
        ...formData,
        expires_at: formData.expires_at || null
      };

      if (editingAlert) {
        await updateAlert(editingAlert.id, alertData);
        toast({
          title: 'Sucesso',
          description: 'Alerta atualizado com sucesso!'
        });
      } else {
        await createAlert(alertData);
        toast({
          title: 'Sucesso',
          description: 'Alerta criado com sucesso!'
        });
      }
      
      await loadAlerts();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar alerta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o alerta.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteAlert(deleteConfirm);
      toast({
        title: 'Sucesso',
        description: 'Alerta excluído com sucesso!'
      });
      await loadAlerts();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao excluir alerta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o alerta.',
        variant: 'destructive'
      });
    }
  };

  const handleViewViews = async (alert) => {
    setViewingViews(alert);
    await loadAlertViews(alert.id);
  };

  const handleExportViews = async (alert) => {
    try {
      // Garantir que temos os dados
      if (!alertViews[alert.id] || !alertRecipients[alert.id]) {
        await loadAlertViews(alert.id);
      }

      const views = alertViews[alert.id] || [];
      const recipients = alertRecipients[alert.id] || [];
      
      // Criar mapa de visualizações por store_id
      const viewsByStore = new Map();
      views.forEach(view => {
        if (view.store_id) {
          viewsByStore.set(view.store_id, view);
        }
      });

      // Preparar dados para CSV
      const csvRows = [];
      
      // Cabeçalho
      csvRows.push([
        'Loja',
        'Código',
        'Bandeira',
        'Franqueado',
        'Status Visualização',
        'Usuário que Visualizou',
        'Email',
        'Data/Hora Visualização'
      ].join(','));

      // Processar cada loja destinatária
      recipients.forEach(store => {
        const view = viewsByStore.get(store.id);
        const status = view ? 'Visualizado' : 'Não Visualizado';
        const username = view?.user?.username || view?.user?.email || '';
        const email = view?.user?.email || '';
        const viewedAt = view?.viewed_at 
          ? format(new Date(view.viewed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
          : '';

        csvRows.push([
          `"${store.name || ''}"`,
          `"${store.code || ''}"`,
          `"${store.bandeira || ''}"`,
          `"${store.franqueado || ''}"`,
          `"${status}"`,
          `"${username}"`,
          `"${email}"`,
          `"${viewedAt}"`
        ].join(','));
      });

      // Criar e baixar CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `visualizacoes_alerta_${alert.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Exportação concluída!',
        description: 'Arquivo CSV baixado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao exportar visualizações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar as visualizações.',
        variant: 'destructive'
      });
    }
  };

  const getRecipientsInfo = (alert) => {
    if (!alert.store_ids && !alert.franqueado_names && !alert.bandeira_names) {
      return { type: 'all', label: 'Todas as lojas', icon: Store };
    }
    
    const parts = [];
    if (alert.store_ids && alert.store_ids.length > 0) {
      parts.push(`${alert.store_ids.length} loja(s)`);
    }
    if (alert.franqueado_names && alert.franqueado_names.length > 0) {
      parts.push(`${alert.franqueado_names.length} franqueado(s)`);
    }
    if (alert.bandeira_names && alert.bandeira_names.length > 0) {
      parts.push(`${alert.bandeira_names.length} bandeira(s)`);
    }
    
    return { type: 'specific', label: parts.join(', '), icon: Building2 };
  };

  // Verificar permissões
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Carregando informações do usuário...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'comunicação') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Acesso negado. Você não tem permissão para acessar esta página.</p>
          <p className="text-xs text-muted-foreground mt-2">Role atual: {user.role}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Alertas e Comunicados - MYFEET</title>
      </Helmet>
      
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="w-8 h-8 text-primary" />
              Alertas e Comunicados
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie alertas e comunicados para as lojas
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Alerta
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Lojas</Label>
                <MultiSelectFilter
                  options={(stores || []).map(s => ({ value: s.id, label: `${s.code || ''} - ${s.name || ''}` }))}
                  selected={filters.store}
                  onChange={(value) => setFilters(prev => ({ ...prev, store: value }))}
                  placeholder="Todas as lojas"
                />
              </div>
              <div>
                <Label>Franqueados</Label>
                <MultiSelectFilter
                  options={franqueados.map(f => ({ value: f, label: f }))}
                  selected={filters.franqueado}
                  onChange={(value) => setFilters(prev => ({ ...prev, franqueado: value }))}
                  placeholder="Todos os franqueados"
                />
              </div>
              <div>
                <Label>Bandeiras</Label>
                <MultiSelectFilter
                  options={bandeiras.map(b => ({ value: b, label: b }))}
                  selected={filters.bandeira}
                  onChange={(value) => setFilters(prev => ({ ...prev, bandeira: value }))}
                  placeholder="Todas as bandeiras"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alertas */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando alertas...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-semibold mb-2">Erro ao carregar alertas</p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={loadAlerts} className="mt-4">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum alerta encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAlerts.map((alert) => {
              const recipientsInfo = getRecipientsInfo(alert);
              const views = alertViews[alert.id] || [];
              const isExpired = alert.expires_at && new Date(alert.expires_at) < new Date();
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn(
                    "hover:shadow-lg transition-shadow",
                    !alert.is_active && "opacity-60",
                    isExpired && "border-yellow-500/50"
                  )}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{alert.title}</CardTitle>
                            {!alert.is_active && (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                            {isExpired && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Expirado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              {recipientsInfo.icon && <recipientsInfo.icon className="w-4 h-4" />}
                              {recipientsInfo.label}
                            </span>
                            {alert.expires_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Expira: {format(new Date(alert.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewViews(alert)}
                            title="Ver visualizações"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(alert)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(alert.id)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{alert.message}</p>
                      {views.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground mb-2">
                            Visualizado por {views.length} usuário(s)
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Editar Alerta' : 'Novo Alerta'}</DialogTitle>
            <DialogDescription>
              {editingAlert ? 'Edite as informações do alerta abaixo.' : 'Preencha os dados para criar um novo alerta.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Manutenção programada"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Digite a mensagem do alerta..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expires_at">Data de Expiração (opcional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="is_active">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Destinatários</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione lojas específicas, ou deixe vazio para enviar a todas as lojas. Você também pode filtrar por franqueado ou bandeira.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Lojas Específicas (opcional)</Label>
                  <StoreMultiSelect
                    stores={availableStores}
                    selected={formData.store_ids}
                    onChange={(value) => setFormData(prev => ({ ...prev, store_ids: value }))}
                    placeholder="Selecione lojas específicas ou deixe vazio para todas"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Franqueados (opcional)</Label>
                  <MultiSelectFilter
                    options={franqueados.map(f => ({ value: f, label: f }))}
                    selected={formData.franqueado_names}
                    onChange={(value) => setFormData(prev => ({ ...prev, franqueado_names: value }))}
                    placeholder="Selecione franqueados ou deixe vazio"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Bandeiras (opcional)</Label>
                  <MultiSelectFilter
                    options={bandeiras.map(b => ({ value: b, label: b }))}
                    selected={formData.bandeira_names}
                    onChange={(value) => setFormData(prev => ({ ...prev, bandeira_names: value }))}
                    placeholder="Selecione bandeiras ou deixe vazio"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAlert ? 'Salvar Alterações' : 'Criar Alerta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualizações */}
      <Dialog open={!!viewingViews} onOpenChange={(open) => !open && setViewingViews(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Visualizações do Alerta</DialogTitle>
                <DialogDescription>
                  Lista completa de lojas destinatárias e quem visualizou
                </DialogDescription>
              </div>
              {viewingViews && (
                <Button
                  onClick={() => handleExportViews(viewingViews)}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </DialogHeader>
          {viewingViews && (
            <div className="space-y-4">
              {/* Resumo */}
              {alertRecipients[viewingViews.id] && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Lojas</p>
                    <p className="text-2xl font-bold">{alertRecipients[viewingViews.id].length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visualizado</p>
                    <p className="text-2xl font-bold text-primary">
                      {alertViews[viewingViews.id]?.length || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Não Visualizado</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {(alertRecipients[viewingViews.id]?.length || 0) - (alertViews[viewingViews.id]?.length || 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de Visualizações */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Visualizado ({alertViews[viewingViews.id]?.length || 0})
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {alertViews[viewingViews.id] && alertViews[viewingViews.id].length > 0 ? (
                    alertViews[viewingViews.id].map((view) => (
                      <div key={view.id} className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                        <div className="flex-1">
                          <p className="font-medium">{view.user?.username || view.user?.email || 'Usuário'}</p>
                          <p className="text-sm text-muted-foreground">
                            {view.store?.name || 'Loja'} ({view.store?.code || ''})
                            {view.store?.bandeira && ` - ${view.store.bandeira}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Visualizado em: {view.viewed_at ? format(new Date(view.viewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Nenhuma visualização registrada ainda
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de Não Visualizados */}
              {alertRecipients[viewingViews.id] && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                    Não Visualizado ({(alertRecipients[viewingViews.id]?.length || 0) - (alertViews[viewingViews.id]?.length || 0)})
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(() => {
                      const viewsByStore = new Map();
                      (alertViews[viewingViews.id] || []).forEach(view => {
                        if (view.store_id) {
                          viewsByStore.set(view.store_id, view);
                        }
                      });

                      const notViewed = (alertRecipients[viewingViews.id] || []).filter(
                        store => !viewsByStore.has(store.id)
                      );

                      return notViewed.length > 0 ? (
                        notViewed.map((store) => (
                          <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 border-border">
                            <div className="flex-1">
                              <p className="font-medium">{store.name || 'Loja'}</p>
                              <p className="text-sm text-muted-foreground">
                                {store.code || ''}
                                {store.bandeira && ` - ${store.bandeira}`}
                                {store.franqueado && ` - ${store.franqueado}`}
                              </p>
                            </div>
                            <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-4" />
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          Todas as lojas visualizaram o alerta
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AlertasComunicados;
