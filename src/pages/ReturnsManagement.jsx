import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, MoreVertical, Search, RotateCcw, Package, Calendar, Store, FileText, CheckCircle, BarChart3, TrendingUp, AlertCircle, CheckSquare, X } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MultiSelectFilter from '@/components/MultiSelectFilter';

// Tabs component simples (reutilizado de TrainingManagement)
const Tabs = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (!child || child.type === null) return null;
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
        if (!child || child.type === null) return null;
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

const ReturnsManagement = () => {
  const { 
    stores, 
    returns, 
    returnsPlanner,
    physicalMissing, 
    addReturn, 
    updateReturn, 
    updateReturnsPlanner,
    deleteReturn,
    addPhysicalMissing,
    updatePhysicalMissing,
    deletePhysicalMissing,
    fetchData 
  } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStore = user?.role === 'loja';
  const isDevolucoes = user?.role === 'devoluções';
  
  // Debug: Verificar se returnsPlanner está sendo carregado
  useEffect(() => {
    console.log('🔍 [ReturnsManagement] returnsPlanner recebido:', returnsPlanner?.length || 0, 'itens');
    if (returnsPlanner && returnsPlanner.length > 0) {
      console.log('📋 [ReturnsManagement] Primeiro item do planner:', returnsPlanner[0]);
      const aguardandoColeta = returnsPlanner.filter(item => item.status === 'Aguardando coleta');
      console.log('📦 [ReturnsManagement] Items aguardando coleta:', aguardandoColeta.length);
      if (isStore && user?.storeId) {
        const paraMinhaLoja = aguardandoColeta.filter(item => item.store_id === user.storeId);
        console.log('🏪 [ReturnsManagement] Items para minha loja:', paraMinhaLoja.length, 'Store ID:', user.storeId);
        if (paraMinhaLoja.length > 0) {
          console.log('✅ [ReturnsManagement] Items encontrados para a loja:', paraMinhaLoja);
        }
      }
    }
  }, [returnsPlanner, isStore, user?.storeId]);
  
  // Estados do componente
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: []
  });
  
  // Filtros de data para dashboard (apenas admin)
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Filtros específicos para devoluções pendentes
  const [pendingFilters, setPendingFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: [],
    startDate: '',
    endDate: ''
  });
  
  // Filtros específicos para falta física
  const [missingFilters, setMissingFilters] = useState({
    store: [],
    franqueado: [],
    bandeira: [],
    supervisor: [],
    startDate: '',
    endDate: ''
  });
  
  // Estado do formulário de devolução pendente
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

  // Estado do formulário de falta física
  const [missingFormData, setMissingFormData] = useState({
    missing_type: [], // Array para multiseleção: ['FALTA FISICA'], ['SOBRA'], ['DIVERGENCIA NF X FISICO'], ou combinações
    brand: '',
    nf_number: '',
    sku: '',
    color: '',
    size: '',
    cost_value: '',
    quantity: '',
    moved_to_defect: false,
    store_id: user?.storeId || '',
    // Campos para divergência (o que faltou)
    divergence_missing_brand: '',
    divergence_missing_sku: '',
    divergence_missing_color: '',
    divergence_missing_size: '',
    divergence_missing_quantity: '',
    divergence_missing_cost_value: '',
    // Campos para divergência (o que sobrou no lugar)
    divergence_surplus_brand: '',
    divergence_surplus_sku: '',
    divergence_surplus_color: '',
    divergence_surplus_size: '',
    divergence_surplus_quantity: '',
    divergence_surplus_cost_value: ''
  });

  // Atualizar store_id quando user mudar
  useEffect(() => {
    if (user?.storeId) {
      setPendingFormData(prev => ({ ...prev, store_id: user.storeId }));
      setMissingFormData(prev => ({ ...prev, store_id: user.storeId }));
    }
  }, [user?.storeId]);

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

  // Opções de filtros
  const filterOptions = useMemo(() => {
    const storesList = stores || [];
    return {
      stores: storesList.map(s => ({ value: s.id, label: s.name })),
      franqueados: [...new Set(storesList.map(s => s.franqueado).filter(Boolean))].map(f => ({ value: f, label: f })),
      bandeiras: [...new Set(storesList.map(s => s.bandeira).filter(Boolean))].map(b => ({ value: b, label: b })),
      supervisors: [...new Set(storesList.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s }))
    };
  }, [stores]);

  // Converter returns_planner para formato de returns para exibição
  const plannerAsReturns = useMemo(() => {
    if (!returnsPlanner || returnsPlanner.length === 0) {
      console.log('⚠️ [ReturnsManagement] returnsPlanner está vazio ou undefined');
      return [];
    }
    
    console.log(`📦 [ReturnsManagement] Total de items no planner: ${returnsPlanner.length}`);
    
    const filtered = (returnsPlanner || [])
      .filter(item => {
        const match = item.status === 'Aguardando coleta';
        if (!match) {
          console.log(`⏭️ [ReturnsManagement] Item ${item.id} filtrado - status: "${item.status}" (esperado: "Aguardando coleta")`);
        }
        return match;
      });
    
    console.log(`✅ [ReturnsManagement] Items com status "Aguardando coleta": ${filtered.length}`);
    
    if (isStore && user?.storeId) {
      const paraMinhaLoja = filtered.filter(item => item.store_id === user.storeId);
      console.log(`🏪 [ReturnsManagement] Items para loja ${user.storeId}: ${paraMinhaLoja.length}`);
    }
    
    return filtered.map(item => ({
      id: `planner_${item.id}`, // Prefixo para identificar que vem do planner
      planner_id: item.id, // ID original do planner
      store_id: item.store_id,
      brand: item.brand || '',
      nf_number: item.invoice_number || '',
      nf_emission_date: item.invoice_issue_date || '',
      nf_value: item.return_value || 0,
      volume_quantity: item.items_quantity || 0,
      date: item.opening_date || '',
      case_number: item.case_number || '',
      return_type: item.return_type || '',
      supervisor: item.supervisor || '',
      from_planner: true, // Flag para identificar que vem do planner
      collected_at: null, // Sempre pendente se está aqui
      created_at: item.created_at
    }));
  }, [returnsPlanner, isStore, user?.storeId]);

  // Filtrar devoluções pendentes (incluindo do planner)
  const pendingReturns = useMemo(() => {
    // Combinar returns normais com returns do planner
    const allReturns = [...(returns || []), ...plannerAsReturns];
    
    let filtered = allReturns.filter(ret => {
      // Garantir que tem store_id válido
      if (!ret.store_id) return false;
      
      // IMPORTANTE: Se for loja, mostrar APENAS suas devoluções (criadas por ela OU do planner para sua loja)
      // Role devoluções vê TODAS as devoluções (sem restrição de loja)
      if (isStore && user?.storeId && !isDevolucoes) {
        if (ret.store_id !== user.storeId) {
          return false; // Loja não pode ver devoluções de outras lojas
        }
      }
      
      const store = (stores || []).find(s => s.id === ret.store_id);
      if (!store) return false;
      
      // Aplicar filtros (para admin/supervisor/devoluções)
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
        const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
        const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
        const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));
        
        if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) {
          return false;
        }
      }
      
      const matchesSearch = 
        ret.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.nf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Verificar se não foi coletada
      if (ret.collected_at) return false;
      
      // Admin/Supervisor vê TODAS as pendentes (de todas as lojas) - já filtrado acima
      // Loja já foi filtrada no início, então retorna apenas se passar na busca
      return matchesSearch;
    });
    
    return filtered;
  }, [returns, plannerAsReturns, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, filters]);

  // Filtrar devoluções coletadas
  const collectedReturns = useMemo(() => {
    let filtered = (returns || []).filter(ret => {
      // Garantir que tem store_id válido e foi coletada
      if (!ret.store_id || !ret.collected_at) return false;
      
      // IMPORTANTE: Se for loja, mostrar APENAS suas devoluções coletadas (criadas por ela)
      // Role devoluções vê TODAS as devoluções (sem restrição de loja)
      if (isStore && user?.storeId && !isDevolucoes) {
        if (ret.store_id !== user.storeId) {
          return false; // Loja não pode ver devoluções de outras lojas
        }
      }
      
      const store = (stores || []).find(s => s.id === ret.store_id);
      if (!store) return false;
      
      // Aplicar filtros (para admin/supervisor/devoluções)
      if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
        const matchStore = filters.store.length === 0 || filters.store.includes(store.id);
        const matchFranqueado = filters.franqueado.length === 0 || (store.franqueado && filters.franqueado.includes(store.franqueado));
        const matchBandeira = filters.bandeira.length === 0 || (store.bandeira && filters.bandeira.includes(store.bandeira));
        const matchSupervisor = filters.supervisor.length === 0 || (store.supervisor && filters.supervisor.includes(store.supervisor));
        
        if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) {
          return false;
        }
      }
      
      const matchesSearch = 
        ret.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ret.nf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Admin/Supervisor vê TODAS as coletadas (de todas as lojas) - já filtrado acima
      // Loja já foi filtrada no início, então retorna apenas se passar na busca
      return matchesSearch;
    });
    
    return filtered;
  }, [returns, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, filters]);

  // Filtrar falta física (excluindo finalizadas da lista principal)
  const filteredMissing = useMemo(() => {
    return (physicalMissing || []).filter(item => {
      // Excluir itens com status "nota_finalizada" da lista principal
      if (item.status === 'nota_finalizada') {
        return false;
      }
      
      // IMPORTANTE: Se for loja, mostrar APENAS suas faltas físicas (criadas por ela)
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
        
        if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) {
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
      
      // Admin/Supervisor vê TODAS as faltas (de todas as lojas) - já filtrado acima
      // Loja já foi filtrada no início, então retorna apenas se passar na busca
      return matchesSearch;
    });
  }, [physicalMissing, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, filters]);

  // Filtrar falta física finalizada (listagem minimizada)
  const finishedMissing = useMemo(() => {
    return (physicalMissing || []).filter(item => {
      // Apenas itens com status "nota_finalizada"
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
        
        if (!matchStore || !matchFranqueado || !matchBandeira || !matchSupervisor) {
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
        store.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Admin/Supervisor vê TODAS as faltas finalizadas (de todas as lojas) - já filtrado acima
      // Loja já foi filtrada no início, então retorna apenas se passar na busca
      return matchesSearch;
    });
  }, [physicalMissing, searchTerm, stores, isStore, isAdmin, isDevolucoes, user?.storeId, user?.role, filters]);

  // Dashboard - Estatísticas (admin vê todas, loja vê apenas suas)
  const dashboardStats = useMemo(() => {
    // Filtrar devoluções pendentes com filtros específicos
    let filteredReturns = returns || [];
    
    // Aplicar filtros específicos de devoluções pendentes (para admin/supervisor/devoluções)
    if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
      // Filtro por data
      if (pendingFilters.startDate || pendingFilters.endDate) {
        filteredReturns = filteredReturns.filter(ret => {
          if (!ret.date) return false;
          const retDate = new Date(ret.date);
          if (pendingFilters.startDate && retDate < new Date(pendingFilters.startDate)) return false;
          if (pendingFilters.endDate && retDate > new Date(pendingFilters.endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Filtro por combinação
      const filteredStoreIds = new Set();
      (stores || []).forEach(store => {
        const matchStore = pendingFilters.store.length === 0 || pendingFilters.store.includes(store.id);
        const matchFranqueado = pendingFilters.franqueado.length === 0 || (store.franqueado && pendingFilters.franqueado.includes(store.franqueado));
        const matchBandeira = pendingFilters.bandeira.length === 0 || (store.bandeira && pendingFilters.bandeira.includes(store.bandeira));
        const matchSupervisor = pendingFilters.supervisor.length === 0 || (store.supervisor && pendingFilters.supervisor.includes(store.supervisor));
        
        if (matchStore && matchFranqueado && matchBandeira && matchSupervisor) {
          filteredStoreIds.add(store.id);
        }
      });
      
      filteredReturns = filteredReturns.filter(ret => filteredStoreIds.has(ret.store_id));
    }
    
    // Filtrar falta física com filtros específicos
    let filteredMissing = physicalMissing || [];
    
    // Aplicar filtros específicos de falta física (para admin/supervisor/devoluções)
    if (isAdmin || user?.role === 'supervisor' || isDevolucoes) {
      // Filtro por data
      if (missingFilters.startDate || missingFilters.endDate) {
        filteredMissing = filteredMissing.filter(item => {
          if (!item.created_at) return false;
          const itemDate = new Date(item.created_at);
          if (missingFilters.startDate && itemDate < new Date(missingFilters.startDate)) return false;
          if (missingFilters.endDate && itemDate > new Date(missingFilters.endDate + 'T23:59:59')) return false;
          return true;
        });
      }
      
      // Filtro por combinação
      const filteredStoreIdsMissing = new Set();
      (stores || []).forEach(store => {
        const matchStore = missingFilters.store.length === 0 || missingFilters.store.includes(store.id);
        const matchFranqueado = missingFilters.franqueado.length === 0 || (store.franqueado && missingFilters.franqueado.includes(store.franqueado));
        const matchBandeira = missingFilters.bandeira.length === 0 || (store.bandeira && missingFilters.bandeira.includes(store.bandeira));
        const matchSupervisor = missingFilters.supervisor.length === 0 || (store.supervisor && missingFilters.supervisor.includes(store.supervisor));
        
        if (matchStore && matchFranqueado && matchBandeira && matchSupervisor) {
          filteredStoreIdsMissing.add(store.id);
        }
      });
      
      filteredMissing = filteredMissing.filter(item => filteredStoreIdsMissing.has(item.store_id));
    }
    
    // Para dashboard, admin/supervisor/devoluções vê tudo (já filtrado), loja vê apenas suas estatísticas
    const returnsToCount = (isStore && user?.storeId && !isDevolucoes)
      ? filteredReturns.filter(ret => ret.store_id === user.storeId)
      : filteredReturns;
      
    const missingToCount = (isStore && user?.storeId && !isDevolucoes)
      ? filteredMissing.filter(item => item.store_id === user.storeId)
      : filteredMissing;

    const stats = {
      totalPending: (isStore && user?.storeId && !isDevolucoes)
        ? returnsToCount.filter(ret => !ret.collected_at).length
        : pendingReturns.length,
      totalCollected: (isStore && user?.storeId && !isDevolucoes)
        ? returnsToCount.filter(ret => ret.collected_at).length
        : collectedReturns.length,
      totalMissing: missingToCount.filter(item => item.status !== 'nota_finalizada').length,
      totalFinishedMissing: missingToCount.filter(item => item.status === 'nota_finalizada').length,
      // Total de volumes APENAS de devoluções pendentes (não coletadas)
      totalVolumes: returnsToCount
        .filter(ret => !ret.collected_at)
        .reduce((sum, ret) => sum + (parseInt(ret.volume_quantity) || 0), 0),
      // Valores financeiros de devoluções pendentes
      totalPendingValue: returnsToCount
        .filter(ret => !ret.collected_at)
        .reduce((sum, ret) => sum + (parseFloat(ret.nf_value) || 0), 0),
      totalCollectedValue: returnsToCount
        .filter(ret => ret.collected_at)
        .reduce((sum, ret) => sum + (parseFloat(ret.nf_value) || 0), 0),
      // Valores financeiros de falta física
      totalMissingValue: missingToCount
        .filter(item => item.status !== 'nota_finalizada')
        .reduce((sum, item) => {
          const cost = parseFloat(item.cost_value) || 0;
          const qty = parseInt(item.quantity) || 0;
          return sum + (cost * qty);
        }, 0),
      totalFinishedMissingValue: missingToCount
        .filter(item => item.status === 'nota_finalizada')
        .reduce((sum, item) => {
          const cost = parseFloat(item.cost_value) || 0;
          const qty = parseInt(item.quantity) || 0;
          return sum + (cost * qty);
        }, 0),
      byStore: {},
      byStatus: {
        'reabertura': { count: 0, value: 0 },
        'nota_emitida': { count: 0, value: 0 },
        'aguardando_coleta': { count: 0, value: 0 },
        'coleta_infrutifera': { count: 0, value: 0 }
      },
      missingByStatus: {
        'movimentado': { count: 0, value: 0 },
        'processo_aberto': { count: 0, value: 0 },
        'nota_finalizada': { count: 0, value: 0 }
      }
    };

    // Estatísticas por loja (admin vê todas, loja vê apenas suas)
    returnsToCount.forEach(ret => {
      const store = (stores || []).find(s => s.id === ret.store_id);
      if (store) {
        if (!stats.byStore[store.id]) {
          stats.byStore[store.id] = {
            storeName: store.name,
            storeCode: store.code,
            pending: 0,
            collected: 0,
            volumes: 0
          };
        }
        if (ret.collected_at) {
          stats.byStore[store.id].collected++;
        } else {
          stats.byStore[store.id].pending++;
        }
        // Volumes apenas para pendentes
        if (!ret.collected_at) {
          stats.byStore[store.id].volumes += parseInt(ret.volume_quantity) || 0;
        }
      }
    });

    // Por status com valores (apenas pendentes - admin vê todas, loja vê apenas suas)
    returnsToCount.forEach(ret => {
      if (!ret.collected_at && ret.admin_status) {
        if (!stats.byStatus[ret.admin_status]) {
          stats.byStatus[ret.admin_status] = { count: 0, value: 0 };
        }
        stats.byStatus[ret.admin_status].count += 1;
        stats.byStatus[ret.admin_status].value += parseFloat(ret.nf_value) || 0;
      }
    });

    // Status de falta física com valores
    missingToCount.forEach(item => {
      if (item.status) {
        if (!stats.missingByStatus[item.status]) {
          stats.missingByStatus[item.status] = { count: 0, value: 0 };
        }
        stats.missingByStatus[item.status].count += 1;
        const cost = parseFloat(item.cost_value) || 0;
        const qty = parseInt(item.quantity) || 0;
        stats.missingByStatus[item.status].value += (cost * qty);
      }
    });

    // Análises adicionais
    // Maior marca pendente
    const brandCounts = {};
    returnsToCount
      .filter(ret => !ret.collected_at && ret.brand)
      .forEach(ret => {
        brandCounts[ret.brand] = (brandCounts[ret.brand] || 0) + 1;
      });
    const topBrand = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topPendingBrand = topBrand ? { brand: topBrand[0], count: topBrand[1] } : null;

    // Total de peças (quantidade total de volumes PENDENTES)
    stats.totalPieces = returnsToCount
      .filter(ret => !ret.collected_at)
      .reduce((sum, ret) => {
        return sum + (parseInt(ret.volume_quantity) || 0);
      }, 0);

    // Análises de falta física: SKU, tamanho, cor e marca mais faltantes
    // Separar por status: em aberto/movimentado vs finalizado
    const skuCountsOpen = {};
    const sizeCountsOpen = {};
    const colorCountsOpen = {};
    const brandCountsOpen = {};
    const skuQuantitiesOpen = {};
    
    const skuCountsFinished = {};
    const sizeCountsFinished = {};
    const colorCountsFinished = {};
    const brandCountsFinished = {};
    const skuQuantitiesFinished = {};
    
    missingToCount.forEach(item => {
      const qty = parseInt(item.quantity) || 0;
      const isFinished = item.status === 'nota_finalizada';
      
      const skuCounts = isFinished ? skuCountsFinished : skuCountsOpen;
      const sizeCounts = isFinished ? sizeCountsFinished : sizeCountsOpen;
      const colorCounts = isFinished ? colorCountsFinished : colorCountsOpen;
      const brandCounts = isFinished ? brandCountsFinished : brandCountsOpen;
      const skuQuantities = isFinished ? skuQuantitiesFinished : skuQuantitiesOpen;
      
      // SKU mais faltante
      if (item.sku) {
        skuCounts[item.sku] = (skuCounts[item.sku] || 0) + 1;
        skuQuantities[item.sku] = (skuQuantities[item.sku] || 0) + qty;
      }
      
      // Tamanho mais faltante
      if (item.size) {
        sizeCounts[item.size] = (sizeCounts[item.size] || 0) + qty;
      }
      
      // Cor mais faltante
      if (item.color) {
        colorCounts[item.color] = (colorCounts[item.color] || 0) + qty;
      }
      
      // Marca mais faltante
      if (item.brand) {
        brandCounts[item.brand] = (brandCounts[item.brand] || 0) + qty;
      }
    });
    
    // Top SKU em aberto
    const topSkuOpen = Object.entries(skuQuantitiesOpen)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingSkuOpen = topSkuOpen ? { sku: topSkuOpen[0], quantity: topSkuOpen[1] } : null;
    
    // Top SKU finalizado
    const topSkuFinished = Object.entries(skuQuantitiesFinished)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingSkuFinished = topSkuFinished ? { sku: topSkuFinished[0], quantity: topSkuFinished[1] } : null;
    
    // Top tamanho em aberto
    const topSizeOpen = Object.entries(sizeCountsOpen)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingSizeOpen = topSizeOpen ? { size: topSizeOpen[0], quantity: topSizeOpen[1] } : null;
    
    // Top tamanho finalizado
    const topSizeFinished = Object.entries(sizeCountsFinished)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingSizeFinished = topSizeFinished ? { size: topSizeFinished[0], quantity: topSizeFinished[1] } : null;
    
    // Top cor em aberto
    const topColorOpen = Object.entries(colorCountsOpen)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingColorOpen = topColorOpen ? { color: topColorOpen[0], quantity: topColorOpen[1] } : null;
    
    // Top cor finalizado
    const topColorFinished = Object.entries(colorCountsFinished)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingColorFinished = topColorFinished ? { color: topColorFinished[0], quantity: topColorFinished[1] } : null;
    
    // Top marca em aberto
    const topBrandOpen = Object.entries(brandCountsOpen)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingBrandOpen = topBrandOpen ? { brand: topBrandOpen[0], quantity: topBrandOpen[1] } : null;
    
    // Top marca finalizado
    const topBrandFinished = Object.entries(brandCountsFinished)
      .sort((a, b) => b[1] - a[1])[0];
    stats.topMissingBrandFinished = topBrandFinished ? { brand: topBrandFinished[0], quantity: topBrandFinished[1] } : null;
    
    // Valores separados por status
    stats.missingValueOpen = missingToCount
      .filter(item => item.status !== 'nota_finalizada')
      .reduce((sum, item) => {
        const cost = parseFloat(item.cost_value) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (cost * qty);
      }, 0);
    
    stats.missingValueFinished = missingToCount
      .filter(item => item.status === 'nota_finalizada')
      .reduce((sum, item) => {
        const cost = parseFloat(item.cost_value) || 0;
        const qty = parseInt(item.quantity) || 0;
        return sum + (cost * qty);
      }, 0);

    return stats;
  }, [returns, pendingReturns, collectedReturns, filteredMissing, physicalMissing, stores, isStore, isDevolucoes, user?.storeId, user?.role, isAdmin, pendingFilters, missingFilters]);

  // Handlers para devoluções pendentes
  const handleCreatePendingReturn = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios (NF só é obrigatória se não tiver marcado "Não possui NF")
    if (!pendingFormData.brand || !pendingFormData.volume_quantity || !pendingFormData.date) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    // Se não marcou "Não possui NF", então NF é obrigatória
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

    try {
      // Preparar dados base
      const returnData = {
        brand: pendingFormData.brand.trim(),
        volume_quantity: parseInt(pendingFormData.volume_quantity),
        date: pendingFormData.date,
        store_id: user.storeId,
        admin_status: 'aguardando_coleta'
      };

      // Se não possui NF, usar valores padrão ou não incluir
      if (pendingFormData.has_no_nf) {
        // Usar valores padrão que indicam que não há NF
        returnData.nf_number = 'SEM_NF';
        returnData.nf_emission_date = null;
        returnData.nf_value = null;
      } else {
        // Incluir dados de NF normalmente
        returnData.nf_number = pendingFormData.nf_number.trim();
        returnData.nf_emission_date = pendingFormData.nf_emission_date;
        returnData.nf_value = pendingFormData.nf_value ? parseFloat(pendingFormData.nf_value) : null;
      }

      await addReturn(returnData);

      // Resetar formulário
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
        // Verificar se é um item do planner
        if (returnId.startsWith('planner_')) {
          // É do planner - atualizar status no planner
          const plannerId = returnId.replace('planner_', '');
          await updateReturnsPlanner(plannerId, {
            status: 'Coletado'
          });
          toast({
            title: 'Sucesso!',
            description: 'Devolução do planner marcada como coletada.',
          });
        } else {
          // É um return normal - atualizar collected_at
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

  // Handlers para falta física
  const handleCreateMissing = async (e) => {
    e.preventDefault();
    
    // Validação: deve selecionar pelo menos um tipo
    if (!missingFormData.missing_type || missingFormData.missing_type.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione pelo menos um tipo (Falta Física, Divergência NF x Físico, ou Sobra).',
      });
      return;
    }

    // Validação: se não marcou "Movimentado para defeito", não permite criar
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

    // Validação específica para divergência
    if (missingFormData.missing_type.includes('DIVERGENCIA NF X FISICO')) {
      if (!missingFormData.divergence_missing_brand || !missingFormData.divergence_missing_sku ||
          !missingFormData.divergence_surplus_brand || !missingFormData.divergence_surplus_sku) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Para divergência, preencha todos os campos do item que faltou e do item que sobrou.',
        });
        return;
      }
    }

    // Validação para FALTA FISICA e SOBRA
    if (missingFormData.missing_type.includes('FALTA FISICA') || missingFormData.missing_type.includes('SOBRA')) {
      if (!missingFormData.brand || !missingFormData.sku || !missingFormData.color || 
          !missingFormData.size || !missingFormData.cost_value || !missingFormData.quantity) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Preencha todos os campos obrigatórios (Marca, SKU, Cor, Tamanho, Custo e Quantidade).',
        });
        return;
      }
    }

    try {
      // Preparar dados base
      const missingData = {
        nf_number: missingFormData.nf_number.trim(),
        moved_to_defect: missingFormData.moved_to_defect,
        store_id: user.storeId,
        status: missingFormData.moved_to_defect ? 'movimentado' : 'processo_aberto',
        missing_type: missingFormData.missing_type, // Array de tipos
      };

      // Para FALTA FISICA
      if (missingFormData.missing_type.includes('FALTA FISICA')) {
        const costValue = parseFloat(missingFormData.cost_value) || 0;
        const quantity = parseInt(missingFormData.quantity) || 0;
        const sku_info = `${missingFormData.sku} - ${missingFormData.color} - ${missingFormData.size}`;
        
        missingData.brand = missingFormData.brand.trim();
        missingData.sku = missingFormData.sku.trim();
        missingData.color = missingFormData.color.trim();
        missingData.size = missingFormData.size.trim();
        missingData.sku_info = sku_info;
        missingData.cost_value = costValue;
        missingData.quantity = quantity;
        missingData.total_value = costValue * quantity;
      }

      // Para SOBRA
      if (missingFormData.missing_type.includes('SOBRA')) {
        const costValue = parseFloat(missingFormData.cost_value) || 0;
        const quantity = parseInt(missingFormData.quantity) || 0;
        const sku_info = `${missingFormData.sku} - ${missingFormData.color} - ${missingFormData.size}`;
        
        missingData.brand = missingFormData.brand.trim();
        missingData.sku = missingFormData.sku.trim();
        missingData.color = missingFormData.color.trim();
        missingData.size = missingFormData.size.trim();
        missingData.sku_info = sku_info;
        missingData.cost_value = costValue;
        missingData.quantity = quantity;
        missingData.total_value = costValue * quantity;
      }

      // Para DIVERGENCIA NF X FISICO
      if (missingFormData.missing_type.includes('DIVERGENCIA NF X FISICO')) {
        missingData.divergence_missing_brand = missingFormData.divergence_missing_brand.trim();
        missingData.divergence_missing_sku = missingFormData.divergence_missing_sku.trim();
        missingData.divergence_missing_color = missingFormData.divergence_missing_color.trim();
        missingData.divergence_missing_size = missingFormData.divergence_missing_size.trim();
        missingData.divergence_missing_quantity = parseInt(missingFormData.divergence_missing_quantity) || 0;
        missingData.divergence_missing_cost_value = parseFloat(missingFormData.divergence_missing_cost_value) || 0;

        missingData.divergence_surplus_brand = missingFormData.divergence_surplus_brand.trim();
        missingData.divergence_surplus_sku = missingFormData.divergence_surplus_sku.trim();
        missingData.divergence_surplus_color = missingFormData.divergence_surplus_color.trim();
        missingData.divergence_surplus_size = missingFormData.divergence_surplus_size.trim();
        missingData.divergence_surplus_quantity = parseInt(missingFormData.divergence_surplus_quantity) || 0;
        missingData.divergence_surplus_cost_value = parseFloat(missingFormData.divergence_surplus_cost_value) || 0;

        // Para divergência, calcular valores totais baseados no que faltou
        missingData.cost_value = missingData.divergence_missing_cost_value;
        missingData.quantity = missingData.divergence_missing_quantity;
        missingData.total_value = missingData.divergence_missing_cost_value * missingData.divergence_missing_quantity;
      }

      await addPhysicalMissing(missingData);

      // Resetar formulário
      setMissingFormData({
        missing_type: [],
        brand: '',
        nf_number: '',
        sku: '',
        color: '',
        size: '',
        cost_value: '',
        quantity: '',
        moved_to_defect: false,
        store_id: user.storeId,
        divergence_missing_brand: '',
        divergence_missing_sku: '',
        divergence_missing_color: '',
        divergence_missing_size: '',
        divergence_missing_quantity: '',
        divergence_missing_cost_value: '',
        divergence_surplus_brand: '',
        divergence_surplus_sku: '',
        divergence_surplus_color: '',
        divergence_surplus_size: '',
        divergence_surplus_quantity: '',
        divergence_surplus_cost_value: ''
      });

      toast({
        title: 'Sucesso!',
        description: 'Falta física registrada com sucesso.',
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
        'movimentado': 'Movimentado',
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
    } else {
      const statusConfig = {
        'movimentado': { label: 'Movimentado', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        'processo_aberto': { label: 'Processo Aberto', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
        'nota_finalizada': { label: 'Nota Finalizada', class: 'bg-green-500/10 text-green-500 border-green-500/20' }
      };
      const config = statusConfig[status] || statusConfig['processo_aberto'];
      return (
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", config.class)}>
          {config.label}
        </span>
      );
    }
  };

  const userStore = useMemo(() => {
    if (!user?.storeId) return null;
    return (stores || []).find(s => s.id === user.storeId);
  }, [stores, user?.storeId]);

  return (
    <>
      <Helmet><title>Devoluções - MYFEET</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <RotateCcw className="w-8 h-8 text-primary" />
              Devoluções
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie devoluções e falta física de produtos.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por marca, NF, produto ou loja..." 
              className="pl-9 w-64 bg-card" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Dashboard */}
        <div className="space-y-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Dashboard de Devoluções
            </h2>
          </div>

          {/* SEÇÃO: DEVOLUÇÕES PENDENTES */}
          <Card className="p-6 border-2 border-yellow-500/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  Devoluções Pendentes (Paradas na Loja)
                </h3>
              </div>

              {/* Filtros para Devoluções Pendentes (admin/supervisor/devoluções) */}
              {(isAdmin || user?.role === 'supervisor' || isDevolucoes) && (
                <Card className="p-4 bg-secondary/50 border border-yellow-500/30">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros de Devoluções Pendentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Loja</Label>
                      <MultiSelectFilter
                        options={filterOptions.stores}
                        selected={pendingFilters.store}
                        onChange={(selected) => setPendingFilters({ ...pendingFilters, store: selected })}
                        placeholder="Todas as lojas"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Franqueado</Label>
                      <MultiSelectFilter
                        options={filterOptions.franqueados}
                        selected={pendingFilters.franqueado}
                        onChange={(selected) => setPendingFilters({ ...pendingFilters, franqueado: selected })}
                        placeholder="Todos os franqueados"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Bandeira</Label>
                      <MultiSelectFilter
                        options={filterOptions.bandeiras}
                        selected={pendingFilters.bandeira}
                        onChange={(selected) => setPendingFilters({ ...pendingFilters, bandeira: selected })}
                        placeholder="Todas as bandeiras"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Supervisor</Label>
                      <MultiSelectFilter
                        options={filterOptions.supervisors}
                        selected={pendingFilters.supervisor}
                        onChange={(selected) => setPendingFilters({ ...pendingFilters, supervisor: selected })}
                        placeholder="Todos os supervisores"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data Inicial</Label>
                      <Input
                        type="date"
                        value={pendingFilters.startDate}
                        onChange={(e) => setPendingFilters({ ...pendingFilters, startDate: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data Final</Label>
                      <Input
                        type="date"
                        value={pendingFilters.endDate}
                        onChange={(e) => setPendingFilters({ ...pendingFilters, endDate: e.target.value })}
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

            {/* Status de Devoluções Pendentes */}
            {(Object.values(dashboardStats.byStatus).some(v => (typeof v === 'object' ? v.count : v) > 0)) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Status de Devoluções Pendentes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(dashboardStats.byStatus).map(([status, data]) => {
                    const count = typeof data === 'object' ? data.count : data;
                    const value = typeof data === 'object' ? data.value : 0;
                    return count > 0 && (
                      <div key={status} className="bg-secondary p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          {getStatusBadge(status, 'return')}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Quantidade:</p>
                          <p className="font-bold text-xl text-foreground">{count}</p>
                          {value > 0 && (
                            <>
                              <p className="text-sm text-muted-foreground mt-2">Valor:</p>
                              <p className="font-semibold text-foreground">
                                R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Maior Marca Pendente */}
            {dashboardStats.topPendingBrand && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Maior Marca Pendente
                </h3>
                <div className="flex items-center gap-4">
                  <div className="bg-secondary px-4 py-3 rounded-lg border border-border">
                    <span className="font-bold text-2xl text-foreground">{dashboardStats.topPendingBrand.brand}</span>
                    <p className="text-sm text-muted-foreground mt-1">{dashboardStats.topPendingBrand.count} devolução(ões) pendente(s)</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Volumes por Loja */}
            {Object.keys(dashboardStats.byStore).length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Volumes Pendentes por Loja
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(dashboardStats.byStore).map((storeStat, index) => (
                    <motion.div
                      key={index}
                      className="bg-secondary p-3 rounded-lg border border-border"
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-semibold text-foreground">{storeStat.storeName}</p>
                      <p className="text-xs text-muted-foreground mb-2">{storeStat.storeCode}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pendentes:</span>
                          <span className="font-semibold text-yellow-500">{storeStat.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Volumes Pendentes:</span>
                          <span className="font-semibold text-foreground">{storeStat.volumes}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
            </div>
          </Card>

          {/* SEÇÃO: FALTA FÍSICA */}
          <Card className="p-6 border-2 border-red-500/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Falta Física
                </h3>
              </div>

              {/* Filtros para Falta Física (admin/supervisor/devoluções) */}
              {(isAdmin || user?.role === 'supervisor' || isDevolucoes) && (
                <Card className="p-4 bg-secondary/50 border border-red-500/30">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros de Falta Física</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Loja</Label>
                      <MultiSelectFilter
                        options={filterOptions.stores}
                        selected={missingFilters.store}
                        onChange={(selected) => setMissingFilters({ ...missingFilters, store: selected })}
                        placeholder="Todas as lojas"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Franqueado</Label>
                      <MultiSelectFilter
                        options={filterOptions.franqueados}
                        selected={missingFilters.franqueado}
                        onChange={(selected) => setMissingFilters({ ...missingFilters, franqueado: selected })}
                        placeholder="Todos os franqueados"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Bandeira</Label>
                      <MultiSelectFilter
                        options={filterOptions.bandeiras}
                        selected={missingFilters.bandeira}
                        onChange={(selected) => setMissingFilters({ ...missingFilters, bandeira: selected })}
                        placeholder="Todas as bandeiras"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Supervisor</Label>
                      <MultiSelectFilter
                        options={filterOptions.supervisors}
                        selected={missingFilters.supervisor}
                        onChange={(selected) => setMissingFilters({ ...missingFilters, supervisor: selected })}
                        placeholder="Todos os supervisores"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data Inicial</Label>
                      <Input
                        type="date"
                        value={missingFilters.startDate}
                        onChange={(e) => setMissingFilters({ ...missingFilters, startDate: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data Final</Label>
                      <Input
                        type="date"
                        value={missingFilters.endDate}
                        onChange={(e) => setMissingFilters({ ...missingFilters, endDate: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </Card>
              )}
            
            {/* Cards principais de falta física */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Em Aberto/Movimentado</span>
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">{dashboardStats.totalMissing}</span>
                {dashboardStats.missingValueOpen > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    R$ {dashboardStats.missingValueOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Nota Finalizada</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">{dashboardStats.totalFinishedMissing}</span>
                {dashboardStats.missingValueFinished > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    R$ {dashboardStats.missingValueFinished.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Valor Total Em Aberto</span>
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">
                  R$ {dashboardStats.missingValueOpen.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Valor de falta física em processo</p>
              </motion.div>
              <motion.div
                className="bg-card p-4 rounded-xl border border-border"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-sm font-medium">Valor Total Finalizado</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-bold text-3xl text-foreground">
                  R$ {dashboardStats.missingValueFinished.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Valor de falta física finalizada</p>
              </motion.div>
            </div>

            {/* Status de Falta Física */}
            {(Object.values(dashboardStats.missingByStatus).some(v => (typeof v === 'object' ? v.count : v) > 0)) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Status de Falta Física
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(dashboardStats.missingByStatus).map(([status, data]) => {
                    const count = typeof data === 'object' ? data.count : data;
                    const value = typeof data === 'object' ? data.value : 0;
                    return count > 0 && (
                      <div key={status} className="bg-secondary p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          {getStatusBadge(status, 'missing')}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Quantidade:</p>
                          <p className="font-bold text-xl text-foreground">{count}</p>
                          {value > 0 && (
                            <>
                              <p className="text-sm text-muted-foreground mt-2">Valor:</p>
                              <p className="font-semibold text-foreground">
                                R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Análises de Falta Física - Em Aberto/Movimentado */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Análises de Falta Física - Em Aberto/Movimentado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.topMissingBrandOpen && (
                  <div className="bg-secondary p-3 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Marca Mais Faltante</p>
                    <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingBrandOpen.brand}</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingBrandOpen.quantity} unidade(s)</p>
                  </div>
                )}
                {dashboardStats.topMissingSkuOpen && (
                  <div className="bg-secondary p-3 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">SKU Mais Faltante</p>
                    <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingSkuOpen.sku}</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingSkuOpen.quantity} unidade(s)</p>
                  </div>
                )}
                {dashboardStats.topMissingSizeOpen && (
                  <div className="bg-secondary p-3 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Tamanho Mais Faltante</p>
                    <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingSizeOpen.size}</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingSizeOpen.quantity} unidade(s)</p>
                  </div>
                )}
                {dashboardStats.topMissingColorOpen && (
                  <div className="bg-secondary p-3 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Cor Mais Faltante</p>
                    <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingColorOpen.color}</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingColorOpen.quantity} unidade(s)</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Análises de Falta Física - Finalizado */}
            {(dashboardStats.topMissingBrandFinished || dashboardStats.topMissingSkuFinished || dashboardStats.topMissingSizeFinished || dashboardStats.topMissingColorFinished) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Análises de Falta Física - Nota Finalizada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardStats.topMissingBrandFinished && (
                    <div className="bg-secondary p-3 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Marca Mais Faltante</p>
                      <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingBrandFinished.brand}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingBrandFinished.quantity} unidade(s)</p>
                    </div>
                  )}
                  {dashboardStats.topMissingSkuFinished && (
                    <div className="bg-secondary p-3 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">SKU Mais Faltante</p>
                      <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingSkuFinished.sku}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingSkuFinished.quantity} unidade(s)</p>
                    </div>
                  )}
                  {dashboardStats.topMissingSizeFinished && (
                    <div className="bg-secondary p-3 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Tamanho Mais Faltante</p>
                      <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingSizeFinished.size}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingSizeFinished.quantity} unidade(s)</p>
                    </div>
                  )}
                  {dashboardStats.topMissingColorFinished && (
                    <div className="bg-secondary p-3 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Cor Mais Faltante</p>
                      <p className="font-bold text-xl text-foreground">{dashboardStats.topMissingColorFinished.color}</p>
                      <p className="text-xs text-muted-foreground mt-1">{dashboardStats.topMissingColorFinished.quantity} unidade(s)</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className={`grid w-full ${finishedMissing.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="collected">Coletados</TabsTrigger>
            <TabsTrigger value="missing">Falta Física</TabsTrigger>
            {finishedMissing.length > 0 && (
              <TabsTrigger value="finished">Finalizados ({finishedMissing.length})</TabsTrigger>
            )}
          </TabsList>

          {/* ABA PENDENTES */}
          <TabsContent value="pending" className="space-y-4 mt-4">
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
                    <Input
                      id="brand"
                      value={pendingFormData.brand}
                      onChange={(e) => setPendingFormData({ ...pendingFormData, brand: e.target.value })}
                      required
                      className="bg-secondary"
                      placeholder="Ex: ARTWALK"
                    />
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
                  <div className="md:col-span-2 lg:col-span-5">
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
                      
                      {/* Botão COLETADO apenas para lojas */}
                      {isStore && returnItem.store_id === user?.storeId && (
                        <Button
                          onClick={() => handleMarkAsCollected(returnItem.id)}
                          className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white"
                        >
                          <CheckSquare className="w-4 h-4" />
                          COLETADO
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ABA COLETADOS */}
          <TabsContent value="collected" className="space-y-4 mt-4">
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
              </Card>
            )}

            {collectedReturns.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma devolução coletada</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Nenhuma devolução coletada encontrada.'}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectedReturns.map((returnItem, index) => {
                  const store = stores.find(s => s.id === returnItem.store_id);
                  return (
                    <motion.div
                      key={returnItem.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl shadow-lg border border-green-500/20 p-5"
                    >
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
                        <div className="flex items-center gap-2">
                          {(isAdmin || isDevolucoes) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    const nfInfo = (returnItem.nf_number && returnItem.nf_number !== 'SEM_NF') ? `NF: ${returnItem.nf_number}` : 'Não possui NF';
                                    if (window.confirm(`Tem certeza que deseja excluir esta devolução coletada (${returnItem.brand} - ${nfInfo})? Esta ação não pode ser desfeita.`)) {
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
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
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
                          <span className="text-muted-foreground">Coletado em:</span>
                          <span className="font-medium text-green-500">
                            {returnItem.collected_at ? format(new Date(returnItem.collected_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          {getStatusBadge(returnItem.admin_status || 'aguardando_coleta', 'return')}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ABA FALTA FISICA */}
          <TabsContent value="missing" className="space-y-4 mt-4">
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
                  {/* Campo de Tipo (Multiseleção) */}
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

                  {/* Campos comuns para todos os tipos */}
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
                  
                  {/* Campos condicionais baseados no tipo */}
                  {missingFormData.missing_type?.includes('FALTA FISICA') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="missing_brand">Marca do Item que Faltou *</Label>
                        <Input
                          id="missing_brand"
                          value={missingFormData.brand}
                          onChange={(e) => setMissingFormData({ ...missingFormData, brand: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: NIKE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missing_sku">SKU do Item que Faltou *</Label>
                        <Input
                          id="missing_sku"
                          value={missingFormData.sku}
                          onChange={(e) => setMissingFormData({ ...missingFormData, sku: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missing_color">Cor do Item que Faltou *</Label>
                        <Input
                          id="missing_color"
                          value={missingFormData.color}
                          onChange={(e) => setMissingFormData({ ...missingFormData, color: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: PRETO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missing_size">Tamanho do Item que Faltou *</Label>
                        <Input
                          id="missing_size"
                          value={missingFormData.size}
                          onChange={(e) => setMissingFormData({ ...missingFormData, size: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missing_quantity">Quantidade que Faltou *</Label>
                        <Input
                          id="missing_quantity"
                          type="number"
                          min="1"
                          value={missingFormData.quantity}
                          onChange={(e) => setMissingFormData({ ...missingFormData, quantity: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="missing_cost_value">Valor de Custo do Item que Faltou *</Label>
                        <Input
                          id="missing_cost_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={missingFormData.cost_value}
                          onChange={(e) => setMissingFormData({ ...missingFormData, cost_value: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </>
                  )}

                  {missingFormData.missing_type?.includes('SOBRA') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_brand">Marca do Item que Sobrou *</Label>
                        <Input
                          id="surplus_brand"
                          value={missingFormData.brand}
                          onChange={(e) => setMissingFormData({ ...missingFormData, brand: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: NIKE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_sku">SKU do Item que Sobrou *</Label>
                        <Input
                          id="surplus_sku"
                          value={missingFormData.sku}
                          onChange={(e) => setMissingFormData({ ...missingFormData, sku: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_color">Cor do Item que Sobrou *</Label>
                        <Input
                          id="surplus_color"
                          value={missingFormData.color}
                          onChange={(e) => setMissingFormData({ ...missingFormData, color: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: PRETO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_size">Tamanho do Item que Sobrou *</Label>
                        <Input
                          id="surplus_size"
                          value={missingFormData.size}
                          onChange={(e) => setMissingFormData({ ...missingFormData, size: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_quantity">Quantidade que Sobrou *</Label>
                        <Input
                          id="surplus_quantity"
                          type="number"
                          min="1"
                          value={missingFormData.quantity}
                          onChange={(e) => setMissingFormData({ ...missingFormData, quantity: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="surplus_cost_value">Valor de Custo do Item que Sobrou *</Label>
                        <Input
                          id="surplus_cost_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={missingFormData.cost_value}
                          onChange={(e) => setMissingFormData({ ...missingFormData, cost_value: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </>
                  )}

                  {missingFormData.missing_type?.includes('DIVERGENCIA NF X FISICO') && (
                    <>
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="font-semibold text-foreground mb-4">O que Faltou *</h4>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_brand">Marca do Item que Faltou *</Label>
                        <Input
                          id="div_missing_brand"
                          value={missingFormData.divergence_missing_brand}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_brand: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: NIKE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_sku">SKU do Item que Faltou *</Label>
                        <Input
                          id="div_missing_sku"
                          value={missingFormData.divergence_missing_sku}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_sku: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_color">Cor do Item que Faltou *</Label>
                        <Input
                          id="div_missing_color"
                          value={missingFormData.divergence_missing_color}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_color: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: PRETO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_size">Tamanho do Item que Faltou *</Label>
                        <Input
                          id="div_missing_size"
                          value={missingFormData.divergence_missing_size}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_size: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 42"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_quantity">Quantidade que Faltou *</Label>
                        <Input
                          id="div_missing_quantity"
                          type="number"
                          min="1"
                          value={missingFormData.divergence_missing_quantity}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_quantity: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_missing_cost_value">Valor de Custo do Item que Faltou *</Label>
                        <Input
                          id="div_missing_cost_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={missingFormData.divergence_missing_cost_value}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_missing_cost_value: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 200.00"
                        />
                      </div>

                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="font-semibold text-foreground mb-4">O que Sobrou no Lugar *</h4>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_brand">Marca do Item que Sobrou *</Label>
                        <Input
                          id="div_surplus_brand"
                          value={missingFormData.divergence_surplus_brand}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_brand: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: ADIDAS"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_sku">SKU do Item que Sobrou *</Label>
                        <Input
                          id="div_surplus_sku"
                          value={missingFormData.divergence_surplus_sku}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_sku: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: SKU456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_color">Cor do Item que Sobrou *</Label>
                        <Input
                          id="div_surplus_color"
                          value={missingFormData.divergence_surplus_color}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_color: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: BRANCO"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_size">Tamanho do Item que Sobrou *</Label>
                        <Input
                          id="div_surplus_size"
                          value={missingFormData.divergence_surplus_size}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_size: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_quantity">Quantidade que Sobrou *</Label>
                        <Input
                          id="div_surplus_quantity"
                          type="number"
                          min="1"
                          value={missingFormData.divergence_surplus_quantity}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_quantity: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="div_surplus_cost_value">Valor de Custo do Item que Sobrou *</Label>
                        <Input
                          id="div_surplus_cost_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={missingFormData.divergence_surplus_cost_value}
                          onChange={(e) => setMissingFormData({ ...missingFormData, divergence_surplus_cost_value: e.target.value })}
                          required
                          className="bg-secondary"
                          placeholder="Ex: 250.00"
                        />
                      </div>
                    </>
                  )}

                  {/* Valor total calculado (apenas para FALTA FISICA e SOBRA) */}
                  {(missingFormData.missing_type?.includes('FALTA FISICA') || missingFormData.missing_type?.includes('SOBRA')) && 
                   missingFormData.cost_value && missingFormData.quantity && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Valor Total Calculado</Label>
                      <div className="bg-secondary p-3 rounded-lg border border-border">
                        <span className="font-semibold text-foreground text-lg">
                          R$ {(parseFloat(missingFormData.cost_value || 0) * parseInt(missingFormData.quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Valor total calculado para divergência */}
                  {missingFormData.missing_type?.includes('DIVERGENCIA NF X FISICO') && 
                   missingFormData.divergence_missing_cost_value && missingFormData.divergence_missing_quantity && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Valor Total do Item que Faltou</Label>
                      <div className="bg-secondary p-3 rounded-lg border border-border">
                        <span className="font-semibold text-foreground text-lg">
                          R$ {(parseFloat(missingFormData.divergence_missing_cost_value || 0) * parseInt(missingFormData.divergence_missing_quantity || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
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

            {/* Lista de falta física */}
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
                                <DropdownMenuItem onClick={() => handleUpdateMissingStatus(item.id, 'movimentado')}>
                                  Movimentado
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
                                      deletePhysicalMissing(item.id);
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
                            {getStatusBadge(item.status || 'processo_aberto', 'missing')}
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

          {/* ABA FINALIZADOS (Falta Física) */}
          <TabsContent value="finished" className="space-y-4 mt-4">
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
                      className="bg-card rounded-xl shadow-lg border border-border p-5 opacity-75"
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
                            ) : null}
                            <p className="text-sm text-muted-foreground mt-1">
                              {store?.name || 'Loja não encontrada'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(isAdmin || isDevolucoes) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const itemDescription = `${item.brand || item.product_name || 'Item'} - ${item.nf_number || 'Sem NF'}`;
                                      if (window.confirm(`Tem certeza que deseja excluir esta falta física finalizada (${itemDescription})? Esta ação não pode ser desfeita.`)) {
                                        deletePhysicalMissing(item.id);
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
                            {getStatusBadge('nota_finalizada', 'missing')}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
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
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Registrado em:</span>
                            <span className="font-medium text-foreground">
                              {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Finalizado em:</span>
                            <span className="font-medium text-green-500">
                              {item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ReturnsManagement;
