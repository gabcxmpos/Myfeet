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
import { Calendar, MapPin, Users, Plus, Trash2, Edit, GraduationCap, Building2, Clock, Link as LinkIcon, X, TrendingUp, Award, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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

const TabsList = ({ activeTab, setActiveTab, children, className }) => {
  return (
    <div className={cn("flex border-b border-border", className)}>
      {React.Children.map(children, child => {
        if (child.type === TabsTrigger) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ value, activeTab, setActiveTab, children, className }) => {
  const isActive = activeTab === value;
  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, activeTab, children, className }) => {
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
};

const TrainingManagement = () => {
  const { trainings, trainingRegistrations, collaborators, stores, addTraining, updateTraining, deleteTraining, addTrainingRegistration, updateTrainingRegistration, deleteTrainingRegistration, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Garantir que trainingRegistrations e trainings sejam arrays
  const safeTrainingRegistrations = Array.isArray(trainingRegistrations) ? trainingRegistrations : [];
  const safeTrainings = Array.isArray(trainings) ? trainings : [];
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [selectedTrainingForRegistrations, setSelectedTrainingForRegistrations] = useState(null);
  const [isRegistrationsDialogOpen, setIsRegistrationsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ store: [], franqueado: [], bandeira: [], supervisor: [] });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainingDate: '',
    time: '',
    format: 'presencial',
    link: '',
    brand: '',
    storeIds: [],
    location: '',
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
      // Parse store_ids se for string
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
      
      setFormData({
        title: training.title || '',
        description: training.description || '',
        trainingDate: training.training_date ? format(new Date(training.training_date), 'yyyy-MM-dd') : '',
        time: training.time || '',
        format: training.format || 'presencial',
        link: training.link || '',
        brand: training.brand || '',
        storeIds: storeIdsArray,
        location: training.location || '',
        maxParticipants: training.max_participants || '',
      });
    } else {
      setEditingTraining(null);
      setFormData({
        title: '',
        description: '',
        trainingDate: '',
        time: '',
        format: 'presencial',
        link: '',
        brand: '',
        storeIds: [],
        location: '',
        maxParticipants: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTraining(null);
    setFormData({
      title: '',
      description: '',
      trainingDate: '',
      time: '',
      format: 'presencial',
      link: '',
      brand: '',
      storeIds: [],
      location: '',
      maxParticipants: '',
    });
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

    // Validar link se for online
    if (formData.format === 'online' && !formData.link) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Link é obrigatório para treinamentos online.',
      });
      return;
    }

    // Validar localização se for presencial
    if (formData.format === 'presencial' && !formData.location) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Localização é obrigatória para treinamentos presenciais.',
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
        link: formData.format === 'online' ? formData.link : null,
        brand: formData.brand || null,
        storeIds: formData.storeIds && formData.storeIds.length > 0 ? formData.storeIds : null,
        location: formData.format === 'presencial' ? formData.location : null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
      };

      if (editingTraining) {
        await updateTraining(editingTraining.id, trainingData);
      } else {
        await addTraining(trainingData);
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar treinamento:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este treinamento?')) {
      return;
    }

    try {
      await deleteTraining(id);
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir treinamento:', error);
    }
  };

  const handleOpenRegistrationsDialog = (training) => {
    setSelectedTrainingForRegistrations(training);
    setIsRegistrationsDialogOpen(true);
  };

  const handleTogglePresence = async (registrationId, currentPresence) => {
    try {
      await updateTrainingRegistration(registrationId, {
        presence: !currentPresence,
        status: !currentPresence ? 'confirmed' : 'pending',
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta inscrição?')) {
      return;
    }

    try {
      await deleteTrainingRegistration(registrationId);
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir inscrição:', error);
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

  // Filtros para registros
  const filterOptions = useMemo(() => {
    return {
      stores: stores.map(s => ({ value: s.id, label: s.name })),
      franqueados: [...new Set(stores.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      bandeiras: [...new Set(stores.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      supervisors: [...new Set(stores.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s })),
    };
  }, [stores]);

  const filteredRegistrations = useMemo(() => {
    let filtered = safeTrainingRegistrations;

    if (filters.store.length > 0) {
      filtered = filtered.filter(reg => filters.store.includes(reg.store_id || reg.storeId));
    }

    if (filters.franqueado.length > 0) {
      filtered = filtered.filter(reg => {
        const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
        return store && filters.franqueado.includes(store.franqueado);
      });
    }

    if (filters.bandeira.length > 0) {
      filtered = filtered.filter(reg => {
        const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
        return store && filters.bandeira.includes(store.bandeira);
      });
    }

    if (filters.supervisor.length > 0) {
      filtered = filtered.filter(reg => {
        const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
        return store && filters.supervisor.includes(store.supervisor);
      });
    }

    return filtered;
  }, [safeTrainingRegistrations, filters, stores]);

  // Top 5 lojas por participação
  const top5Stores = useMemo(() => {
    const storeStats = {};
    
    safeTrainingRegistrations.forEach(reg => {
      const storeId = reg.store_id || reg.storeId;
      if (!storeStats[storeId]) {
        storeStats[storeId] = { registrations: 0, presences: 0 };
      }
      storeStats[storeId].registrations++;
      if (reg.presence) {
        storeStats[storeId].presences++;
      }
    });

    return Object.entries(storeStats)
      .map(([storeId, stats]) => {
        const store = stores.find(s => s.id === storeId);
        return {
          storeId,
          storeName: store?.name || 'Loja não encontrada',
          storeCode: store?.code || '',
          registrations: stats.registrations,
          presences: stats.presences,
          adherence: stats.registrations > 0 ? Math.round((stats.presences / stats.registrations) * 100) : 0,
        };
      })
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 5);
  }, [safeTrainingRegistrations, stores]);

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
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Treinamento
          </Button>
        </div>

        <Tabs defaultValue="trainings">
          <TabsList>
            <TabsTrigger value="trainings">Treinamentos</TabsTrigger>
            <TabsTrigger value="registrations">Inscritos</TabsTrigger>
          </TabsList>

          <TabsContent value="trainings" className="space-y-4 mt-4">
            {/* Dashboard de Treinamentos */}
            {(() => {
              const totalTrainings = safeTrainings.length;
              const totalRegistrations = safeTrainingRegistrations.length;
              const totalPresent = safeTrainingRegistrations.filter(r => r.presence).length;
              const adherenceRate = totalRegistrations > 0 ? Math.round((totalPresent / totalRegistrations) * 100) : 0;
              
              // Agrupar inscrições por franqueado
              const registrationsByFranchisee = {};
              safeTrainingRegistrations.forEach(reg => {
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

            {/* Lista de Treinamentos */}
            {safeTrainings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeTrainings.map(training => {
                  const registrations = safeTrainingRegistrations.filter(reg => 
                    (reg.training_id || reg.trainingId) === training.id
                  );
                  const presentCount = registrations.filter(r => r.presence).length;
                  const adherence = registrations.length > 0 ? Math.round((presentCount / registrations.length) * 100) : 0;

                  return (
                    <motion.div
                      key={training.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card p-5 rounded-xl border border-border shadow-sm"
                    >
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-foreground mb-2">{training.title}</h3>
                        {training.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{training.description}</p>
                        )}
                      </div>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(training.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {training.time && ` às ${training.time}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="w-4 h-4" />
                          <span>{formatOptions.find(f => f.value === training.format)?.label || training.format}</span>
                        </div>
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
                        {training.brand && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>Marca: {training.brand}</span>
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {registrations.length} inscrito(s) / {presentCount} presente(s)
                            {training.max_participants && ` / ${training.max_participants} máximo`}
                          </span>
                        </div>
                        {registrations.length > 0 && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Aderência: {adherence}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRegistrationsDialog(training)}
                          className="flex-1 gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Ver Inscritos ({registrations.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(training)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(training.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                <p className="text-lg">Nenhum treinamento cadastrado.</p>
                <p className="text-sm">Clique em "Criar Treinamento" para começar.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4 mt-4">
            {/* Filtros */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Loja</Label>
                  <MultiSelectFilter
                    options={filterOptions.stores}
                    selected={filters.store}
                    onChange={(value) => setFilters(prev => ({ ...prev, store: value }))}
                    placeholder="Selecione lojas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Franqueado</Label>
                  <MultiSelectFilter
                    options={filterOptions.franqueados}
                    selected={filters.franqueado}
                    onChange={(value) => setFilters(prev => ({ ...prev, franqueado: value }))}
                    placeholder="Selecione franqueados"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bandeira</Label>
                  <MultiSelectFilter
                    options={filterOptions.bandeiras}
                    selected={filters.bandeira}
                    onChange={(value) => setFilters(prev => ({ ...prev, bandeira: value }))}
                    placeholder="Selecione bandeiras"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <MultiSelectFilter
                    options={filterOptions.supervisors}
                    selected={filters.supervisor}
                    onChange={(value) => setFilters(prev => ({ ...prev, supervisor: value }))}
                    placeholder="Selecione supervisores"
                  />
                </div>
              </div>
            </div>

            {/* Top 5 Lojas */}
            {top5Stores.length > 0 && (
              <div className="bg-card p-5 rounded-xl border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Top 5 Lojas em Participação
                </h3>
                <div className="space-y-2">
                  {top5Stores.map((store, index) => (
                    <div key={store.storeId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 ? "bg-yellow-500 text-white" :
                          index === 1 ? "bg-gray-400 text-white" :
                          index === 2 ? "bg-orange-600 text-white" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{store.storeName}</p>
                          <p className="text-xs text-muted-foreground">{store.storeCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Inscrições</p>
                          <p className="font-bold text-foreground">{store.registrations}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Presenças</p>
                          <p className="font-bold text-foreground">{store.presences}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Aderência</p>
                          <p className="font-bold text-primary">{store.adherence}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Inscrições */}
            <div className="space-y-4">
              {filteredRegistrations.length > 0 ? (
                filteredRegistrations.map(reg => {
                  const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                  const collaborator = reg.collaborator || {};
                  const training = safeTrainings.find(t => t.id === (reg.training_id || reg.trainingId));

                  return (
                    <div key={reg.id} className="bg-card p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{collaborator.name || 'Colaborador não encontrado'}</h4>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-semibold",
                              reg.presence || reg.status === 'confirmed' 
                                ? "bg-green-500/20 text-green-500"
                                : reg.status === 'cancelled'
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                            )}>
                              {reg.presence || reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><strong>Cargo:</strong> {collaborator.role || 'Não informado'}</p>
                            {collaborator.cpf && <p><strong>CPF:</strong> {collaborator.cpf}</p>}
                            {collaborator.email && <p><strong>Email:</strong> {collaborator.email}</p>}
                            <p><strong>Loja:</strong> {store?.name || 'Não encontrada'}</p>
                            {store?.code && <p><strong>Código:</strong> {store.code}</p>}
                            {store?.franqueado && <p><strong>Franqueado:</strong> {store.franqueado}</p>}
                            {store?.bandeira && <p><strong>Bandeira:</strong> {store.bandeira}</p>}
                            {store?.supervisor && <p><strong>Supervisor:</strong> {store.supervisor}</p>}
                            {training && (
                              <p><strong>Treinamento:</strong> {training.title} - {format(new Date(training.training_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                            )}
                            {reg.registered_at && (
                              <p><strong>Inscrito em:</strong> {format(new Date(reg.registered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`presence-${reg.id}`}
                              checked={reg.presence || false}
                              onCheckedChange={() => handleTogglePresence(reg.id, reg.presence || false)}
                            />
                            <Label htmlFor={`presence-${reg.id}`} className="text-sm cursor-pointer">
                              Presença
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
                  <p className="text-lg">Nenhuma inscrição encontrada.</p>
                  <p className="text-sm">Os registros aparecerão aqui quando houver inscrições.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de Criar/Editar Treinamento */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTraining ? 'Editar Treinamento' : 'Criar Novo Treinamento'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do treinamento. Campos marcados com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-secondary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingDate">Data *</Label>
                  <Input
                    id="trainingDate"
                    type="date"
                    value={formData.trainingDate}
                    onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                    className="bg-secondary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="bg-secondary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Formato *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) => setFormData({ ...formData, format: value, link: value === 'online' ? formData.link : '', location: value === 'presencial' ? formData.location : '' })}
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.format === 'online' && (
                <div className="space-y-2">
                  <Label htmlFor="link">Link da Reunião *</Label>
                  <Input
                    id="link"
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="bg-secondary"
                    placeholder="https://meet.google.com/..."
                    required={formData.format === 'online'}
                  />
                </div>
              )}

              {formData.format === 'presencial' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-secondary"
                    placeholder="Endereço completo"
                    required={formData.format === 'presencial'}
                  />
                </div>
              )}

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

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="bg-secondary"
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTraining ? 'Salvar Alterações' : 'Criar Treinamento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Inscritos Individuais */}
        {selectedTrainingForRegistrations && (
          <Dialog open={isRegistrationsDialogOpen} onOpenChange={setIsRegistrationsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Inscritos - {selectedTrainingForRegistrations.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {format(new Date(selectedTrainingForRegistrations.training_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {selectedTrainingForRegistrations.time && ` às ${selectedTrainingForRegistrations.time}`}
                    </DialogDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const registrations = safeTrainingRegistrations.filter(reg => 
                        (reg.training_id || reg.trainingId) === selectedTrainingForRegistrations.id
                      );
                      handleExportToExcel(selectedTrainingForRegistrations, registrations);
                    }}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {(() => {
                  const registrations = safeTrainingRegistrations.filter(reg => 
                    (reg.training_id || reg.trainingId) === selectedTrainingForRegistrations.id
                  );

                  if (registrations.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhuma inscrição para este treinamento.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-secondary p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total de Inscrições</p>
                          <p className="text-2xl font-bold text-foreground">{registrations.length}</p>
                        </div>
                        <div className="bg-secondary p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Presenças Confirmadas</p>
                          <p className="text-2xl font-bold text-green-500">{registrations.filter(r => r.presence).length}</p>
                        </div>
                        <div className="bg-secondary p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Aderência</p>
                          <p className="text-2xl font-bold text-primary">
                            {registrations.length > 0 ? Math.round((registrations.filter(r => r.presence).length / registrations.length) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                      {registrations.map(reg => {
                        const store = stores.find(s => s.id === (reg.store_id || reg.storeId));
                        const collaborator = reg.collaborator || {};

                        return (
                          <div key={reg.id} className="bg-secondary p-4 rounded-lg border border-border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-foreground">{collaborator.name || 'Colaborador não encontrado'}</h4>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-semibold",
                                    reg.presence || reg.status === 'confirmed' 
                                      ? "bg-green-500/20 text-green-500"
                                      : reg.status === 'cancelled'
                                      ? "bg-red-500/20 text-red-500"
                                      : "bg-yellow-500/20 text-yellow-500"
                                  )}>
                                    {reg.presence || reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                                  </span>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p><strong>Cargo:</strong> {collaborator.role || 'Não informado'}</p>
                                  {collaborator.cpf && <p><strong>CPF:</strong> {collaborator.cpf}</p>}
                                  {collaborator.email && <p><strong>Email:</strong> {collaborator.email}</p>}
                                  <p><strong>Loja:</strong> {store?.name || 'Não encontrada'}</p>
                                  {store?.code && <p><strong>Código:</strong> {store.code}</p>}
                                  {store?.franqueado && <p><strong>Franqueado:</strong> {store.franqueado}</p>}
                                  {store?.bandeira && <p><strong>Bandeira:</strong> {store.bandeira}</p>}
                                  {store?.supervisor && <p><strong>Supervisor:</strong> {store.supervisor}</p>}
                                  {reg.registered_at && (
                                    <p><strong>Inscrito em:</strong> {format(new Date(reg.registered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Checkbox
                                  id={`presence-dialog-${reg.id}`}
                                  checked={reg.presence || false}
                                  onCheckedChange={() => handleTogglePresence(reg.id, reg.presence || false)}
                                />
                                <Label htmlFor={`presence-dialog-${reg.id}`} className="text-sm cursor-pointer">
                                  Presença
                                </Label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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







