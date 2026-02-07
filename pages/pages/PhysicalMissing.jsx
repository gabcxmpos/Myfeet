import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle, MoreVertical, Trash2, Search, BarChart3, Package, TrendingUp, CheckCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { AVAILABLE_BRANDS as DEFAULT_BRANDS } from '@/lib/brands';
import { fetchAppSettings } from '@/lib/supabaseService';

const PhysicalMissing = () => {
  const { 
    stores, 
    physicalMissing, 
    addPhysicalMissing,
    updatePhysicalMissing,
    deletePhysicalMissing,
    fetchData 
  } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStore = user?.role === 'loja' || user?.role === 'admin_loja';
  const isDevolucoes = user?.role === 'devoluções';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('open');
  const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);
  const [selectedMissingForView, setSelectedMissingForView] = useState(null);
  const [filters, setFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: [],
    brand: [],
    startDate: '',
    endDate: ''
  });

  // Usar filtros locais
  const activeFilters = filters;
  
  const [missingFormData, setMissingFormData] = useState({
    missing_type: [],
    nf_number: '',
    moved_to_defect: false,
    store_id: user?.storeId || '',
    items: [{
      id: Date.now(),
      brand: '',
      sku: '',
      color: '',
      size: '',
      cost_value: '',
      quantity: ''
    }],
    // Para Divergência: arrays de itens
    divergence_missing_items: [{
      id: Date.now(),
      brand: '',
      sku: '',
      color: '',
      size: '',
      quantity: '',
      cost_value: ''
    }],
    divergence_surplus_items: [{
      id: Date.now(),
      brand: '',
      sku: '',
      color: '',
      size: '',
      quantity: '',
      cost_value: ''
    }]
  });

  useEffect(() => {
    if (user?.storeId) {
      setMissingFormData(prev => ({ 
        ...prev, 
        store_id: user.storeId,
        items: prev.items || [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          cost_value: '',
          quantity: ''
        }],
        divergence_missing_items: prev.divergence_missing_items || [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }],
        divergence_surplus_items: prev.divergence_surplus_items || [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }]
      }));
    }
  }, [user?.storeId]);

  // Carregar marcas do banco de dados
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const savedBrands = await fetchAppSettings('available_brands');
        if (savedBrands && Array.isArray(savedBrands) && savedBrands.length > 0) {
          setAvailableBrands(savedBrands);
        }
      } catch (error) {
        console.error('Erro ao carregar marcas:', error);
        setAvailableBrands(DEFAULT_BRANDS);
      }
    };
    loadBrands();
  }, []);

  useOptimizedRefresh(fetchData);

  const filterOptions = useMemo(() => {
    const storesList = stores || [];
    return {
      stores: storesList.map(s => ({ value: s.id, label: s.name })),
      franqueados: [...new Set(storesList.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      bandeiras: [...new Set(storesList.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      supervisors: [...new Set(storesList.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s })),
      brands: availableBrands.map(brand => ({ value: brand, label: brand }))
    };
  }, [stores, availableBrands]);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    let filteredMissing = physicalMissing || [];

    // Aplicar filtros (para admin/supervisor/devoluções)
    if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
      // Filtro por data
      if (activeFilters.startDate || activeFilters.endDate) {
        filteredMissing = filteredMissing.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at);
          if (activeFilters.startDate && itemDate < new Date(activeFilters.startDate)) return false;
          if (activeFilters.endDate && itemDate > new Date(activeFilters.endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Filtro por combinação (só aplicar se houver filtros selecionados)
      const hasFilters = activeFilters.store.length > 0 || 
                        activeFilters.franqueado.length > 0 || 
                        activeFilters.bandeira.length > 0 || 
                        activeFilters.supervisor.length > 0 ||
                        activeFilters.brand.length > 0;
      
      if (hasFilters) {
        const filteredStoreIds = new Set();
        (stores || []).forEach(store => {
          const matchStore = activeFilters.store.length === 0 || activeFilters.store.includes(store.id);
          const matchFranqueado = activeFilters.franqueado.length === 0 || (store.franqueado && activeFilters.franqueado.includes(store.franqueado));
          const matchBandeira = activeFilters.bandeira.length === 0 || (store.bandeira && activeFilters.bandeira.includes(store.bandeira));
          const matchSupervisor = activeFilters.supervisor.length === 0 || (store.supervisor && activeFilters.supervisor.includes(store.supervisor));
          
          if (matchStore && matchFranqueado && matchBandeira && matchSupervisor) {
            filteredStoreIds.add(store.id);
          }
        });
        
        filteredMissing = filteredMissing.filter(item => {
          const matchStore = filteredStoreIds.has(item.store_id);
          const matchBrand = activeFilters.brand.length === 0 || (item.brand && activeFilters.brand.includes(item.brand));
          return matchStore && matchBrand;
        });
      }
      // Se não há filtros, mostrar todas as faltas físicas (para devoluções, admin e supervisor)
    }

    // Para loja, filtrar apenas sua loja (exceto se for perfil devoluções)
    const missingToCount = (isStore && user?.storeId && !isDevolucoes)
      ? filteredMissing.filter(item => item.store_id === user.storeId)
      : filteredMissing;

    return {
      totalMissing: missingToCount.filter(item => item.status !== 'nota_finalizada').length,
      totalMissingValue: missingToCount
        .filter(item => item.status !== 'nota_finalizada')
        .reduce((sum, item) => {
          const cost = parseFloat(item.cost_value) || 0;
          const qty = parseInt(item.quantity) || 0;
          return sum + (cost * qty);
        }, 0),
    };
  }, [physicalMissing, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, activeFilters]);

  // Filtrar falta física finalizada
  const finishedMissing = useMemo(() => {
    return (physicalMissing || []).filter(item => {
      if (item.status !== 'nota_finalizada') {
        return false;
      }
      
      // IMPORTANTE: Se for loja, mostrar APENAS suas faltas físicas finalizadas (criadas por ela)
      // Role devoluções vê TODAS as faltas físicas (sem restrição de loja)
      if (isStore && user?.storeId && !isDevolucoes) {
        if (item.store_id !== user.storeId) {
          return false; // Loja não pode ver faltas físicas de outras lojas
        }
      }
      
      const store = (stores || []).find(s => s.id === item.store_id);
      if (!store) return false;
      
      // Aplicar filtros (para admin/supervisor/devoluções)
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
        const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
        const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
        const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));
        const matchBrand = filters.brand.length === 0 || (item.brand && filters.brand.includes(item.brand));
        
        if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor || !matchBrand) {
          return false;
        }
      }
      
      // Filtro por marca (aplicar para todos os perfis)
      if (filters.brand && filters.brand.length > 0) {
        if (!item.brand || !filters.brand.includes(item.brand)) {
          return false;
        }
      }
      
      const matchesSearch = 
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [physicalMissing, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, filters]);

  const filteredMissing = useMemo(() => {
    // Agrupar por NF para mostrar apenas um card por NF
    const groupedByNF = {};
    
    (physicalMissing || []).forEach(item => {
      if (item.status === 'nota_finalizada') {
        return;
      }
      
      // Loja só vê suas próprias faltas físicas (exceto se for perfil devoluções)
      if (isStore && user?.storeId && !isDevolucoes) {
        if (item.store_id !== user.storeId) {
          return;
        }
      }
      
      const store = (stores || []).find(s => s.id === item.store_id);
      if (!store) return;
      
      // Para admin, supervisor e devoluções: aplicar filtros se existirem
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        // Se há filtros aplicados, verificar correspondência
        const hasFilters = activeFilters.store.length > 0 || 
                          activeFilters.franqueado.length > 0 || 
                          activeFilters.bandeira.length > 0 || 
                          activeFilters.supervisor.length > 0;
        
        if (hasFilters) {
          const matchStore = activeFilters.store.length === 0 || activeFilters.store.includes(store.id);
          const matchFranqueado = activeFilters.franqueado.length === 0 || (store.franqueado && activeFilters.franqueado.includes(store.franqueado));
          const matchBandeira = activeFilters.bandeira.length === 0 || (store.bandeira && activeFilters.bandeira.includes(store.bandeira));
          const matchSupervisor = activeFilters.supervisor.length === 0 || (store.supervisor && activeFilters.supervisor.includes(store.supervisor));
          
          if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) {
            return;
          }
        }

        // Filtro por data (sempre aplicar se existir)
        if (activeFilters.startDate || activeFilters.endDate) {
          if (!item.created_at) return;
          const itemDate = new Date(item.created_at);
          if (activeFilters.startDate && itemDate < new Date(activeFilters.startDate)) return;
          if (activeFilters.endDate && itemDate > new Date(activeFilters.endDate + 'T23:59:59')) return;
        }
      }
      
      // Filtro de busca
      const matchesSearch = 
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return;
      
      // Agrupar por NF e store_id
      const key = `${item.nf_number}_${item.store_id}`;
      if (!groupedByNF[key]) {
        groupedByNF[key] = [];
      }
      groupedByNF[key].push(item);
    });
    
    // Retornar array com um item representativo por grupo (o primeiro)
    return Object.values(groupedByNF).map(group => group[0]);
  }, [physicalMissing, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, activeFilters]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'estoque_falta_fisica': { label: 'Estoque Falta Física', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      'processo_aberto': { label: 'Processo Aberto', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      'nota_finalizada': { label: 'Nota Finalizada', class: 'bg-green-500/10 text-green-500 border-green-500/20' }
    };
    const config = statusConfig[status] || statusConfig['processo_aberto'];
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", config.class)}>
        {config.label}
      </span>
    );
  };

  const handleAddItem = () => {
    setMissingFormData({
      ...missingFormData,
      items: [
        ...missingFormData.items,
        {
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          cost_value: '',
          quantity: ''
        }
      ]
    });
  };

  const handleRemoveItem = (itemId) => {
    if (missingFormData.items.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário ter pelo menos um item.',
      });
      return;
    }
    setMissingFormData({
      ...missingFormData,
      items: missingFormData.items.filter(item => item.id !== itemId)
    });
  };

  const handleAddDivergenceMissingItem = () => {
    setMissingFormData({
      ...missingFormData,
      divergence_missing_items: [
        ...missingFormData.divergence_missing_items,
        {
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }
      ]
    });
  };

  const handleRemoveDivergenceMissingItem = (itemId) => {
    if (missingFormData.divergence_missing_items.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário ter pelo menos um item que faltou.',
      });
      return;
    }
    setMissingFormData({
      ...missingFormData,
      divergence_missing_items: missingFormData.divergence_missing_items.filter(item => item.id !== itemId)
    });
  };

  const handleUpdateDivergenceMissingItem = (itemId, field, value) => {
    setMissingFormData({
      ...missingFormData,
      divergence_missing_items: missingFormData.divergence_missing_items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const handleAddDivergenceSurplusItem = () => {
    setMissingFormData({
      ...missingFormData,
      divergence_surplus_items: [
        ...missingFormData.divergence_surplus_items,
        {
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }
      ]
    });
  };

  const handleRemoveDivergenceSurplusItem = (itemId) => {
    if (missingFormData.divergence_surplus_items.length === 1) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário ter pelo menos um item que sobrou.',
      });
      return;
    }
    setMissingFormData({
      ...missingFormData,
      divergence_surplus_items: missingFormData.divergence_surplus_items.filter(item => item.id !== itemId)
    });
  };

  const handleUpdateDivergenceSurplusItem = (itemId, field, value) => {
    setMissingFormData({
      ...missingFormData,
      divergence_surplus_items: missingFormData.divergence_surplus_items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const handleUpdateItem = (itemId, field, value) => {
    setMissingFormData({
      ...missingFormData,
      items: missingFormData.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const handleCreateMissing = async (e) => {
    e.preventDefault();
    
    if (!missingFormData.missing_type || missingFormData.missing_type.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione pelo menos um tipo (Falta Física, Divergência NF x Físico, ou Sobra).',
      });
      return;
    }

    if (!missingFormData.moved_to_defect) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário marcar a opção "Movimentado para defeito" para registrar a falta física.',
      });
      return;
    }

    if (!user?.storeId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não possui loja associada.',
      });
      return;
    }

    if (missingFormData.missing_type.includes('DIVERGENCIA NF X FISICO')) {
      // Validar todos os itens que faltaram
      const invalidMissingItems = missingFormData.divergence_missing_items.filter(item => 
        !item.brand || !item.sku || !item.color || !item.size || !item.cost_value || !item.quantity
      );

      // Validar todos os itens que sobraram
      const invalidSurplusItems = missingFormData.divergence_surplus_items.filter(item => 
        !item.brand || !item.sku || !item.color || !item.size || !item.cost_value || !item.quantity
      );

      if (invalidMissingItems.length > 0 || invalidSurplusItems.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios (Marca, SKU, Cor, Tamanho, Custo e Quantidade) para todos os itens que faltaram e que sobraram.',
        });
        return;
      }
    }

    if (missingFormData.missing_type.includes('FALTA FISICA') || missingFormData.missing_type.includes('SOBRA')) {
      // Validar todos os itens
      const invalidItems = missingFormData.items.filter(item => 
        !item.brand || !item.sku || !item.color || !item.size || !item.cost_value || !item.quantity
      );

      if (invalidItems.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios (Marca, SKU, Cor, Tamanho, Custo e Quantidade) para todos os itens.',
        });
        return;
      }
    }

    try {
      // Para FALTA FISICA e SOBRA, criar um registro SEPARADO para cada item
      if (missingFormData.missing_type.includes('FALTA FISICA') || missingFormData.missing_type.includes('SOBRA')) {
        // Criar um registro para cada item
        const promises = missingFormData.items.map(async (item) => {
          const costValue = parseFloat(item.cost_value) || 0;
          const quantity = parseInt(item.quantity) || 0;
          const totalValue = costValue * quantity;

          const missingData = {
            nf_number: missingFormData.nf_number.trim(),
            moved_to_defect: missingFormData.moved_to_defect,
            store_id: user.storeId,
            status: missingFormData.moved_to_defect ? 'estoque_falta_fisica' : 'processo_aberto',
            missing_type: missingFormData.missing_type,
            brand: item.brand.trim(),
            sku: item.sku.trim(),
            color: item.color.trim(),
            size: item.size.trim(),
            sku_info: `${item.sku.trim()} - ${item.color.trim()} - ${item.size.trim()}`,
            cost_value: costValue,
            quantity: quantity,
            total_value: totalValue
          };

          return await addPhysicalMissing(missingData);
        });

        // Aguardar todos os registros serem criados
        await Promise.all(promises);

        toast({
          title: 'Sucesso!',
          description: `${missingFormData.items.length} item(ns) registrado(s) com sucesso na NF ${missingFormData.nf_number}.`,
        });
      } else if (missingFormData.missing_type.includes('DIVERGENCIA NF X FISICO')) {
        // Para divergência, criar um registro para cada combinação de item que faltou e item que sobrou
        // Se houver múltiplos itens, criar registros para todas as combinações
        const promises = [];
        
        missingFormData.divergence_missing_items.forEach(missingItem => {
          missingFormData.divergence_surplus_items.forEach(surplusItem => {
            const missingCostValue = parseFloat(missingItem.cost_value) || 0;
            const missingQuantity = parseInt(missingItem.quantity) || 0;
            const missingTotalValue = missingCostValue * missingQuantity;

            const missingData = {
              nf_number: missingFormData.nf_number.trim(),
              moved_to_defect: missingFormData.moved_to_defect,
              store_id: user.storeId,
              status: missingFormData.moved_to_defect ? 'estoque_falta_fisica' : 'processo_aberto',
              missing_type: missingFormData.missing_type,
              // Item que faltou
              divergence_missing_brand: missingItem.brand.trim(),
              divergence_missing_sku: missingItem.sku.trim(),
              divergence_missing_color: missingItem.color.trim(),
              divergence_missing_size: missingItem.size.trim(),
              divergence_missing_quantity: missingQuantity,
              divergence_missing_cost_value: missingCostValue,
              // Item que sobrou
              divergence_surplus_brand: surplusItem.brand.trim(),
              divergence_surplus_sku: surplusItem.sku.trim(),
              divergence_surplus_color: surplusItem.color.trim(),
              divergence_surplus_size: surplusItem.size.trim(),
              divergence_surplus_quantity: parseInt(surplusItem.quantity) || 0,
              divergence_surplus_cost_value: parseFloat(surplusItem.cost_value) || 0,
              // Campos principais (baseados no item que faltou)
              brand: missingItem.brand.trim(),
              sku: missingItem.sku.trim(),
              color: missingItem.color.trim(),
              size: missingItem.size.trim(),
              sku_info: `${missingItem.sku.trim()} - ${missingItem.color.trim()} - ${missingItem.size.trim()}`,
              cost_value: missingCostValue,
              quantity: missingQuantity,
              total_value: missingTotalValue
            };

            promises.push(addPhysicalMissing(missingData));
          });
        });

        // Aguardar todos os registros serem criados
        await Promise.all(promises);

        const totalRecords = missingFormData.divergence_missing_items.length * missingFormData.divergence_surplus_items.length;
        toast({
          title: 'Sucesso!',
          description: `${totalRecords} registro(s) de divergência criado(s) com sucesso na NF ${missingFormData.nf_number}.`,
        });
      }

      // Limpar formulário
      setMissingFormData({
        missing_type: [],
        nf_number: '',
        moved_to_defect: false,
        store_id: user.storeId,
        items: [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          cost_value: '',
          quantity: ''
        }],
        divergence_missing_items: [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }],
        divergence_surplus_items: [{
          id: Date.now(),
          brand: '',
          sku: '',
          color: '',
          size: '',
          quantity: '',
          cost_value: ''
        }]
      });
    } catch (error) {
      console.error('Erro ao registrar falta física:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao registrar falta física.',
      });
    }
  };

  const handleUpdateMissingStatus = async (missingId, status) => {
    try {
      await updatePhysicalMissing(missingId, { status });
      
      const statusLabels = {
        'estoque_falta_fisica': 'Estoque Falta Física',
        'processo_aberto': 'Processo Aberto',
        'nota_finalizada': 'Nota Finalizada'
      };
      
      toast({
        title: 'Status atualizado!',
        description: `Status alterado para: ${statusLabels[status]}. ${status === 'nota_finalizada' ? 'A falta física foi movida para a listagem de finalizados.' : ''}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar falta física:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a falta física.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Falta Física</h2>
          <p className="text-muted-foreground mt-1">Preenchimento das lojas - registro de faltas físicas</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por marca, NF, SKU ou loja..." 
            className="pl-9 w-64 bg-card" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Dashboard de Falta Física */}
      {(isAdmin || isStore || user?.role === 'supervisor' || isDevolucoes) && (
        <Card className="p-6 border-2 border-red-500/20 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-400" />
                Dashboard de Falta Física
              </h3>
            </div>

            {/* Filtros para Falta Física (admin/supervisor/devoluções) */}
            {(isAdmin || user?.role === 'supervisor' || isDevolucoes) && (
              <Card className="p-4 bg-secondary/50 border border-red-500/30 mb-4">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Loja</Label>
                    <MultiSelectFilter
                      options={filterOptions.stores}
                      selected={filters.store}
                      onChange={(selected) => setFilters({ ...filters, store: selected })}
                      placeholder="Todas as lojas"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Franqueado</Label>
                    <MultiSelectFilter
                      options={filterOptions.franqueados}
                      selected={filters.franqueado}
                      onChange={(selected) => setFilters({ ...filters, franqueado: selected })}
                      placeholder="Todos os franqueados"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Bandeira</Label>
                    <MultiSelectFilter
                      options={filterOptions.bandeiras}
                      selected={filters.bandeira}
                      onChange={(selected) => setFilters({ ...filters, bandeira: selected })}
                      placeholder="Todas as bandeiras"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Supervisor</Label>
                    <MultiSelectFilter
                      options={filterOptions.supervisors}
                      selected={filters.supervisor}
                      onChange={(selected) => setFilters({ ...filters, supervisor: selected })}
                      placeholder="Todos os supervisores"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Marca</Label>
                    <MultiSelectFilter
                      options={filterOptions.brands}
                      selected={filters.brand}
                      onChange={(selected) => setFilters({ ...filters, brand: selected })}
                      placeholder="Todas as marcas"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Data Inicial</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Data Final</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Itens em Aberto</span>
                  <Package className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">{dashboardStats.totalMissing}</span>
                <p className="text-xs text-muted-foreground mt-1">Itens de falta física em aberto</p>
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Valor Total</span>
                  <TrendingUp className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">
                  R$ {dashboardStats.totalMissingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Valor dos itens em aberto</p>
              </motion.div>
            </div>
          </div>
        </Card>
      )}

      {/* Formulário para falta física (apenas lojas) */}
      {isStore && (
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registrar Falta Física
          </h3>
          <form onSubmit={handleCreateMissing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Tipo(s) *</Label>
              <MultiSelectFilter
                options={[
                  { value: 'FALTA FISICA', label: 'Falta Física' },
                  { value: 'DIVERGENCIA NF X FISICO', label: 'Divergência NF x Físico' },
                  { value: 'SOBRA', label: 'Sobra' }
                ]}
                selected={missingFormData.missing_type || []}
                onChange={(selected) => setMissingFormData({ ...missingFormData, missing_type: selected })}
                placeholder="Selecione o(s) tipo(s)..."
              />
              <p className="text-xs text-muted-foreground">
                Selecione um ou mais tipos: Falta Física, Divergência NF x Físico, ou Sobra
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="missing_nf_number">Número da NF *</Label>
              <Input
                id="missing_nf_number"
                value={missingFormData.nf_number}
                onChange={(e) => setMissingFormData({ ...missingFormData, nf_number: e.target.value })}
                required
                className="bg-secondary"
                placeholder="Ex: 123456"
              />
            </div>
            
            {missingFormData.missing_type?.includes('FALTA FISICA') && (
              <>
                {missingFormData.items.map((item, index) => (
                  <div key={item.id} className="md:col-span-2 border border-border rounded-lg p-4 space-y-4 bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Item {index + 1}</h4>
                      {missingFormData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`missing_brand_${item.id}`}>Marca do Item que Faltou *</Label>
                        <Select
                          value={item.brand}
                          onValueChange={(value) => handleUpdateItem(item.id, 'brand', value)}
                          required
                        >
                          <SelectTrigger id={`missing_brand_${item.id}`} className="bg-secondary">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`missing_sku_${item.id}`}>SKU do Item que Faltou *</Label>
                        <Input
                          id={`missing_sku_${item.id}`}
                          value={item.sku}
                          onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`missing_color_${item.id}`}>Cor do Item que Faltou *</Label>
                        <Input
                          id={`missing_color_${item.id}`}
                          value={item.color}
                          onChange={(e) => handleUpdateItem(item.id, 'color', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 111"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`missing_size_${item.id}`}>Tamanho do Item que Faltou *</Label>
                        <Input
                          id={`missing_size_${item.id}`}
                          value={item.size}
                          onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`missing_quantity_${item.id}`}>Quantidade que Faltou *</Label>
                        <Input
                          id={`missing_quantity_${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`missing_cost_value_${item.id}`}>Valor de Custo do Item que Faltou *</Label>
                        <Input
                          id={`missing_cost_value_${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_value}
                          onChange={(e) => handleUpdateItem(item.id, 'cost_value', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </div>
                    {item.cost_value && item.quantity && (
                      <div className="space-y-2">
                        <Label>Valor Total do Item {index + 1}</Label>
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <span className="font-semibold text-foreground text-lg">
                            R$ {(parseFloat(item.cost_value || 0) * parseInt(item.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Mais um Item
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Use este botão para adicionar mais itens na mesma nota fiscal (produtos de cor ou tamanho diferentes)
                  </p>
                </div>
              </>
            )}

            {missingFormData.missing_type?.includes('SOBRA') && (
              <>
                {missingFormData.items.map((item, index) => (
                  <div key={item.id} className="md:col-span-2 border border-border rounded-lg p-4 space-y-4 bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Item {index + 1}</h4>
                      {missingFormData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_brand_${item.id}`}>Marca do Item que Sobrou *</Label>
                        <Select
                          value={item.brand}
                          onValueChange={(value) => handleUpdateItem(item.id, 'brand', value)}
                          required
                        >
                          <SelectTrigger id={`surplus_brand_${item.id}`} className="bg-secondary">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_sku_${item.id}`}>SKU do Item que Sobrou *</Label>
                        <Input
                          id={`surplus_sku_${item.id}`}
                          value={item.sku}
                          onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_color_${item.id}`}>Cor do Item que Sobrou *</Label>
                        <Input
                          id={`surplus_color_${item.id}`}
                          value={item.color}
                          onChange={(e) => handleUpdateItem(item.id, 'color', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 111"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_size_${item.id}`}>Tamanho do Item que Sobrou *</Label>
                        <Input
                          id={`surplus_size_${item.id}`}
                          value={item.size}
                          onChange={(e) => handleUpdateItem(item.id, 'size', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_quantity_${item.id}`}>Quantidade que Sobrou *</Label>
                        <Input
                          id={`surplus_quantity_${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`surplus_cost_value_${item.id}`}>Valor de Custo do Item que Sobrou *</Label>
                        <Input
                          id={`surplus_cost_value_${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_value}
                          onChange={(e) => handleUpdateItem(item.id, 'cost_value', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </div>
                    {item.cost_value && item.quantity && (
                      <div className="space-y-2">
                        <Label>Valor Total do Item {index + 1}</Label>
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <span className="font-semibold text-foreground text-lg">
                            R$ {(parseFloat(item.cost_value || 0) * parseInt(item.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddItem}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Mais um Item
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Use este botão para adicionar mais itens na mesma nota fiscal (produtos de cor ou tamanho diferentes)
                  </p>
                </div>
              </>
            )}

            {missingFormData.missing_type?.includes('DIVERGENCIA NF X FISICO') && (
              <>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold text-foreground mb-4">O que Faltou *</h4>
                </div>
                {missingFormData.divergence_missing_items.map((item, index) => (
                  <div key={item.id} className="md:col-span-2 border border-border rounded-lg p-4 space-y-4 bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">Item que Faltou {index + 1}</h5>
                      {missingFormData.divergence_missing_items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDivergenceMissingItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_brand_${item.id}`}>Marca do Item que Faltou *</Label>
                        <Select
                          value={item.brand}
                          onValueChange={(value) => handleUpdateDivergenceMissingItem(item.id, 'brand', value)}
                          required
                        >
                          <SelectTrigger id={`div_missing_brand_${item.id}`} className="bg-secondary">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_sku_${item.id}`}>SKU do Item que Faltou *</Label>
                        <Input
                          id={`div_missing_sku_${item.id}`}
                          value={item.sku}
                          onChange={(e) => handleUpdateDivergenceMissingItem(item.id, 'sku', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_color_${item.id}`}>Cor do Item que Faltou *</Label>
                        <Input
                          id={`div_missing_color_${item.id}`}
                          value={item.color}
                          onChange={(e) => handleUpdateDivergenceMissingItem(item.id, 'color', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 111"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_size_${item.id}`}>Tamanho do Item que Faltou *</Label>
                        <Input
                          id={`div_missing_size_${item.id}`}
                          value={item.size}
                          onChange={(e) => handleUpdateDivergenceMissingItem(item.id, 'size', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_quantity_${item.id}`}>Quantidade que Faltou *</Label>
                        <Input
                          id={`div_missing_quantity_${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateDivergenceMissingItem(item.id, 'quantity', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_missing_cost_value_${item.id}`}>Valor de Custo do Item que Faltou *</Label>
                        <Input
                          id={`div_missing_cost_value_${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_value}
                          onChange={(e) => handleUpdateDivergenceMissingItem(item.id, 'cost_value', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </div>
                    {item.cost_value && item.quantity && (
                      <div className="space-y-2">
                        <Label>Valor Total do Item que Faltou {index + 1}</Label>
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <span className="font-semibold text-foreground text-lg">
                            R$ {(parseFloat(item.cost_value || 0) * parseInt(item.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDivergenceMissingItem}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Mais um Item que Faltou
                  </Button>
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h4 className="font-semibold text-foreground mb-4">O que Sobrou no Lugar *</h4>
                </div>
                {missingFormData.divergence_surplus_items.map((item, index) => (
                  <div key={item.id} className="md:col-span-2 border border-border rounded-lg p-4 space-y-4 bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-foreground">Item que Sobrou {index + 1}</h5>
                      {missingFormData.divergence_surplus_items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDivergenceSurplusItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_brand_${item.id}`}>Marca do Item que Sobrou *</Label>
                        <Select
                          value={item.brand}
                          onValueChange={(value) => handleUpdateDivergenceSurplusItem(item.id, 'brand', value)}
                          required
                        >
                          <SelectTrigger id={`div_surplus_brand_${item.id}`} className="bg-secondary">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBrands.map((brand) => (
                              <SelectItem key={brand} value={brand}>
                                {brand}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_sku_${item.id}`}>SKU do Item que Sobrou *</Label>
                        <Input
                          id={`div_surplus_sku_${item.id}`}
                          value={item.sku}
                          onChange={(e) => handleUpdateDivergenceSurplusItem(item.id, 'sku', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_color_${item.id}`}>Cor do Item que Sobrou *</Label>
                        <Input
                          id={`div_surplus_color_${item.id}`}
                          value={item.color}
                          onChange={(e) => handleUpdateDivergenceSurplusItem(item.id, 'color', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 222"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_size_${item.id}`}>Tamanho do Item que Sobrou *</Label>
                        <Input
                          id={`div_surplus_size_${item.id}`}
                          value={item.size}
                          onChange={(e) => handleUpdateDivergenceSurplusItem(item.id, 'size', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_quantity_${item.id}`}>Quantidade que Sobrou *</Label>
                        <Input
                          id={`div_surplus_quantity_${item.id}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateDivergenceSurplusItem(item.id, 'quantity', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`div_surplus_cost_value_${item.id}`}>Valor de Custo do Item que Sobrou *</Label>
                        <Input
                          id={`div_surplus_cost_value_${item.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.cost_value}
                          onChange={(e) => handleUpdateDivergenceSurplusItem(item.id, 'cost_value', e.target.value)}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 250.00"
                        />
                      </div>
                    </div>
                    {item.cost_value && item.quantity && (
                      <div className="space-y-2">
                        <Label>Valor Total do Item que Sobrou {index + 1}</Label>
                        <div className="bg-background p-3 rounded-lg border border-border">
                          <span className="font-semibold text-foreground text-lg">
                            R$ {(parseFloat(item.cost_value || 0) * parseInt(item.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDivergenceSurplusItem}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Mais um Item que Sobrou
                  </Button>
                </div>
              </>
            )}

            {(missingFormData.missing_type?.includes('FALTA FISICA') || missingFormData.missing_type?.includes('SOBRA')) && 
             missingFormData.items.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <Label>Valor Total de Todos os Itens</Label>
                <div className="bg-secondary p-3 rounded-lg border border-border">
                  <span className="font-semibold text-foreground text-lg">
                    R$ {missingFormData.items.reduce((total, item) => {
                      const costValue = parseFloat(item.cost_value || 0);
                      const quantity = parseInt(item.quantity || 0);
                      return total + (costValue * quantity);
                    }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {missingFormData.missing_type?.includes('DIVERGENCIA NF X FISICO') && 
             (missingFormData.divergence_missing_items.length > 0 || missingFormData.divergence_surplus_items.length > 0) && (
              <div className="space-y-2 md:col-span-2">
                <Label>Resumo da Divergência</Label>
                <div className="bg-secondary p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de Itens que Faltaram:</span>
                    <span className="font-semibold text-foreground">{missingFormData.divergence_missing_items.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de Itens que Sobraram:</span>
                    <span className="font-semibold text-foreground">{missingFormData.divergence_surplus_items.length}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground font-semibold">Total de Registros a Criar:</span>
                    <span className="font-bold text-primary text-lg">
                      {missingFormData.divergence_missing_items.length * missingFormData.divergence_surplus_items.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Será criado um registro para cada combinação de item que faltou × item que sobrou.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2 flex items-center gap-2">
              <Checkbox
                id="missing_moved_to_defect"
                checked={missingFormData.moved_to_defect}
                onCheckedChange={(checked) => setMissingFormData({ ...missingFormData, moved_to_defect: !!checked })}
                required
              />
              <Label htmlFor="missing_moved_to_defect" className="cursor-pointer">
                Movimentado para defeito *
              </Label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Registrar Falta Física
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Abas para separar Em Aberto e Finalizados */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">
            Em Aberto {filteredMissing.length > 0 && `(${filteredMissing.length})`}
          </TabsTrigger>
          <TabsTrigger value="finished">
            Finalizados {finishedMissing.length > 0 && `(${finishedMissing.length})`}
          </TabsTrigger>
        </TabsList>

        {/* ABA: EM ABERTO */}
        <TabsContent value="open" className="mt-6">
          {/* Lista de falta física em aberto */}
          {filteredMissing.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma falta física registrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : (isStore ? 'Registre uma falta física acima.' : 'Nenhuma falta física encontrada.')}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMissing.map((item, index) => {
            const store = (stores || []).find(s => s.id === item.store_id);
            // Buscar todos os itens da mesma NF
            const allItemsForNF = (physicalMissing || []).filter(pm => 
              pm.nf_number === item.nf_number && pm.store_id === item.store_id && pm.status !== 'nota_finalizada'
            );
            const items = allItemsForNF.length > 0 && allItemsForNF[0].items 
              ? allItemsForNF[0].items 
              : allItemsForNF.map(pm => ({
                  brand: pm.brand,
                  sku: pm.sku,
                  color: pm.color,
                  size: pm.size,
                  cost_value: pm.cost_value,
                  quantity: pm.quantity,
                  total_value: (parseFloat(pm.cost_value || 0) * parseInt(pm.quantity || 0))
                }));
            const totalValue = items.reduce((sum, it) => sum + (it.total_value || 0), 0);
            const totalQuantity = items.reduce((sum, it) => sum + (parseInt(it.quantity) || 0), 0);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl shadow-lg border border-border p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{item.brand || item.product_name || 'Sem marca'}</h3>
                      {item.nf_number && (
                        <p className="text-sm text-muted-foreground">NF: {item.nf_number}</p>
                      )}
                      {items.length > 1 && (
                        <p className="text-sm text-primary font-medium mt-1">
                          {items.length} itens diferentes
                        </p>
                      )}
                      {(item.sku || item.color || item.size) && items.length === 1 ? (
                        <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          {item.sku && <p>SKU: {item.sku}</p>}
                          {item.color && <p>Cor: {item.color}</p>}
                          {item.size && <p>Tamanho: {item.size}</p>}
                        </div>
                      ) : item.sku_info ? (
                        <p className="text-sm text-muted-foreground mt-1">{item.sku_info}</p>
                      ) : item.product_name ? (
                        <p className="text-sm text-muted-foreground">{item.product_name}</p>
                      ) : null}
                      <p className="text-sm text-muted-foreground mt-1">
                        {store?.name || 'Loja não encontrada'}
                      </p>
                      {item.moved_to_defect && (
                        <p className="text-sm text-orange-500 font-medium mt-1">
                          ✓ Movimentado para defeito
                        </p>
                      )}
                    </div>
                    {(isAdmin || isDevolucoes) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateMissingStatus(item.id, 'estoque_falta_fisica')}>
                            Estoque Falta Física
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMissingStatus(item.id, 'processo_aberto')}>
                            Processo Aberto
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateMissingStatus(item.id, 'nota_finalizada')}>
                            Nota Finalizada
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const itemDescription = `${item.brand || item.product_name || 'Item'} - ${item.nf_number || 'Sem NF'}`;
                              if (window.confirm(`Tem certeza que deseja excluir esta falta física (${itemDescription})? Esta ação não pode ser desfeita.`)) {
                                // Deletar todos os registros com a mesma NF e store_id para garantir que o grupo completo seja removido
                                deletePhysicalMissing(item.id, item.nf_number, item.store_id);
                              }
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {items.length > 1 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total de Itens:</span>
                          <span className="font-medium text-foreground">{items.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Quantidade Total:</span>
                          <span className="font-medium text-foreground">{totalQuantity}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground font-semibold">Valor Total:</span>
                          <span className="font-bold text-foreground text-base">
                            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    ) : items.length === 1 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Custo Unitário:</span>
                          <span className="font-medium text-foreground">
                            R$ {parseFloat(items[0].cost_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Quantidade:</span>
                          <span className="font-medium text-foreground">{items[0].quantity}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <span className="text-muted-foreground font-semibold">Valor Total:</span>
                          <span className="font-bold text-foreground text-base">
                            R$ {(items[0].total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Registrado em:</span>
                      <span className="font-medium text-foreground">
                        {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(item.status || 'processo_aberto')}
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Buscar todos os registros da mesma NF para garantir que temos todos os dados
                          const allNFItems = (physicalMissing || []).filter(pm => 
                            pm.nf_number === item.nf_number && pm.store_id === item.store_id && pm.status !== 'nota_finalizada'
                          );
                          const viewItems = allNFItems.length > 0 && allNFItems[0].items 
                            ? allNFItems[0].items 
                            : allNFItems.map(pm => ({
                                brand: pm.brand,
                                sku: pm.sku,
                                color: pm.color,
                                size: pm.size,
                                cost_value: pm.cost_value,
                                quantity: pm.quantity,
                                total_value: (parseFloat(pm.cost_value || 0) * parseInt(pm.quantity || 0))
                              }));
                          setSelectedMissingForView({ ...item, items: viewItems });
                        }}
                        className="w-full gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar Falta Física
                      </Button>
                    </div>
                    {item.notes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Observações:</p>
                        <p className="text-sm text-foreground">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
          )}
        </TabsContent>

        {/* ABA: FINALIZADOS */}
        <TabsContent value="finished" className="mt-6">
          {/* Filtros (admin/supervisor/devoluções) */}
          {(isAdmin || user?.role === 'supervisor' || isDevolucoes) && (
            <Card className="p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Loja</Label>
                  <MultiSelectFilter
                    options={filterOptions.stores}
                    selected={filters.store}
                    onChange={(selected) => setFilters({ ...filters, store: selected })}
                    placeholder="Todas as lojas"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Franqueado</Label>
                  <MultiSelectFilter
                    options={filterOptions.franqueados}
                    selected={filters.franqueado}
                    onChange={(selected) => setFilters({ ...filters, franqueado: selected })}
                    placeholder="Todos os franqueados"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bandeira</Label>
                  <MultiSelectFilter
                    options={filterOptions.bandeiras}
                    selected={filters.bandeira}
                    onChange={(selected) => setFilters({ ...filters, bandeira: selected })}
                    placeholder="Todas as bandeiras"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supervisor</Label>
                  <MultiSelectFilter
                    options={filterOptions.supervisors}
                    selected={filters.supervisor}
                    onChange={(selected) => setFilters({ ...filters, supervisor: selected })}
                    placeholder="Todos os supervisores"
                    className="bg-background"
                  />
                </div>
              </div>
            </Card>
          )}

          {finishedMissing.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma falta física finalizada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nenhuma falta física finalizada encontrada.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finishedMissing.map((item, index) => {
                const store = (stores || []).find(s => s.id === item.store_id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl shadow-lg border border-border p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{item.brand || item.product_name || 'Sem marca'}</h3>
                          {item.nf_number && (
                            <p className="text-sm text-muted-foreground">NF: {item.nf_number}</p>
                          )}
                          {(item.sku || item.color || item.size) ? (
                            <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                              {item.sku && <p>SKU: {item.sku}</p>}
                              {item.color && <p>Cor: {item.color}</p>}
                              {item.size && <p>Tamanho: {item.size}</p>}
                            </div>
                          ) : item.sku_info ? (
                            <p className="text-sm text-muted-foreground mt-1">{item.sku_info}</p>
                          ) : item.product_name ? (
                            <p className="text-sm text-muted-foreground">{item.product_name}</p>
                          ) : null}
                          <p className="text-sm text-muted-foreground mt-1">
                            {store?.name || 'Loja não encontrada'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        {item.cost_value && item.quantity && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Custo Unitário:</span>
                              <span className="font-medium text-foreground">
                                R$ {parseFloat(item.cost_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Quantidade:</span>
                              <span className="font-medium text-foreground">{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border pt-2">
                              <span className="text-muted-foreground font-semibold">Valor Total:</span>
                              <span className="font-bold text-foreground text-base">
                                R$ {(parseFloat(item.cost_value || 0) * parseInt(item.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        )}
                        {item.quantity && !item.cost_value && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Quantidade:</span>
                            <span className="font-medium text-foreground">{item.quantity}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Registrado em:</span>
                          <span className="font-medium text-foreground">
                            {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          {getStatusBadge(item.status || 'nota_finalizada')}
                        </div>
                        {item.notes && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">Observações:</p>
                            <p className="text-sm text-foreground">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização de Falta Física */}
      <Dialog open={!!selectedMissingForView} onOpenChange={(open) => !open && setSelectedMissingForView(null)}>
        <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Falta Física - NF {selectedMissingForView?.nf_number}
            </DialogTitle>
            <DialogDescription>
              Visualize todos os itens registrados nesta nota fiscal
            </DialogDescription>
          </DialogHeader>
          
          {selectedMissingForView && (
            <div className="space-y-4 mt-4">
              {/* Informações Gerais */}
              <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">NF:</span>
                    <p className="font-semibold">{selectedMissingForView.nf_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loja:</span>
                    <p className="font-semibold">
                      {(stores || []).find(s => s.id === selectedMissingForView.store_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registrado em:</span>
                    <p className="font-semibold">
                      {selectedMissingForView.created_at 
                        ? format(new Date(selectedMissingForView.created_at), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedMissingForView.status || 'processo_aberto')}
                    </div>
                  </div>
                </div>
                {selectedMissingForView.moved_to_defect && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-orange-500 font-medium">
                      ✓ Movimentado para defeito
                    </p>
                  </div>
                )}
              </div>

              {/* Tabela de Itens */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Itens da Falta Física</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          Marca
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          Cor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          Tamanho
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          Quantidade
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border">
                          Custo Unitário
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                          Valor Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {selectedMissingForView.items && selectedMissingForView.items.length > 0 ? (
                        selectedMissingForView.items.map((item, index) => (
                          <tr key={index} className="hover:bg-secondary/50">
                            <td className="px-4 py-3 text-sm text-foreground border-r border-border">
                              {item.brand || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground border-r border-border">
                              {item.sku || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground border-r border-border">
                              {item.color || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground border-r border-border">
                              {item.size || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-foreground border-r border-border">
                              {item.quantity || 0}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-foreground border-r border-border">
                              R$ {parseFloat(item.cost_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                              R$ {(item.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-muted-foreground">
                            Nenhum item encontrado
                          </td>
                        </tr>
                      )}
                      {/* Linha de Total */}
                      {selectedMissingForView.items && selectedMissingForView.items.length > 0 && (
                        <tr className="bg-secondary/50 font-semibold">
                          <td colSpan="4" className="px-4 py-3 text-sm text-foreground border-r border-border">
                            TOTAL
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-foreground border-r border-border">
                            {selectedMissingForView.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-foreground border-r border-border">
                            -
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-primary text-lg">
                            R$ {selectedMissingForView.items.reduce((sum, item) => sum + (item.total_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhysicalMissing;



