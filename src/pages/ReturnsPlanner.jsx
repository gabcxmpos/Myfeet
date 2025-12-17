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
import { Plus, Edit, Trash2, Calendar, Store, FileText, User, Search, BarChart3, Clock, TrendingUp, AlertCircle, CheckCircle, DollarSign, Package, CheckSquare, Save, X, Settings, Download } from 'lucide-react';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, Tooltip, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
        store_id: formData.store_id,
        supervisor: formData.supervisor?.trim() || null,
        return_type: formData.return_type,
        opening_date: formData.opening_date,
        brand: formData.brand,
        case_number: formData.case_number?.trim() || null,
        invoice_number: formData.invoice_number?.trim() || null,
        // IMPORTANTE: Campos de data vazios devem ser null, não string vazia
        invoice_issue_date: formData.invoice_issue_date?.trim() || null,
        // Garantir que campos numéricos sejam números ou null
        return_value: formData.return_value ? parseFloat(formData.return_value) : null,
        items_quantity: formData.items_quantity ? parseInt(formData.items_quantity) : null,
        status: formData.status,
        responsible_user_id: formData.responsible_user_id || null,
      };

      console.log('📤 [ReturnsPlanner] Dados a serem enviados:', dataToSend);

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
      console.error('❌ [ReturnsPlanner] Erro ao salvar planner:', error);
      console.error('❌ [ReturnsPlanner] Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      toast({ 
        title: 'Erro', 
        description: error.message || error.details || 'Erro ao salvar registro.', 
        variant: 'destructive' 
      });
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

  // Estatísticas detalhadas por status e tipo
  const stats = useMemo(() => {
    const data = dashboardData;
    const aguardandoAprovacao = data.filter(d => d.status === 'Aguardando aprovação da marca');
    const aguardandoColeta = data.filter(d => d.status === 'Aguardando coleta');
    const coletados = data.filter(d => d.status === 'Coletado');
    
    // Função auxiliar para calcular por tipo
    const calculateByType = (items) => {
      return items.reduce((acc, item) => {
        const type = item.return_type || 'Sem tipo';
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            totalValue: 0,
            totalQuantity: 0,
          };
        }
        acc[type].count++;
        acc[type].totalValue += parseFloat(item.return_value) || 0;
        acc[type].totalQuantity += parseInt(item.items_quantity) || 0;
        return acc;
      }, {});
    };
    
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
        byType: calculateByType(aguardandoAprovacao),
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
        byType: calculateByType(aguardandoColeta),
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
        byType: calculateByType(coletados),
      },
      totalValue: data.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      totalQuantity: data.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
      // Estatísticas gerais por tipo (todos os status)
      byType: calculateByType(data),
      // Estatísticas gerais por status
      byStatus: {
        'Aguardando aprovação da marca': {
          count: aguardandoAprovacao.length,
          totalValue: aguardandoAprovacao.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: aguardandoAprovacao.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        'Aguardando coleta': {
          count: aguardandoColeta.length,
          totalValue: aguardandoColeta.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: aguardandoColeta.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        'Coletado': {
          count: coletados.length,
          totalValue: coletados.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: coletados.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
      },
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
      
      // Gráfico por tipo (com valores e quantidades)
      const byType = {
        COMERCIAL: {
          count: data.filter(d => d.return_type === 'COMERCIAL').length,
          totalValue: data.filter(d => d.return_type === 'COMERCIAL').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.return_type === 'COMERCIAL').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        DEFEITO: {
          count: data.filter(d => d.return_type === 'DEFEITO').length,
          totalValue: data.filter(d => d.return_type === 'DEFEITO').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.return_type === 'DEFEITO').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        FALTA_FISICA: {
          count: data.filter(d => d.return_type === 'FALTA_FISICA').length,
          totalValue: data.filter(d => d.return_type === 'FALTA_FISICA').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.return_type === 'FALTA_FISICA').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
      };
      
      // Gráfico por status (com valores e quantidades)
      const byStatus = {
        'Aguardando aprovação da marca': {
          count: data.filter(d => d.status === 'Aguardando aprovação da marca').length,
          totalValue: data.filter(d => d.status === 'Aguardando aprovação da marca').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.status === 'Aguardando aprovação da marca').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        'Aguardando coleta': {
          count: data.filter(d => d.status === 'Aguardando coleta').length,
          totalValue: data.filter(d => d.status === 'Aguardando coleta').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.status === 'Aguardando coleta').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
        'Coletado': {
          count: data.filter(d => d.status === 'Coletado').length,
          totalValue: data.filter(d => d.status === 'Coletado').reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
          totalQuantity: data.filter(d => d.status === 'Coletado').reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
        },
      };
      
      // Gráfico por tipo e status (matriz)
      const byTypeAndStatus = {};
      ['COMERCIAL', 'DEFEITO', 'FALTA_FISICA'].forEach(type => {
        byTypeAndStatus[type] = {
          'Aguardando aprovação da marca': data.filter(d => d.return_type === type && d.status === 'Aguardando aprovação da marca').length,
          'Aguardando coleta': data.filter(d => d.return_type === type && d.status === 'Aguardando coleta').length,
          'Coletado': data.filter(d => d.return_type === type && d.status === 'Coletado').length,
        };
      });
      
      // Gráfico por loja (top 10) - com separação por tipo e status
      const byStore = {};
      data.forEach(item => {
        if (item.store_id) {
          const store = storesList.find(s => s.id === item.store_id);
          const storeName = store?.name || 'Loja não encontrada';
          if (!byStore[storeName]) {
            byStore[storeName] = {
              total: 0,
              byType: { COMERCIAL: 0, DEFEITO: 0, FALTA_FISICA: 0 },
              byStatus: {
                'Aguardando aprovação da marca': 0,
                'Aguardando coleta': 0,
                'Coletado': 0,
              },
            };
          }
          byStore[storeName].total++;
          const type = item.return_type || 'COMERCIAL';
          if (byStore[storeName].byType[type] !== undefined) {
            byStore[storeName].byType[type]++;
          }
          if (item.status && byStore[storeName].byStatus[item.status] !== undefined) {
            byStore[storeName].byStatus[item.status]++;
          }
        }
      });
      const topStores = Object.entries(byStore)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));
      
      // Gráfico de evolução temporal (últimos 30 dias) - com separação por tipo e status
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
            // Por tipo
            comercial: dayData.filter(d => d.return_type === 'COMERCIAL').length,
            defeito: dayData.filter(d => d.return_type === 'DEFEITO').length,
            faltaFisica: dayData.filter(d => d.return_type === 'FALTA_FISICA').length,
            // Por status
            aguardandoAprovacao: dayData.filter(d => d.status === 'Aguardando aprovação da marca').length,
            aguardandoColeta: dayData.filter(d => d.status === 'Aguardando coleta').length,
          });
        } catch (e) {
          // Ignorar erro em um dia específico
        }
      }
      
      return {
        byType: Object.entries(byType).map(([name, data]) => ({ name, ...data })),
        byStatus: Object.entries(byStatus).map(([name, data]) => ({ name, ...data })),
        byTypeAndStatus,
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

  // Cores para gráficos - Tons mais claros e vibrantes para melhor visibilidade
  const typeColors = {
    COMERCIAL: '#c084fc', // Roxo mais claro
    DEFEITO: '#f87171', // Vermelho mais claro
    FALTA_FISICA: '#fb923c', // Laranja mais claro
  };

  const statusColors = {
    'Aguardando aprovação da marca': '#fbbf24', // Amarelo mais claro e vibrante
    'Aguardando coleta': '#60a5fa', // Azul mais claro
    'Coletado': '#34d399', // Verde mais claro e vibrante
  };

  // Função para exportar dashboard como PDF
  const handleExportPDF = async () => {
    try {
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto o PDF é gerado.',
      });

      // Encontrar o elemento do dashboard
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        toast({
          title: 'Erro',
          description: 'Não foi possível encontrar o conteúdo do dashboard.',
          variant: 'destructive',
        });
        return;
      }

      // Criar canvas do conteúdo
      const canvas = await html2canvas(dashboardElement, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Criar PDF com fundo escuro
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Preencher fundo escuro
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 40) / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      // Adicionar título
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Planner de Devoluções', pdfWidth / 2, 15, { align: 'center' });
      
      // Adicionar informações dos filtros
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      let yPos = 25;
      const filters = [];
      if (dateRange.startDate && dateRange.endDate) {
        filters.push(`Período: ${format(new Date(dateRange.startDate), 'dd/MM/yyyy', { locale: ptBR })} até ${format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: ptBR })}`);
      }
      if (dashboardFilters.stores.length > 0) {
        const storeNames = dashboardFilters.stores.map(id => stores.find(s => s.id === id)?.name).filter(Boolean).join(', ');
        filters.push(`Lojas: ${storeNames}`);
      }
      if (dashboardFilters.supervisors.length > 0) {
        filters.push(`Supervisores: ${dashboardFilters.supervisors.join(', ')}`);
      }
      if (dashboardFilters.status.length > 0) {
        filters.push(`Status: ${dashboardFilters.status.join(', ')}`);
      }
      if (dashboardFilters.brands.length > 0) {
        filters.push(`Marcas: ${dashboardFilters.brands.join(', ')}`);
      }
      
      if (filters.length > 0) {
        pdf.text('Filtros aplicados:', 10, yPos);
        yPos += 5;
        filters.forEach(filter => {
          pdf.text(filter, 10, yPos, { maxWidth: pdfWidth - 20 });
          yPos += 5;
        });
        yPos += 5;
      }
      
      // Adicionar imagem centralizada
      const imgX = (pdfWidth - imgScaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', imgX, yPos, imgScaledWidth, imgScaledHeight);
      
      // Adicionar data de geração
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      // Salvar PDF
      const fileName = `Planner_Devolucoes_${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR })}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: 'PDF gerado com sucesso!',
        description: `O arquivo ${fileName} foi baixado.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    }
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
          <div className="flex gap-2">
            {activeTab === 'dashboard' && (
              <Button
                variant="outline"
                onClick={handleExportPDF}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            )}
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
          <div id="dashboard-content" className="space-y-6">
            {/* Filtros do Dashboard - Compacto e Moderno */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Período</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="h-9 text-sm"
                        />
                        <span className="self-center text-muted-foreground">até</span>
                        <Input
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[180px]">
                    <MultiSelectFilter
                      options={stores.map(s => ({ value: s.id, label: s.name }))}
                      selected={dashboardFilters.stores}
                      onChange={(val) => setDashboardFilters(prev => ({ ...prev, stores: val }))}
                      placeholder="Lojas"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <MultiSelectFilter
                      options={supervisors.map(s => ({ value: s, label: s }))}
                      selected={dashboardFilters.supervisors}
                      onChange={(val) => setDashboardFilters(prev => ({ ...prev, supervisors: val }))}
                      placeholder="Supervisores"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <MultiSelectFilter
                      options={[
                        { value: 'Aguardando aprovação da marca', label: 'Aguardando Aprovação' },
                        { value: 'Aguardando coleta', label: 'Aguardando Coleta' },
                        { value: 'Coletado', label: 'Coletado' },
                      ]}
                      selected={dashboardFilters.status}
                      onChange={(val) => setDashboardFilters(prev => ({ ...prev, status: val }))}
                      placeholder="Status"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <MultiSelectFilter
                      options={availableBrands.map(brand => ({ value: brand, label: brand }))}
                      selected={dashboardFilters.brands}
                      onChange={(val) => setDashboardFilters(prev => ({ ...prev, brands: val }))}
                      placeholder="Marcas"
                    />
                  </div>
                  {(dashboardFilters.stores.length > 0 || dashboardFilters.supervisors.length > 0 || 
                    dashboardFilters.status.length > 0 || dashboardFilters.brands.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDashboardFilters({ stores: [], supervisors: [], status: [], brands: [] })}
                      className="h-9 text-xs"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Principais - Cards Modernos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground">Total</div>
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>{stats.totalQuantity} peças</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground">Aguardando Aprovação</div>
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-bold text-yellow-500 mb-1">{stats.aguardandoAprovacao.count}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>R$ {stats.aguardandoAprovacao.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>{stats.aguardandoAprovacao.totalQuantity} peças</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground">Aguardando Coleta</div>
                      <Package className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-500 mb-1">{stats.aguardandoColeta.count}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>R$ {stats.aguardandoColeta.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>{stats.aguardandoColeta.totalQuantity} peças</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground">Coletado/Finalizado</div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-500 mb-1">{stats.coletado.count}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>R$ {stats.coletado.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>{stats.coletado.totalQuantity} peças</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* Detalhamento por Status - Layout Simplificado */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Aguardando Aprovação */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Aguardando Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-yellow-500">{stats.aguardandoAprovacao.count}</span>
                    <span className="text-sm text-muted-foreground">registros</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Valor</div>
                      <div className="font-semibold">R$ {stats.aguardandoAprovacao.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Peças</div>
                      <div className="font-semibold">{stats.aguardandoAprovacao.totalQuantity}</div>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Tipo</div>
                    {Object.entries(stats.aguardandoAprovacao.byType || {}).map(([type, data]) => {
                      const typeLabel = type === 'COMERCIAL' ? 'Comercial' : 
                                       type === 'DEFEITO' ? 'Defeito' : 
                                       type === 'FALTA_FISICA' ? 'Falta Física' : type;
                      if (!data || data.count === 0) return null;
                      return (
                        <div key={type} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{typeLabel}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">{data.count}</Badge>
                            <span className="text-muted-foreground">R$ {data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Aguardando Coleta */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-blue-500" />
                    Aguardando Coleta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-500">{stats.aguardandoColeta.count}</span>
                    <span className="text-sm text-muted-foreground">registros</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Valor</div>
                      <div className="font-semibold">R$ {stats.aguardandoColeta.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Peças</div>
                      <div className="font-semibold">{stats.aguardandoColeta.totalQuantity}</div>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Tipo</div>
                    {Object.entries(stats.aguardandoColeta.byType || {}).map(([type, data]) => {
                      const typeLabel = type === 'COMERCIAL' ? 'Comercial' : 
                                       type === 'DEFEITO' ? 'Defeito' : 
                                       type === 'FALTA_FISICA' ? 'Falta Física' : type;
                      if (!data || data.count === 0) return null;
                      return (
                        <div key={type} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{typeLabel}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">{data.count}</Badge>
                            <span className="text-muted-foreground">R$ {data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Coletado/Finalizado */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Coletado/Finalizado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-500">{stats.coletado.count}</span>
                    <span className="text-sm text-muted-foreground">registros</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Valor</div>
                      <div className="font-semibold">R$ {stats.coletado.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Peças</div>
                      <div className="font-semibold">{stats.coletado.totalQuantity}</div>
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Tipo</div>
                    {Object.entries(stats.coletado.byType || {}).map(([type, data]) => {
                      const typeLabel = type === 'COMERCIAL' ? 'Comercial' : 
                                       type === 'DEFEITO' ? 'Defeito' : 
                                       type === 'FALTA_FISICA' ? 'Falta Física' : type;
                      if (!data || data.count === 0) return null;
                      return (
                        <div key={type} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{typeLabel}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-2 py-0">{data.count}</Badge>
                            <span className="text-muted-foreground">R$ {data.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Produtividade por Usuário (Apenas Admin) - Simplificado */}
            {user?.role === 'admin' && userProductivity.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Produtividade por Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {userProductivity.map((userStat) => (
                      <div key={userStat.userId} className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-sm">{userStat.username}</div>
                          <Badge variant="secondary" className="text-xs">{userStat.total}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Valor</div>
                            <div className="font-medium">R$ {userStat.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Peças</div>
                            <div className="font-medium">{userStat.totalQuantity}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">Aprov: {userStat.byStatus['Aguardando aprovação da marca']}</Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">Coleta: {userStat.byStatus['Aguardando coleta']}</Badge>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">Colet: {userStat.byStatus['Coletado']}</Badge>
                        </div>
                        {userStat.byType && Object.keys(userStat.byType).some(type => userStat.byType[type]?.count > 0) && (
                          <div className="border-t pt-2 space-y-1">
                            {Object.entries(userStat.byType).map(([type, data]) => {
                              const typeLabel = type === 'COMERCIAL' ? 'Comercial' : 
                                               type === 'DEFEITO' ? 'Defeito' : 
                                               type === 'FALTA_FISICA' ? 'Falta Física' : type;
                              if (!data || data.count === 0) return null;
                              return (
                                <div key={type} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{typeLabel}:</span>
                                  <span className="font-medium">{data.count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métricas de SLA - Compactas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-l-2 border-l-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Tempo Médio Aprovação</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">{slaMetrics.avgTimeAprovacao} dias</div>
                </CardContent>
              </Card>
              <Card className="border-l-2 border-l-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Tempo Médio Coleta</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">{slaMetrics.avgTimeColeta} dias</div>
                </CardContent>
              </Card>
              <Card className="border-l-2 border-l-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Tempo Médio Total</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">{slaMetrics.avgTimeToColeta} dias</div>
                </CardContent>
              </Card>
              <Card className="border-l-2 border-l-orange-500">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                    <div className="text-xs text-muted-foreground">Itens em Risco</div>
                  </div>
                  <div className="text-xl font-bold text-orange-500">{slaMetrics.itemsAtRisk}</div>
                  <div className="text-xs text-muted-foreground">+7 dias</div>
                </CardContent>
              </Card>
            </div>

            {/* Taxa de Conclusão - Simplificada */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Taxa de Conclusão</span>
                  </div>
                  <span className="text-2xl font-bold text-green-500">{slaMetrics.completionRate}%</span>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all rounded-full"
                      style={{ width: `${slaMetrics.completionRate}%` }}
                    />
                  </div>
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
                  <style>{`
                    .recharts-cartesian-axis-tick-value { fill: #ffffff !important; }
                    .recharts-legend-item-text { fill: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-label { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item-value { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item-name { color: #ffffff !important; }
                    .recharts-tooltip-wrapper * { color: #ffffff !important; }
                  `}</style>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData?.byType || []}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: '#ffffff' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value, name) => {
                          if (name === 'count') return [`${value} registros`, 'Quantidade'];
                          if (name === 'totalValue') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor Total'];
                          if (name === 'totalQuantity') return [`${value} peças`, 'Quantidade de Peças'];
                          return [value, name];
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#ffffff' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Quantidade">
                        {(chartData?.byType || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={typeColors[entry.name] || '#8884d8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                    {(chartData?.byType || []).map((entry) => (
                      <div key={entry.name} className="text-center">
                        <div className="font-semibold">{entry.name}</div>
                        <div className="text-muted-foreground">
                          R$ {entry.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'} • {entry.totalQuantity || 0} peças
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico por Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Devoluções por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <style>{`
                    .recharts-legend-item-text { fill: #ffffff !important; }
                    .recharts-pie-label-text { fill: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-label { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item-value { color: #ffffff !important; }
                    .recharts-tooltip-wrapper .recharts-tooltip-item-name { color: #ffffff !important; }
                    .recharts-tooltip-wrapper * { color: #ffffff !important; }
                  `}</style>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData?.byStatus || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelStyle={{ fill: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(chartData?.byStatus || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: '#ffffff' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        formatter={(value) => {
                          const entry = (chartData?.byStatus || []).find(e => e.count === value);
                          if (entry) {
                            return [`${value} registros • R$ ${entry.totalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'} • ${entry.totalQuantity || 0} peças`, entry.name];
                          }
                          return [value];
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#ffffff' }}
                        formatter={(value) => {
                          const entry = (chartData?.byStatus || []).find(e => e.name === value);
                          return entry ? `${value} (${entry.count})` : value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico por Tipo e Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Devoluções por Tipo e Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData?.byTypeAndStatus ? Object.entries(chartData.byTypeAndStatus).map(([type, statuses]) => ({
                      name: type === 'COMERCIAL' ? 'Comercial' : type === 'DEFEITO' ? 'Defeito' : 'Falta Física',
                      aguardandoAprovacao: (statuses && statuses['Aguardando aprovação da marca']) || 0,
                      aguardandoColeta: (statuses && statuses['Aguardando coleta']) || 0,
                      coletado: (statuses && statuses['Coletado']) || 0,
                    })) : []}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#ffffff' }} />
                      <Bar dataKey="aguardandoAprovacao" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Aguardando Aprovação" />
                      <Bar dataKey="aguardandoColeta" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} name="Aguardando Coleta" />
                      <Bar dataKey="coletado" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} name="Coletado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top 10 Lojas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top 10 Lojas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart 
                      data={(chartData?.topStores || []).map(store => ({
                        name: store.name.length > 15 ? store.name.substring(0, 15) + '...' : store.name,
                        total: store.total,
                        comercial: store.byType?.COMERCIAL || 0,
                        defeito: store.byType?.DEFEITO || 0,
                        faltaFisica: store.byType?.FALTA_FISICA || 0,
                      }))} 
                      layout="vertical"
                    >
                      <XAxis 
                        type="number" 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        width={100} 
                        style={{ fontSize: '11px' }}
                      />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#ffffff' }} />
                      <Bar dataKey="comercial" stackId="a" radius={[0, 0, 0, 0]} fill="#c084fc" name="Comercial" />
                      <Bar dataKey="defeito" stackId="a" radius={[0, 0, 0, 0]} fill="#f87171" name="Defeito" />
                      <Bar dataKey="faltaFisica" stackId="a" radius={[0, 4, 4, 0]} fill="#fb923c" name="Falta Física" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Evolução Temporal */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Evolução (Últimos 30 Dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData?.timeline || []}>
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        style={{ fontSize: '11px' }}
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                      />
                      <YAxis 
                        stroke="#ffffff" 
                        tick={{ fill: '#ffffff' }}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#ffffff' }} />
                      <Line type="monotone" dataKey="comercial" stroke="#c084fc" strokeWidth={2} name="Comercial" dot={false} />
                      <Line type="monotone" dataKey="defeito" stroke="#f87171" strokeWidth={2} name="Defeito" dot={false} />
                      <Line type="monotone" dataKey="faltaFisica" stroke="#fb923c" strokeWidth={2} name="Falta Física" dot={false} />
                      <Line type="monotone" dataKey="aguardandoAprovacao" stroke="#fbbf24" strokeWidth={2} name="Aguardando Aprovação" dot={false} />
                      <Line type="monotone" dataKey="aguardandoColeta" stroke="#60a5fa" strokeWidth={2} name="Aguardando Coleta" dot={false} />
                      <Line type="monotone" dataKey="coletados" stroke="#34d399" strokeWidth={2} name="Coletados" dot={false} />
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

