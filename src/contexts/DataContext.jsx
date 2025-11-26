
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import * as api from '@/lib/supabaseService';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Tarefas padrão do checklist (usadas apenas se não houver tarefas no banco)
const defaultDailyTasks = [
    { id: 'task-1', text: 'Abertura Operacional' },
    { id: 'task-2', text: 'Limpeza da loja' },
    { id: 'task-3', text: 'Five Minutes - KPIs' },
    { id: 'task-4', text: 'Pedidos SFS - Manhã' },
    { id: 'task-5', text: 'Caixa dia anterior e Depósito' },
    { id: 'task-6', text: 'Relatório de Performance KPIs' },
    { id: 'task-7', text: 'Relatório de Performance Produto' },
    { id: 'task-8', text: 'Acompanhamento Planilha Chegada de Pedidos' },
    { id: 'task-9', text: 'Ativações CRM' },
    { id: 'task-10', text: 'Organização de Loja Operacional durante dia' },
    { id: 'task-11', text: 'Organização de Loja Visual Merchandising' },
    { id: 'task-12', text: 'Pedidos SFS - Tarde' },
    { id: 'task-13', text: 'Jornada de atendimento' },
    { id: 'task-14', text: 'Pedidos Digital Haass noite' },
    { id: 'task-15', text: 'Pedidos Digital Haass fechamento' },
    { id: 'task-16', text: 'Virtual Gate' },
    { id: 'task-17', text: 'Perdas e Danos' },
    { id: 'task-18', text: 'Tom Ticket' },
    { id: 'task-19', text: 'SLA/NPS Digital' },
];

// Tarefas padrão do checklist gerencial (PPAD GERENCIAL)
const defaultGerencialTasks = [
    { id: 'gerencial-1', text: 'TAG SIZE' },
    { id: 'gerencial-2', text: 'TAG PRICE' },
    { id: 'gerencial-3', text: 'TWALL' },
    { id: 'gerencial-4', text: 'SOM' },
    { id: 'gerencial-5', text: 'UNIFORME' },
    { id: 'gerencial-6', text: 'ENGAGE' },
    { id: 'gerencial-7', text: 'PASSADORIA' },
    { id: 'gerencial-8', text: 'LIMPEZA' },
    { id: 'gerencial-9', text: 'REPOSICAO' },
    { id: 'gerencial-10', text: 'TELAS DIGITAIS' },
    { id: 'gerencial-11', text: 'SLA' },
    { id: 'gerencial-12', text: 'CANCELAMENTOS' },
    { id: 'gerencial-13', text: 'CLIENTES' },
    { id: 'gerencial-14', text: 'DEVOLUCOES' },
    { id: 'gerencial-15', text: 'RECEBIMENTO' },
    { id: 'gerencial-16', text: 'DEPOSITOS' },
    { id: 'gerencial-17', text: 'NOTAS TRANSF PENDENTES' },
    { id: 'gerencial-18', text: 'FECHAMENTO CAIXA' },
    { id: 'gerencial-19', text: 'INVENTARIO' },
    { id: 'gerencial-20', text: 'MALOTES' },
    { id: 'gerencial-21', text: 'ESCALA' },
    { id: 'gerencial-22', text: 'HEADCOUNT' },
    { id: 'gerencial-23', text: 'FÉRIAS' },
    { id: 'gerencial-24', text: 'BENEFICIOS' },
    { id: 'gerencial-25', text: 'PREMIACOES' },
    { id: 'gerencial-26', text: 'FB LIDERANÇA' },
];

const buildAuditKey = (storeId, date, checklistType = 'operacional') => {
  if (!storeId || !date) return '';
  return `${storeId}-${date}-${checklistType}`;
};

const mapAuditsArray = (audits = []) => {
  const map = {};
  audits.forEach((audit) => {
    if (audit?.store_id && audit?.date) {
      const key = buildAuditKey(audit.store_id, audit.date, audit.checklist_type || 'operacional');
      if (key) {
        map[key] = audit;
      }
    }
  });
  return map;
};

export const DataProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // States
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [forms, setForms] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [trainingRegistrations, setTrainingRegistrations] = useState([]);
  const [returns, setReturns] = useState([]);
  const [physicalMissing, setPhysicalMissing] = useState([]);
  const [returnsPlanner, setReturnsPlanner] = useState([]);
  
  // App Settings
  const [patentSettings, setPatentSettings] = useState({ bronze: 0, prata: 70, ouro: 85, platina: 95 });
  const [chaveContent, setChaveContent] = useState('');
  const [menuVisibility, setMenuVisibility] = useState({});
  const [jobRoles, setJobRoles] = useState([]);
  const [checklistAudits, setChecklistAudits] = useState({});
  const [checklist, setChecklist] = useState({});
  const [dailyTasks, setDailyTasks] = useState(defaultDailyTasks); // Tarefas do checklist operacional (agora vem do banco)
  const [gerencialTasks, setGerencialTasks] = useState(defaultGerencialTasks); // Tarefas do checklist gerencial

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('⚠️ [DataContext] Usuário não autenticado, pulando fetchData');
      setLoading(false);
      return;
    }
    
    console.log('🚀 [DataContext] Iniciando fetchData...', { role: user?.role, storeId: user?.storeId });
    console.log('🔍 [DataContext] Verificando se api.fetchAppUsers existe:', typeof api.fetchAppUsers);
    console.log('🔍 [DataContext] Verificando se api.fetchForms existe:', typeof api.fetchForms);
    
    setLoading(true);
    try {
      // Para lojas, passar storeId para filtrar treinamentos
      const storeIdForTrainings = user?.role === 'loja' ? user?.storeId : null;
      
      console.log('📦 [DataContext] Chamando Promise.all para buscar todos os dados...');
      
      // Buscar usuários e formulários com tratamento de erro individual
      let fetchedUsers = [];
      let fetchedForms = [];
      let fetchedReturnsPlanner = [];
      
      if (typeof api.fetchAppUsers === 'function') {
        try {
          console.log('🔍 [DataContext] Tentando buscar usuários...');
          fetchedUsers = await api.fetchAppUsers();
          console.log('✅ [DataContext] Usuários buscados com sucesso:', fetchedUsers?.length || 0);
        } catch (userError) {
          console.error('❌ [DataContext] Erro ao buscar usuários:', userError);
          fetchedUsers = [];
        }
      } else {
        console.error('❌ [DataContext] api.fetchAppUsers não é uma função!', api.fetchAppUsers);
      }
      
      if (typeof api.fetchForms === 'function') {
        try {
          console.log('🔍 [DataContext] Tentando buscar formulários...');
          fetchedForms = await api.fetchForms();
          console.log('✅ [DataContext] Formulários buscados com sucesso:', fetchedForms?.length || 0);
        } catch (formError) {
          console.error('❌ [DataContext] Erro ao buscar formulários:', formError);
          fetchedForms = [];
        }
      } else {
        console.error('❌ [DataContext] api.fetchForms não é uma função!', api.fetchForms);
      }
      
      // Buscar returns planner com tratamento de erro individual (tabela pode não existir ainda)
      if (typeof api.fetchReturnsPlanner === 'function') {
        try {
          console.log('🔍 [DataContext] Tentando buscar planner de devoluções...');
          fetchedReturnsPlanner = await api.fetchReturnsPlanner();
          console.log('✅ [DataContext] Planner de devoluções buscado com sucesso:', fetchedReturnsPlanner?.length || 0);
        } catch (plannerError) {
          if (plannerError.code === 'PGRST205' || plannerError.message?.includes('Could not find the table')) {
            console.warn('⚠️ [DataContext] Tabela returns_planner não encontrada. Execute o script CRIAR_TABELA_PLANNER_DEVOLUCOES.sql no Supabase.');
            fetchedReturnsPlanner = [];
          } else {
            console.error('❌ [DataContext] Erro ao buscar planner de devoluções:', plannerError);
            fetchedReturnsPlanner = [];
          }
        }
      }
      
      const [
        fetchedStores,
        fetchedEvaluations,
        fetchedCollaborators,
        fetchedFeedbacks,
        fetchedTrainings,
        fetchedTrainingRegistrations,
        fetchedReturns,
        fetchedPhysicalMissing,
        fetchedPatents,
        fetchedChave,
        fetchedMenu,
        fetchedChecklistTasks,
        fetchedGerencialChecklistTasks,
        fetchedJobRoles,
      ] = await Promise.all([
        api.fetchStores(),
        api.fetchEvaluations(),
        api.fetchCollaborators(),
        api.fetchFeedbacks(),
        api.fetchTrainings(storeIdForTrainings),
        api.fetchTrainingRegistrations(),
        api.fetchReturns(),
        api.fetchPhysicalMissing(),
        api.fetchAppSettings('patent_settings'),
        api.fetchAppSettings('chave_content'),
        api.fetchAppSettings('menu_visibility'),
        api.fetchChecklistTasks(),
        api.fetchGerencialChecklistTasks(),
        api.fetchJobRoles(),
      ]);

      console.log('✅ [DataContext] Promise.all concluído!', {
        stores: fetchedStores?.length || 0,
        users: fetchedUsers?.length || 0,
        forms: fetchedForms?.length || 0,
        evaluations: fetchedEvaluations?.length || 0
      });

      console.log('🔄 [DataContext] Definindo dados nos states...');
      console.log('  - fetchedUsers:', fetchedUsers?.length || 0, fetchedUsers);
      console.log('  - fetchedForms:', fetchedForms?.length || 0, fetchedForms);
      console.log('  - fetchedStores:', fetchedStores?.length || 0);
      
      setStores(fetchedStores);
      setUsers(fetchedUsers || []);
      setForms(fetchedForms || []);
      
      // Debug: Verificar se os dados estão sendo carregados
      console.log('📊 [DataContext] Dados definidos nos states:', {
        users: (fetchedUsers || [])?.length || 0,
        forms: (fetchedForms || [])?.length || 0,
        stores: fetchedStores?.length || 0
      });
      setEvaluations(fetchedEvaluations);
      setCollaborators(fetchedCollaborators);
      setFeedbacks(fetchedFeedbacks);
      setTrainings(fetchedTrainings);
      setTrainingRegistrations(fetchedTrainingRegistrations);
      setReturns(fetchedReturns || []);
      setPhysicalMissing(fetchedPhysicalMissing || []);
      setReturnsPlanner(fetchedReturnsPlanner || []);
      
      if (fetchedPatents) setPatentSettings(fetchedPatents);
      // Garantir que chaveContent sempre seja uma string
      // fetchAppSettings retorna data?.value diretamente
      // Se o value for um objeto com initialContent, usar isso; caso contrário, usar o value diretamente ou string vazia
      if (fetchedChave) {
        if (typeof fetchedChave === 'object' && fetchedChave !== null && 'initialContent' in fetchedChave) {
          setChaveContent(fetchedChave.initialContent || '');
        } else if (typeof fetchedChave === 'string') {
          setChaveContent(fetchedChave);
        } else {
          setChaveContent('');
        }
      } else {
        setChaveContent(''); // Valor padrão se não houver conteúdo
      }
      if (fetchedMenu) setMenuVisibility(fetchedMenu);
      setJobRoles(fetchedJobRoles || []);
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const fetchedAudits = await api.fetchChecklistAuditsByDate(todayStr);
        setChecklistAudits(mapAuditsArray(fetchedAudits || []));
      } catch (auditError) {
        console.warn('Erro ao buscar auditorias do checklist:', auditError);
        setChecklistAudits({});
      }
      
      // Configurar tarefas do checklist operacional
      if (fetchedChecklistTasks && fetchedChecklistTasks.length > 0) {
        setDailyTasks(fetchedChecklistTasks);
      } else {
        // Se não houver tarefas no banco, usar as padrão e salvar no banco
        setDailyTasks(defaultDailyTasks);
        // Salvar tarefas padrão no banco (assíncrono, não precisa aguardar)
        api.saveChecklistTasks(defaultDailyTasks).catch(err => {
          console.warn('Erro ao salvar tarefas padrão do checklist operacional:', err);
        });
      }

      // Configurar tarefas do checklist gerencial
      if (fetchedGerencialChecklistTasks && fetchedGerencialChecklistTasks.length > 0) {
        setGerencialTasks(fetchedGerencialChecklistTasks);
      } else {
        // Se não houver tarefas no banco, usar as padrão e salvar no banco
        setGerencialTasks(defaultGerencialTasks);
        // Salvar tarefas padrão no banco (assíncrono, não precisa aguardar)
        api.saveGerencialChecklistTasks(defaultGerencialTasks).catch(err => {
          console.warn('Erro ao salvar tarefas padrão do checklist gerencial:', err);
        });
      }

    } catch (error) {
      console.error('❌ [DataContext] Erro ao carregar dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast, isAuthenticated, user?.role, user?.storeId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
      // Clear data on logout
      setStores([]);
      setUsers([]);
      setForms([]);
      setEvaluations([]);
      setCollaborators([]);
      setFeedbacks([]);
      setTrainings([]);
      setTrainingRegistrations([]);
      setReturns([]);
      setPhysicalMissing([]);
      setChecklistAudits({});
    }
  }, [isAuthenticated, fetchData]);

  // Refresh periódico de dados críticos para multi-usuário - Otimizado para mobile
  useEffect(() => {
    if (!isAuthenticated) return;

    // Verificar se está online antes de fazer refresh
    const checkAndRefresh = () => {
      // Verificar conexão de rede
      if (navigator.onLine === false) {
        console.warn('⚠️ Sem conexão de rede. Pulando refresh automático.');
        return;
      }

      // Verificar se a página está visível (evitar refresh em background em mobile)
      if (document.visibilityState === 'hidden') {
        return; // Não fazer refresh se a página estiver em background
      }

      // Refresh dados críticos que mudam frequentemente
      Promise.all([
        api.fetchEvaluations(),
        api.fetchFeedbacks(),
        api.fetchCollaborators(),
        api.fetchTrainings(user?.role === 'loja' ? user?.storeId : null),
        api.fetchTrainingRegistrations(),
        api.fetchReturns(),
        api.fetchPhysicalMissing(),
      ]).then(([newEvaluations, newFeedbacks, newCollaborators, newTrainings, newRegistrations, newReturns, newPhysicalMissing]) => {
        setEvaluations(newEvaluations);
        setFeedbacks(newFeedbacks);
        setCollaborators(newCollaborators);
        setTrainings(newTrainings);
        setTrainingRegistrations(newRegistrations);
        setReturns(newReturns || []);
        setPhysicalMissing(newPhysicalMissing || []);
      }).catch(error => {
        console.warn('Erro ao atualizar dados em background:', error);
      });
    };

    // Intervalo adaptativo: mais frequente quando visível, menos quando em background
    const REFRESH_INTERVAL_VISIBLE = 30000; // 30 segundos quando visível
    const REFRESH_INTERVAL_HIDDEN = 120000; // 2 minutos quando em background
    
    let intervalId;
    let currentInterval = REFRESH_INTERVAL_VISIBLE;

    const updateInterval = () => {
      if (intervalId) clearInterval(intervalId);
      
      currentInterval = document.visibilityState === 'visible' 
        ? REFRESH_INTERVAL_VISIBLE 
        : REFRESH_INTERVAL_HIDDEN;
      
      intervalId = setInterval(checkAndRefresh, currentInterval);
    };

    // Iniciar intervalo
    updateInterval();
    
    // Atualizar intervalo quando visibilidade mudar
    const handleVisibilityChange = () => {
      updateInterval();
      // Se voltou a ser visível, fazer refresh imediato
      if (document.visibilityState === 'visible') {
        checkAndRefresh();
      }
    };

    // Escutar eventos de rede
    const handleOnline = () => {
      console.log('✅ Conexão restaurada. Fazendo refresh...');
      checkAndRefresh();
    };

    const handleOffline = () => {
      console.warn('⚠️ Conexão perdida.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, user?.role, user?.storeId]);

  // Refresh quando a janela volta ao foco (usuário volta para a aba) - Melhorado para mobile
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastRefreshTime = Date.now();
    const MIN_REFRESH_INTERVAL = 5000; // Mínimo de 5 segundos entre refreshes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Evitar refresh muito frequente em mobile
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
          return;
        }
        lastRefreshTime = now;

        // Refresh dados quando a página volta a ser visível (incluindo returns e physicalMissing)
        // Buscar returns planner separadamente para não quebrar o Promise.all se a tabela não existir
        Promise.all([
          api.fetchEvaluations(),
          api.fetchFeedbacks(),
          api.fetchCollaborators(),
          api.fetchStores(),
          api.fetchTrainings(user?.role === 'loja' ? user?.storeId : null),
          api.fetchTrainingRegistrations(),
          api.fetchReturns(),
          api.fetchPhysicalMissing(),
        ]).then(([newEvaluations, newFeedbacks, newCollaborators, newStores, newTrainings, newRegistrations, newReturns, newPhysicalMissing]) => {
          setEvaluations(newEvaluations);
          setFeedbacks(newFeedbacks);
          setCollaborators(newCollaborators);
          setStores(newStores);
          setTrainings(newTrainings);
          setTrainingRegistrations(newRegistrations);
          setReturns(newReturns || []);
          setPhysicalMissing(newPhysicalMissing || []);
          
          // Buscar returns planner separadamente com tratamento de erro
          api.fetchReturnsPlanner().then(newReturnsPlanner => {
            setReturnsPlanner(newReturnsPlanner || []);
          }).catch(error => {
            if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
              // Tabela não existe ainda - ignorar silenciosamente
              setReturnsPlanner([]);
            } else {
              console.warn('Erro ao atualizar returns planner:', error);
            }
          });
        }).catch(error => {
          console.warn('Erro ao atualizar dados ao voltar ao foco:', error);
        });
      }
    };

    // Também escutar eventos de foco da janela (útil para mobile)
    const handleFocus = () => {
      handleVisibilityChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.role, user?.storeId]);
  
  // Wrapper for API calls to refresh local state
  const handleApiCall = async (apiCall, successMsg) => {
    try {
      const result = await apiCall();
      toast({ title: 'Sucesso!', description: successMsg });
      fetchData(); // Refresh all data
      return result;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na Operação', description: error.message });
      throw error;
    }
  };

  // Stores
  const addStore = (store) => handleApiCall(() => api.createStore(store), 'Loja adicionada.');
  const updateStore = (id, data) => handleApiCall(() => api.updateStore(id, data), 'Loja atualizada.');
  const deleteStore = (id) => handleApiCall(() => api.deleteStore(id), 'Loja removida.');

  // Users
  const addUser = async (email, password, data) => {
    try {
      const result = await api.createAppUser(email, password, data);
      toast({ 
        title: 'Sucesso!', 
        description: 'Usuário criado com sucesso.' 
      });
      fetchData(); // Refresh all data
      return result;
    } catch (error) {
      // Mensagem de erro mais específica para foreign key
      let errorMessage = error.message || 'Erro ao criar usuário';
      
      // Se o erro já contém instruções detalhadas (do supabaseService.js), usar a mensagem completa
      if (error.message?.includes('SOLUCAO_COMPLETA.sql') || error.message?.includes('SOLUÇÃO OBRIGATÓRIA')) {
        // A mensagem já está completa, usar ela
        errorMessage = error.message;
      } else if (error.message?.includes('foreign key') || error.code === '23503') {
        // Mensagem simplificada para o toast
        errorMessage = '❌ Erro de configuração do banco de dados.\n\nExecute o script SOLUCAO_COMPLETA.sql no Supabase SQL Editor.\n\nVeja o console ou o arquivo INSTRUCOES_CORRECAO.md para instruções detalhadas.';
      }
      
      // Exibir toast com mensagem (limitada a 500 caracteres para o toast)
      const toastMessage = errorMessage.length > 500 
        ? errorMessage.substring(0, 500) + '...\n\nVeja o console para mais detalhes.'
        : errorMessage;
      
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao criar usuário', 
        description: toastMessage,
        duration: 10000 // 10 segundos para dar tempo de ler
      });
      
      // Sempre lançar o erro para que o componente possa tratá-lo também
      throw error;
    }
  };
  const updateUser = (id, data) => handleApiCall(() => api.updateAppUser(id, data), 'Usuário atualizado.');
  const deleteUser = async (id) => {
    try {
      await api.deleteAppUser(id);
      toast({ 
        title: 'Usuário Excluído!', 
        description: 'O usuário foi removido completamente do sistema (servidor e web).' 
      });
      fetchData(); // Refresh data
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir usuário', description: error.message });
      throw error;
    }
  };
  const toggleUserStatus = async (id) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('Usuário não encontrado');
      
      // Se status for null/undefined, tratar como 'active' e mudar para 'blocked'
      const currentStatus = user.status || 'active';
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      await handleApiCall(() => api.updateAppUser(id, { status: newStatus }), `Usuário ${newStatus === 'active' ? 'ativado' : 'bloqueado'}.`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status', description: error.message });
    }
  };
  const resetUserPassword = async (email) => {
    try {
      await api.resetUserPassword(email);
      toast({ 
        title: 'Senha Resetada!', 
        description: 'A senha do usuário foi resetada para a senha padrão "afeet10". O usuário poderá fazer login com essa senha.' 
      });
      fetchData(); // Refresh data
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao resetar senha', description: error.message });
      throw error;
    }
  };

  // Forms
  const saveForm = (form) => handleApiCall(() => api.createForm(form), 'Formulário salvo.');
  const updateForm = (id, data) => handleApiCall(() => api.updateForm(id, data), 'Formulário atualizado.');
  const deleteForm = async (id) => {
    if (!id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID do formulário é obrigatório' });
      return;
    }
    
    // Salvar o formulário que será excluído para reverter se necessário
    const formToDelete = forms.find(f => f.id === id);
    
    if (!formToDelete) {
      console.warn('⚠️ Formulário não encontrado no estado local:', id);
      toast({ variant: 'destructive', title: 'Erro', description: 'Formulário não encontrado' });
      return;
    }
    
    // Remover IMEDIATAMENTE do estado local (optimistic update)
    console.log('🗑️ Removendo formulário do estado local imediatamente:', id);
    setForms(prev => {
      const filtered = prev.filter(f => f.id !== id);
      console.log('📊 Formulário removido do estado. Total restante:', filtered.length);
      return filtered;
    });
    
    // Mostrar toast de sucesso imediatamente
    toast({ title: 'Sucesso!', description: 'Formulário excluído.' });
    
    // Fazer a exclusão no banco de forma assíncrona (não bloquear UI)
    try {
      console.log('🗑️ Excluindo formulário no banco de dados:', id);
      await api.deleteForm(id);
      console.log('✅ Formulário excluído com sucesso no banco:', id);
      
      // Refresh dados para garantir sincronização (mas não deve trazer o item de volta se foi excluído)
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao excluir formulário no banco:', error);
      
      // Reverter: adicionar o formulário de volta ao estado local
      console.log('↩️ Revertendo exclusão: adicionando formulário de volta ao estado');
      setForms(prev => {
        const exists = prev.find(f => f.id === id);
        if (!exists) {
          return [...prev, formToDelete];
        }
        return prev;
      });
      
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao excluir formulário', 
        description: error.message || 'Não foi possível excluir o formulário. Tente novamente.' 
      });
    }
  };

  // Evaluations
  const addEvaluation = (evalData) => handleApiCall(() => api.createEvaluation(evalData), 'Avaliação enviada.');
  const updateEvaluationStatus = (id, status) => handleApiCall(() => api.updateEvaluation(id, { status }), 'Status da avaliação atualizado.');
  const approveEvaluation = async (id) => {
    if (!id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID da avaliação não fornecido.' });
      return;
    }
    
    try {
      // Buscar a avaliação antes de aprovar para validação
      const evaluationToApprove = evaluations.find(e => e.id === id);
      
      if (!evaluationToApprove) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Avaliação não encontrada.' });
        return;
      }
      
      // Validar score da avaliação
      const score = evaluationToApprove.score;
      if (score === null || score === undefined || isNaN(score)) {
        toast({ 
          variant: 'destructive', 
          title: 'Erro de validação', 
          description: 'A avaliação possui um score inválido e não pode ser aprovada. Score: ' + score 
        });
        return;
      }
      
      if (score < 0 || score > 100) {
        toast({ 
          variant: 'destructive', 
          title: 'Erro de validação', 
          description: `A avaliação possui um score fora do range válido (0-100). Score atual: ${score}` 
        });
        return;
      }
      
      console.log('🔐 [approveEvaluation] Obtendo usuário atual...');
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ [approveEvaluation] Erro ao obter usuário:', userError);
        throw new Error('Erro ao obter informações do usuário');
      }
      
      if (!authUser?.id) {
        console.error('❌ [approveEvaluation] Usuário não encontrado');
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ [approveEvaluation] Usuário obtido:', { userId: authUser.id, email: authUser.email });
      console.log('✅ [approveEvaluation] Validação da avaliação:', { 
        id, 
        pillar: evaluationToApprove.pillar, 
        score: evaluationToApprove.score,
        storeId: evaluationToApprove.storeId 
      });
      
      const updateData = {
        status: 'approved',
        approved_by: authUser.id
      };
      
      console.log('🔄 [approveEvaluation] Aprovando avaliação:', { id, updateData });
      
      await handleApiCall(() => api.updateEvaluation(id, updateData), 'Avaliação aprovada! A avaliação agora conta para a pontuação.');
      
      // Atualizar lista de avaliações após aprovação
      await fetchData();
      
    } catch (error) {
      console.error('❌ [approveEvaluation] Erro completo:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao aprovar avaliação';
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao aprovar avaliação', 
        description: errorMessage.includes('permission') || errorMessage.includes('policy') 
          ? 'Você não tem permissão para aprovar esta avaliação. Verifique suas permissões.'
          : errorMessage
      });
      throw error;
    }
  };
  const deleteEvaluation = async (id) => {
    if (!id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID da avaliação é obrigatório' });
      return;
    }
    
    // Salvar a avaliação que será excluída para reverter se necessário
    const evaluationToDelete = evaluations.find(e => e.id === id);
    
    if (!evaluationToDelete) {
      console.warn('⚠️ Avaliação não encontrada no estado local:', id);
      toast({ variant: 'destructive', title: 'Erro', description: 'Avaliação não encontrada' });
      return;
    }
    
    // Remover IMEDIATAMENTE do estado local (optimistic update)
    // Isso força o recálculo INSTANTÂNEO das pontuações no Dashboard e Ranking
    console.log('🗑️ Removendo avaliação do estado local imediatamente:', id);
    setEvaluations(prev => {
      const filtered = prev.filter(e => e.id !== id);
      console.log('📊 Avaliação removida do estado. Total restante:', filtered.length);
      console.log('📊 IDs restantes:', filtered.map(e => e.id));
      return filtered;
    });
    
    // Mostrar toast de sucesso imediatamente
    toast({ title: 'Sucesso!', description: 'Avaliação removida.' });
    
    // Fazer a exclusão no banco de forma assíncrona (não bloquear UI)
    // Se falhar, vamos reverter o estado
    api.deleteEvaluation(id)
      .then((result) => {
        if (!result || !result.success) {
          throw new Error('A exclusão não foi confirmada pelo servidor');
        }
        
        console.log('✅ Avaliação excluída do banco de dados:', result);
        
        // Aguardar um pouco para garantir que a exclusão foi commitada
        return new Promise(resolve => setTimeout(resolve, 2000));
      })
      .then(() => {
        // Recarregar dados do banco APENAS para sincronizar com outros usuários
        // Mas filtrar para não trazer a avaliação excluída de volta
        console.log('🔄 Recarregando dados para sincronização...');
        return fetchData();
      })
      .then(() => {
        // Verificar se a avaliação ainda está no estado (não deveria estar)
        const stillExists = evaluations.some(e => e.id === id);
        if (stillExists) {
          console.warn('⚠️ Avaliação ainda aparece após recarregar. Removendo novamente...');
          setEvaluations(prev => prev.filter(e => e.id !== id));
        }
        console.log('✅ Sincronização concluída. Avaliação excluída permanentemente.');
      })
      .catch((error) => {
        // Se falhar, reverter o optimistic update
        console.error('❌ Erro ao excluir avaliação do banco:', error);
        
        // Reverter o estado
        setEvaluations(prev => {
          const exists = prev.find(e => e.id === id);
          if (!exists && evaluationToDelete) {
            console.log('🔄 Revertendo exclusão. Adicionando avaliação de volta ao estado.');
            return [...prev, evaluationToDelete];
          }
          return prev;
        });
        
        // Recarregar dados para garantir consistência
        fetchData().catch(err => console.error('Erro ao recarregar dados:', err));
        
        toast({ 
          variant: 'destructive', 
          title: 'Erro na Operação', 
          description: error.message || 'Não foi possível excluir a avaliação. Ela foi restaurada.' 
        });
      });
  };
  
  // Collaborators
  const addCollaborator = (collabData) => handleApiCall(() => api.createCollaborator(collabData), 'Colaborador adicionado.');
  const updateCollaborator = (id, updates) => handleApiCall(() => api.updateCollaborator(id, updates), 'Colaborador atualizado.');
  const deleteCollaborator = (id) => handleApiCall(() => api.deleteCollaborator(id), 'Colaborador removido.');

  // Trainings
  const addTraining = (trainingData) => handleApiCall(() => api.createTraining(trainingData), 'Treinamento criado.');
  const updateTraining = (id, data) => handleApiCall(() => api.updateTraining(id, data), 'Treinamento atualizado.');
  const deleteTraining = (id) => handleApiCall(() => api.deleteTraining(id), 'Treinamento removido.');
  
  // Training Registrations
  const addTrainingRegistration = (registrationData) => handleApiCall(() => api.createTrainingRegistration(registrationData), 'Inscrição realizada com sucesso.');
  const updateTrainingRegistration = (id, data) => handleApiCall(() => api.updateTrainingRegistration(id, data), 'Inscrição atualizada.');
  const deleteTrainingRegistration = (id) => handleApiCall(() => api.deleteTrainingRegistration(id), 'Inscrição cancelada.');

  // Feedback
  const addFeedback = (feedbackData) => handleApiCall(() => api.createFeedback(feedbackData), 'Feedback enviado.');
  const deleteFeedbacksBySatisfaction = async (satisfactionLevels) => {
    if (!satisfactionLevels || !Array.isArray(satisfactionLevels) || satisfactionLevels.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Níveis de satisfação são obrigatórios' });
      return;
    }
    
    try {
      const result = await api.deleteFeedbacksBySatisfaction(satisfactionLevels);
      const count = result.deleted || 0;
      toast({ 
        title: 'Sucesso!', 
        description: `${count} feedback(s) excluído(s) com sucesso.` 
      });
      fetchData(); // Refresh dados
      return result;
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao excluir feedbacks', 
        description: error.message || 'Não foi possível excluir os feedbacks.' 
      });
      throw error;
    }
  };
  const deleteFeedback = async (feedbackId) => {
    if (!feedbackId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'ID do feedback é obrigatório' });
      return;
    }
    
    // Salvar o feedback que será excluído para reverter se necessário
    const feedbackToDelete = feedbacks.find(f => f.id === feedbackId);
    
    if (!feedbackToDelete) {
      console.warn('⚠️ Feedback não encontrado no estado local:', feedbackId);
      toast({ variant: 'destructive', title: 'Erro', description: 'Feedback não encontrado' });
      return;
    }
    
    // Remover IMEDIATAMENTE do estado local (optimistic update)
    console.log('🗑️ Removendo feedback do estado local imediatamente:', feedbackId);
    setFeedbacks(prev => {
      const filtered = prev.filter(f => f.id !== feedbackId);
      console.log('📊 Feedback removido do estado. Total restante:', filtered.length);
      return filtered;
    });
    
    // Mostrar toast de sucesso imediatamente
    toast({ title: 'Sucesso!', description: 'Feedback excluído.' });
    
    // Fazer a exclusão no banco de forma assíncrona (não bloquear UI)
    try {
      console.log('🗑️ Excluindo feedback no banco de dados:', feedbackId);
      const result = await api.deleteFeedback(feedbackId);
      console.log('✅ Feedback excluído com sucesso no banco:', result);
      
      // Refresh dados para garantir sincronização (mas não deve trazer o item de volta se foi excluído)
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao excluir feedback no banco:', error);
      
      // Reverter: adicionar o feedback de volta ao estado local
      console.log('↩️ Revertendo exclusão: adicionando feedback de volta ao estado');
      setFeedbacks(prev => {
        const exists = prev.find(f => f.id === feedbackId);
        if (!exists) {
          return [...prev, feedbackToDelete];
        }
        return prev;
      });
      
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao excluir feedback', 
        description: error.message || 'Não foi possível excluir o feedback. Tente novamente.' 
      });
    }
  };

  // Settings
  const updatePatentSettings = (settings) => handleApiCall(() => api.upsertAppSettings('patent_settings', settings), 'Patamares de patente atualizados.');
  const updateChaveContent = (content) => handleApiCall(() => api.upsertAppSettings('chave_content', { initialContent: content }), 'Conteúdo da CHAVE atualizado.');
  const updateMenuVisibility = async (visibility) => {
    try {
      // Atualizar estado local imediatamente
      setMenuVisibility(visibility);
      // Salvar no banco
      const result = await api.upsertAppSettings('menu_visibility', visibility);
      toast({ title: 'Sucesso!', description: 'Visibilidade do menu atualizada.' });
      // Recarregar dados para garantir sincronização
      fetchData();
      return result;
    } catch (error) {
      // Reverter estado local em caso de erro
      fetchData();
      toast({ variant: 'destructive', title: 'Erro na Operação', description: error.message });
      throw error;
    }
  };
  const refreshChecklistAuditsForDate = async (date = format(new Date(), 'yyyy-MM-dd')) => {
    try {
      const audits = await api.fetchChecklistAuditsByDate(date);
      setChecklistAudits(mapAuditsArray(audits || []));
      return audits;
    } catch (error) {
      console.warn('Erro ao atualizar auditorias:', error);
      throw error;
    }
  };
  const toggleChecklistAuditStatus = async (storeId, date, checklistType = 'operacional', audited, selectedAuditedBy = null, selectedAuditedByName = null) => {
    const auditKey = buildAuditKey(storeId, date, checklistType);
    try {
      if (audited) {
        // Se admin selecionou um usuário específico, usar esse usuário; caso contrário, usar o usuário atual
        const auditedBy = selectedAuditedBy || user?.id;
        const auditedByName = selectedAuditedByName || user?.username || user?.email;
        
        const result = await api.upsertChecklistAudit({
          storeId,
          date,
          checklistType,
          auditedBy,
          auditedByName,
        });
        setChecklistAudits(prev => ({ ...prev, [auditKey]: result }));
        toast({ title: 'Auditoria registrada!', description: 'Checklist auditado com sucesso.' });
        return result;
      }
      await api.deleteChecklistAudit(storeId, date, checklistType);
      setChecklistAudits(prev => {
        const newMap = { ...prev };
        delete newMap[auditKey];
        return newMap;
      });
      toast({ title: 'Auditoria removida', description: 'O status de auditoria foi atualizado.' });
      return null;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar auditoria', description: error.message });
      throw error;
    }
  };
  const fetchChecklistAuditsForStoreRange = async (storeId, startDate, endDate, checklistType = 'operacional') => {
    return await api.fetchChecklistAuditsRange(storeId, startDate, endDate, checklistType);
  };
  const updateJobRoles = async (roles) => {
    try {
      if (!Array.isArray(roles)) {
        throw new Error('A lista de cargos precisa ser um array.');
      }
      await api.saveJobRoles(roles);
      setJobRoles(roles);
      toast({ title: 'Sucesso!', description: 'Lista de cargos atualizada.' });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar cargos', description: error.message });
      throw error;
    }
  };

  // Checklist operacional ou gerencial
  const updateChecklist = async (storeId, taskId, isChecked, checklistType = 'operacional', updateBoth = false) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr, checklistType);
      
      const newTasks = { ...(currentChecklist?.tasks || {}), [taskId]: isChecked };
      
      // Salvar o checklist atual
      await api.upsertDailyChecklist(storeId, todayStr, newTasks, checklistType);
      
      // Se updateBoth for true, atualizar também o outro checklist
      // Isso é útil quando admin/supervisor edita e quer garantir que ambos estejam sincronizados
      if (updateBoth) {
        const otherType = checklistType === 'operacional' ? 'gerencial' : 'operacional';
        try {
          // Buscar o checklist do outro tipo
          const otherChecklist = await api.fetchDailyChecklist(storeId, todayStr, otherType);
          // Atualizar com as mesmas tarefas (mas apenas se o taskId existir no outro checklist)
          if (otherChecklist?.tasks && otherChecklist.tasks.hasOwnProperty(taskId)) {
            const otherNewTasks = { ...otherChecklist.tasks, [taskId]: isChecked };
            await api.upsertDailyChecklist(storeId, todayStr, otherNewTasks, otherType);
          }
        } catch (otherError) {
          // Se falhar ao atualizar o outro checklist, não bloquear a atualização do atual
          console.warn('Erro ao atualizar outro checklist:', otherError);
        }
      }
      
      setChecklist(prev => ({
        ...prev,
        [storeId]: { ...(prev[storeId] || { date: todayStr }), tasks: newTasks, checklist_type: checklistType }
      }));
      
    } catch(error){
      toast({ variant: 'destructive', title: 'Erro no Checklist', description: error.message });
    }
  };

  // Gerenciamento de tarefas do checklist operacional (admin)
  const updateChecklistTasks = async (tasks) => {
    try {
      await api.saveChecklistTasks(tasks);
      setDailyTasks(tasks);
      toast({ title: 'Sucesso!', description: 'Tarefas do checklist operacional atualizadas.' });
      // Recarregar dados para atualizar as tarefas em toda a aplicação
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar tarefas', description: error.message });
      throw error;
    }
  };

  // Gerenciamento de tarefas do checklist gerencial (admin)
  const updateGerencialChecklistTasks = async (tasks) => {
    try {
      await api.saveGerencialChecklistTasks(tasks);
      setGerencialTasks(tasks);
      toast({ title: 'Sucesso!', description: 'Tarefas do checklist gerencial atualizadas.' });
      // Recarregar dados para atualizar as tarefas em toda a aplicação
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar tarefas', description: error.message });
      throw error;
    }
  };

  // Buscar histórico de checklist (operacional ou gerencial)
  const fetchChecklistHistory = async (storeId, startDate, endDate, checklistType = 'operacional') => {
    try {
      return await api.fetchChecklistHistory(storeId, startDate, endDate, checklistType);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar histórico', description: error.message });
      throw error;
    }
  };

  // Returns (Devoluções)
  const addReturn = async (returnData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newReturn = await api.createReturn({
        ...returnData,
        created_by: user?.id || null
      });
      setReturns(prev => [newReturn, ...prev]);
      toast({ title: 'Sucesso!', description: 'Devolução cadastrada com sucesso e enviada para administradores.' });
      return newReturn;
    } catch (error) {
      // Se a tabela não existe, mostrar mensagem amigável
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        toast({ 
          variant: 'destructive', 
          title: 'Tabela não encontrada', 
          description: 'As tabelas de devoluções ainda não foram criadas no banco. Execute o script SQL CRIAR_TABELAS_DEVOLUCOES.sql no Supabase.' 
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro ao cadastrar devolução', description: error.message });
      }
      throw error;
    }
  };

  const updateReturn = async (id, updates) => {
    try {
      const updatedReturn = await api.updateReturn(id, updates);
      setReturns(prev => prev.map(ret => ret.id === id ? updatedReturn : ret));
      toast({ title: 'Sucesso!', description: 'Devolução atualizada com sucesso.' });
      
      // Se foi marcado como coletado, atualizar o Planner automaticamente
      if (updates.collected_at) {
        try {
          // Buscar registros do Planner relacionados a esta devolução
          // Relacionamento: mesma loja + número da nota ou número do caso
          const returnItem = returns.find(r => r.id === id);
          if (returnItem && returnItem.store_id) {
            const relatedPlannerItems = returnsPlanner.filter(planner => {
              // Verificar se é da mesma loja
              if (planner.store_id !== returnItem.store_id) return false;
              
              // Verificar se tem número da nota correspondente
              // Tenta diferentes campos possíveis: nf_number, invoice_number, nota_fiscal
              const returnNfNumber = returnItem.nf_number || returnItem.invoice_number || returnItem.nota_fiscal;
              if (returnNfNumber && planner.invoice_number && 
                  returnNfNumber.toString() === planner.invoice_number.toString()) {
                return true;
              }
              
              // Verificar se tem número do caso correspondente
              if (returnItem.case_number && planner.case_number && 
                  returnItem.case_number.toString() === planner.case_number.toString()) {
                return true;
              }
              
              return false;
            });
            
            // Atualizar todos os registros relacionados para "Coletado"
            if (relatedPlannerItems.length > 0) {
              for (const plannerItem of relatedPlannerItems) {
                if (plannerItem.status !== 'Coletado') {
                  await api.updateReturnsPlanner(plannerItem.id, { status: 'Coletado' });
                  setReturnsPlanner(prev => prev.map(item => 
                    item.id === plannerItem.id ? { ...item, status: 'Coletado' } : item
                  ));
                }
              }
            }
          }
        } catch (plannerError) {
          // Não interromper o fluxo se houver erro na sincronização do Planner
          console.warn('Erro ao sincronizar Planner:', plannerError);
        }
      }
      
      return updatedReturn;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar devolução', description: error.message });
      throw error;
    }
  };

  const deleteReturn = async (id) => {
    try {
      await api.deleteReturn(id);
      setReturns(prev => prev.filter(ret => ret.id !== id));
      toast({ title: 'Sucesso!', description: 'Devolução excluída com sucesso.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir devolução', description: error.message });
      throw error;
    }
  };

  // Physical Missing (Falta Física)
  const addPhysicalMissing = async (missingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newMissing = await api.createPhysicalMissing({
        ...missingData,
        created_by: user?.id || null
      });
      setPhysicalMissing(prev => [newMissing, ...prev]);
      toast({ title: 'Sucesso!', description: 'Falta física registrada com sucesso e enviada para administradores.' });
      return newMissing;
    } catch (error) {
      // Se a tabela não existe, mostrar mensagem amigável
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        toast({ 
          variant: 'destructive', 
          title: 'Tabela não encontrada', 
          description: 'As tabelas de devoluções ainda não foram criadas no banco. Execute o script SQL CRIAR_TABELAS_DEVOLUCOES.sql no Supabase.' 
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro ao registrar falta física', description: error.message });
      }
      throw error;
    }
  };

  const updatePhysicalMissing = async (id, updates) => {
    try {
      const updatedMissing = await api.updatePhysicalMissing(id, updates);
      setPhysicalMissing(prev => prev.map(item => item.id === id ? updatedMissing : item));
      toast({ title: 'Sucesso!', description: 'Falta física atualizada com sucesso.' });
      return updatedMissing;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar falta física', description: error.message });
      throw error;
    }
  };

  const deletePhysicalMissing = async (id) => {
    try {
      await api.deletePhysicalMissing(id);
      setPhysicalMissing(prev => prev.filter(item => item.id !== id));
      toast({ title: 'Sucesso!', description: 'Falta física excluída com sucesso.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir falta física', description: error.message });
      throw error;
    }
  };

  // Returns Planner
  const addReturnsPlanner = async (plannerData) => {
    try {
      const newPlanner = await api.createReturnsPlanner(plannerData);
      setReturnsPlanner(prev => [newPlanner, ...prev]);
      toast({ title: 'Sucesso!', description: 'Registro do planner criado com sucesso.' });
      return newPlanner;
    } catch (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        toast({ 
          variant: 'destructive', 
          title: 'Tabela não encontrada', 
          description: 'A tabela returns_planner ainda não foi criada no banco. Execute o script SQL CRIAR_TABELA_PLANNER_DEVOLUCOES.sql no Supabase.' 
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro ao criar registro', description: error.message });
      }
      throw error;
    }
  };

  const updateReturnsPlanner = async (id, updates) => {
    try {
      const updatedPlanner = await api.updateReturnsPlanner(id, updates);
      setReturnsPlanner(prev => prev.map(item => item.id === id ? updatedPlanner : item));
      toast({ title: 'Sucesso!', description: 'Registro do planner atualizado com sucesso.' });
      return updatedPlanner;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar registro', description: error.message });
      throw error;
    }
  };

  const deleteReturnsPlanner = async (id) => {
    try {
      await api.deleteReturnsPlanner(id);
      setReturnsPlanner(prev => prev.filter(item => item.id !== id));
      toast({ title: 'Sucesso!', description: 'Registro do planner excluído com sucesso.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir registro', description: error.message });
      throw error;
    }
  };

  // Log quando o value é criado/atualizado
  console.log('🎯 [DataContext] Criando value object:', {
    usersCount: users?.length || 0,
    formsCount: forms?.length || 0,
    storesCount: stores?.length || 0,
    loading,
    usersIsArray: Array.isArray(users),
    formsIsArray: Array.isArray(forms)
  });

  const value = {
    loading,
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    stores,
    addStore,
    updateStore,
    deleteStore,
    evaluations,
    addEvaluation,
    updateEvaluationStatus,
    approveEvaluation,
    deleteEvaluation,
    forms,
    saveForm,
    updateForm,
    deleteForm,
    patentSettings,
    updatePatentSettings,
    collaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    feedbacks,
    trainings,
    addTraining,
    updateTraining,
    deleteTraining,
    trainingRegistrations,
    addTrainingRegistration,
    updateTrainingRegistration,
    deleteTrainingRegistration,
    addFeedback,
    deleteFeedback,
    deleteFeedbacksBySatisfaction,
    chaveContent,
    updateChaveContent,
    dailyTasks,
    gerencialTasks,
    checklist,
    updateChecklist,
    updateChecklistTasks,
    updateGerencialChecklistTasks,
    fetchChecklistHistory,
    checklistAudits,
    refreshChecklistAuditsForDate,
    toggleChecklistAuditStatus,
    fetchChecklistAuditsForStoreRange,
    menuVisibility,
    updateMenuVisibility,
    jobRoles,
    updateJobRoles,
    returns,
    addReturn,
    updateReturn,
    deleteReturn,
    physicalMissing,
    addPhysicalMissing,
    updatePhysicalMissing,
    deletePhysicalMissing,
    returnsPlanner,
    addReturnsPlanner,
    updateReturnsPlanner,
    deleteReturnsPlanner,
    fetchData, // Expor fetchData para permitir refresh manual em componentes
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
