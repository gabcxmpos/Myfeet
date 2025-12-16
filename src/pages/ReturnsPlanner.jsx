import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Calendar, Store, FileText, User, Search, BarChart3, Clock, TrendingUp, AlertCircle, CheckCircle, DollarSign, Package, CheckSquare, Save, X, Settings } from 'lucide-react';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, Tooltip, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { AVAILABLE_BRANDS as DEFAULT_BRANDS } from '@/lib/brands';
import { fetchAppSettings } from '@/lib/supabaseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ReturnsPlanner = () => {
  const { stores, users, returnsPlanner, addReturnsPlanner, updateReturnsPlanner, deleteReturnsPlanner, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);
  
  // Filtros para dashboard
  const [dashboardFilters, setDashboardFilters] = useState({
    stores: [],
    supervisors: [],
    status: [],
    brands: [],
  });
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 dias atrás
    endDate: format(new Date(), 'yyyy-MM-dd'), // Hoje
  });

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

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

  // Form state
  const [formData, setFormData] = useState({
    store_id: '',
    supervisor: '',
    return_type: '',
    opening_date: format(new Date(), 'yyyy-MM-dd'),
    brand: '',
    case_number: '',
    invoice_number: '',
    invoice_issue_date: '',
    return_value: '',
    items_quantity: '',
    status: 'Aguardando aprovação da marca',
    responsible_user_id: '',
  });

  // Buscar usuários com perfil "devoluções" para o campo responsável
  const devolucoesUsers = useMemo(() => {
    return users.filter(u => u.role === 'devoluções');
  }, [users]);

  // Buscar supervisores únicos das lojas
  const supervisors = useMemo(() => {
    return [...new Set(stores.map(s => s.supervisor).filter(Boolean))].sort();
  }, [stores]);

  // Filtrar dados
  const filteredData = useMemo(() => {
    let filtered = returnsPlanner || [];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.case_number?.toLowerCase().includes(term) ||
        item.invoice_number?.toLowerCase().includes(term) ||
        stores.find(s => s.id === item.store_id)?.name?.toLowerCase().includes(term) ||
        item.supervisor?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtro de loja
    if (storeFilter !== 'all') {
      filtered = filtered.filter(item => item.store_id === storeFilter);
    }

    // Filtro por marca (dashboardFilters)
    if (dashboardFilters.brands && dashboardFilters.brands.length > 0) {
      filtered = filtered.filter(item => item.brand && dashboardFilters.brands.includes(item.brand));
    }

    return filtered.sort((a, b) => {
      try {
        if (!a.opening_date || !b.opening_date) return 0;
        const dateA = new Date(a.opening_date);
        const dateB = new Date(b.opening_date);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB - dateA; // Mais recente primeiro
      } catch (e) {
        return 0;
      }
    });
  }, [returnsPlanner, searchTerm, statusFilter, storeFilter, stores, dashboardFilters]);

  // Reset form
  const resetForm = () => {
    setFormData({
      store_id: '',
      supervisor: '',
      return_type: '',
      opening_date: format(new Date(), 'yyyy-MM-dd'),
      brand: '',
      case_number: '',
      invoice_number: '',
      invoice_issue_date: '',
      return_value: '',
      items_quantity: '',
      status: 'Aguardando aprovação da marca',
      responsible_user_id: '',
    });
    setEditingItem(null);
  };

  // Iniciar criação (inline)
  const handleCreate = () => {
    resetForm();
    setEditingItem('new');
  };

  // Iniciar edição (inline)
  const handleEdit = (item) => {
    setFormData({
      store_id: item.store_id || '',
      supervisor: item.supervisor || '',
      return_type: item.return_type || '',
      opening_date: item.opening_date ? format(new Date(item.opening_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      brand: item.brand || '',
      case_number: item.case_number || '',
      invoice_number: item.invoice_number || '',
      invoice_issue_date: item.invoice_issue_date ? format(new Date(item.invoice_issue_date), 'yyyy-MM-dd') : '',
      return_value: item.return_value || '',
      items_quantity: item.items_quantity || '',
      status: item.status || 'Aguardando aprovação da marca',
      responsible_user_id: item.responsible_user_id || '',
    });
    setEditingItem(item);
  };
  
  // Troca rápida de status
  const handleQuickStatusChange = async (itemId, newStatus) => {
    try {
      await updateReturnsPlanner(itemId, { status: newStatus });
      toast({ title: 'Sucesso!', description: 'Status atualizado com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar status.', variant: 'destructive' });
    }
  };

  // Salvar (criar ou atualizar) - inline
  const handleSave = async () => {
    // Validações
    if (!formData.store_id) {
      toast({ title: 'Erro', description: 'Selecione uma loja.', variant: 'destructive' });
      return;
    }
    if (!formData.return_type) {
      toast({ title: 'Erro', description: 'Selecione o tipo de devolução.', variant: 'destructive' });
      return;
    }
    if (!formData.opening_date) {
      toast({ title: 'Erro', description: 'Informe a data de abertura.', variant: 'destructive' });
      return;
    }
    if (!formData.status) {
      toast({ title: 'Erro', description: 'Selecione o status.', variant: 'destructive' });
      return;
    }
    // Validar marca obrigatória
    if (!formData.brand || formData.brand === 'none' || formData.brand.trim() === '') {
      toast({ title: 'Erro', description: 'Selecione uma marca. O campo marca é obrigatório.', variant: 'destructive' });
      return;
    }
    // Nota: Data de emissão NF e número da nota NÃO são obrigatórios, pois o caso pode ser aberto antes da aprovação da marca

    // Verificar duplicidade apenas ao criar novo registro
    if (!editingItem || editingItem === 'new' || !editingItem.id) {
      const duplicateCheck = returnsPlanner.find(item => {
        // Comparar loja (obrigatório)
        if (item.store_id !== formData.store_id) return false;
        
        // Comparar marca (obrigatório)
        const itemBrand = (item.brand || '').toString().trim();
        const formBrand = (formData.brand || '').toString().trim();
        if (itemBrand !== formBrand) return false;
        
        // Comparar caso (se ambos tiverem valor, devem ser iguais)
        const itemCase = (item.case_number || '').toString().trim();
        const formCase = (formData.case_number || '').toString().trim();
        const hasItemCase = itemCase && itemCase !== '';
        const hasFormCase = formCase && formCase !== '';
        
        // Se ambos têm caso, devem ser iguais
        if (hasItemCase && hasFormCase && itemCase !== formCase) return false;
        // Se apenas um tem caso, são diferentes (não é duplicado)
        if (hasItemCase !== hasFormCase) return false;
        
        // Comparar NF (se ambos tiverem valor, devem ser iguais)
        const itemInvoice = (item.invoice_number || '').toString().trim();
        const formInvoice = (formData.invoice_number || '').toString().trim();
        const hasItemInvoice = itemInvoice && itemInvoice !== '';
        const hasFormInvoice = formInvoice && formInvoice !== '';
        
        // Se ambos têm NF, devem ser iguais
        if (hasItemInvoice && hasFormInvoice && itemInvoice !== formInvoice) return false;
        // Se apenas um tem NF, são diferentes (não é duplicado)
        if (hasItemInvoice !== hasFormInvoice) return false;
        
        // Se chegou aqui, é duplicado (mesma loja + marca + mesmo estado de caso + mesmo estado de NF)
        return true;
      });

      if (duplicateCheck) {
        toast({ 
          title: 'Erro', 
          description: 'Já existe um registro com esta combinação de Loja + Caso + Marca + Nota Fiscal. Verifique os dados e tente novamente.', 
          variant: 'destructive' 
        });
        return;
      }
    }

    try {
      // Preparar dados para envio (garantir que campos vazios sejam null ou string vazia conforme necessário)
      const dataToSend = {
        ...formData,
        // Garantir que campos numéricos sejam números ou null
        return_value: formData.return_value ? parseFloat(formData.return_value) : null,
        items_quantity: formData.items_quantity ? parseInt(formData.items_quantity) : null,
        // Garantir que campos de texto vazios sejam null ou string vazia
        case_number: formData.case_number?.trim() || null,
        invoice_number: formData.invoice_number?.trim() || null,
        supervisor: formData.supervisor?.trim() || null,
        responsible_user_id: formData.responsible_user_id || null,
        // IMPORTANTE: Campos de data vazios devem ser null, não string vazia
        invoice_issue_date: formData.invoice_issue_date?.trim() || null,
      };

      if (editingItem && editingItem !== 'new' && editingItem.id) {
        await updateReturnsPlanner(editingItem.id, dataToSend);
        toast({ title: 'Sucesso!', description: 'Registro atualizado com sucesso.' });
      } else {
        await addReturnsPlanner(dataToSend);
        toast({ title: 'Sucesso!', description: 'Registro criado com sucesso.' });
      }
      resetForm();
      setEditingItem(null);
      // Atualizar a lista após salvar
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar planner:', error);
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar registro.', variant: 'destructive' });
    }
  };
  
  // Cancelar edição/criação
  const handleCancel = () => {
    resetForm();
    setEditingItem(null);
  };

  // Excluir
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await deleteReturnsPlanner(itemToDelete.id);
        toast({ title: 'Sucesso!', description: 'Registro excluído com sucesso.' });
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        // Atualizar a lista após exclusão
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir planner:', error);
        toast({ title: 'Erro', description: error.message || 'Erro ao excluir registro.', variant: 'destructive' });
      }
    }
  };

  // Marcar como coletado
  const handleMarkAsCollected = async (plannerId) => {
    if (window.confirm('Confirmar que esta devolução foi coletada?')) {
      try {
        await updateReturnsPlanner(plannerId, {
          status: 'Coletado'
        });
        toast({ title: 'Sucesso!', description: 'Status atualizado para Coletado.' });
      } catch (error) {
        toast({ title: 'Erro', description: error.message || 'Erro ao atualizar status.', variant: 'destructive' });
      }
    }
  };

  // Obter nome da loja
  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || 'Loja não encontrada';
  };

  // Obter nome do responsável
  const getResponsibleName = (userId) => {
    if (!userId) return 'Não atribuído';
    const responsible = devolucoesUsers.find(u => u.id === userId);
    return responsible?.username || responsible?.email || 'Usuário não encontrado';
  };

  // Obter cor do badge de status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Aguardando aprovação da marca':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Aguardando coleta':
        return 'bg-blue-500/20 text-blue-400';
      case 'Coletado':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Obter cor do badge de tipo
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'COMERCIAL':
        return 'bg-purple-500/20 text-purple-400';
      case 'DEFEITO':
        return 'bg-red-500/20 text-red-400';
      case 'FALTA_FISICA':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Tabs
  const [activeTab, setActiveTab] = useState('dashboard');

  // Filtrar dados para dashboard com filtros de período e dashboard filters
  const dashboardData = useMemo(() => {
    let data = returnsPlanner || [];
    
    // Filtro por período
    if (dateRange.startDate || dateRange.endDate) {
      data = data.filter(item => {
        if (!item.opening_date) return false;
        try {
          const itemDate = format(parseISO(item.opening_date), 'yyyy-MM-dd');
          const start = dateRange.startDate || '1900-01-01';
          const end = dateRange.endDate || '9999-12-31';
          return itemDate >= start && itemDate <= end;
        } catch (e) {
          return false;
        }
      });
    }
    
    // Filtro por loja
    if (dashboardFilters.stores.length > 0) {
      data = data.filter(item => dashboardFilters.stores.includes(item.store_id));
    }
    
    // Filtro por supervisor
    if (dashboardFilters.supervisors.length > 0) {
      data = data.filter(item => dashboardFilters.supervisors.includes(item.supervisor));
    }
    
    // Filtro por status
    if (dashboardFilters.status.length > 0) {
      data = data.filter(item => dashboardFilters.status.includes(item.status));
    }
    
    // Filtro por marca
    if (dashboardFilters.brands && dashboardFilters.brands.length > 0) {
      data = data.filter(item => item.brand && dashboardFilters.brands.includes(item.brand));
    }
    
    return data;
  }, [returnsPlanner, dateRange, dashboardFilters]);

  // Estatísticas detalhadas por status
  const stats = useMemo(() => {
    const data = dashboardData;
    const aguardandoAprovacao = data.filter(d => d.status === 'Aguardando aprovação da marca');
    const aguardandoColeta = data.filter(d => d.status === 'Aguardando coleta');
    const coletados = data.filter(d => d.status === 'Coletado');
    
    return {
      total: data.length,
      aguardandoAprovacao: {
        count: aguardandoAprovacao.length,
        totalValue: aguardandoAprovacao.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
        totalQuantity: aguardandoAprovacao.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        byBrand: aguardandoAprovacao.reduce((acc, item) => {
          const brand = item.brand || 'Sem marca';
          acc[brand] = (acc[brand] || 0) + 1;
          return acc;
        }, {}),
      },
      aguardandoColeta: {
        count: aguardandoColeta.length,
        totalValue: aguardandoColeta.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
        totalQuantity: aguardandoColeta.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        byBrand: aguardandoColeta.reduce((acc, item) => {
          const brand = item.brand || 'Sem marca';
          acc[brand] = (acc[brand] || 0) + 1;
          return acc;
        }, {}),
      },
      coletado: {
        count: coletados.length,
        totalValue: coletados.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
        totalQuantity: coletados.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        byBrand: coletados.reduce((acc, item) => {
          const brand = item.brand || 'Sem marca';
          acc[brand] = (acc[brand] || 0) + 1;
          return acc;
        }, {}),
      },
      totalValue: data.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      totalQuantity: data.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
    };
  }, [dashboardData]);
  
  // Produtividade por usuário (apenas para admin)
  const userProductivity = useMemo(() => {
    if (user?.role !== 'admin') return [];
    
    const data = dashboardData;
    const userStats = {};
    
    data.forEach(item => {
      if (item.responsible_user_id) {
        const userId = item.responsible_user_id;
        if (!userStats[userId]) {
          const responsible = devolucoesUsers.find(u => u.id === userId);
          userStats[userId] = {
            userId,
            username: responsible?.username || responsible?.email || 'Usuário desconhecido',
            total: 0,
            totalValue: 0,
            totalQuantity: 0,
            byStatus: {
              'Aguardando aprovação da marca': 0,
              'Aguardando coleta': 0,
              'Coletado': 0,
            },
          };
        }
        userStats[userId].total++;
        userStats[userId].totalValue += parseFloat(item.return_value) || 0;
        userStats[userId].totalQuantity += parseInt(item.items_quantity) || 0;
        if (item.status && userStats[userId].byStatus[item.status] !== undefined) {
          userStats[userId].byStatus[item.status]++;
        }
      }
    });
    
    return Object.values(userStats).sort((a, b) => b.total - a.total);
  }, [dashboardData, user, devolucoesUsers]);

  // Métricas de SLA
  const slaMetrics = useMemo(() => {
    const data = dashboardData;
    const now = new Date();
    
    // Tempo médio em cada status
    const aguardandoAprovacao = data.filter(d => d.status === 'Aguardando aprovação da marca');
    const aguardandoColeta = data.filter(d => d.status === 'Aguardando coleta');
    const coletados = data.filter(d => d.status === 'Coletado');
    
    // Calcular tempo médio em "Aguardando aprovação"
    const avgTimeAprovacao = aguardandoAprovacao.length > 0
      ? aguardandoAprovacao.reduce((acc, item) => {
          if (!item.opening_date) return acc;
          try {
            const openingDate = parseISO(item.opening_date);
            return acc + differenceInDays(now, openingDate);
          } catch (e) {
            return acc;
          }
        }, 0) / aguardandoAprovacao.length
      : 0;
    
    // Calcular tempo médio em "Aguardando coleta"
    const avgTimeColeta = aguardandoColeta.length > 0
      ? aguardandoColeta.reduce((acc, item) => {
          if (!item.opening_date) return acc;
          try {
            const openingDate = parseISO(item.opening_date);
            return acc + differenceInDays(now, openingDate);
          } catch (e) {
            return acc;
          }
        }, 0) / aguardandoColeta.length
      : 0;
    
    // Calcular tempo médio total até coleta (apenas para coletados)
    const avgTimeToColeta = coletados.length > 0
      ? coletados.reduce((acc, item) => {
          if (!item.opening_date) return acc;
          try {
            const openingDate = parseISO(item.opening_date);
            const updatedDate = item.updated_at ? parseISO(item.updated_at) : now;
            return acc + differenceInDays(updatedDate, openingDate);
          } catch (e) {
            return acc;
          }
        }, 0) / coletados.length
      : 0;
    
    // Itens com SLA em risco (mais de 7 dias em qualquer status)
    const itemsAtRisk = data.filter(item => {
      if (!item.opening_date) return false;
      try {
        const openingDate = parseISO(item.opening_date);
        return differenceInDays(now, openingDate) > 7 && item.status !== 'Coletado';
      } catch (e) {
        return false;
      }
    }).length;
    
    // Taxa de conclusão (coletados / total)
    const completionRate = data.length > 0 ? (coletados.length / data.length) * 100 : 0;
    
    return {
      avgTimeAprovacao: Math.round(avgTimeAprovacao * 10) / 10,
      avgTimeColeta: Math.round(avgTimeColeta * 10) / 10,
      avgTimeToColeta: Math.round(avgTimeToColeta * 10) / 10,
      itemsAtRisk,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }, [returnsPlanner]);

  // Dados para gráficos
  const chartData = useMemo(() => {
    try {
      const data = dashboardData;
      const storesList = stores || [];
      
      // Gráfico por tipo
      const byType = {
        COMERCIAL: data.filter(d => d.return_type === 'COMERCIAL').length,
        DEFEITO: data.filter(d => d.return_type === 'DEFEITO').length,
        FALTA_FISICA: data.filter(d => d.return_type === 'FALTA_FISICA').length,
      };
      
      // Gráfico por status
      const byStatus = {
        'Aguardando aprovação da marca': data.filter(d => d.status === 'Aguardando aprovação da marca').length,
        'Aguardando coleta': data.filter(d => d.status === 'Aguardando coleta').length,
        'Coletado': data.filter(d => d.status === 'Coletado').length,
      };
      
      // Gráfico por loja (top 10)
      const byStore = {};
      data.forEach(item => {
        if (item.store_id) {
          const store = storesList.find(s => s.id === item.store_id);
          const storeName = store?.name || 'Loja não encontrada';
          byStore[storeName] = (byStore[storeName] || 0) + 1;
        }
      });
      const topStores = Object.entries(byStore)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      
      // Gráfico de evolução temporal (últimos 30 dias)
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        try {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayData = data.filter(item => {
            if (!item.opening_date) return false;
            try {
              const itemDate = format(parseISO(item.opening_date), 'yyyy-MM-dd');
              return itemDate === dateStr;
            } catch (e) {
              return false;
            }
          });
          last30Days.push({
            date: format(date, 'dd/MM'),
            abertos: dayData.length,
            coletados: dayData.filter(d => d.status === 'Coletado').length,
          });
        } catch (e) {
          // Ignorar erro em um dia específico
        }
      }
      
      return {
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        topStores,
        timeline: last30Days,
      };
    } catch (error) {
      console.error('Erro ao calcular chartData:', error);
      return {
        byType: [],
        byStatus: [],
        topStores: [],
        timeline: [],
      };
    }
  }, [dashboardData, stores]);

  // Cores para gráficos
  const typeColors = {
    COMERCIAL: '#a855f7',
    DEFEITO: '#ef4444',
    FALTA_FISICA: '#f97316',
  };

  const statusColors = {
    'Aguardando aprovação da marca': '#eab308',
    'Aguardando coleta': '#3b82f6',
    'Coletado': '#22c55e',
  };

  return (
    <>
      <Helmet>
        <title>Planner de Devoluções - MYFEET</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Planner de Devoluções</h1>
            <p className="text-muted-foreground mt-1">Registro e acompanhamento de devoluções</p>
          </div>
          {user?.role === 'devoluções' || user?.role === 'admin' ? (
            <Button
              variant="outline"
              onClick={() => navigate('/brands-settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurar Marcas
            </Button>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'lista'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Lista de Registros
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            {/* Filtros do Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Período - Data Inicial</Label>
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período - Data Final</Label>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <MultiSelectFilter
                    options={stores.map(s => ({ value: s.id, label: s.name }))}
                    selected={dashboardFilters.stores}
                    onChange={(val) => setDashboardFilters(prev => ({ ...prev, stores: val }))}
                    placeholder="Filtrar por Loja..."
                  />
                  <MultiSelectFilter
                    options={supervisors.map(s => ({ value: s, label: s }))}
                    selected={dashboardFilters.supervisors}
                    onChange={(val) => setDashboardFilters(prev => ({ ...prev, supervisors: val }))}
                    placeholder="Filtrar por Supervisor..."
                  />
                  <MultiSelectFilter
                    options={[
                      { value: 'Aguardando aprovação da marca', label: 'Aguardando Aprovação' },
                      { value: 'Aguardando coleta', label: 'Aguardando Coleta' },
                      { value: 'Coletado', label: 'Coletado' },
                    ]}
                    selected={dashboardFilters.status}
                    onChange={(val) => setDashboardFilters(prev => ({ ...prev, status: val }))}
                    placeholder="Filtrar por Status..."
                  />
                  <MultiSelectFilter
                    options={availableBrands.map(brand => ({ value: brand, label: brand }))}
                    selected={dashboardFilters.brands}
                    onChange={(val) => setDashboardFilters(prev => ({ ...prev, brands: val }))}
                    placeholder="Filtrar por Marca..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total de Registros</div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">
                    R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {stats.totalQuantity} peças
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Aguardando Aprovação</div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.aguardandoAprovacao.count}</div>
                  <div className="text-xs text-muted-foreground">
                    R$ {stats.aguardandoAprovacao.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {stats.aguardandoAprovacao.totalQuantity} peças
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Aguardando Coleta</div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.aguardandoColeta.count}</div>
                  <div className="text-xs text-muted-foreground">
                    R$ {stats.aguardandoColeta.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {stats.aguardandoColeta.totalQuantity} peças
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Coletado</div>
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.coletado.count}</div>
                  <div className="text-xs text-muted-foreground">
                    R$ {stats.coletado.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • {stats.coletado.totalQuantity} peças
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Detalhamento por Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Aguardando Aprovação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-400">
                    <Clock className="w-5 h-5" />
                    Aguardando Aprovação da Marca
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.aguardandoAprovacao.count} registros</div>
                    <div className="text-lg text-muted-foreground">
                      R$ {stats.aguardandoAprovacao.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {stats.aguardandoAprovacao.totalQuantity} peças
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-2">Por Marca:</div>
                    {Object.entries(stats.aguardandoAprovacao.byBrand).map(([brand, count]) => (
                      <div key={brand} className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{brand}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Aguardando Coleta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <Package className="w-5 h-5" />
                    Aguardando Coleta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.aguardandoColeta.count} registros</div>
                    <div className="text-lg text-muted-foreground">
                      R$ {stats.aguardandoColeta.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {stats.aguardandoColeta.totalQuantity} peças
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-2">Por Marca:</div>
                    {Object.entries(stats.aguardandoColeta.byBrand).map(([brand, count]) => (
                      <div key={brand} className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{brand}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Coletado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Coletado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.coletado.count} registros</div>
                    <div className="text-lg text-muted-foreground">
                      R$ {stats.coletado.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {stats.coletado.totalQuantity} peças
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="text-sm font-semibold mb-2">Por Marca:</div>
                    {Object.entries(stats.coletado.byBrand).map(([brand, count]) => (
                      <div key={brand} className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{brand}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Produtividade por Usuário (Apenas Admin) */}
            {user?.role === 'admin' && userProductivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Produtividade por Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userProductivity.map((userStat) => (
                      <div key={userStat.userId} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{userStat.username}</div>
                          <Badge variant="outline">{userStat.total} registros</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Valor Total</div>
                            <div className="font-medium">R$ {userStat.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Quantidade</div>
                            <div className="font-medium">{userStat.totalQuantity} peças</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Status</div>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">Aprov: {userStat.byStatus['Aguardando aprovação da marca']}</Badge>
                              <Badge variant="outline" className="text-xs">Coleta: {userStat.byStatus['Aguardando coleta']}</Badge>
                              <Badge variant="outline" className="text-xs">Colet: {userStat.byStatus['Coletado']}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métricas de SLA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Tempo Médio Aprovação</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{slaMetrics.avgTimeAprovacao} dias</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Tempo Médio Coleta</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{slaMetrics.avgTimeColeta} dias</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Tempo Médio Total</div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{slaMetrics.avgTimeToColeta} dias</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Itens em Risco</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{slaMetrics.itemsAtRisk}</div>
                  <div className="text-xs text-muted-foreground mt-1">Mais de 7 dias</div>
                </CardContent>
              </Card>
            </div>

            {/* Taxa de Conclusão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Taxa de Conclusão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${slaMetrics.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{slaMetrics.completionRate}%</div>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle>Devoluções por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData?.byType || []}>
                      <XAxis dataKey="name" stroke="hsla(var(--muted-foreground))" />
                      <YAxis stroke="hsla(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {(chartData?.byType || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={typeColors[entry.name] || '#8884d8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico por Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Devoluções por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData?.byStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(chartData?.byStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top 10 Lojas */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Lojas com Mais Devoluções</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData?.topStores || []} layout="vertical">
                      <XAxis type="number" stroke="hsla(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsla(var(--muted-foreground))" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Evolução Temporal */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução (Últimos 30 Dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData?.timeline || []}>
                      <XAxis dataKey="date" stroke="hsla(var(--muted-foreground))" />
                      <YAxis stroke="hsla(var(--muted-foreground))" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="abertos" stroke="#3b82f6" name="Abertos" />
                      <Line type="monotone" dataKey="coletados" stroke="#22c55e" name="Coletados" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por caso, nota, loja ou supervisor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="Aguardando aprovação da marca">Aguardando Aprovação</SelectItem>
                      <SelectItem value="Aguardando coleta">Aguardando Coleta</SelectItem>
                      <SelectItem value="Coletado">Coletado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={storeFilter} onValueChange={setStoreFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Loja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Lojas</SelectItem>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Formulário Inline para Novo Registro */}
            {editingItem === 'new' && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Novo Registro</h3>
                    <Button variant="ghost" size="icon" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Loja *</Label>
                      <Select value={formData.store_id} onValueChange={(value) => {
                        setFormData({ ...formData, store_id: value });
                        const selectedStore = stores.find(s => s.id === value);
                        if (selectedStore?.supervisor) {
                          setFormData(prev => ({ ...prev, supervisor: selectedStore.supervisor }));
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a loja" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map(store => (
                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Supervisor</Label>
                      <Select value={formData.supervisor || ''} onValueChange={(value) => setFormData({ ...formData, supervisor: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisors.map(supervisor => (
                            <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Devolução *</Label>
                      <Select value={formData.return_type || ''} onValueChange={(value) => setFormData({ ...formData, return_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMERCIAL">Comercial</SelectItem>
                          <SelectItem value="DEFEITO">Defeito</SelectItem>
                          <SelectItem value="FALTA_FISICA">Falta Física</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marca *</Label>
                      <Select 
                        value={formData.brand || ''} 
                        onValueChange={(value) => setFormData({ ...formData, brand: value })}
                      >
                        <SelectTrigger>
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
                      <Label>Data de Abertura *</Label>
                      <Input
                        type="date"
                        value={formData.opening_date || ''}
                        onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nº do Caso</Label>
                      <Input
                        value={formData.case_number || ''}
                        onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                        placeholder="Ex: CASO-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nº da Nota</Label>
                      <Input
                        value={formData.invoice_number || ''}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                        placeholder="Ex: 123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Emissão NF</Label>
                      <Input
                        type="date"
                        value={formData.invoice_issue_date || ''}
                        onChange={(e) => setFormData({ ...formData, invoice_issue_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.return_value || ''}
                        onChange={(e) => setFormData({ ...formData, return_value: e.target.value })}
                        placeholder="Ex: 1500.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade de Itens</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.items_quantity || ''}
                        onChange={(e) => setFormData({ ...formData, items_quantity: e.target.value })}
                        placeholder="Ex: 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <Select value={formData.status || 'Aguardando aprovação da marca'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aguardando aprovação da marca">Aguardando aprovação da marca</SelectItem>
                          <SelectItem value="Aguardando coleta">Aguardando coleta</SelectItem>
                          <SelectItem value="Coletado">Coletado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Select 
                        value={formData.responsible_user_id || 'none'} 
                        onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não atribuído</SelectItem>
                          {devolucoesUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.username || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botão para Novo Registro (quando não está editando) */}
            {!editingItem && (
              <Button onClick={handleCreate} className="gap-2 w-full md:w-auto">
                <Plus className="w-4 h-4" />
                Novo Registro
              </Button>
            )}

            {/* Lista de Registros */}
            {filteredData.length === 0 && editingItem !== 'new' && !editingItem ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">Nenhum registro encontrado</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchTerm || statusFilter !== 'all' || storeFilter !== 'all' 
                      ? 'Tente ajustar os filtros' 
                      : 'Clique em "Novo Registro" para começar'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredData.map((item) => {
                  if (editingItem && editingItem !== 'new' && editingItem.id === item.id) {
                    return (
                      // Formulário de Edição Inline
                      <Card key={item.id} className="border-primary/50 bg-primary/5">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Editar Registro</h3>
                            <Button variant="ghost" size="icon" onClick={handleCancel}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Loja *</Label>
                        <Select value={formData.store_id || ''} onValueChange={(value) => {
                          setFormData({ ...formData, store_id: value });
                          const selectedStore = stores.find(s => s.id === value);
                          if (selectedStore?.supervisor) {
                            setFormData(prev => ({ ...prev, supervisor: selectedStore.supervisor }));
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a loja" />
                          </SelectTrigger>
                          <SelectContent>
                            {stores.map(store => (
                              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Supervisor</Label>
                        <Select value={formData.supervisor || ''} onValueChange={(value) => setFormData({ ...formData, supervisor: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o supervisor" />
                          </SelectTrigger>
                          <SelectContent>
                            {supervisors.map(supervisor => (
                              <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Devolução *</Label>
                        <Select value={formData.return_type || ''} onValueChange={(value) => setFormData({ ...formData, return_type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMERCIAL">Comercial</SelectItem>
                            <SelectItem value="DEFEITO">Defeito</SelectItem>
                            <SelectItem value="FALTA_FISICA">Falta Física</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Marca *</Label>
                        <Select 
                          value={formData.brand || ''} 
                          onValueChange={(value) => setFormData({ ...formData, brand: value })}
                        >
                          <SelectTrigger>
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
                        <Label>Data de Abertura *</Label>
                        <Input
                          type="date"
                          value={formData.opening_date || ''}
                          onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nº do Caso</Label>
                        <Input
                          value={formData.case_number || ''}
                          onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                          placeholder="Ex: CASO-2024-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nº da Nota</Label>
                        <Input
                          value={formData.invoice_number || ''}
                          onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                          placeholder="Ex: 123456"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Emissão NF</Label>
                        <Input
                          type="date"
                          value={formData.invoice_issue_date || ''}
                          onChange={(e) => setFormData({ ...formData, invoice_issue_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.return_value || ''}
                          onChange={(e) => setFormData({ ...formData, return_value: e.target.value })}
                          placeholder="Ex: 1500.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade de Itens</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.items_quantity || ''}
                          onChange={(e) => setFormData({ ...formData, items_quantity: e.target.value })}
                          placeholder="Ex: 5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status *</Label>
                        <Select value={formData.status || 'Aguardando aprovação da marca'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aguardando aprovação da marca">Aguardando aprovação da marca</SelectItem>
                            <SelectItem value="Aguardando coleta">Aguardando coleta</SelectItem>
                            <SelectItem value="Coletado">Coletado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Responsável</Label>
                        <Select 
                          value={formData.responsible_user_id || 'none'} 
                          onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value === 'none' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não atribuído</SelectItem>
                            {devolucoesUsers.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.username || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            // Visualização Normal do Item
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-lg p-4 md:p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getTypeBadgeColor(item.return_type)}>
                        {item.return_type === 'FALTA_FISICA' ? 'Falta Física' : item.return_type}
                      </Badge>
                      <Badge className={getStatusBadgeColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Loja:</span>
                          <span className="font-medium text-foreground">{getStoreName(item.store_id)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Supervisor:</span>
                          <span className="font-medium text-foreground">{item.supervisor || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Data Abertura:</span>
                          <span className="font-medium text-foreground">
                            {item.opening_date ? format(new Date(item.opening_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não informado'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {item.case_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nº Caso:</span>
                            <span className="font-medium text-foreground">{item.case_number}</span>
                          </div>
                        )}
                        {item.invoice_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Nº Nota:</span>
                            <span className="font-medium text-foreground">{item.invoice_number}</span>
                          </div>
                        )}
                        {item.invoice_issue_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Data Emissão NF:</span>
                            <span className="font-medium text-foreground">
                              {format(new Date(item.invoice_issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        )}
                        {item.return_value && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-medium text-foreground">
                              R$ {parseFloat(item.return_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        {item.items_quantity && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Quantidade:</span>
                            <span className="font-medium text-foreground">{item.items_quantity} {item.items_quantity === 1 ? 'item' : 'itens'}</span>
                          </div>
                        )}
                        {item.brand && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{item.brand}</Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Responsável:</span>
                          <span className="font-medium text-foreground">{getResponsibleName(item.responsible_user_id)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                    {/* Troca rápida de status */}
                    <Select 
                      value={item.status} 
                      onValueChange={(newStatus) => handleQuickStatusChange(item.id, newStatus)}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aguardando aprovação da marca">Aguardando Aprovação</SelectItem>
                        <SelectItem value="Aguardando coleta">Aguardando Coleta</SelectItem>
                        <SelectItem value="Coletado">Coletado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDeleteClick(item)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
              </div>
            </motion.div>
            );
          })}
              </div>
            )}
          </div>
        )}


        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ReturnsPlanner;

