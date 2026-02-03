import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Save, X, Search, BarChart3, Package, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { cn } from '@/lib/utils';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';

const ReturnsCapacity = () => {
  const { 
    stores, 
    returnsCapacity,
    addReturnsCapacity, 
    updateReturnsCapacity, 
    deleteReturnsCapacity,
    fetchData 
  } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDevolucoes = user?.role === 'devoluções';
  const isSupervisor = user?.role === 'supervisor';
  const isLoja = user?.role === 'loja' || user?.role === 'admin_loja';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: [],
    mu: []
  });
  
  const [editingId, setEditingId] = useState(null);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [formDataFTW, setFormDataFTW] = useState({
    capacidade_estoque: '',
    estoque_atual: '',
    sku: '',
    ate_4_pecas: '',
    percentual_ultimas_pecas: '',
    capacidade_estoque_venda: '',
    data_referencia: new Date().toISOString().split('T')[0]
  });
  const [formDataAPP, setFormDataAPP] = useState({
    capacidade_estoque: '',
    estoque_atual: '',
    sku: '',
    ate_4_pecas: '',
    percentual_ultimas_pecas: '',
    capacidade_estoque_venda: '',
    data_referencia: new Date().toISOString().split('T')[0]
  });
  const [formDataEQ, setFormDataEQ] = useState({
    capacidade_estoque: '',
    estoque_atual: '',
    sku: '',
    ate_4_pecas: '',
    percentual_ultimas_pecas: '',
    capacidade_estoque_venda: '',
    data_referencia: new Date().toISOString().split('T')[0]
  });
  
  // Estado antigo para compatibilidade com edição
  const [formData, setFormData] = useState({
    store_id: '',
    mu: '',
    capacidade_estoque: '',
    estoque_atual: '',
    sku: '',
    ate_4_pecas: '',
    percentual_ultimas_pecas: '',
    capacidade_estoque_venda: '',
    data_referencia: new Date().toISOString().split('T')[0]
  });

  useOptimizedRefresh(fetchData);

  const filterOptions = useMemo(() => {
    const storesList = stores || [];
    const capacityList = returnsCapacity || [];
    const mus = [...new Set(capacityList.map(c => c.mu).filter(Boolean))];
    return {
      stores: storesList.map(s => ({ value: s.id, label: s.name })),
      franqueados: [...new Set(storesList.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      bandeiras: [...new Set(storesList.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      supervisors: [...new Set(storesList.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s })),
      mus: mus.map(m => ({ value: m, label: m }))
    };
  }, [stores, returnsCapacity]);

  // Filtrar dados
  const filteredCapacity = useMemo(() => {
    let filtered = returnsCapacity || [];
    
    // Filtro por loja (para lojas, mostrar apenas sua loja)
    if (isLoja && user?.storeId && !isDevolucoes) {
      filtered = filtered.filter(cap => cap.store_id === user.storeId);
    }
    
    // Aplicar filtros (para admin/supervisor/devoluções)
    if (isAdmin || isSupervisor || isDevolucoes) {
      const hasFilters = filters.store.length > 0 || 
                        filters.franqueado.length > 0 || 
                        filters.bandeira.length > 0 || 
                        filters.supervisor.length > 0 ||
                        filters.mu.length > 0;
      
      if (hasFilters) {
        const filteredStoreIds = new Set();
        (stores || []).forEach(store => {
          const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
          const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
          const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
          const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));
          
          if (matchStore && matchFranqueado && matchBandeira && matchSupervisor) {
            filteredStoreIds.add(store.id);
          }
        });
        
        filtered = filtered.filter(cap => {
          const matchStore = filters.store.length === 0 || filteredStoreIds.has(cap.store_id);
          const matchMu = filters.mu.length === 0 || (cap.mu && filters.mu.includes(cap.mu));
          return matchStore && matchMu;
        });
      }
    }
    
    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cap => {
        const store = stores.find(s => s.id === cap.store_id);
        return (
          cap.mu?.toLowerCase().includes(term) ||
          store?.name?.toLowerCase().includes(term) ||
          store?.code?.toLowerCase().includes(term)
        );
      });
    }
    
    return filtered;
  }, [returnsCapacity, stores, filters, searchTerm, isAdmin, isSupervisor, isDevolucoes, isLoja, user?.storeId]);

  // Ordenar por loja e depois por MU
  const sortedCapacity = useMemo(() => {
    return [...filteredCapacity].sort((a, b) => {
      const storeA = stores.find(s => s.id === a.store_id);
      const storeB = stores.find(s => s.id === b.store_id);
      const codeA = storeA?.code || '';
      const codeB = storeB?.code || '';
      
      if (codeA !== codeB) {
        return codeA.localeCompare(codeB);
      }
      
      return (a.mu || '').localeCompare(b.mu || '');
    });
  }, [filteredCapacity, stores]);

  const handleEdit = (capacity) => {
    setEditingId(capacity.id);
    setFormData({
      store_id: capacity.store_id,
      mu: capacity.mu || '',
      capacidade_estoque: capacity.capacidade_estoque || '',
      estoque_atual: capacity.estoque_atual || '',
      sku: capacity.sku || '',
      ate_4_pecas: capacity.ate_4_pecas || '',
      percentual_ultimas_pecas: capacity.percentual_ultimas_pecas || '',
      capacidade_estoque_venda: capacity.capacidade_estoque_venda || '',
      data_referencia: capacity.data_referencia || new Date().toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      store_id: '',
      mu: '',
      capacidade_estoque: '',
      estoque_atual: '',
      sku: '',
      ate_4_pecas: '',
      percentual_ultimas_pecas: '',
      capacidade_estoque_venda: '',
      data_referencia: new Date().toISOString().split('T')[0]
    });
  };

  const handleSave = async () => {
    try {
      // Se estiver editando, usar o formulário antigo
      if (editingId) {
        if (!formData.store_id || !formData.mu) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Loja e MU são obrigatórios.',
          });
          return;
        }

        const estoqueAtual = parseInt(formData.estoque_atual) || 0;
        const capacidadeEstoque = parseInt(formData.capacidade_estoque) || 0;
        const capacidadeEstoqueVenda = capacidadeEstoque > 0 
          ? parseFloat(calculateCapacidadeEstoqueVenda(estoqueAtual, capacidadeEstoque))
          : 0;

        const capacityData = {
          store_id: formData.store_id,
          mu: formData.mu,
          capacidade_estoque: capacidadeEstoque,
          estoque_atual: estoqueAtual,
          sku: parseInt(formData.sku) || 0,
          ate_4_pecas: parseInt(formData.ate_4_pecas) || 0,
          percentual_ultimas_pecas: parseFloat(formData.percentual_ultimas_pecas) || 0,
          capacidade_estoque_venda: capacidadeEstoqueVenda,
          data_referencia: formData.data_referencia
        };

        await updateReturnsCapacity(editingId, capacityData);
        handleCancelEdit();
        return;
      }

      // Se não estiver editando, criar para FTW, APP e EQ
      if (!selectedStoreId) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Selecione uma loja.',
        });
        return;
      }

      const capacitiesToCreate = [];

      // Criar registro para FTW (se tiver capacidade_estoque preenchido)
      if (formDataFTW.capacidade_estoque) {
        const estoqueAtualFTW = parseInt(formDataFTW.estoque_atual) || 0;
        const capacidadeEstoqueFTW = parseInt(formDataFTW.capacidade_estoque) || 0;
        const capacidadeEstoqueVendaFTW = capacidadeEstoqueFTW > 0 
          ? parseFloat(calculateCapacidadeEstoqueVenda(estoqueAtualFTW, capacidadeEstoqueFTW))
          : 0;

        capacitiesToCreate.push({
          store_id: selectedStoreId,
          mu: 'FTW',
          capacidade_estoque: capacidadeEstoqueFTW,
          estoque_atual: estoqueAtualFTW,
          sku: parseInt(formDataFTW.sku) || 0,
          ate_4_pecas: parseInt(formDataFTW.ate_4_pecas) || 0,
          percentual_ultimas_pecas: parseFloat(formDataFTW.percentual_ultimas_pecas) || 0,
          capacidade_estoque_venda: capacidadeEstoqueVendaFTW,
          data_referencia: formDataFTW.data_referencia
        });
      }

      // Criar registro para APP (se tiver capacidade_estoque preenchido)
      if (formDataAPP.capacidade_estoque) {
        const estoqueAtualAPP = parseInt(formDataAPP.estoque_atual) || 0;
        const capacidadeEstoqueAPP = parseInt(formDataAPP.capacidade_estoque) || 0;
        const capacidadeEstoqueVendaAPP = capacidadeEstoqueAPP > 0 
          ? parseFloat(calculateCapacidadeEstoqueVenda(estoqueAtualAPP, capacidadeEstoqueAPP))
          : 0;

        capacitiesToCreate.push({
          store_id: selectedStoreId,
          mu: 'APP',
          capacidade_estoque: capacidadeEstoqueAPP,
          estoque_atual: estoqueAtualAPP,
          sku: parseInt(formDataAPP.sku) || 0,
          ate_4_pecas: parseInt(formDataAPP.ate_4_pecas) || 0,
          percentual_ultimas_pecas: parseFloat(formDataAPP.percentual_ultimas_pecas) || 0,
          capacidade_estoque_venda: capacidadeEstoqueVendaAPP,
          data_referencia: formDataAPP.data_referencia
        });
      }

      // Criar registro para EQ (se tiver capacidade_estoque preenchido)
      if (formDataEQ.capacidade_estoque) {
        const estoqueAtualEQ = parseInt(formDataEQ.estoque_atual) || 0;
        const capacidadeEstoqueEQ = parseInt(formDataEQ.capacidade_estoque) || 0;
        const capacidadeEstoqueVendaEQ = capacidadeEstoqueEQ > 0 
          ? parseFloat(calculateCapacidadeEstoqueVenda(estoqueAtualEQ, capacidadeEstoqueEQ))
          : 0;

        capacitiesToCreate.push({
          store_id: selectedStoreId,
          mu: 'EQ',
          capacidade_estoque: capacidadeEstoqueEQ,
          estoque_atual: estoqueAtualEQ,
          sku: parseInt(formDataEQ.sku) || 0,
          ate_4_pecas: parseInt(formDataEQ.ate_4_pecas) || 0,
          percentual_ultimas_pecas: parseFloat(formDataEQ.percentual_ultimas_pecas) || 0,
          capacidade_estoque_venda: capacidadeEstoqueVendaEQ,
          data_referencia: formDataEQ.data_referencia
        });
      }

      if (capacitiesToCreate.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha pelo menos um MU (FTW, APP ou EQ) com capacidade de estoque.',
        });
        return;
      }

      // Validar valores antes de criar
      for (const capacityData of capacitiesToCreate) {
        // Validar percentual_ultimas_pecas (deve ser um número válido)
        const percentualUltimasPecas = parseFloat(capacityData.percentual_ultimas_pecas) || 0;
        if (isNaN(percentualUltimasPecas) || percentualUltimasPecas < 0) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: `O valor de "% Últimas Peças" para ${capacityData.mu} é inválido.`,
          });
          return;
        }

        // Validar capacidade_estoque_venda (deve ser um número válido)
        const capacidadeEstoqueVenda = parseFloat(capacityData.capacidade_estoque_venda) || 0;
        if (isNaN(capacidadeEstoqueVenda) || capacidadeEstoqueVenda < 0) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: `O valor de "% Capacidade Estoque Venda" para ${capacityData.mu} é inválido.`,
          });
          return;
        }
      }

      // Criar todos os registros
      for (const capacityData of capacitiesToCreate) {
        await addReturnsCapacity(capacityData);
      }

      // Limpar formulários
      setSelectedStoreId('');
      setFormDataFTW({
        capacidade_estoque: '',
        estoque_atual: '',
        sku: '',
        ate_4_pecas: '',
        percentual_ultimas_pecas: '',
        capacidade_estoque_venda: '',
        data_referencia: new Date().toISOString().split('T')[0]
      });
      setFormDataAPP({
        capacidade_estoque: '',
        estoque_atual: '',
        sku: '',
        ate_4_pecas: '',
        percentual_ultimas_pecas: '',
        capacidade_estoque_venda: '',
        data_referencia: new Date().toISOString().split('T')[0]
      });
      setFormDataEQ({
        capacidade_estoque: '',
        estoque_atual: '',
        sku: '',
        ate_4_pecas: '',
        percentual_ultimas_pecas: '',
        capacidade_estoque_venda: '',
        data_referencia: new Date().toISOString().split('T')[0]
      });

      toast({
        title: 'Sucesso!',
        description: `${capacitiesToCreate.length} registro(s) de capacidade criado(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao salvar capacidade:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao salvar capacidade.',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de capacidade?')) {
      try {
        await deleteReturnsCapacity(id);
        // Recarregar os dados após exclusão bem-sucedida
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir capacidade:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir',
          description: error.message || 'Não foi possível excluir o registro. Verifique suas permissões.',
        });
      }
    }
  };

  // Calcular percentual de capacidade de estoque venda
  // Fórmula: estoque_atual / capacidade_estoque * 100
  const calculateCapacidadeEstoqueVenda = (estoqueAtual, capacidadeEstoque) => {
    if (!capacidadeEstoque || capacidadeEstoque === 0) return 0;
    if (!estoqueAtual || estoqueAtual === 0) return 0;
    return ((estoqueAtual / capacidadeEstoque) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Capacidade de Processamento</h2>
          <p className="text-muted-foreground mt-1">Gerencie o limite de capacidade e volume parado nas lojas</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por loja ou MU..." 
            className="pl-9 w-64 bg-card" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Filtros */}
      {(isAdmin || isSupervisor || isDevolucoes) && (
        <Card className="p-4 bg-secondary/50 border">
          <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <Label className="text-xs">MU</Label>
              <MultiSelectFilter
                options={filterOptions.mus}
                selected={filters.mu}
                onChange={(selected) => setFilters({ ...filters, mu: selected })}
                placeholder="Todos os MUs"
                className="bg-background"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Formulário de criação/edição */}
      {(isAdmin || isDevolucoes) && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            {editingId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Editar Capacidade' : 'Nova Capacidade'}
          </h3>
          
          {editingId ? (
            // Formulário de edição (modo antigo)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_id">Loja *</Label>
                <Select 
                  value={formData.store_id} 
                  onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  disabled={!!editingId}
                >
                  <SelectTrigger id="store_id" className="bg-secondary">
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name} ({store.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mu">MU *</Label>
                <Input
                  id="mu"
                  value={formData.mu}
                  onChange={(e) => setFormData({ ...formData, mu: e.target.value.toUpperCase() })}
                  className="bg-secondary"
                  placeholder="Ex: FTW, APP, EQ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade_estoque_edit">Capacidade Estoque *</Label>
                <Input
                  id="capacidade_estoque_edit"
                  type="number"
                  min="0"
                  value={formData.capacidade_estoque}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, capacidade_estoque: value });
                    if (formData.estoque_atual && value) {
                      const percentual = calculateCapacidadeEstoqueVenda(parseInt(formData.estoque_atual), parseInt(value));
                      setFormData(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                    }
                  }}
                  className="bg-secondary"
                  placeholder="Ex: 5800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_atual_edit">Estoque Atual</Label>
                <Input
                  id="estoque_atual_edit"
                  type="number"
                  min="0"
                  value={formData.estoque_atual}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, estoque_atual: value });
                    if (formData.capacidade_estoque && value) {
                      const percentual = calculateCapacidadeEstoqueVenda(parseInt(value), parseInt(formData.capacidade_estoque));
                      setFormData(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                    }
                  }}
                  className="bg-secondary"
                  placeholder="Ex: 5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku_edit">SKU</Label>
                <Input
                  id="sku_edit"
                  type="number"
                  min="0"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-secondary"
                  placeholder="Ex: 553"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ate_4_pecas_edit">Até 4 peças</Label>
                <Input
                  id="ate_4_pecas_edit"
                  type="number"
                  min="0"
                  value={formData.ate_4_pecas}
                  onChange={(e) => setFormData({ ...formData, ate_4_pecas: e.target.value })}
                  className="bg-secondary"
                  placeholder="Ex: 189"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentual_ultimas_pecas_edit">% Últimas Peças</Label>
                <Input
                  id="percentual_ultimas_pecas_edit"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentual_ultimas_pecas}
                  onChange={(e) => setFormData({ ...formData, percentual_ultimas_pecas: e.target.value })}
                  className="bg-secondary"
                  placeholder="Ex: 34.18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade_estoque_venda_edit">% Capacidade Estoque Venda</Label>
                <Input
                  id="capacidade_estoque_venda_edit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.capacidade_estoque_venda}
                  className="bg-secondary"
                  placeholder="Ex: 86.21"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_referencia_edit">Data Referência</Label>
                <Input
                  id="data_referencia_edit"
                  type="date"
                  value={formData.data_referencia}
                  onChange={(e) => setFormData({ ...formData, data_referencia: e.target.value })}
                  className="bg-secondary"
                />
              </div>
            </div>
          ) : (
            // Formulário de criação (novo formato com FTW, APP e EQ)
            <>
              <div className="mb-6">
                <Label htmlFor="store_select">Loja *</Label>
                <Select 
                  value={selectedStoreId} 
                  onValueChange={(value) => setSelectedStoreId(value)}
                >
                  <SelectTrigger id="store_select" className="bg-secondary mt-2">
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name} ({store.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStoreId && (
                <div className="space-y-6">
                  {/* Bloco FTW */}
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <h4 className="font-semibold text-foreground mb-4 text-lg">FTW</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftw_capacidade_estoque">Capacidade Estoque *</Label>
                        <Input
                          id="ftw_capacidade_estoque"
                          type="number"
                          min="0"
                          value={formDataFTW.capacidade_estoque}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataFTW({ ...formDataFTW, capacidade_estoque: value });
                            if (formDataFTW.estoque_atual && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(formDataFTW.estoque_atual), parseInt(value));
                              setFormDataFTW(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 5800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_estoque_atual">Estoque Atual</Label>
                        <Input
                          id="ftw_estoque_atual"
                          type="number"
                          min="0"
                          value={formDataFTW.estoque_atual}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataFTW({ ...formDataFTW, estoque_atual: value });
                            if (formDataFTW.capacidade_estoque && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(value), parseInt(formDataFTW.capacidade_estoque));
                              setFormDataFTW(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_sku">SKU</Label>
                        <Input
                          id="ftw_sku"
                          type="number"
                          min="0"
                          value={formDataFTW.sku}
                          onChange={(e) => setFormDataFTW({ ...formDataFTW, sku: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 553"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_ate_4_pecas">Até 4 peças</Label>
                        <Input
                          id="ftw_ate_4_pecas"
                          type="number"
                          min="0"
                          value={formDataFTW.ate_4_pecas}
                          onChange={(e) => setFormDataFTW({ ...formDataFTW, ate_4_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 189"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_percentual_ultimas_pecas">% Últimas Peças</Label>
                        <Input
                          id="ftw_percentual_ultimas_pecas"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formDataFTW.percentual_ultimas_pecas}
                          onChange={(e) => setFormDataFTW({ ...formDataFTW, percentual_ultimas_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 34.18"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_capacidade_estoque_venda">% Capacidade Estoque Venda</Label>
                        <Input
                          id="ftw_capacidade_estoque_venda"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formDataFTW.capacidade_estoque_venda}
                          className="bg-secondary"
                          placeholder="Ex: 86.21"
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftw_data_referencia">Data Referência</Label>
                        <Input
                          id="ftw_data_referencia"
                          type="date"
                          value={formDataFTW.data_referencia}
                          onChange={(e) => setFormDataFTW({ ...formDataFTW, data_referencia: e.target.value })}
                          className="bg-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco APP */}
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <h4 className="font-semibold text-foreground mb-4 text-lg">APP</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="app_capacidade_estoque">Capacidade Estoque *</Label>
                        <Input
                          id="app_capacidade_estoque"
                          type="number"
                          min="0"
                          value={formDataAPP.capacidade_estoque}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataAPP({ ...formDataAPP, capacidade_estoque: value });
                            if (formDataAPP.estoque_atual && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(formDataAPP.estoque_atual), parseInt(value));
                              setFormDataAPP(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_estoque_atual">Estoque Atual</Label>
                        <Input
                          id="app_estoque_atual"
                          type="number"
                          min="0"
                          value={formDataAPP.estoque_atual}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataAPP({ ...formDataAPP, estoque_atual: value });
                            if (formDataAPP.capacidade_estoque && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(value), parseInt(formDataAPP.capacidade_estoque));
                              setFormDataAPP(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_sku">SKU</Label>
                        <Input
                          id="app_sku"
                          type="number"
                          min="0"
                          value={formDataAPP.sku}
                          onChange={(e) => setFormDataAPP({ ...formDataAPP, sku: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 348"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_ate_4_pecas">Até 4 peças</Label>
                        <Input
                          id="app_ate_4_pecas"
                          type="number"
                          min="0"
                          value={formDataAPP.ate_4_pecas}
                          onChange={(e) => setFormDataAPP({ ...formDataAPP, ate_4_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 182"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_percentual_ultimas_pecas">% Últimas Peças</Label>
                        <Input
                          id="app_percentual_ultimas_pecas"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formDataAPP.percentual_ultimas_pecas}
                          onChange={(e) => setFormDataAPP({ ...formDataAPP, percentual_ultimas_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 52.30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_capacidade_estoque_venda">% Capacidade Estoque Venda</Label>
                        <Input
                          id="app_capacidade_estoque_venda"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formDataAPP.capacidade_estoque_venda}
                          className="bg-secondary"
                          placeholder="Ex: 0.00"
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="app_data_referencia">Data Referência</Label>
                        <Input
                          id="app_data_referencia"
                          type="date"
                          value={formDataAPP.data_referencia}
                          onChange={(e) => setFormDataAPP({ ...formDataAPP, data_referencia: e.target.value })}
                          className="bg-secondary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloco EQ */}
                  <div className="border rounded-lg p-4 bg-secondary/20">
                    <h4 className="font-semibold text-foreground mb-4 text-lg">EQ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="eq_capacidade_estoque">Capacidade Estoque *</Label>
                        <Input
                          id="eq_capacidade_estoque"
                          type="number"
                          min="0"
                          value={formDataEQ.capacidade_estoque}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataEQ({ ...formDataEQ, capacidade_estoque: value });
                            if (formDataEQ.estoque_atual && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(formDataEQ.estoque_atual), parseInt(value));
                              setFormDataEQ(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 5000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_estoque_atual">Estoque Atual</Label>
                        <Input
                          id="eq_estoque_atual"
                          type="number"
                          min="0"
                          value={formDataEQ.estoque_atual}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormDataEQ({ ...formDataEQ, estoque_atual: value });
                            if (formDataEQ.capacidade_estoque && value) {
                              const percentual = calculateCapacidadeEstoqueVenda(parseInt(value), parseInt(formDataEQ.capacidade_estoque));
                              setFormDataEQ(prev => ({ ...prev, capacidade_estoque_venda: percentual }));
                            }
                          }}
                          className="bg-secondary"
                          placeholder="Ex: 0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_sku">SKU</Label>
                        <Input
                          id="eq_sku"
                          type="number"
                          min="0"
                          value={formDataEQ.sku}
                          onChange={(e) => setFormDataEQ({ ...formDataEQ, sku: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 348"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_ate_4_pecas">Até 4 peças</Label>
                        <Input
                          id="eq_ate_4_pecas"
                          type="number"
                          min="0"
                          value={formDataEQ.ate_4_pecas}
                          onChange={(e) => setFormDataEQ({ ...formDataEQ, ate_4_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 182"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_percentual_ultimas_pecas">% Últimas Peças</Label>
                        <Input
                          id="eq_percentual_ultimas_pecas"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formDataEQ.percentual_ultimas_pecas}
                          onChange={(e) => setFormDataEQ({ ...formDataEQ, percentual_ultimas_pecas: e.target.value })}
                          className="bg-secondary"
                          placeholder="Ex: 52.30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_capacidade_estoque_venda">% Capacidade Estoque Venda</Label>
                        <Input
                          id="eq_capacidade_estoque_venda"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formDataEQ.capacidade_estoque_venda}
                          className="bg-secondary"
                          placeholder="Ex: 0.00"
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="eq_data_referencia">Data Referência</Label>
                        <Input
                          id="eq_data_referencia"
                          type="date"
                          value={formDataEQ.data_referencia}
                          onChange={(e) => setFormDataEQ({ ...formDataEQ, data_referencia: e.target.value })}
                          className="bg-secondary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleSave} 
              className="gap-2"
              disabled={!editingId && !selectedStoreId}
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
            {editingId && (
              <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            )}
            {!editingId && selectedStoreId && (
              <Button 
                onClick={() => {
                  setSelectedStoreId('');
                  setFormDataFTW({
                    capacidade_estoque: '',
                    estoque_atual: '',
                    sku: '',
                    ate_4_pecas: '',
                    percentual_ultimas_pecas: '',
                    capacidade_estoque_venda: '',
                    data_referencia: new Date().toISOString().split('T')[0]
                  });
                  setFormDataAPP({
                    capacidade_estoque: '',
                    estoque_atual: '',
                    sku: '',
                    ate_4_pecas: '',
                    percentual_ultimas_pecas: '',
                    capacidade_estoque_venda: '',
                    data_referencia: new Date().toISOString().split('T')[0]
                  });
                  setFormDataEQ({
                    capacidade_estoque: '',
                    estoque_atual: '',
                    sku: '',
                    ate_4_pecas: '',
                    percentual_ultimas_pecas: '',
                    capacidade_estoque_venda: '',
                    data_referencia: new Date().toISOString().split('T')[0]
                  });
                }} 
                variant="outline" 
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Tabela de Capacidade */}
      {sortedCapacity.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum registro encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente ajustar os filtros de busca.' : (isAdmin || isDevolucoes ? 'Cadastre uma nova capacidade acima.' : 'Nenhuma capacidade registrada.')}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b-2 border-primary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">SIGLALOJA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">MU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">CAPACIDADE ESTOQUE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">ESTOQUE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">Até 4 peças</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">% DE ULTIMAS PEÇAS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">CAPACIDADE ESTOQUE VENDA</th>
                  {(isAdmin || isDevolucoes) && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground uppercase">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {sortedCapacity.map((cap, index) => {
                  const store = stores.find(s => s.id === cap.store_id);
                  // Calcular: estoque_atual / capacidade_estoque * 100
                  const percentualVenda = cap.capacidade_estoque_venda || calculateCapacidadeEstoqueVenda(cap.estoque_atual || 0, cap.capacidade_estoque || 0);
                  const isHighCapacity = parseFloat(percentualVenda) > 80;
                  const isMediumCapacity = parseFloat(percentualVenda) > 50;
                  
                  // Verificar se a loja anterior é a mesma para mesclar visualmente
                  const prevCap = index > 0 ? sortedCapacity[index - 1] : null;
                  const prevStore = prevCap ? stores.find(s => s.id === prevCap.store_id) : null;
                  const isSameStore = prevStore && store && prevStore.id === store.id;
                  
                  return (
                    <tr key={cap.id} className={cn(
                      "hover:bg-secondary/50 transition-colors",
                      isHighCapacity && "bg-yellow-500/10",
                      isMediumCapacity && !isHighCapacity && "bg-green-500/10"
                    )}>
                      <td className={cn(
                        "px-4 py-3 text-sm text-foreground font-medium",
                        isSameStore && "bg-secondary/30"
                      )}>
                        {isSameStore ? '' : (store?.code || '-')}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{cap.mu || '-'}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{cap.capacidade_estoque?.toLocaleString('pt-BR') || 0}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {cap.estoque_atual !== null && cap.estoque_atual !== undefined 
                          ? cap.estoque_atual.toLocaleString('pt-BR') 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{cap.sku || 0}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{cap.ate_4_pecas || 0}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {cap.percentual_ultimas_pecas 
                          ? `${parseFloat(cap.percentual_ultimas_pecas).toFixed(2).replace('.', ',')}%` 
                          : '0,00%'}
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-sm font-medium",
                        isHighCapacity && "bg-yellow-500/20",
                        isMediumCapacity && !isHighCapacity && "bg-green-500/20"
                      )}>
                        <span className={cn(
                          isHighCapacity && "text-yellow-600 font-bold",
                          isMediumCapacity && !isHighCapacity && "text-green-600 font-bold",
                          !isMediumCapacity && "text-foreground"
                        )}>
                          {percentualVenda ? `${parseFloat(percentualVenda).toFixed(2).replace('.', ',')}%` : '0,00%'}
                        </span>
                      </td>
                      {(isAdmin || isDevolucoes) && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cap)}
                              className="h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cap.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReturnsCapacity;

