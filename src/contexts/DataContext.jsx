
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import * as api from '@/lib/supabaseService';
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

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // States
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [forms, setForms] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  
  // App Settings
  const [patentSettings, setPatentSettings] = useState({ bronze: 0, prata: 70, ouro: 85, platina: 95 });
  const [chaveContent, setChaveContent] = useState('');
  const [menuVisibility, setMenuVisibility] = useState({});
  const [checklist, setChecklist] = useState({});
  const [dailyTasks, setDailyTasks] = useState(defaultDailyTasks); // Tarefas do checklist operacional (agora vem do banco)
  const [gerencialTasks, setGerencialTasks] = useState(defaultGerencialTasks); // Tarefas do checklist gerencial

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        fetchedStores,
        fetchedUsers,
        fetchedForms,
        fetchedEvaluations,
        fetchedCollaborators,
        fetchedFeedbacks,
        fetchedPatents,
        fetchedChave,
        fetchedMenu,
        fetchedChecklistTasks,
        fetchedGerencialChecklistTasks,
      ] = await Promise.all([
        api.fetchStores(),
        api.fetchAppUsers(),
        api.fetchForms(),
        api.fetchEvaluations(),
        api.fetchCollaborators(),
        api.fetchFeedbacks(),
        api.fetchAppSettings('patent_settings'),
        api.fetchAppSettings('chave_content'),
        api.fetchAppSettings('menu_visibility'),
        api.fetchChecklistTasks(),
        api.fetchGerencialChecklistTasks(),
      ]);

      setStores(fetchedStores);
      setUsers(fetchedUsers);
      setForms(fetchedForms);
      setEvaluations(fetchedEvaluations);
      setCollaborators(fetchedCollaborators);
      setFeedbacks(fetchedFeedbacks);
      
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
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    }
  }, [isAuthenticated, fetchData]);

  // Refresh periódico de dados críticos para multi-usuário (a cada 30 segundos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      // Refresh dados críticos que mudam frequentemente
      Promise.all([
        api.fetchEvaluations(),
        api.fetchFeedbacks(),
        api.fetchCollaborators(),
      ]).then(([newEvaluations, newFeedbacks, newCollaborators]) => {
        setEvaluations(newEvaluations);
        setFeedbacks(newFeedbacks);
        setCollaborators(newCollaborators);
      }).catch(error => {
        console.warn('Erro ao atualizar dados em background:', error);
      });
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Refresh quando a janela volta ao foco (usuário volta para a aba)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh dados quando a página volta a ser visível
        Promise.all([
          api.fetchEvaluations(),
          api.fetchFeedbacks(),
          api.fetchCollaborators(),
          api.fetchStores(),
        ]).then(([newEvaluations, newFeedbacks, newCollaborators, newStores]) => {
          setEvaluations(newEvaluations);
          setFeedbacks(newFeedbacks);
          setCollaborators(newCollaborators);
          setStores(newStores);
        }).catch(error => {
          console.warn('Erro ao atualizar dados ao voltar ao foco:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);
  
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
  const deleteForm = (id) => handleApiCall(() => api.deleteForm(id), 'Formulário removido.');

  // Evaluations
  const addEvaluation = (evalData) => handleApiCall(() => api.createEvaluation(evalData), 'Avaliação enviada.');
  const updateEvaluationStatus = (id, status) => handleApiCall(() => api.updateEvaluation(id, { status }), 'Status da avaliação atualizado.');
  const deleteEvaluation = (id) => handleApiCall(() => api.deleteEvaluation(id), 'Avaliação removida.');
  
  // Collaborators
  const addCollaborator = (collabData) => handleApiCall(() => api.createCollaborator(collabData), 'Colaborador adicionado.');
  const deleteCollaborator = (id) => handleApiCall(() => api.deleteCollaborator(id), 'Colaborador removido.');

  // Feedback
  const addFeedback = (feedbackData) => handleApiCall(() => api.createFeedback(feedbackData), 'Feedback enviado.');

  // Settings
  const updatePatentSettings = (settings) => handleApiCall(() => api.upsertAppSettings('patent_settings', settings), 'Patamares de patente atualizados.');
  const updateChaveContent = (content) => handleApiCall(() => api.upsertAppSettings('chave_content', { initialContent: content }), 'Conteúdo da CHAVE atualizado.');
  const updateMenuVisibility = (visibility) => handleApiCall(() => api.upsertAppSettings('menu_visibility', visibility), 'Visibilidade do menu atualizada.');

  // Checklist operacional ou gerencial
  const updateChecklist = async (storeId, taskId, isChecked, checklistType = 'operacional') => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr, checklistType);
      
      const newTasks = { ...(currentChecklist?.tasks || {}), [taskId]: isChecked };
      
      await api.upsertDailyChecklist(storeId, todayStr, newTasks, checklistType);
      
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
    deleteEvaluation,
    forms,
    saveForm,
    updateForm,
    deleteForm,
    patentSettings,
    updatePatentSettings,
    collaborators,
    addCollaborator,
    deleteCollaborator,
    feedbacks,
    addFeedback,
    chaveContent,
    updateChaveContent,
    dailyTasks,
    gerencialTasks,
    checklist,
    updateChecklist,
    updateChecklistTasks,
    updateGerencialChecklistTasks,
    fetchChecklistHistory,
    menuVisibility,
    updateMenuVisibility,
    fetchData, // Expor fetchData para permitir refresh manual em componentes
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
