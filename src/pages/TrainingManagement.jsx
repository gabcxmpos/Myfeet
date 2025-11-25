import React, { useState, useMemo } from 'react';
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
import { Calendar, MapPin, Users, Plus, Trash2, Edit, GraduationCap, Building2, Clock, Link as LinkIcon, X, TrendingUp, Award, Download, MoreVertical, Lock, Unlock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import StoreMultiSelect from '@/components/StoreMultiSelect';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Tabs component simples (substituir quando tiver o componente oficial)
const Tabs = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { activeTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab, className }) => {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}>
      {React.Children.map(children, child => {
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ value, children, activeTab, setActiveTab, className }) => {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "",
        className
      )}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, activeTab, className }) => {
  if (activeTab !== value) return null;
  return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}</div>;
};

const TrainingManagement = () => {
  const { trainings, trainingRegistrations, stores, collaborators, addTraining, updateTraining, deleteTraining, updateTrainingRegistration, deleteTrainingRegistration, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [updatingPresence, setUpdatingPresence] = useState({});
  const [viewingRegistrations, setViewingRegistrations] = useState(null);
  const [filters, setFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: []
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainingDate: '',
    time: '',
    format: 'presencial',
    brand: '',
    storeIds: [],
    location: '',
    link: '',
    maxParticipants: '',
  });

  const formatOptions = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'online', label: 'Online' },
    { value: 'hibrido', label: 'Híbrido' },
  ];


  const handleOpenDialog = (training = null) => {
    if (training) {
      setEditingTraining(training);
      // Parse store_ids se for string ou array
      let storeIdsArray = [];
      if (training.store_ids) {
        if (typeof training.store_ids === 'string') {
          try {
            storeIdsArray = JSON.parse(training.store_ids);
          } catch {
            storeIdsArray = [];
          }
        } else if (Array.isArray(training.store_ids)) {
          storeIdsArray = training.store_ids;
        }
      }
      // Se não tem store_ids mas tem bandeira (formato antigo), manter vazio por enquanto
      
      setFormData({
        title: training.title || '',
        description: training.description || '',
        trainingDate: training.training_date ? format(new Date(training.training_date), 'yyyy-MM-dd') : '',
        time: training.time || '',
        format: training.format || 'presencial',
        brand: training.brand || '',
        storeIds: storeIdsArray,
        location: training.location || '',
        link: training.link || '',
        maxParticipants: training.max_participants?.toString() || '',
      });
    } else {
      setEditingTraining(null);
      setFormData({
        title: '',
        description: '',
        trainingDate: '',
        time: '',
        format: 'presencial',
        brand: '',
        storeIds: [],
        location: '',
        link: '',
        maxParticipants: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.trainingDate || !formData.format) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    try {
      const trainingData = {
        title: formData.title,
        description: formData.description || null,
        trainingDate: formData.trainingDate,
        time: formData.time || null,
        format: formData.format,
        brand: formData.brand || null,
        storeIds: formData.storeIds && formData.storeIds.length > 0 
          ? formData.storeIds  // Enviar array diretamente, Supabase JSONB aceita
          : null,
        // Se for online, location deve ser null; se não for online, location pode ter valor
        location: formData.format === 'online' ? null : (formData.location || null),
        // Se for online, link pode ter valor; se não for online, link deve ser null
        link: formData.format === 'online' ? (formData.link || null) : null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      };

      if (editingTraining) {
        await updateTraining(editingTraining.id, trainingData);
        // Aguardar um pouco para garantir que os dados foram atualizados
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await addTraining(trainingData);
      }
      
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        trainingDate: '',
        format: 'presencial',
        brand: '',
        location: '',
        maxParticipants: '',
      });
      setEditingTraining(null);
    } catch (error) {
      console.error('Erro ao salvar treinamento:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este treinamento? Todas as inscrições serão canceladas.')) {
      try {
        await deleteTraining(id);
      } catch (error) {
        console.error('Erro ao excluir treinamento:', error);
      }
    }
  };

  const handleTogglePresence = async (registrationId, currentPresence) => {
    setUpdatingPresence(prev => ({ ...prev, [registrationId]: true }));
    try {
      const newPresence = !currentPresence;
      // Quando marcar presença, mudar status para "confirmed"
      // Quando desmarcar presença, mudar status para "pending"
      await updateTrainingRegistration(registrationId, {
        presence: newPresence,
        status: newPresence ? 'confirmed' : 'pending'
      });
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a presença.',
      });
    } finally {
      setUpdatingPresence(prev => {
        const newState = { ...prev };
        delete newState[registrationId];
        return newState;
      });
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (window.confirm('Tem certeza que deseja excluir esta inscrição?')) {
      try {
        await deleteTrainingRegistration(registrationId);
        toast({
          title: 'Sucesso!',
          description: 'Inscrição excluída com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir inscrição:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível excluir a inscrição.',
        });
      }
    }
  };

  const handleToggleBlockRegistrations = async (trainingId, currentBlocked) => {
    try {
      const newBlocked = !currentBlocked;
      await updateTraining(trainingId, { registrationsBlocked: newBlocked });
      toast({
        title: 'Sucesso!',
        description: newBlocked ? 'Inscrições bloqueadas com sucesso.' : 'Inscrições desbloqueadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao alterar bloqueio de inscrições:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível alterar o bloqueio de inscrições.',
      });
    }
  };

  const handleExportToExcel = (training, registrations) => {
    try {
      // Preparar dados para exportação
      const data = registrations.map((reg, index) => {
        const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
        const collaborator = reg.collaborator || {};
        
        return {
          'Nº': index + 1,
          'Nome do Colaborador': collaborator.name || 'Não informado',
          'CPF': collaborator.cpf || 'Não informado',
          'Email': collaborator.email || 'Não informado',
          'Cargo': collaborator.role || 'Não informado',
          'Loja': store?.name || 'Não encontrada',
          'Código da Loja': store?.code || 'Não informado',
          'Franqueado': store?.franqueado || 'Não informado',
          'Bandeira': store?.bandeira || 'Não informada',
          'Supervisor': store?.supervisor || 'Não informado',
          'Status': reg.presence || reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'cancelled' ? 'Cancelado' : 'Pendente',
          'Presença': reg.presence ? 'Sim' : 'Não',
          'Data de Inscrição': reg.registered_at ? format(new Date(reg.registered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informada',
          'Observações': reg.notes || 'Sem observações'
        };
      });

      // Criar cabeçalho CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        // Informações do treinamento
        `Treinamento: ${training.title}`,
        `Data: ${format(new Date(training.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}${training.time ? ` às ${training.time}` : ''}`,
        `Formato: ${formatOptions.find(f => f.value === training.format)?.label || training.format}`,
        training.location ? `Local: ${training.location}` : '',
        training.brand ? `Marca: ${training.brand}` : '',
        '',
        // Cabeçalhos
        headers.join(';'),
        // Dados
        ...data.map(row => headers.map(header => {
          const value = row[header] || '';
          // Escapar valores que contêm ponto e vírgula ou aspas
          if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(';'))
      ].filter(Boolean).join('\n');

      // Criar blob e fazer download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel reconhecer UTF-8
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Inscritos_${training.title.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(training.training_date), 'yyyy-MM-dd', { locale: ptBR })}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso!',
        description: `Arquivo Excel exportado com ${registrations.length} inscrito(s).`,
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível exportar para Excel.',
      });
    }
  };

  // Agrupar inscrições por treinamento
  const registrationsByTraining = useMemo(() => {
    const grouped = {};
    trainingRegistrations.forEach(reg => {
      const trainingId = reg.training_id || reg.trainingId;
      if (!grouped[trainingId]) {
        grouped[trainingId] = [];
      }
      grouped[trainingId].push(reg);
    });
    return grouped;
  }, [trainingRegistrations]);

  // Opções de filtros
  const filterOptions = useMemo(() => {
    return {
      stores: stores.map(s => ({ value: s.id, label: s.name })),
      franqueados: [...new Set(stores.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      bandeiras: [...new Set(stores.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      supervisors: [...new Set(stores.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s }))
    };
  }, [stores]);

  // Filtrar registrações baseado nos filtros
  const filteredRegistrations = useMemo(() => {
    return trainingRegistrations.filter(reg => {
      const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
      if (!store) return false;

      const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
      const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
      const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
      const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));

      return matchStore && matchFranqueado && matchBandeira && matchSupervisor;
    });
  }, [trainingRegistrations, stores, filters]);

  // Top 5 lojas por participação (aderência baseada em headcount)
  const top5Stores = useMemo(() => {
    const storeStats = {};
    filteredRegistrations.forEach(reg => {
      const storeId = reg.store_id || reg.storeId;
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      if (!storeStats[storeId]) {
        // Calcular headcount da loja (colaboradores ativos)
        const storeCollaborators = (collaborators || []).filter(c => 
          (c.storeId === storeId || c.store_id === storeId) && 
          (c.status || 'ativo') === 'ativo'
        );
        const headcount = storeCollaborators.length;

        storeStats[storeId] = {
          storeId,
          storeName: store.name,
          storeCode: store.code,
          franqueado: store.franqueado,
          bandeira: store.bandeira,
          total: 0, // Inscrições
          present: 0, // Presenças
          headcount: headcount // Headcount da loja
        };
      }
      storeStats[storeId].total++;
      if (reg.presence) {
        storeStats[storeId].present++;
      }
    });

    return Object.values(storeStats)
      .map(stat => ({
        ...stat,
        // Aderência = (presenças / headcount) * 100
        adherence: stat.headcount > 0 ? Math.round((stat.present / stat.headcount) * 100) : 0
      }))
      .sort((a, b) => b.adherence - a.adherence) // Ordenar por aderência
      .slice(0, 5);
  }, [filteredRegistrations, stores, collaborators]);

  // Treinamentos ordenados por data
  const sortedTrainings = useMemo(() => {
    return [...trainings].sort((a, b) => {
      const dateA = new Date(a.training_date);
      const dateB = new Date(b.training_date);
      return dateA - dateB;
    });
  }, [trainings]);

  return (
    <>
      <Helmet>
        <title>Agenda de Treinamentos - MYFEET</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agenda de Treinamentos</h1>
            <p className="text-muted-foreground mt-1">Gerencie treinamentos e visualize inscrições.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Treinamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTraining ? 'Editar Treinamento' : 'Novo Treinamento'}</DialogTitle>
                <DialogDescription>
                  {editingTraining ? 'Atualize as informações do treinamento.' : 'Preencha os dados para criar um novo treinamento.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-secondary min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trainingDate">Data *</Label>
                    <Input
                      id="trainingDate"
                      type="date"
                      value={formData.trainingDate || ''}
                      onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time || ''}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Formato *</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) => setFormData({ ...formData, format: value })}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Máx. Participantes</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants || ''}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      className="bg-secondary"
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input
                      id="brand"
                      value={formData.brand || ''}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="bg-secondary"
                      placeholder="Ex: ARTWALK, AUTHENTIC FEET, MAGICFEET"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeIds">Lojas Destinatárias</Label>
                    <StoreMultiSelect
                      stores={stores}
                      selected={formData.storeIds}
                      onChange={(selected) => setFormData({ ...formData, storeIds: selected })}
                      placeholder="Selecione as lojas (ou deixe vazio para todas)"
                      className="bg-secondary"
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para disponibilizar para todas as lojas, ou selecione lojas específicas.
                    </p>
                  </div>
                </div>
                {formData.format === 'online' ? (
                  <div className="space-y-2">
                    <Label htmlFor="link">Link da Reunião *</Label>
                    <Input
                      id="link"
                      type="url"
                      value={formData.link || ''}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      required
                      className="bg-secondary"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="location">Local {formData.format === 'presencial' || formData.format === 'hibrido' ? '*' : ''}</Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required={formData.format === 'presencial' || formData.format === 'hibrido'}
                      className="bg-secondary"
                      placeholder="Endereço do treinamento"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTraining ? 'Salvar Alterações' : 'Criar Treinamento'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="trainings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
            <TabsTrigger value="registrations">Inscritos</TabsTrigger>
          </TabsList>

          <TabsContent value="trainings" className="space-y-4 mt-4">
            {/* Dashboard de Treinamentos */}
            {(() => {
              const totalTrainings = trainings.length;
              const totalRegistrations = trainingRegistrations.length;
              const totalPresent = trainingRegistrations.filter(r => r.presence).length;
              
              // Calcular headcount total de todas as lojas
              const allStoreIds = [...new Set(trainingRegistrations.map(r => r.store_id || r.storeId))];
              const totalHeadcount = allStoreIds.reduce((sum, storeId) => {
                const storeCollaborators = (collaborators || []).filter(c => 
                  (c.storeId === storeId || c.store_id === storeId) && 
                  (c.status || 'ativo') === 'ativo'
                );
                return sum + storeCollaborators.length;
              }, 0);
              
              // Aderência geral = (total de presenças / headcount total) * 100
              const adherenceRate = totalHeadcount > 0 ? Math.round((totalPresent / totalHeadcount) * 100) : 0;
              
              // Agrupar inscrições por franqueado
              const registrationsByFranchisee = {};
              trainingRegistrations.forEach(reg => {
                const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                if (store?.franqueado) {
                  if (!registrationsByFranchisee[store.franqueado]) {
                    registrationsByFranchisee[store.franqueado] = { total: 0, present: 0 };
                  }
                  registrationsByFranchisee[store.franqueado].total++;
                  if (reg.presence) {
                    registrationsByFranchisee[store.franqueado].present++;
                  }
                }
              });
              
              // Encontrar maior grupo franqueado participativo
              const topFranchisee = Object.entries(registrationsByFranchisee)
                .map(([name, data]) => ({
                  name,
                  total: data.total,
                  present: data.present,
                  adherence: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
                }))
                .sort((a, b) => b.total - a.total)[0];

              return (
                <div className="space-y-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-6 h-6" />
                    Dashboard de Treinamentos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-sm font-medium">Total de Treinamentos</span>
                        <GraduationCap className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="font-bold text-3xl text-foreground">{totalTrainings}</span>
                    </motion.div>
                    <motion.div
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-sm font-medium">Inscrições</span>
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="font-bold text-3xl text-foreground">{totalRegistrations}</span>
                    </motion.div>
                    <motion.div
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-sm font-medium">Presenças</span>
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="font-bold text-3xl text-foreground">{totalPresent}</span>
                    </motion.div>
                    <motion.div
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center justify-between text-muted-foreground mb-2">
                        <span className="text-sm font-medium">Aderência</span>
                        <GraduationCap className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="font-bold text-3xl text-foreground">{adherenceRate}%</span>
                    </motion.div>
                  </div>
                  {topFranchisee && (
                    <motion.div
                      className="bg-card p-5 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="w-6 h-6 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Maior Grupo Franqueado Participativo</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="text-foreground font-semibold text-xl">{topFranchisee.name}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total de Inscrições</p>
                            <p className="text-foreground font-bold text-lg">{topFranchisee.total}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Presenças</p>
                            <p className="text-foreground font-bold text-lg">{topFranchisee.present}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Aderência</p>
                            <p className="text-foreground font-bold text-lg">{topFranchisee.adherence}%</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })()}
            {/* Análise Individual por Treinamento */}
            <div className="space-y-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Análise Individual por Treinamento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTrainings.map(training => {
                  const registrations = registrationsByTraining[training.id] || [];
                  const presentCount = registrations.filter(r => r.presence).length;
                  const totalCount = registrations.length;
                  
                  // Calcular headcount total das lojas inscritas neste treinamento
                  const storeIds = [...new Set(registrations.map(r => r.store_id || r.storeId))];
                  const totalHeadcount = storeIds.reduce((sum, storeId) => {
                    const storeCollaborators = (collaborators || []).filter(c => 
                      (c.storeId === storeId || c.store_id === storeId) && 
                      (c.status || 'ativo') === 'ativo'
                    );
                    return sum + storeCollaborators.length;
                  }, 0);
                  
                  // Aderência = (presenças / headcount total) * 100
                  const adherence = totalHeadcount > 0 ? Math.round((presentCount / totalHeadcount) * 100) : 0;
                  
                  return (
                    <motion.div
                      key={`analysis-${training.id}`}
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <h3 className="font-bold text-lg text-foreground mb-3 line-clamp-1">{training.title}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Headcount:</span>
                          <span className="font-semibold text-foreground">{totalHeadcount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Inscrições:</span>
                          <span className="font-semibold text-foreground">{totalCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Presenças:</span>
                          <span className="font-semibold text-foreground">{presentCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Aderência:</span>
                          <span className={cn(
                            "font-semibold",
                            adherence >= 80 ? "text-green-500" :
                            adherence >= 60 ? "text-yellow-500" :
                            "text-red-500"
                          )}>{adherence}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Lojas */}
            {top5Stores.length > 0 && (
              <div className="space-y-4 mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  Top 5 Lojas em Participação
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {top5Stores.map((store, index) => (
                    <motion.div
                      key={store.storeId}
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 ? "bg-yellow-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-orange-500 text-white" :
                          "bg-secondary text-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{store.storeName}</p>
                          <p className="text-xs text-muted-foreground truncate">{store.storeCode}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Headcount:</span>
                          <span className="font-semibold">{store.headcount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inscrições:</span>
                          <span className="font-semibold">{store.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Presenças:</span>
                          <span className="font-semibold">{store.present}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aderência:</span>
                          <span className={cn(
                            "font-semibold",
                            store.adherence >= 80 ? "text-green-500" :
                            store.adherence >= 60 ? "text-yellow-500" :
                            "text-red-500"
                          )}>{store.adherence}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Treinamentos */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                Treinamentos Criados
              </h2>
            {sortedTrainings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTrainings.map(training => {
                  const registrations = registrationsByTraining[training.id] || [];
                  const formatLabel = formatOptions.find(f => f.value === training.format)?.label || training.format;
                  
                  return (
                    <motion.div
                      key={training.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-5 rounded-xl border border-border shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground mb-2">{training.title}</h3>
                          {training.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{training.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const regs = registrationsByTraining[training.id] || [];
                              if (regs.length > 0) {
                                handleExportToExcel(training, regs);
                              } else {
                                toast({
                                  variant: 'destructive',
                                  title: 'Aviso',
                                  description: 'Não há inscritos para exportar.',
                                });
                              }
                            }}
                            className="h-8 w-8"
                            title="Exportar para Excel"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingRegistrations(training)}
                            className="h-8 w-8"
                            title="Ver Inscritos"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(training)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleToggleBlockRegistrations(training.id, training.registrations_blocked || false)}
                                >
                                  {training.registrations_blocked ? (
                                    <>
                                      <Unlock className="mr-2 h-4 w-4" />
                                      Desbloquear Inscrições
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="mr-2 h-4 w-4" />
                                      Bloquear Inscrições
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(training.id)} 
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {!isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(training)}
                                className="h-8 w-8"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(training.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(training.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          <span>{formatLabel}</span>
                        </div>
                        {training.time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{training.time}</span>
                          </div>
                        )}
                        {training.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{training.location}</span>
                          </div>
                        )}
                        {training.link && (
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            <a 
                              href={training.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Acessar Link da Reunião
                            </a>
                          </div>
                        )}
                        {training.store_ids && (() => {
                          try {
                            const storeIdsArray = typeof training.store_ids === 'string' 
                              ? JSON.parse(training.store_ids) 
                              : training.store_ids;
                            if (Array.isArray(storeIdsArray) && storeIdsArray.length > 0) {
                              const selectedStores = stores.filter(s => storeIdsArray.includes(s.id));
                              if (selectedStores.length > 0) {
                                return (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="w-4 h-4" />
                                    <span>
                                      {selectedStores.length} loja(s): {selectedStores.map(s => s.code || s.name).join(', ')}
                                    </span>
                                  </div>
                                );
                              }
                            }
                          } catch {
                            // Ignorar erro
                          }
                          return null;
                        })()}
                        {training.brand && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{training.brand}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {registrations.length} inscrito(s)
                            {training.max_participants && ` / ${training.max_participants} máximo`}
                          </span>
                        </div>
                        {training.registrations_blocked && (
                          <div className="flex items-center gap-2 text-orange-500 font-medium">
                            <Lock className="w-4 h-4" />
                            <span>Inscrições bloqueadas</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                <p className="text-lg">Nenhum treinamento cadastrado.</p>
                <p className="text-sm">Clique em "Novo Treinamento" para criar o primeiro.</p>
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4 mt-4">
            {/* Filtros */}
            <div className="bg-card p-4 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Loja</Label>
                  <MultiSelectFilter
                    options={filterOptions.stores}
                    selected={filters.store}
                    onChange={(selected) => setFilters({ ...filters, store: selected })}
                    placeholder="Todas as lojas"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Franqueado</Label>
                  <MultiSelectFilter
                    options={filterOptions.franqueados}
                    selected={filters.franqueado}
                    onChange={(selected) => setFilters({ ...filters, franqueado: selected })}
                    placeholder="Todos os franqueados"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bandeira</Label>
                  <MultiSelectFilter
                    options={filterOptions.bandeiras}
                    selected={filters.bandeira}
                    onChange={(selected) => setFilters({ ...filters, bandeira: selected })}
                    placeholder="Todas as bandeiras"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <MultiSelectFilter
                    options={filterOptions.supervisors}
                    selected={filters.supervisor}
                    onChange={(selected) => setFilters({ ...filters, supervisor: selected })}
                    placeholder="Todos os supervisores"
                    className="bg-secondary"
                  />
                </div>
              </div>
            </div>

            {/* Top 5 Lojas */}
            {top5Stores.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top 5 Lojas em Participação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {top5Stores.map((store, index) => (
                    <motion.div
                      key={store.storeId}
                      className="bg-card p-4 rounded-xl border border-border"
                      whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 ? "bg-yellow-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-orange-500 text-white" :
                          "bg-secondary text-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{store.storeName}</p>
                          <p className="text-xs text-muted-foreground truncate">{store.storeCode}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Headcount:</span>
                          <span className="font-semibold">{store.headcount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inscrições:</span>
                          <span className="font-semibold">{store.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Presenças:</span>
                          <span className="font-semibold">{store.present}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aderência:</span>
                          <span className={cn(
                            "font-semibold",
                            store.adherence >= 80 ? "text-green-500" :
                            store.adherence >= 60 ? "text-yellow-500" :
                            "text-red-500"
                          )}>{store.adherence}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              // Filtrar treinamentos que têm inscrições após aplicar os filtros
              const trainingsWithFilteredRegistrations = sortedTrainings
                .map(training => {
                  const allRegistrations = registrationsByTraining[training.id] || [];
                  const registrations = allRegistrations.filter(reg => {
                    const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                    if (!store) return false;

                    const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
                    const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
                    const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
                    const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));

                    return matchStore && matchFranqueado && matchBandeira && matchSupervisor;
                  });
                  
                  return registrations.length > 0 ? { training, registrations } : null;
                })
                .filter(Boolean);

              if (trainingsWithFilteredRegistrations.length === 0) {
                return (
                  <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                    <p className="text-lg">Nenhuma inscrição encontrada.</p>
                    {Object.values(filters).some(f => f.length > 0) && (
                      <p className="text-sm mt-2">Tente ajustar os filtros.</p>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {trainingsWithFilteredRegistrations.map(({ training, registrations }) => {

                  const presentCount = registrations.filter(r => r.presence).length;
                  const totalCount = registrations.length;

                  return (
                    <motion.div
                      key={training.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-5 rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">
                            {training.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(training.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {training.time && ` às ${training.time}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {presentCount} / {totalCount} presentes
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% de aderência
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportToExcel(training, registrations)}
                            className="gap-2"
                            title="Exportar para Excel"
                          >
                            <Download className="w-4 h-4" />
                            Excel
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {registrations.map(reg => {
                          const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                          const collaborator = reg.collaborator || {};
                          const isUpdating = updatingPresence[reg.id];
                          
                          return (
                            <div
                              key={reg.id}
                              className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={reg.presence || false}
                                  onCheckedChange={() => handleTogglePresence(reg.id, reg.presence)}
                                  disabled={isUpdating}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{collaborator.name || 'Colaborador não encontrado'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">{store?.name || 'Loja não encontrada'}</span>
                                    {store?.franqueado && ` - Franqueado: ${store.franqueado}`}
                                    {' - '}
                                    {collaborator.role || 'Cargo não informado'}
                                    {collaborator.cpf && ` - CPF: ${collaborator.cpf}`}
                                    {collaborator.email && ` - Email: ${collaborator.email}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                                  reg.presence || reg.status === 'confirmed' ? "bg-green-500/20 text-green-500" :
                                  reg.status === 'cancelled' ? "bg-red-500/20 text-red-500" :
                                  "bg-yellow-500/20 text-yellow-500"
                                )}>
                                  {reg.presence || reg.status === 'confirmed' ? 'Confirmado' :
                                   reg.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteRegistration(reg.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Excluir Inscrição"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                  })}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Dialog para visualizar inscritos de um treinamento específico */}
        {viewingRegistrations && (
          <Dialog open={!!viewingRegistrations} onOpenChange={(open) => !open && setViewingRegistrations(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Inscritos - {viewingRegistrations.title}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const regs = registrationsByTraining[viewingRegistrations.id] || [];
                      if (regs.length > 0) {
                        handleExportToExcel(viewingRegistrations, regs);
                      } else {
                        toast({
                          variant: 'destructive',
                          title: 'Aviso',
                          description: 'Não há inscritos para exportar.',
                        });
                      }
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                  </Button>
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(viewingRegistrations.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {viewingRegistrations.time && ` às ${viewingRegistrations.time}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {(() => {
                  const registrations = registrationsByTraining[viewingRegistrations.id] || [];
                  const presentCount = registrations.filter(r => r.presence).length;
                  const totalCount = registrations.length;
                  
                  if (registrations.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhuma inscrição para este treinamento.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">
                            {presentCount} / {totalCount} presentes
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}% de aderência
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {registrations.map(reg => {
                          const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                          const collaborator = reg.collaborator || {};
                          const isUpdating = updatingPresence[reg.id];
                          
                          return (
                            <div
                              key={reg.id}
                              className="flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={reg.presence || false}
                                  onCheckedChange={() => handleTogglePresence(reg.id, reg.presence)}
                                  disabled={isUpdating}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{collaborator.name || 'Colaborador não encontrado'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">{store?.name || 'Loja não encontrada'}</span>
                                    {store?.franqueado && ` - Franqueado: ${store.franqueado}`}
                                    {' - '}
                                    {collaborator.role || 'Cargo não informado'}
                                    {collaborator.cpf && ` - CPF: ${collaborator.cpf}`}
                                    {collaborator.email && ` - Email: ${collaborator.email}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs px-2 py-1 rounded-full whitespace-nowrap",
                                  reg.presence || reg.status === 'confirmed' ? "bg-green-500/20 text-green-500" :
                                  reg.status === 'cancelled' ? "bg-red-500/20 text-red-500" :
                                  "bg-yellow-500/20 text-yellow-500"
                                )}>
                                  {reg.presence || reg.status === 'confirmed' ? 'Confirmado' :
                                   reg.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteRegistration(reg.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Excluir Inscrição"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
};

export default TrainingManagement;

