import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Tablet, 
  Laptop, 
  Monitor, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CreditCard,
  Store,
  Filter,
  Package,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import * as api from '@/lib/supabaseService';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { supabase } from '@/lib/customSupabaseClient';
import { availableIcons, getIconByName, defaultEquipmentTypes } from '@/lib/equipmentIcons';

const conditionOptions = [
  { value: 'NOVO', label: 'Novo', color: 'bg-green-500' },
  { value: 'BOM', label: 'Bom', color: 'bg-blue-500' },
  { value: 'QUEBRADO', label: 'Quebrado', color: 'bg-red-500' },
];

const carriers = ['VIVO', 'CLARO', 'TIM', 'OI', 'OUTROS'];

const PatrimonyManagement = () => {
  const { user } = useAuth();
  const { stores } = useData();
  const { toast } = useToast();
  
  const [equipments, setEquipments] = useState([]);
  const [chips, setChips] = useState([]);
  const [equipmentTypesList, setEquipmentTypesList] = useState([]); // Tipos do banco + padrão
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'table'
  const [collapsedStores, setCollapsedStores] = useState(new Set()); // Lojas colapsadas
  
  // Dialogs
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [chipDialogOpen, setChipDialogOpen] = useState(false);
  const [deleteEquipmentDialogOpen, setDeleteEquipmentDialogOpen] = useState(false);
  const [deleteChipDialogOpen, setDeleteChipDialogOpen] = useState(false);
  const [equipmentTypeDialogOpen, setEquipmentTypeDialogOpen] = useState(false);
  const [storeDetailsDialogOpen, setStoreDetailsDialogOpen] = useState(false);
  const [selectedStoreForDetails, setSelectedStoreForDetails] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingChip, setEditingChip] = useState(null);
  const [editingEquipmentType, setEditingEquipmentType] = useState(null);
  
  // Form states
  const [equipmentForm, setEquipmentForm] = useState({
    store_id: '',
    equipment_type: 'CELULAR',
    condition_status: 'BOM',
    brand: '',
    model: '',
    serial_number: '',
    notes: '',
    icon_name: '',
  });
  
  const [equipmentTypeForm, setEquipmentTypeForm] = useState({
    name: '',
    label: '',
    icon_name: 'Smartphone',
  });
  
  const [chipForm, setChipForm] = useState({
    store_id: '',
    phone_number: '',
    carrier: 'VIVO',
    usage_type: '',
    notes: '',
  });

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    return filterStoresByUserType(stores, user?.role);
  }, [stores, user?.role]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [equipmentsData, chipsData, typesData] = await Promise.all([
        api.fetchEquipments().catch(err => {
          // Se a tabela não existir, retornar array vazio
          if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
            console.warn('Tabela de equipamentos não encontrada. Execute o script SQL primeiro.');
            return [];
          }
          throw err;
        }),
        api.fetchChips().catch(err => {
          // Se a tabela não existir, retornar array vazio
          if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
            console.warn('Tabela de chips não encontrada. Execute o script SQL primeiro.');
            return [];
          }
          throw err;
        }),
        api.fetchEquipmentTypes().catch(err => {
          // Se a tabela não existir, usar apenas tipos padrão
          if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
            console.warn('Tabela de tipos de equipamentos não encontrada. Usando tipos padrão.');
            return [];
          }
          throw err;
        }),
      ]);
      setEquipments(equipmentsData || []);
      setChips(chipsData || []);
      
      // Combinar tipos padrão com tipos do banco
      const combinedTypes = [...defaultEquipmentTypes];
      if (typesData && typesData.length > 0) {
        typesData.forEach(dbType => {
          // Se não existe nos padrões, adicionar
          if (!combinedTypes.find(t => t.value === dbType.name)) {
            combinedTypes.push({
              value: dbType.name,
              label: dbType.label,
              iconName: dbType.icon_name,
              color: dbType.color || 'text-blue-500',
            });
          }
        });
      }
      setEquipmentTypesList(combinedTypes);
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
      setEquipmentTypesList(defaultEquipmentTypes);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debug
  useEffect(() => {
    console.log('🔍 [PatrimonyManagement] Componente montado', { user, storesCount: stores?.length });
  }, [user, stores]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Removido polling - usando apenas Realtime para evitar piscar na tela

  // Subscription para atualizações em tempo real
  useEffect(() => {
    if (!user) {
      console.log('⚠️ [PatrimonyManagement] Usuário não disponível, pulando subscription');
      return;
    }
    
    console.log('🔌 [PatrimonyManagement] Configurando subscription Realtime para usuário:', user.role, user.id);
    
    const equipmentsChannel = supabase
      .channel(`equipments-management-${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'equipments'
        },
        async (payload) => {
          console.log('🔄 [Realtime PatrimonyManagement] EVENTO RECEBIDO!', {
            eventType: payload.eventType,
            id: payload.new?.id || payload.old?.id,
            newData: payload.new,
            oldData: payload.old,
            timestamp: new Date().toISOString()
          });
          if (payload.eventType === 'UPDATE') {
            console.log('📝 [PatrimonyManagement] Processando UPDATE:', payload.new);
            
            // Verificar se temos condition_status no payload
            if (payload.new?.condition_status) {
              console.log('✅ [PatrimonyManagement] condition_status recebido:', payload.new.condition_status);
            }
            
            // Atualização imediata com os dados do payload
            setEquipments(prev => {
              const index = prev.findIndex(eq => eq.id === payload.new.id);
              if (index >= 0) {
                // Atualizar o item existente com os novos dados
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  ...payload.new,
                  // Garantir que condition_status seja atualizado
                  condition_status: payload.new.condition_status || updated[index].condition_status,
                  // Manter a relação com stores se já existir
                  stores: updated[index].stores || payload.new.stores
                };
                console.log('✅ [PatrimonyManagement] Equipamento atualizado no estado:', {
                  id: updated[index].id,
                  condition_status: updated[index].condition_status
                });
                return updated;
              }
              console.log('⚠️ [PatrimonyManagement] Equipamento não encontrado na lista, buscando dados completos...');
              // Se não encontrou, buscar dados completos e adicionar
              return prev;
            });
            
            // Buscar dados completos em background para garantir relações
            try {
              const { data, error } = await supabase
                .from('equipments')
                .select('*, stores(id, name, code)')
                .eq('id', payload.new.id)
                .single();
              
              if (error) {
                console.error('❌ [PatrimonyManagement] Erro ao buscar dados atualizados:', error);
                return;
              }
              
              if (data) {
                console.log('✅ [PatrimonyManagement] Dados completos recebidos:', data);
                setEquipments(prev => {
                  const index = prev.findIndex(eq => eq.id === payload.new.id);
                  if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = data;
                    return updated;
                  } else {
                    // Se não encontrou, adicionar à lista
                    console.log('➕ [PatrimonyManagement] Adicionando equipamento à lista');
                    return [data, ...prev];
                  }
                });
              }
            } catch (error) {
              console.error('❌ [PatrimonyManagement] Erro ao buscar dados atualizados:', error);
              // Recarregar tudo como fallback
              loadData();
            }
          } else if (payload.eventType === 'INSERT') {
            // Buscar dados completos do novo equipamento
            try {
              const { data } = await supabase
                .from('equipments')
                .select('*, stores(id, name, code)')
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
              loadData();
            }
          } else if (payload.eventType === 'DELETE') {
            setEquipments(prev => prev.filter(eq => eq.id !== payload.old.id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 [PatrimonyManagement] Status subscription equipments:', status);
        if (err) {
          console.error('❌ [PatrimonyManagement] Erro na subscription equipments:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ [PatrimonyManagement] Subscription equipments ativa!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [PatrimonyManagement] Erro no canal equipments - Realtime pode não estar habilitado');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [PatrimonyManagement] Timeout na subscription equipments');
        }
      });

    const chipsChannel = supabase
      .channel(`chips-management-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chips' },
        async (payload) => {
          console.log('🔄 [Realtime PatrimonyManagement] Mudança em chips:', {
            eventType: payload.eventType,
            id: payload.new?.id || payload.old?.id
          });
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Buscar dados completos para garantir que temos as relações (stores)
            try {
              const { data } = await supabase
                .from('chips')
                .select('*, stores(id, name, code)')
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                if (payload.eventType === 'INSERT') {
                  setChips(prev => [data, ...prev]);
                } else {
                  setChips(prev => {
                    const index = prev.findIndex(chip => chip.id === payload.new.id);
                    if (index >= 0) {
                      const updated = [...prev];
                      updated[index] = data;
                      return updated;
                    }
                    return prev;
                  });
                }
              }
            } catch (error) {
              console.error('Erro ao buscar dados atualizados:', error);
              // Fallback: recarregar tudo
              loadData();
            }
          } else if (payload.eventType === 'DELETE') {
            setChips(prev => prev.filter(chip => chip.id !== payload.old.id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 [PatrimonyManagement] Status subscription chips:', status);
        if (err) {
          console.error('❌ [PatrimonyManagement] Erro na subscription chips:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ [PatrimonyManagement] Subscription chips ativa!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [PatrimonyManagement] Erro no canal chips');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [PatrimonyManagement] Timeout na subscription chips');
        }
      });

    // Subscription para tipos de equipamentos (apenas para admin)
    const equipmentTypesChannel = user?.role === 'admin' ? supabase
      .channel(`equipment-types-management-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'equipment_types' },
        async (payload) => {
          console.log('🔄 [Realtime PatrimonyManagement] Mudança em equipment_types:', {
            eventType: payload.eventType,
            id: payload.new?.id || payload.old?.id
          });
          // Recarregar tipos quando houver mudanças
          loadData();
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('❌ [PatrimonyManagement] Erro na subscription equipment_types:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ [PatrimonyManagement] Subscription equipment_types ativa!');
        }
      }) : null;

    return () => {
      console.log('🔌 [PatrimonyManagement] Desconectando subscriptions...');
      equipmentsChannel.unsubscribe();
      chipsChannel.unsubscribe();
      if (equipmentTypesChannel) {
        equipmentTypesChannel.unsubscribe();
      }
    };
  }, [loadData, user]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => {
      const matchesStore = !selectedStore || eq.store_id === selectedStore;
      const matchesType = selectedEquipmentType === 'all' || eq.equipment_type === selectedEquipmentType;
      const matchesCondition = selectedCondition === 'all' || eq.condition_status === selectedCondition;
      const matchesSearch = !searchTerm || 
        eq.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStore && matchesType && matchesCondition && matchesSearch;
    });
  }, [equipments, selectedStore, selectedEquipmentType, selectedCondition, searchTerm]);

  const filteredChips = useMemo(() => {
    return chips.filter(chip => {
      const matchesStore = !selectedStore || chip.store_id === selectedStore;
      const matchesSearch = !searchTerm || 
        chip.phone_number?.includes(searchTerm) ||
        chip.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chip.usage_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chip.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStore && matchesSearch;
    });
  }, [chips, selectedStore, searchTerm]);

  // Agrupar equipamentos e chips por loja para admin e supervisão
  const isAdminOrSupervisor = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia';
  }, [user?.role]);

  const equipmentsByStore = useMemo(() => {
    if (!isAdminOrSupervisor) return null;
    
    const grouped = {};
    filteredEquipments.forEach(eq => {
      const storeId = eq.store_id;
      const storeName = eq.stores?.name || 'Loja não identificada';
      if (!grouped[storeId]) {
        grouped[storeId] = {
          storeId,
          storeName,
          equipments: []
        };
      }
      grouped[storeId].equipments.push(eq);
    });
    return grouped;
  }, [filteredEquipments, isAdminOrSupervisor]);

  const chipsByStore = useMemo(() => {
    if (!isAdminOrSupervisor) return null;
    
    const grouped = {};
    filteredChips.forEach(chip => {
      const storeId = chip.store_id;
      const storeName = chip.stores?.name || 'Loja não identificada';
      if (!grouped[storeId]) {
        grouped[storeId] = {
          storeId,
          storeName,
          chips: []
        };
      }
      grouped[storeId].chips.push(chip);
    });
    return grouped;
  }, [filteredChips, isAdminOrSupervisor]);

  const handleOpenEquipmentDialog = (equipment = null) => {
    if (equipment) {
      setEditingEquipment(equipment);
      setEquipmentForm({
        store_id: equipment.store_id,
        equipment_type: equipment.equipment_type,
        condition_status: equipment.condition_status,
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        notes: equipment.notes || '',
        icon_name: equipment.icon_name || '',
      });
    } else {
      setEditingEquipment(null);
      const defaultType = equipmentTypesList[0] || defaultEquipmentTypes[0];
      setEquipmentForm({
        store_id: selectedStore || '',
        equipment_type: defaultType?.value || 'CELULAR',
        condition_status: 'BOM',
        brand: '',
        model: '',
        serial_number: '',
        notes: '',
        icon_name: defaultType?.iconName || 'Smartphone',
      });
    }
    setEquipmentDialogOpen(true);
  };
  
  const handleOpenEquipmentTypeDialog = (type = null) => {
    if (type) {
      setEditingEquipmentType(type);
        setEquipmentTypeForm({
          name: type.name,
          label: type.label,
          icon_name: type.icon_name || 'Smartphone',
        });
    } else {
      setEditingEquipmentType(null);
      setEquipmentTypeForm({
        name: '',
        label: '',
        icon_name: 'Smartphone',
      });
    }
    setEquipmentTypeDialogOpen(true);
  };
  
  const handleSaveEquipmentType = async () => {
    try {
      if (!equipmentTypeForm.name || !equipmentTypeForm.label) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha nome e label do tipo de equipamento.',
        });
        return;
      }
      
      // Validar formato do nome (uppercase, sem espaços)
      const formattedName = equipmentTypeForm.name.toUpperCase().replace(/\s+/g, '_');
      
      if (editingEquipmentType) {
        await api.updateEquipmentType(editingEquipmentType.id, {
          name: formattedName,
          label: equipmentTypeForm.label,
          icon_name: equipmentTypeForm.icon_name,
          color: 'text-blue-500', // Valor padrão
        });
        toast({
          title: 'Sucesso',
          description: 'Tipo de equipamento atualizado com sucesso.',
        });
      } else {
        await api.createEquipmentType({
          name: formattedName,
          label: equipmentTypeForm.label,
          icon_name: equipmentTypeForm.icon_name,
          color: 'text-blue-500', // Valor padrão
        });
        toast({
          title: 'Sucesso',
          description: 'Tipo de equipamento criado com sucesso.',
        });
      }
      
      setEquipmentTypeDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tipo de equipamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o tipo de equipamento.',
      });
    }
  };

  const handleOpenChipDialog = (chip = null) => {
    if (chip) {
      setEditingChip(chip);
      setChipForm({
        store_id: chip.store_id,
        phone_number: chip.phone_number,
        carrier: chip.carrier,
        usage_type: chip.usage_type,
        notes: chip.notes || '',
      });
    } else {
      setEditingChip(null);
      setChipForm({
        store_id: selectedStore || '',
        phone_number: '',
        carrier: 'VIVO',
        usage_type: '',
        notes: '',
      });
    }
    setChipDialogOpen(true);
  };

  const handleSaveEquipment = async () => {
    try {
      if (!equipmentForm.store_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Selecione uma loja.',
        });
        return;
      }

      // Garantir que icon_name está preenchido (usar o padrão do tipo se não foi selecionado)
      const typeData = getEquipmentTypeData(equipmentForm.equipment_type);
      const iconName = equipmentForm.icon_name || typeData.iconName || 'Smartphone';
      
      const equipmentData = {
        ...equipmentForm,
        icon_name: iconName
      };

      if (editingEquipment) {
        await api.updateEquipment(editingEquipment.id, equipmentData);
        toast({
          title: 'Sucesso',
          description: 'Equipamento atualizado com sucesso.',
        });
      } else {
        await api.createEquipment(equipmentData);
        toast({
          title: 'Sucesso',
          description: 'Equipamento cadastrado com sucesso.',
        });
      }
      
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

  const handleSaveChip = async () => {
    try {
      if (!chipForm.store_id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Selecione uma loja.',
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

      if (editingChip) {
        await api.updateChip(editingChip.id, chipForm);
        toast({
          title: 'Sucesso',
          description: 'Chip atualizado com sucesso.',
        });
      } else {
        await api.createChip(chipForm);
        toast({
          title: 'Sucesso',
          description: 'Chip cadastrado com sucesso.',
        });
      }
      
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

  const handleDeleteEquipment = async () => {
    try {
      await api.deleteEquipment(editingEquipment.id);
      toast({
        title: 'Sucesso',
        description: 'Equipamento excluído com sucesso.',
      });
      setDeleteEquipmentDialogOpen(false);
      setEditingEquipment(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o equipamento.',
      });
    }
  };

  const handleDeleteChip = async () => {
    try {
      await api.deleteChip(editingChip.id);
      toast({
        title: 'Sucesso',
        description: 'Chip excluído com sucesso.',
      });
      setDeleteChipDialogOpen(false);
      setEditingChip(null);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir chip:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o chip.',
      });
    }
  };

  const getEquipmentIcon = (type, iconName = null) => {
    // Se tiver icon_name específico, usar ele
    if (iconName) {
      return getIconByName(iconName);
    }
    // Caso contrário, buscar pelo tipo
    const typeData = equipmentTypesList.find(t => t.value === type);
    if (typeData && typeData.iconName) {
      return getIconByName(typeData.iconName);
    }
    return Smartphone; // Default
  };
  
  const getEquipmentTypeData = (type) => {
    return equipmentTypesList.find(t => t.value === type) || {
      value: type,
      label: type,
      iconName: 'Smartphone',
      color: 'text-blue-500'
    };
  };

  const getConditionBadge = (condition) => {
    const option = conditionOptions.find(opt => opt.value === condition);
    return (
      <Badge className={`${option?.color || 'bg-gray-500'} text-white text-xs px-2 py-0.5`}>
        {option?.label || condition}
      </Badge>
    );
  };

  const toggleStoreCollapse = (storeId) => {
    setCollapsedStores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
      } else {
        newSet.add(storeId);
      }
      return newSet;
    });
  };

  const equipmentStats = useMemo(() => {
    const stats = {
      total: equipments.length,
      byType: {},
      byCondition: {},
      byStore: {},
      byStoreAndType: {}, // { storeId: { type: count } }
      byStoreAndCondition: {}, // { storeId: { condition: count } }
    };

    equipments.forEach(eq => {
      stats.byType[eq.equipment_type] = (stats.byType[eq.equipment_type] || 0) + 1;
      stats.byCondition[eq.condition_status] = (stats.byCondition[eq.condition_status] || 0) + 1;
      stats.byStore[eq.store_id] = (stats.byStore[eq.store_id] || 0) + 1;
      
      // Por loja e tipo
      if (!stats.byStoreAndType[eq.store_id]) {
        stats.byStoreAndType[eq.store_id] = {};
      }
      stats.byStoreAndType[eq.store_id][eq.equipment_type] = 
        (stats.byStoreAndType[eq.store_id][eq.equipment_type] || 0) + 1;
      
      // Por loja e condição
      if (!stats.byStoreAndCondition[eq.store_id]) {
        stats.byStoreAndCondition[eq.store_id] = {};
      }
      stats.byStoreAndCondition[eq.store_id][eq.condition_status] = 
        (stats.byStoreAndCondition[eq.store_id][eq.condition_status] || 0) + 1;
    });

    return stats;
  }, [equipments]);
  
  // Estatísticas por loja para visualização em cards (usando filteredEquipments para refletir filtros)
  const storeStats = useMemo(() => {
    if (!isAdminOrSupervisor) return [];
    
    return filteredStores.map(store => {
      // Usar filteredEquipments ao invés de equipments para refletir os filtros ativos
      const storeEquipments = filteredEquipments.filter(eq => eq.store_id === store.id);
      const storeChips = chips.filter(chip => chip.store_id === store.id);
      
      // Estatísticas por tipo (apenas dos equipamentos filtrados)
      const byType = {};
      storeEquipments.forEach(eq => {
        byType[eq.equipment_type] = (byType[eq.equipment_type] || 0) + 1;
      });
      
      // Estatísticas por condição (apenas dos equipamentos filtrados)
      const byCondition = {
        NOVO: storeEquipments.filter(eq => eq.condition_status === 'NOVO').length,
        BOM: storeEquipments.filter(eq => eq.condition_status === 'BOM').length,
        QUEBRADO: storeEquipments.filter(eq => eq.condition_status === 'QUEBRADO').length,
      };
      
      return {
        store,
        totalEquipments: storeEquipments.length,
        totalChips: storeChips.length,
        byType,
        byCondition,
      };
    });
  }, [filteredStores, filteredEquipments, chips, isAdminOrSupervisor]);

  const chipStats = useMemo(() => {
    const stats = {
      total: chips.length,
      byCarrier: {},
      byStore: {},
    };

    chips.forEach(chip => {
      stats.byCarrier[chip.carrier] = (stats.byCarrier[chip.carrier] || 0) + 1;
      stats.byStore[chip.store_id] = (stats.byStore[chip.store_id] || 0) + 1;
    });

    return stats;
  }, [chips]);

  // Verificar se o usuário tem permissão
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando informações do usuário...</p>
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
              {equipmentStats.total + chipStats.total} itens cadastrados
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Button onClick={() => handleOpenEquipmentTypeDialog()} size="sm" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Novo Tipo
              </Button>
            )}
            <Button onClick={() => handleOpenEquipmentDialog()} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Equipamento
            </Button>
            <Button onClick={() => handleOpenChipDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Chip
            </Button>
          </div>
        </div>

        {/* Estatísticas compactas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setSelectedEquipmentType('all')}
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
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setSelectedStore(null)}
          >
            <div className="p-2 rounded-md bg-purple-500/10">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{chipStats.total}</div>
              <div className="text-xs text-muted-foreground">Chips</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="p-2 rounded-md bg-green-500/10">
              <Store className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Object.keys(equipmentStats.byStore).length}</div>
              <div className="text-xs text-muted-foreground">Lojas</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => setSelectedCondition('QUEBRADO')}
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

        {/* Visualização por loja para admin/supervisor */}
        {isAdminOrSupervisor ? (
          <Tabs defaultValue="equipments" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="equipments" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Equipamentos
              </TabsTrigger>
              <TabsTrigger value="chips" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Chips
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="equipments" className="space-y-4">
              {/* Filtros - Movidos para cima */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar equipamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
                  <SelectTrigger className="w-[180px] h-10">
                    <Monitor className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {equipmentTypesList.map(type => {
                      const Icon = getEquipmentIcon(type.value, type.iconName);
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="w-[150px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {conditionOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-lg p-1 bg-background">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 px-3"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Cards de lojas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {storeStats.map((storeStat, index) => (
                  <motion.div
                    key={storeStat.store.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`cursor-pointer hover:border-primary transition-all hover:shadow-md ${
                        selectedStore === storeStat.store.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Abrir diálogo de detalhes da loja
                        setSelectedStoreForDetails(storeStat.store);
                        setStoreDetailsDialogOpen(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{storeStat.store.code}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">{storeStat.store.name}</p>
                          </div>
                          <Badge variant="secondary" className="font-semibold">{storeStat.totalEquipments}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Estatísticas por tipo de equipamento */}
                        {Object.keys(storeStat.byType).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Por Tipo:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(storeStat.byType).map(([type, count]) => {
                                const typeData = getEquipmentTypeData(type);
                                const Icon = getEquipmentIcon(type, typeData.iconName);
                                return (
                                  <div
                                    key={type}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/80 hover:bg-muted transition-colors"
                                    title={typeData.label}
                                  >
                                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Estatísticas por condição - Design modernizado */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Por Status:</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
                              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{storeStat.byCondition.NOVO || 0}</div>
                              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">Novo</div>
                            </div>
                            <div className="text-center p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                              <div className="text-base font-bold text-blue-700 dark:text-blue-400">{storeStat.byCondition.BOM || 0}</div>
                              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-500 uppercase tracking-wide">Bom</div>
                            </div>
                            <div className="text-center p-2.5 rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 border border-rose-200/50 dark:border-rose-800/30">
                              <div className="text-base font-bold text-rose-700 dark:text-rose-400">{storeStat.byCondition.QUEBRADO || 0}</div>
                              <div className="text-[10px] font-medium text-rose-600 dark:text-rose-500 uppercase tracking-wide">Quebrado</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Lista de equipamentos (quando uma loja está selecionada) */}
              {selectedStore ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-500" />
                        Equipamentos da Loja Selecionada
                        <Badge variant="secondary" className="ml-2">{filteredEquipments.length}</Badge>
                      </h2>
                      {filteredStores.find(s => s.id === selectedStore) && (
                        <Badge variant="outline" className="text-xs">
                          {filteredStores.find(s => s.id === selectedStore)?.code} - {filteredStores.find(s => s.id === selectedStore)?.name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStore(null)}
                      className="text-xs"
                    >
                      Limpar Seleção
                    </Button>
                  </div>
                  {filteredEquipments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                      <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum equipamento encontrado para esta loja</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {filteredEquipments.map((equipment, index) => {
                        const Icon = getEquipmentIcon(equipment.equipment_type, equipment.icon_name);
                        const typeData = getEquipmentTypeData(equipment.equipment_type);
                        const typeLabel = typeData.label;
                        const colors = typeData.color || 'text-blue-500';
                        
                        return (
                          <motion.div
                            key={equipment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`p-2 rounded-lg bg-opacity-10 ${colors.replace('text-', 'bg-')}`}>
                                    <Icon className={`w-5 h-5 ${colors}`} />
                                  </div>
                                  {getConditionBadge(equipment.condition_status)}
                                </div>
                                <div className="space-y-1 mb-3">
                                  <p className="font-semibold text-sm">{typeLabel}</p>
                                  {equipment.brand && (
                                    <p className="text-xs text-muted-foreground">{equipment.brand} {equipment.model}</p>
                                  )}
                                  {equipment.serial_number && (
                                    <p className="text-xs text-muted-foreground font-mono">{equipment.serial_number}</p>
                                  )}
                                </div>
                                <div className="flex gap-1 pt-2 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEquipmentDialog(equipment);
                                    }}
                                    className="flex-1 h-7 text-xs"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEquipment(equipment);
                                      setDeleteEquipmentDialogOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Clique em um card de loja acima para ver os equipamentos</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="chips" className="space-y-4">
              {/* Filtros para chips */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-card">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar chips..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <Select value={selectedStore || 'all'} onValueChange={(value) => setSelectedStore(value === 'all' ? null : value)}>
                  <SelectTrigger className="w-[180px] h-9">
                    <Store className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Loja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {filteredStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 px-2"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-7 px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Lista de chips agrupados por loja */}
              {filteredChips.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum chip encontrado</p>
                </div>
              ) : chipsByStore ? (
                // Exibição agrupada por loja
                <div className="space-y-4">
                  {Object.values(chipsByStore).map((storeGroup, storeIndex) => {
                    const isCollapsed = collapsedStores.has(`chip-${storeGroup.storeId}`);
                    
                    return (
                      <Card key={storeGroup.storeId} className="overflow-hidden">
                        <CardHeader 
                          className="cursor-pointer hover:bg-accent/50 transition-colors pb-3"
                          onClick={() => toggleStoreCollapse(`chip-${storeGroup.storeId}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Store className="w-5 h-5 text-primary" />
                              <div>
                                <h3 className="text-md font-semibold text-foreground">{storeGroup.storeName}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {storeGroup.chips.length} chip{storeGroup.chips.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {!isCollapsed && (
                          <CardContent className="pt-0">
                            {viewMode === 'table' ? (
                              // Visualização em tabela
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Número</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Operadora</th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Uso</th>
                                      <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {storeGroup.chips.map((chip) => (
                                      <tr key={chip.id} className="border-b hover:bg-accent/50 transition-colors">
                                        <td className="py-2 px-3">
                                          <span className="text-sm font-medium">{chip.phone_number}</span>
                                        </td>
                                        <td className="py-2 px-3">
                                          <Badge variant="outline" className="text-xs">{chip.carrier}</Badge>
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="text-xs text-muted-foreground">
                                            {chip.usage_type || 'Uso não informado'}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenChipDialog(chip);
                                              }}
                                              className="h-7 w-7 p-0"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingChip(chip);
                                                setDeleteChipDialogOpen(true);
                                              }}
                                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              // Visualização em grid (cards compactos)
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                {storeGroup.chips.map((chip, index) => (
                                  <motion.div
                                    key={chip.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                  >
                                    <Card className="hover:border-primary/50 transition-all cursor-pointer group h-full">
                                      <CardContent className="p-3">
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="p-1.5 rounded-md bg-purple-500/10">
                                            <CreditCard className="w-4 h-4 text-purple-500" />
                                          </div>
                                          <Badge variant="outline" className="text-xs">{chip.carrier}</Badge>
                                        </div>
                                        <div className="space-y-0.5 mb-2">
                                          <p className="font-medium text-xs">{chip.phone_number}</p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {chip.usage_type || 'Uso não informado'}
                                          </p>
                                        </div>
                                        <div className="flex gap-1 pt-2 border-t">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenChipDialog(chip);
                                            }}
                                            className="flex-1 h-6 text-xs px-1"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingChip(chip);
                                              setDeleteChipDialogOpen(true);
                                            }}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // Exibição normal (não agrupada) - fallback
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filteredChips.map((chip, index) => (
                    <motion.div
                      key={chip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <CreditCard className="w-5 h-5 text-purple-500" />
                            </div>
                            <Badge variant="outline" className="text-xs">{chip.carrier}</Badge>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="font-semibold text-sm">{chip.phone_number}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {chip.stores?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {chip.usage_type || 'Uso não informado'}
                            </p>
                          </div>
                          <div className="flex gap-1 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChipDialog(chip);
                              }}
                              className="flex-1 h-7 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChip(chip);
                                setDeleteChipDialogOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Visualização normal para lojas (não admin) */
          <>
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
                  {equipmentTypesList.map(type => {
                    const Icon = getEquipmentIcon(type.value, type.iconName);
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
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
                    const Icon = getEquipmentIcon(equipment.equipment_type, equipment.icon_name);
                    const typeData = getEquipmentTypeData(equipment.equipment_type);
                    const typeLabel = typeData.label;
                    const colors = typeData.color || 'text-blue-500';
                    
                    return (
                      <motion.div
                        key={equipment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`p-2 rounded-lg bg-opacity-10 ${colors.replace('text-', 'bg-')}`}>
                                <Icon className={`w-5 h-5 ${colors}`} />
                              </div>
                              {getConditionBadge(equipment.condition_status)}
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="font-semibold text-sm">{typeLabel}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                {equipment.stores?.name}
                              </p>
                              {equipment.brand && (
                                <p className="text-xs text-muted-foreground">{equipment.brand} {equipment.model}</p>
                              )}
                            </div>
                            <div className="flex gap-1 pt-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEquipmentDialog(equipment);
                                }}
                                className="flex-1 h-7 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEquipment(equipment);
                                  setDeleteEquipmentDialogOpen(true);
                                }}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
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
            <div className="mt-6">
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
                      <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <CreditCard className="w-5 h-5 text-purple-500" />
                            </div>
                            <Badge variant="outline" className="text-xs">{chip.carrier}</Badge>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="font-semibold text-sm">{chip.phone_number}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {chip.stores?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {chip.usage_type || 'Uso não informado'}
                            </p>
                          </div>
                          <div className="flex gap-1 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChipDialog(chip);
                              }}
                              className="flex-1 h-7 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChip(chip);
                                setDeleteChipDialogOpen(true);
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Dialogs - Compartilhados entre admin e loja */}
        {/* Dialog de Equipamento */}
        <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do equipamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Loja *</Label>
                <Select
                  value={equipmentForm.store_id}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Equipamento *</Label>
                  <Select
                    value={equipmentForm.equipment_type}
                    onValueChange={(value) => {
                      const selectedType = equipmentTypesList.find(t => t.value === value);
                      setEquipmentForm({
                        ...equipmentForm,
                        equipment_type: value,
                        icon_name: selectedType?.iconName || 'Smartphone'
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypesList.map(type => {
                        const Icon = getEquipmentIcon(type.value, type.iconName);
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
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
                  {editingEquipment ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Chip */}
        <Dialog open={chipDialogOpen} onOpenChange={setChipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChip ? 'Editar Chip' : 'Adicionar Chip'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do chip
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Loja *</Label>
                <Select
                  value={chipForm.store_id}
                  onValueChange={(value) => setChipForm({ ...chipForm, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  {editingChip ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão de Equipamento */}
        <AlertDialog open={deleteEquipmentDialogOpen} onOpenChange={setDeleteEquipmentDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEquipment} className="bg-red-500 hover:bg-red-600">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Confirmação de Exclusão de Chip */}
        <AlertDialog open={deleteChipDialogOpen} onOpenChange={setDeleteChipDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este chip? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChip} className="bg-red-500 hover:bg-red-600">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Detalhes da Loja */}
        <Dialog open={storeDetailsDialogOpen} onOpenChange={setStoreDetailsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                {selectedStoreForDetails && (
                  <>
                    {selectedStoreForDetails.code} - {selectedStoreForDetails.name}
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Detalhes completos dos equipamentos desta loja
              </DialogDescription>
            </DialogHeader>
            {selectedStoreForDetails && (
              <div className="space-y-6">
                {/* Estatísticas da Loja */}
                {(() => {
                  const storeEquipments = equipments.filter(eq => eq.store_id === selectedStoreForDetails.id);
                  const storeStat = storeStats.find(s => s.store.id === selectedStoreForDetails.id);
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-blue-500/10">
                              <Monitor className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold">{storeEquipments.length}</div>
                              <div className="text-xs text-muted-foreground">Equipamentos</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-red-500/10">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-500">
                                {storeStat?.byCondition.QUEBRADO || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Quebrados</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Equipamentos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-500" />
                    Equipamentos ({equipments.filter(eq => eq.store_id === selectedStoreForDetails.id).length})
                  </h3>
                  {equipments.filter(eq => eq.store_id === selectedStoreForDetails.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <Monitor className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum equipamento cadastrado nesta loja</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                      {equipments
                        .filter(eq => eq.store_id === selectedStoreForDetails.id)
                        .map((equipment, index) => {
                          const Icon = getEquipmentIcon(equipment.equipment_type, equipment.icon_name);
                          const typeData = getEquipmentTypeData(equipment.equipment_type);
                          const typeLabel = typeData.label;
                          const colors = typeData.color || 'text-blue-500';
                          
                          return (
                            <Card key={equipment.id} className="hover:border-primary/50 transition-all">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`p-2 rounded-lg bg-opacity-10 ${colors.replace('text-', 'bg-')}`}>
                                    <Icon className={`w-5 h-5 ${colors}`} />
                                  </div>
                                  {getConditionBadge(equipment.condition_status)}
                                </div>
                                <div className="space-y-1 mb-3">
                                  <p className="font-semibold text-sm">{typeLabel}</p>
                                  {equipment.brand && (
                                    <p className="text-xs text-muted-foreground">
                                      {equipment.brand} {equipment.model}
                                    </p>
                                  )}
                                  {equipment.serial_number && (
                                    <p className="text-xs text-muted-foreground font-mono">
                                      Patrimônio: {equipment.serial_number}
                                    </p>
                                  )}
                                  {equipment.notes && (
                                    <p className="text-xs text-muted-foreground italic">
                                      {equipment.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 pt-2 border-t">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEquipmentDialog(equipment);
                                      setStoreDetailsDialogOpen(false);
                                    }}
                                    className="flex-1 h-7 text-xs"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEquipment(equipment);
                                      setDeleteEquipmentDialogOpen(true);
                                    }}
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Tipo de Equipamento */}
        <Dialog open={equipmentTypeDialogOpen} onOpenChange={setEquipmentTypeDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEquipmentType ? 'Editar Tipo de Equipamento' : 'Adicionar Novo Tipo de Equipamento'}
              </DialogTitle>
              <DialogDescription>
                Crie um novo tipo de equipamento para usar no controle de patrimônio
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome (Código) *</Label>
                <Input
                  value={equipmentTypeForm.name}
                  onChange={(e) => setEquipmentTypeForm({ ...equipmentTypeForm, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="Ex: IMPRESSORA_3D"
                  disabled={!!editingEquipmentType}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome único em maiúsculas (será convertido automaticamente)
                </p>
              </div>
              <div>
                <Label>Label (Nome de Exibição) *</Label>
                <Input
                  value={equipmentTypeForm.label}
                  onChange={(e) => setEquipmentTypeForm({ ...equipmentTypeForm, label: e.target.value })}
                  placeholder="Ex: Impressora 3D"
                />
              </div>
              <div>
                <Label>Ícone *</Label>
                <div className="grid grid-cols-6 gap-2 mt-2 p-3 border rounded-lg max-h-[250px] overflow-y-auto">
                  {availableIcons.map(iconData => {
                    const Icon = iconData.icon;
                    const isSelected = equipmentTypeForm.icon_name === iconData.name;
                    
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() => setEquipmentTypeForm({ ...equipmentTypeForm, icon_name: iconData.name })}
                        className={`p-2 rounded border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                        title={iconData.label}
                      >
                        <Icon className={`w-5 h-5 mx-auto ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEquipmentTypeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEquipmentType}>
                  {editingEquipmentType ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default PatrimonyManagement;

