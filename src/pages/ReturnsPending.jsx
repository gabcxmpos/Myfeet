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
import { Plus, RotateCcw, MoreVertical, Trash2, CheckSquare, Search, BarChart3, AlertCircle, Package, TrendingUp } from 'lucide-react';
import { AVAILABLE_BRANDS as DEFAULT_BRANDS } from '@/lib/brands';
import { fetchAppSettings } from '@/lib/supabaseService';
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

const ReturnsPending = () => {
  const { 
    stores, 
    returns, 
    returnsPlanner,
    addReturn, 
    updateReturn, 
    updateReturnsPlanner,
    deleteReturn,
    fetchData 
  } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStore = user?.role === 'loja' || user?.role === 'admin_loja';
  const isDevolucoes = user?.role === 'devoluções';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);
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
  
  const [pendingFormData, setPendingFormData] = useState({
    brand: '',
    nf_number: '',
    nf_emission_date: '',
    nf_value: '',
    volume_quantity: '',
    date: new Date().toISOString().split('T')[0],
    store_id: user?.storeId || '',
    has_no_nf: false
  });

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
        // Usar marcas padrão em caso de erro
        setAvailableBrands(DEFAULT_BRANDS);
      }
    };
    loadBrands();
  }, []);

  useEffect(() => {
    if (user?.storeId) {
      setPendingFormData(prev => ({ ...prev, store_id: user.storeId }));
    }
  }, [user?.storeId]);

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

  // REMOVIDO: plannerAsReturns não deve aparecer em ReturnsPending
  // O planner tem sua própria aba e não deve ser misturado com devoluções pendentes
  const plannerAsReturns = useMemo(() => {
    return []; // Não incluir itens do planner em devoluções pendentes
  }, []);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    let filteredReturns = returns || [];

    // Aplicar filtros (para admin/supervisor/devoluções)
    if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
      // Filtro por data
      if (activeFilters.startDate || activeFilters.endDate) {
        filteredReturns = filteredReturns.filter(ret => {
          if (!ret.date) return false;
          const retDate = new Date(ret.date);
          if (activeFilters.startDate && retDate < new Date(activeFilters.startDate)) return false;
          if (activeFilters.endDate && retDate > new Date(activeFilters.endDate + 'T23:59:59')) return false;
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
        
        filteredReturns = filteredReturns.filter(ret => {
          const matchStore = filteredStoreIds.has(ret.store_id);
          const matchBrand = activeFilters.brand.length === 0 || (ret.brand && activeFilters.brand.includes(ret.brand));
          return matchStore && matchBrand;
        });
      }
      // Se não há filtros, mostrar todas as devoluções (para devoluções, admin e supervisor)
    }

    // Para loja, filtrar apenas sua loja
    const returnsToCount = (isStore && user?.storeId && !isDevolucoes)
      ? filteredReturns.filter(ret => ret.store_id === user.storeId)
      : filteredReturns;

    // Combinar devoluções do planner que estão aguardando coleta (agora sempre vazio, mas mantendo a lógica)
    const plannerAsReturnsFiltered = plannerAsReturns.filter(item => {
      if (isStore && user?.storeId && !isDevolucoes) {
        return item.store_id === user.storeId;
      }
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        const store = (stores || []).find(s => s.id === item.store_id);
        if (!store) return false;
        
        // Só aplicar filtros se existirem
        const hasFilters = activeFilters.store.length > 0 || 
                          activeFilters.franqueado.length > 0 || 
                          activeFilters.bandeira.length > 0 || 
                          activeFilters.supervisor.length > 0;
        
        if (hasFilters) {
          const matchStore = activeFilters.store.length === 0 || activeFilters.store.includes(store.id);
          const matchFranqueado = activeFilters.franqueado.length === 0 || (store.franqueado && activeFilters.franqueado.includes(store.franqueado));
          const matchBandeira = activeFilters.bandeira.length === 0 || (store.bandeira && activeFilters.bandeira.includes(store.bandeira));
          const matchSupervisor = activeFilters.supervisor.length === 0 || (store.supervisor && activeFilters.supervisor.includes(store.supervisor));
          if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) return false;
        }
        
        // Filtro por data
        if (activeFilters.startDate || activeFilters.endDate) {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          if (activeFilters.startDate && itemDate < new Date(activeFilters.startDate)) return false;
          if (activeFilters.endDate && itemDate > new Date(activeFilters.endDate + 'T23:59:59')) return false;
        }
      }
      return true;
    });

    const allPendingReturns = [...returnsToCount.filter(ret => !ret.collected_at), ...plannerAsReturnsFiltered];

    return {
      totalPending: allPendingReturns.length,
      totalVolumes: allPendingReturns.reduce((sum, ret) => sum + (parseInt(ret.volume_quantity) || 0), 0),
      totalPendingValue: allPendingReturns.reduce((sum, ret) => sum + (parseFloat(ret.nf_value) || 0), 0),
    };
  }, [returns, plannerAsReturns, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, activeFilters]);

  const pendingReturns = useMemo(() => {
    const allReturns = [...(returns || []), ...plannerAsReturns];
    
    return allReturns.filter(ret => {
      if (!ret.store_id) return false;
      
      // Loja só vê suas próprias devoluções (exceto se for perfil devoluções)
      if (isStore && user?.storeId && !isDevolucoes) {
        if (ret.store_id !== user.storeId) return false;
      }
      
      const store = (stores || []).find(s => s.id === ret.store_id);
      if (!store) return false;
      
      // Para admin, supervisor e devoluções: aplicar filtros se existirem
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        // Se há filtros aplicados, verificar correspondência
        const hasFilters = activeFilters.store.length > 0 || 
                          activeFilters.franqueado.length > 0 || 
                          activeFilters.bandeira.length > 0 || 
                          activeFilters.supervisor.length > 0 ||
                          activeFilters.brand.length > 0;
        
        if (hasFilters) {
          const matchStore = activeFilters.store.length === 0 || activeFilters.store.includes(store.id);
          const matchFranqueado = activeFilters.franqueado.length === 0 || (store.franqueado && activeFilters.franqueado.includes(store.franqueado));
          const matchBandeira = activeFilters.bandeira.length === 0 || (store.bandeira && activeFilters.bandeira.includes(store.bandeira));
          const matchSupervisor = activeFilters.supervisor.length === 0 || (store.supervisor && activeFilters.supervisor.includes(store.supervisor));
          const matchBrand = activeFilters.brand.length === 0 || (ret.brand && activeFilters.brand.includes(ret.brand));
          
          if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor || !matchBrand) {
            return false;
          }
        }
        // Se não há filtros, mostrar todas as devoluções (para devoluções, admin e supervisor)

        // Filtro por data (sempre aplicar se existir)
        if (activeFilters.startDate || activeFilters.endDate) {
          if (!ret.date) return false;
          const retDate = new Date(ret.date);
          if (activeFilters.startDate && retDate < new Date(activeFilters.startDate)) return false;
          if (activeFilters.endDate && retDate > new Date(activeFilters.endDate + 'T23:59:59')) return false;
        }
      }
      
      // Filtro por marca (aplicar para todos os perfis)
      if (activeFilters.brand && activeFilters.brand.length > 0) {
        if (!ret.brand || !activeFilters.brand.includes(ret.brand)) {
          return false;
        }
      }
      
      // Filtro de busca
      const matchesSearch = 
        ret.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.nf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Não mostrar devoluções já coletadas
      if (ret.collected_at) return false;
      
      return true;
    });
  }, [returns, plannerAsReturns, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, activeFilters]);

  const getStatusBadge = (status, type = 'return') => {
    if (type === 'return') {
      const statusConfig = {
        'reabertura': { label: 'Reabertura de Processo', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
        'nota_emitida': { label: 'Nota Emitida', class: 'bg-green-500/10 text-green-500 border-green-500/20' },
        'aguardando_coleta': { label: 'Aguardando Coleta', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        'coleta_infrutifera': { label: 'Coleta Infrutífera', class: 'bg-red-500/10 text-red-500 border-red-500/20' }
      };
      const config = statusConfig[status] || statusConfig['aguardando_coleta'];
      return (
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", config.class)}>
          {config.label}
        </span>
      );
    }
    return null;
  };

  const handleCreatePendingReturn = async (e) => {
    e.preventDefault();
    
    // Validar marca (não pode ser vazio ou "none")
    const brandValue = pendingFormData.brand && pendingFormData.brand !== 'none' ? pendingFormData.brand.trim() : '';
    
    if (!brandValue || !pendingFormData.volume_quantity || !pendingFormData.date) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    if (!pendingFormData.has_no_nf && (!pendingFormData.nf_number || !pendingFormData.nf_emission_date)) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha o número da NF e data de emissão, ou marque "Não possui NF".',
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

    // Validar marca obrigatória
    if (!pendingFormData.brand || pendingFormData.brand === 'none' || pendingFormData.brand.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione uma marca. O campo marca é obrigatório.',
      });
      return;
    }

    try {
      // Garantir que brand não seja "none" ou vazio
      const brandValue = pendingFormData.brand && pendingFormData.brand !== 'none' ? pendingFormData.brand.trim() : '';
      
      const returnData = {
        brand: brandValue,
        volume_quantity: parseInt(pendingFormData.volume_quantity),
        date: pendingFormData.date,
        store_id: user.storeId,
        admin_status: 'aguardando_coleta'
      };

      if (pendingFormData.has_no_nf) {
        returnData.nf_number = 'SEM_NF';
        returnData.nf_emission_date = null;
        returnData.nf_value = null;
      } else {
        returnData.nf_number = pendingFormData.nf_number.trim();
        returnData.nf_emission_date = pendingFormData.nf_emission_date;
        returnData.nf_value = pendingFormData.nf_value ? parseFloat(pendingFormData.nf_value) : null;
      }

      // Verificar duplicidade antes de salvar
      const duplicateCheck = (returns || []).find(item => {
        // Comparar loja (obrigatório)
        if (item.store_id !== returnData.store_id) return false;
        
        // Comparar marca (obrigatório)
        const itemBrand = (item.brand || '').toString().trim();
        const formBrand = brandValue;
        if (itemBrand !== formBrand) return false;
        
        // Comparar NF (se ambos tiverem valor, devem ser iguais)
        const itemNf = (item.nf_number || '').toString().trim();
        const formNf = (returnData.nf_number || '').toString().trim();
        const hasItemNf = itemNf && itemNf !== '' && itemNf !== 'SEM_NF';
        const hasFormNf = formNf && formNf !== '' && formNf !== 'SEM_NF';
        
        // Se ambos têm NF, devem ser iguais
        if (hasItemNf && hasFormNf && itemNf !== formNf) return false;
        // Se ambos não têm NF (SEM_NF), são considerados iguais
        if (!hasItemNf && !hasFormNf) {
          // Ambos não têm NF, continua verificação
        } else if (hasItemNf !== hasFormNf) {
          // Apenas um tem NF, são diferentes (não é duplicado)
          return false;
        }
        
        // Se chegou aqui, é duplicado (mesma loja + marca + mesmo estado de NF)
        return true;
      });

      if (duplicateCheck) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Já existe um registro com esta combinação de Loja + Marca + Nota Fiscal. Verifique os dados e tente novamente.',
        });
        return;
      }

      await addReturn(returnData);

      setPendingFormData({
        brand: '',
        nf_number: '',
        nf_emission_date: '',
        nf_value: '',
        volume_quantity: '',
        date: new Date().toISOString().split('T')[0],
        store_id: user.storeId,
        has_no_nf: false
      });
    } catch (error) {
      console.error('Erro ao criar devolução:', error);
    }
  };

  const handleMarkAsCollected = async (returnId) => {
    if (window.confirm('Confirmar que esta devolução foi coletada?')) {
      try {
        if (returnId.startsWith('planner_')) {
          const plannerId = returnId.replace('planner_', '');
          await updateReturnsPlanner(plannerId, {
            status: 'Coletado'
          });
          toast({
            title: 'Sucesso!',
            description: 'Devolução do planner marcada como coletada.',
          });
        } else {
          await updateReturn(returnId, {
            collected_at: new Date().toISOString()
          });
          toast({
            title: 'Sucesso!',
            description: 'Devolução marcada como coletada.',
          });
        }
      } catch (error) {
        console.error('Erro ao marcar como coletado:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Erro ao marcar devolução como coletada.',
        });
      }
    }
  };

  const handleUpdateAdminStatus = async (returnId, status) => {
    try {
      await updateReturn(returnId, {
        admin_status: status
      });
      
      const statusLabels = {
        'reabertura': 'Reabertura de Processo',
        'nota_emitida': 'Nota Emitida',
        'aguardando_coleta': 'Aguardando Coleta',
        'coleta_infrutifera': 'Coleta Infrutífera'
      };
      
      toast({
        title: 'Status atualizado!',
        description: `Status alterado para: ${statusLabels[status]}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Devoluções Pendentes</h2>
          <p className="text-muted-foreground mt-1">Comunicativo com a loja - devoluções aguardando coleta</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por marca, NF ou loja..." 
            className="pl-9 w-64 bg-card" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Dashboard de Devoluções Pendentes */}
      {(isAdmin || isStore || user?.role === 'supervisor' || isDevolucoes) && (
        <Card className="p-6 border-2 border-yellow-500/20 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                Dashboard de Devoluções Pendentes
              </h3>
            </div>

            {/* Filtros para Devoluções Pendentes (admin/supervisor/devoluções) */}
            {(isAdmin || user?.role === 'supervisor' || isDevolucoes) && (
              <Card className="p-4 bg-secondary/50 border border-yellow-500/30 mb-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Quantidade Pendente</span>
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">{dashboardStats.totalPending}</span>
                <p className="text-xs text-muted-foreground mt-1">Devoluções aguardando coleta</p>
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Volumes Pendentes</span>
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">{dashboardStats.totalVolumes}</span>
                <p className="text-xs text-muted-foreground mt-1">Volumes parados na loja (apenas pendentes)</p>
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Valor Total</span>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">
                  R$ {dashboardStats.totalPendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Valor das notas pendentes</p>
              </motion.div>
            </div>
          </div>
        </Card>
      )}

      {/* Formulário para criar devolução pendente (apenas lojas) */}
      {isStore && (
        <Card className="p-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Devolução Pendente
          </h3>
          <form onSubmit={handleCreatePendingReturn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Select 
                value={pendingFormData.brand || ''} 
                onValueChange={(value) => setPendingFormData({ ...pendingFormData, brand: value })}
                required
              >
                <SelectTrigger id="brand" className="bg-secondary">
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="nf_number">Número da NF {!pendingFormData.has_no_nf && '*'}</Label>
                  <Input
                    id="nf_number"
                    value={pendingFormData.nf_number}
                    onChange={(e) => setPendingFormData({ ...pendingFormData, nf_number: e.target.value })}
                    required={!pendingFormData.has_no_nf}
                    disabled={pendingFormData.has_no_nf}
                    className="bg-secondary"
                    placeholder="Ex: 123456"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="has_no_nf"
                    checked={pendingFormData.has_no_nf}
                    onCheckedChange={(checked) => {
                      setPendingFormData({ 
                        ...pendingFormData, 
                        has_no_nf: checked,
                        nf_number: checked ? '' : pendingFormData.nf_number,
                        nf_emission_date: checked ? '' : pendingFormData.nf_emission_date,
                        nf_value: checked ? '' : pendingFormData.nf_value
                      });
                    }}
                  />
                  <Label htmlFor="has_no_nf" className="text-sm font-normal cursor-pointer">
                    Não possui NF
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nf_emission_date">Data de Emissão da NF {!pendingFormData.has_no_nf && '*'}</Label>
              <Input
                id="nf_emission_date"
                type="date"
                value={pendingFormData.nf_emission_date}
                onChange={(e) => setPendingFormData({ ...pendingFormData, nf_emission_date: e.target.value })}
                required={!pendingFormData.has_no_nf}
                disabled={pendingFormData.has_no_nf}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nf_value">Valor da NF</Label>
              <Input
                id="nf_value"
                type="number"
                step="0.01"
                min="0"
                value={pendingFormData.nf_value}
                onChange={(e) => setPendingFormData({ ...pendingFormData, nf_value: e.target.value })}
                disabled={pendingFormData.has_no_nf}
                className="bg-secondary"
                placeholder="Ex: 1500.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume_quantity">Qtd de Volume *</Label>
              <Input
                id="volume_quantity"
                type="number"
                min="1"
                value={pendingFormData.volume_quantity}
                onChange={(e) => setPendingFormData({ ...pendingFormData, volume_quantity: e.target.value })}
                required
                className="bg-secondary"
                placeholder="Ex: 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={pendingFormData.date}
                onChange={(e) => setPendingFormData({ ...pendingFormData, date: e.target.value })}
                required
                className="bg-secondary"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-6">
              <Button type="submit" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Cadastrar Devolução Pendente
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de devoluções pendentes */}
      {pendingReturns.length === 0 ? (
        <Card className="p-12 text-center">
          <RotateCcw className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma devolução pendente</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente ajustar os filtros de busca.' : (isStore ? 'Cadastre uma nova devolução pendente acima.' : 'Nenhuma devolução pendente encontrada.')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingReturns.map((returnItem, index) => {
            const store = stores.find(s => s.id === returnItem.store_id);
            return (
              <motion.div
                key={returnItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl shadow-lg border border-border p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{returnItem.brand}</h3>
                      {returnItem.nf_number && returnItem.nf_number !== 'SEM_NF' ? (
                        <>
                          <p className="text-sm text-muted-foreground">NF: {returnItem.nf_number}</p>
                          {returnItem.nf_emission_date && (
                            <p className="text-sm text-muted-foreground">
                              Emissão: {new Date(returnItem.nf_emission_date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-amber-500 font-medium">Não possui NF</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {store?.name || 'Loja não encontrada'}
                      </p>
                    </div>
                    {(isAdmin || isDevolucoes) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateAdminStatus(returnItem.id, 'reabertura')}>
                            Reabertura de Processo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAdminStatus(returnItem.id, 'nota_emitida')}>
                            Nota Emitida
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAdminStatus(returnItem.id, 'aguardando_coleta')}>
                            Aguardando Coleta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateAdminStatus(returnItem.id, 'coleta_infrutifera')}>
                            Coleta Infrutífera
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const nfInfo = (returnItem.nf_number && returnItem.nf_number !== 'SEM_NF') ? `NF: ${returnItem.nf_number}` : 'Não possui NF';
                              if (window.confirm(`Tem certeza que deseja excluir esta devolução (${returnItem.brand} - ${nfInfo})? Esta ação não pode ser desfeita.`)) {
                                deleteReturn(returnItem.id);
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
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantidade:</span>
                      <span className="font-medium text-foreground">{returnItem.volume_quantity || 1} volume(s)</span>
                    </div>
                    {returnItem.nf_value && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Valor da NF:</span>
                        <span className="font-medium text-foreground">
                          R$ {parseFloat(returnItem.nf_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium text-foreground">
                        {returnItem.date ? format(new Date(returnItem.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                      </span>
                    </div>
                    {returnItem.nf_emission_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Emissão NF:</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(returnItem.nf_emission_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(returnItem.admin_status || 'aguardando_coleta', 'return')}
                    </div>
                  </div>
                </div>
                
                {/* Botão COLETADO para lojas e perfil de devoluções */}
                {(isStore && returnItem.store_id === user?.storeId) || isDevolucoes ? (
                  <Button
                    onClick={() => handleMarkAsCollected(returnItem.id)}
                    className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <CheckSquare className="w-4 h-4" />
                    COLETADO
                  </Button>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReturnsPending;



