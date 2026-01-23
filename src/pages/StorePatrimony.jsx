import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  Monitor, 
  Plus, 
  Search,
  CreditCard,
  AlertCircle,
  Package
} from 'lucide-react';
import * as api from '@/lib/supabaseService';
import { supabase } from '@/lib/customSupabaseClient';

const equipmentTypes = [
  { value: 'CELULAR', label: 'Celular', icon: Smartphone, color: 'text-blue-500' },
  { value: 'TABLET', label: 'Tablet', icon: Tablet, color: 'text-purple-500' },
  { value: 'NOTEBOOK', label: 'Notebook', icon: Laptop, color: 'text-green-500' },
  { value: 'MINI_PC', label: 'Mini PC', icon: Monitor, color: 'text-orange-500' },
];

const conditionOptions = [
  { value: 'NOVO', label: 'Novo', color: 'bg-green-500' },
  { value: 'BOM', label: 'Bom', color: 'bg-blue-500' },
  { value: 'QUEBRADO', label: 'Quebrado', color: 'bg-red-500' },
];

const carriers = ['VIVO', 'CLARO', 'TIM', 'OI', 'OUTROS'];

const StorePatrimony = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [equipments, setEquipments] = useState([]);
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  
  // Dialogs
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [chipDialogOpen, setChipDialogOpen] = useState(false);
  
  // Form states
  const [equipmentForm, setEquipmentForm] = useState({
    equipment_type: 'CELULAR',
    condition_status: 'BOM',
    brand: '',
    model: '',
    serial_number: '',
    notes: '',
  });
  
  const [chipForm, setChipForm] = useState({
    phone_number: '',
    carrier: 'VIVO',
    usage_type: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    if (!user?.storeId) return;
    
    try {
      setLoading(true);
      const [equipmentsData, chipsData] = await Promise.all([
        api.fetchEquipments(user.storeId).catch(err => {
          // Se a tabela não existir, retornar array vazio
          if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
            console.warn('Tabela de equipamentos não encontrada. Execute o script SQL primeiro.');
            return [];
          }
          throw err;
        }),
        api.fetchChips(user.storeId).catch(err => {
          // Se a tabela não existir, retornar array vazio
          if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
            console.warn('Tabela de chips não encontrada. Execute o script SQL primeiro.');
            return [];
          }
          throw err;
        }),
      ]);
      setEquipments(equipmentsData || []);
      setChips(chipsData || []);
    } catch (error) {
      console.error('Erro ao carregar patrimônio:', error);
      // Não mostrar toast se for erro de tabela não encontrada (já foi tratado acima)
      if (error?.code !== '42P01' && !error?.message?.includes('does not exist')) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Não foi possível carregar os dados de patrimônio.',
        });
      }
      // Garantir que os arrays estão inicializados mesmo em caso de erro
      setEquipments([]);
      setChips([]);
    } finally {
      setLoading(false);
    }
  }, [user?.storeId, toast]);

  useEffect(() => {
    if (user?.storeId) {
      loadData();
    }
  }, [user?.storeId, loadData]);

  // Subscription para atualizações em tempo real
  useEffect(() => {
    if (!user?.storeId) return;

    const equipmentsChannel = supabase
      .channel(`equipments-store-${user.storeId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'equipments',
          filter: `store_id=eq.${user.storeId}`
        },
        async (payload) => {
          console.log('🔄 [Realtime StorePatrimony] Mudança em equipamentos:', {
            eventType: payload.eventType,
            id: payload.new?.id || payload.old?.id,
            newData: payload.new,
            oldData: payload.old
          });
          if (payload.eventType === 'UPDATE') {
            // Atualização imediata com os dados do payload
            setEquipments(prev => {
              const index = prev.findIndex(eq => eq.id === payload.new.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  ...payload.new
                };
                return updated;
              }
              return prev;
            });
            
            // Buscar dados completos em background para garantir sincronização
            try {
              const { data } = await supabase
                .from('equipments')
                .select('*')
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setEquipments(prev => {
                  const index = prev.findIndex(eq => eq.id === payload.new.id);
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = data;
                    return updated;
                  }
                  return prev;
                });
              }
            } catch (error) {
              console.error('Erro ao buscar equipamento atualizado:', error);
              // Não fazer reload completo, já atualizamos com os dados do payload
            }
          } else if (payload.eventType === 'INSERT') {
            // Buscar dados completos do novo equipamento
            try {
              const { data } = await supabase
                .from('equipments')
                .select('*')
                .eq('id', payload.new.id)
                .single();
              if (data) {
                setEquipments(prev => {
                  // Verificar se já existe para evitar duplicatas
                  const exists = prev.some(eq => eq.id === data.id);
                  if (!exists) {
                    return [data, ...prev];
                  }
                  return prev;
                });
              }
            } catch (error) {
              console.error('Erro ao buscar equipamento inserido:', error);
              // Não fazer reload, apenas logar o erro
            }
          } else if (payload.eventType === 'DELETE') {
            setEquipments(prev => prev.filter(eq => eq.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const chipsChannel = supabase
      .channel(`chips-store-${user.storeId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'chips',
          filter: `store_id=eq.${user.storeId}`
        },
        async (payload) => {
          console.log('🔄 [Realtime StorePatrimony] Mudança em chips:', {
            eventType: payload.eventType,
            id: payload.new?.id || payload.old?.id
          });
          if (payload.eventType === 'UPDATE') {
            setChips(prev => {
              const index = prev.findIndex(chip => chip.id === payload.new.id);
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  ...payload.new
                };
                return updated;
              }
              return prev;
            });
          } else if (payload.eventType === 'INSERT') {
            try {
              const { data } = await supabase
                .from('chips')
                .select('*')
                .eq('id', payload.new.id)
                .single();
              if (data) {
                setChips(prev => {
                  const exists = prev.some(chip => chip.id === data.id);
                  if (!exists) {
                    return [data, ...prev];
                  }
                  return prev;
                });
              }
            } catch (error) {
              console.error('Erro ao buscar chip inserido:', error);
            }
          } else if (payload.eventType === 'DELETE') {
            setChips(prev => prev.filter(chip => chip.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      equipmentsChannel.unsubscribe();
      chipsChannel.unsubscribe();
    };
  }, [user?.storeId]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => {
      const matchesType = selectedEquipmentType === 'all' || eq.equipment_type === selectedEquipmentType;
      const matchesCondition = selectedCondition === 'all' || eq.condition_status === selectedCondition;
      const matchesSearch = !searchTerm || 
        eq.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesCondition && matchesSearch;
    });
  }, [equipments, selectedEquipmentType, selectedCondition, searchTerm]);

  const filteredChips = useMemo(() => {
    return chips.filter(chip => {
      const matchesSearch = !searchTerm || 
        chip.phone_number?.includes(searchTerm) ||
        chip.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chip.usage_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [chips, searchTerm]);

  const handleOpenEquipmentDialog = () => {
    setEquipmentForm({
      equipment_type: 'CELULAR',
      condition_status: 'BOM',
      brand: '',
      model: '',
      serial_number: '',
      notes: '',
    });
    setEquipmentDialogOpen(true);
  };

  const handleOpenChipDialog = () => {
    setChipForm({
      phone_number: '',
      carrier: 'VIVO',
      usage_type: '',
      notes: '',
    });
    setChipDialogOpen(true);
  };

  const handleSaveEquipment = async () => {
    try {
      if (!user?.storeId) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Loja não identificada.',
        });
        return;
      }

      await api.createEquipment({
        ...equipmentForm,
        store_id: user.storeId,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Equipamento cadastrado com sucesso.',
      });
      
      setEquipmentDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o equipamento.',
      });
    }
  };

  const handleUpdateCondition = async (equipmentId, newCondition) => {
    // Guardar o estado anterior para possível reversão
    const previousEquipment = equipments.find(eq => eq.id === equipmentId);
    const previousCondition = previousEquipment?.condition_status;
    
    if (!previousEquipment) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Equipamento não encontrado.',
      });
      return;
    }
    
    console.log('🔄 [handleUpdateCondition] Iniciando atualização:', {
      equipmentId,
      newCondition,
      previousCondition
    });
    
    try {
      // Fazer a atualização no banco PRIMEIRO
      const result = await api.updateEquipmentCondition(equipmentId, newCondition);
      
      console.log('✅ [handleUpdateCondition] Atualização concluída:', result);
      
      if (!result) {
        throw new Error('Atualização não retornou resultado');
      }
      
      // Após sucesso, atualizar o estado local e recarregar dados para garantir sincronização
      setEquipments(prev => prev.map(eq => 
        eq.id === equipmentId 
          ? { ...eq, condition_status: newCondition, updated_at: new Date().toISOString() }
          : eq
      ));
      
      // Recarregar dados uma vez para garantir que está sincronizado com o banco
      // Aguardar um pouco para garantir que o UPDATE foi persistido
      setTimeout(() => {
        loadData();
      }, 300);
      
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso.',
      });
    } catch (error) {
      console.error('❌ [handleUpdateCondition] Erro ao atualizar condição:', error);
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o status.',
      });
    }
  };

  const handleSaveChip = async () => {
    try {
      if (!user?.storeId) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Loja não identificada.',
        });
        return;
      }

      if (!chipForm.phone_number) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Informe o número do chip.',
        });
        return;
      }

      await api.createChip({
        ...chipForm,
        store_id: user.storeId,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Chip cadastrado com sucesso.',
      });
      
      setChipDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar chip:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o chip.',
      });
    }
  };

  const getEquipmentIcon = (type) => {
    return equipmentTypes.find(t => t.value === type)?.icon || Smartphone;
  };

  const getConditionBadge = (condition) => {
    const option = conditionOptions.find(opt => opt.value === condition);
    return (
      <Badge className={`${option?.color || 'bg-gray-500'} text-white`}>
        {option?.label || condition}
      </Badge>
    );
  };

  const equipmentStats = useMemo(() => {
    const stats = {
      total: equipments.length,
      byType: {},
      byCondition: {},
    };

    equipments.forEach(eq => {
      stats.byType[eq.equipment_type] = (stats.byType[eq.equipment_type] || 0) + 1;
      stats.byCondition[eq.condition_status] = (stats.byCondition[eq.condition_status] || 0) + 1;
    });

    return stats;
  }, [equipments]);

  if (!user?.storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-destructive">Loja não identificada. Entre em contato com o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Carregando patrimônio...</div>
          <div className="text-sm text-muted-foreground">Aguarde enquanto buscamos os dados.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Controle de Patrimônio - MYFEET</title>
      </Helmet>

      <div className="space-y-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="w-6 h-6" />
              Patrimônio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {equipmentStats.total + chips.length} itens cadastrados
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenEquipmentDialog} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Equipamento
            </Button>
            <Button onClick={handleOpenChipDialog} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Chip
            </Button>
          </div>
        </div>

        {/* Aviso compacto */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Você pode apenas visualizar e adicionar novos itens. Para editar ou excluir, entre em contato com o administrador.
          </p>
        </div>

        {/* Estatísticas compactas */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="p-2 rounded-md bg-blue-500/10">
              <Monitor className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{equipmentStats.total}</div>
              <div className="text-xs text-muted-foreground">Equipamentos</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="p-2 rounded-md bg-purple-500/10">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{chips.length}</div>
              <div className="text-xs text-muted-foreground">Chips</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="p-2 rounded-md bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{equipmentStats.byCondition.QUEBRADO || 0}</div>
              <div className="text-xs text-muted-foreground">Quebrados</div>
            </div>
          </motion.div>
        </div>

        {/* Filtros compactos */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
            <SelectTrigger className="w-[150px] h-9">
              <Monitor className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {equipmentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCondition} onValueChange={setSelectedCondition}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {conditionOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equipamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-500" />
              Equipamentos
              <Badge variant="secondary" className="ml-2">{filteredEquipments.length}</Badge>
            </h2>
          </div>
          {filteredEquipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum equipamento encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredEquipments.map((equipment, index) => {
                const Icon = getEquipmentIcon(equipment.equipment_type);
                const typeLabel = equipmentTypes.find(t => t.value === equipment.equipment_type)?.label;
                const colors = equipmentTypes.find(t => t.value === equipment.equipment_type)?.color || 'text-blue-500';
                
                return (
                  <motion.div
                    key={equipment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-opacity-10 ${colors.replace('text-', 'bg-')}`}>
                            <Icon className={`w-5 h-5 ${colors}`} />
                          </div>
                          <Select
                            value={equipment.condition_status}
                            onValueChange={(value) => handleUpdateCondition(equipment.id, value)}
                          >
                            <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:opacity-80 cursor-pointer">
                              <SelectValue asChild>
                                {getConditionBadge(equipment.condition_status)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {conditionOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{typeLabel}</p>
                          {equipment.brand && (
                            <p className="text-xs text-muted-foreground">{equipment.brand} {equipment.model}</p>
                          )}
                          {equipment.serial_number && (
                            <p className="text-xs text-muted-foreground">Patrimônio: {equipment.serial_number}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              Chips
              <Badge variant="secondary" className="ml-2">{filteredChips.length}</Badge>
            </h2>
          </div>
          {filteredChips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum chip encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredChips.map((chip, index) => (
                <motion.div
                  key={chip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <CreditCard className="w-5 h-5 text-purple-500" />
                        </div>
                        <Badge variant="outline" className="text-xs">{chip.carrier}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{chip.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {chip.usage_type || 'Uso não informado'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Dialog de Equipamento */}
        <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Equipamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do equipamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Equipamento *</Label>
                  <Select
                    value={equipmentForm.equipment_type}
                    onValueChange={(value) => setEquipmentForm({ ...equipmentForm, equipment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condição *</Label>
                  <Select
                    value={equipmentForm.condition_status}
                    onValueChange={(value) => setEquipmentForm({ ...equipmentForm, condition_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marca</Label>
                  <Input
                    value={equipmentForm.brand}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                    placeholder="Ex: Samsung"
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input
                    value={equipmentForm.model}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                    placeholder="Ex: Galaxy S21"
                  />
                </div>
              </div>
              <div>
                <Label>Numero do patrimonio</Label>
                <Input
                  value={equipmentForm.serial_number}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })}
                  placeholder="Ex: SN123456789"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={equipmentForm.notes}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEquipmentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEquipment}>
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Chip */}
        <Dialog open={chipDialogOpen} onOpenChange={setChipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Chip</DialogTitle>
              <DialogDescription>
                Preencha os dados do chip
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número *</Label>
                  <Input
                    value={chipForm.phone_number}
                    onChange={(e) => setChipForm({ ...chipForm, phone_number: e.target.value })}
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>
                <div>
                  <Label>Operadora *</Label>
                  <Select
                    value={chipForm.carrier}
                    onValueChange={(value) => setChipForm({ ...chipForm, carrier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.map(carrier => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Uso *</Label>
                <Input
                  value={chipForm.usage_type}
                  onChange={(e) => setChipForm({ ...chipForm, usage_type: e.target.value })}
                  placeholder="Ex: WhatsApp, Vendas, etc"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={chipForm.notes}
                  onChange={(e) => setChipForm({ ...chipForm, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setChipDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveChip}>
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default StorePatrimony;

