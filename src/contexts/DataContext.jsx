
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

// Tarefas padrão do checklist diário (fallback se não houver no banco)
// Setores: PRODUTO, AMBIENTACAO, DIGITAL, ADMINISTRATIVO, PESSOAS, OUTROS
const defaultDailyTasks = [
    { id: 'task-1', text: 'Abertura Operacional', sector: 'ADMINISTRATIVO' },
    { id: 'task-2', text: 'Limpeza da loja', sector: 'AMBIENTACAO' },
    { id: 'task-3', text: 'Five Minutes - KPIs', sector: 'ADMINISTRATIVO' },
    { id: 'task-4', text: 'Pedidos SFS - Manhã', sector: 'OUTROS' },
    { id: 'task-5', text: 'Caixa dia anterior e Depósito', sector: 'ADMINISTRATIVO' },
    { id: 'task-6', text: 'Relatório de Performance KPIs', sector: 'ADMINISTRATIVO' },
    { id: 'task-7', text: 'Relatório de Performance Produto', sector: 'PRODUTO' },
    { id: 'task-8', text: 'Acompanhamento Planilha Chegada de Pedidos', sector: 'ADMINISTRATIVO' },
    { id: 'task-9', text: 'Ativações CRM', sector: 'DIGITAL' },
    { id: 'task-10', text: 'Organização de Loja Operacional durante dia', sector: 'AMBIENTACAO' },
    { id: 'task-11', text: 'Organização de Loja Visual Merchandising', sector: 'AMBIENTACAO' },
    { id: 'task-12', text: 'Pedidos SFS - Tarde', sector: 'OUTROS' },
    { id: 'task-13', text: 'Jornada de atendimento', sector: 'PESSOAS' },
    { id: 'task-14', text: 'Pedidos Digital Haass noite', sector: 'DIGITAL' },
    { id: 'task-15', text: 'Pedidos Digital Haass fechamento', sector: 'DIGITAL' },
    { id: 'task-16', text: 'Virtual Gate', sector: 'DIGITAL' },
    { id: 'task-17', text: 'Perdas e Danos', sector: 'ADMINISTRATIVO' },
    { id: 'task-18', text: 'Tom Ticket', sector: 'ADMINISTRATIVO' },
    { id: 'task-19', text: 'SLA/NPS Digital', sector: 'DIGITAL' },
];

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // States
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [forms, setForms] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [returnsPlanner, setReturnsPlanner] = useState([]);
  const [physicalMissing, setPhysicalMissing] = useState([]);
  
  // App Settings
  const [patentSettings, setPatentSettings] = useState({ bronze: 0, prata: 70, ouro: 85, platina: 95 });
  const [chaveContent, setChaveContent] = useState('');
  const [menuVisibility, setMenuVisibility] = useState({});
  const [jobRoles, setJobRoles] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [gerencialTasks, setGerencialTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState(defaultDailyTasks);

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
        fetchedJobRoles,
        fetchedDailyTasks,
        fetchedGerencialTasks,
        fetchedReturnsPlanner,
        fetchedPhysicalMissing,
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
        api.fetchAppSettings('job_roles'),
        api.fetchAppSettings('daily_tasks'),
        api.fetchAppSettings('gerencial_tasks'),
        api.fetchReturnsPlanner(),
        api.fetchPhysicalMissing(),
      ]);

      setStores(fetchedStores);
      setUsers(fetchedUsers);
      setForms(fetchedForms);
      setEvaluations(fetchedEvaluations);
      setCollaborators(fetchedCollaborators);
      setFeedbacks(fetchedFeedbacks);
      setReturnsPlanner(fetchedReturnsPlanner || []);
      setPhysicalMissing(fetchedPhysicalMissing || []);
      
      if (fetchedPatents) setPatentSettings(fetchedPatents);
      if (fetchedChave) setChaveContent(fetchedChave.initialContent);
      if (fetchedMenu) setMenuVisibility(fetchedMenu);
      if (fetchedJobRoles && Array.isArray(fetchedJobRoles)) {
        setJobRoles(fetchedJobRoles);
      } else {
        setJobRoles([]);
      }
      if (fetchedDailyTasks && Array.isArray(fetchedDailyTasks) && fetchedDailyTasks.length > 0) {
        setDailyTasks(fetchedDailyTasks);
      } else {
        // Se não houver tarefas no banco, usar padrão
        setDailyTasks(defaultDailyTasks);
      }
      if (fetchedGerencialTasks && Array.isArray(fetchedGerencialTasks)) {
        setGerencialTasks(fetchedGerencialTasks);
      } else {
        // Se não houver tarefas no banco, manter array vazio
        setGerencialTasks([]);
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setLoading(false);
      setIsInitialized(true);
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
      setReturnsPlanner([]);
      setPhysicalMissing([]);
    }
  }, [isAuthenticated, fetchData]);
  
  // Wrapper for API calls to refresh local state
  const handleApiCall = useCallback(async (apiCall, successMsg) => {
    try {
      if (!apiCall || typeof apiCall !== 'function') {
        throw new Error('Função de API inválida');
      }
      const result = await apiCall();
      toast({ title: 'Sucesso!', description: successMsg });
      fetchData(); // Refresh all data
      return result;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na Operação', description: error.message });
      throw error;
    }
  }, [toast, fetchData]);

  // Stores
  const addStore = useCallback((store) => {
    return handleApiCall(() => api.createStore(store), 'Loja adicionada.');
  }, [handleApiCall]);
  
  const updateStore = useCallback((id, data) => {
    return handleApiCall(() => api.updateStore(id, data), 'Loja atualizada.');
  }, [handleApiCall]);
  
  const deleteStore = useCallback((id) => {
    return handleApiCall(() => api.deleteStore(id), 'Loja removida.');
  }, [handleApiCall]);

  // Users
  const addUser = useCallback((email, password, data) => {
    if (!handleApiCall || typeof handleApiCall !== 'function') {
      console.error('❌ [DataContext] handleApiCall não está disponível');
      return Promise.reject(new Error('Sistema não inicializado corretamente'));
    }
    return handleApiCall(() => api.createAppUser(email, password, data), 'Usuário criado.');
  }, [handleApiCall]);
  
  const updateUser = useCallback((id, data) => {
    return handleApiCall(() => api.updateAppUser(id, data), 'Usuário atualizado.');
  }, [handleApiCall]);
  
  const deleteUser = useCallback((id) => {
    return handleApiCall(() => api.deleteAppUser(id), 'Usuário removido.');
  }, [handleApiCall]);
  const toggleUserStatus = useCallback(async (id) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não encontrado.' });
        return;
      }
      const newStatus = user.status === 'active' ? 'blocked' : 'active';
      await handleApiCall(() => api.updateAppUser(id, { status: newStatus }), `Usuário ${newStatus === 'active' ? 'ativado' : 'bloqueado'}.`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Erro ao alterar status do usuário.' });
      throw error;
    }
  }, [users, toast, handleApiCall]);
  
  const resetUserPassword = useCallback(async (email) => {
    try {
      const { data, error } = await supabase.rpc('reset_user_password_to_default', {
        p_email: email.trim().toLowerCase()
      });
      
      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('not found')) {
          const errorMsg = 'A função RPC não está disponível. Execute o script SQL no Supabase para criar a função necessária.';
          toast({ variant: 'destructive', title: 'Erro ao resetar senha', description: errorMsg, duration: 10000 });
          throw new Error(errorMsg);
        }
        throw error;
      }
      
      if (data && data.success) {
        toast({ title: 'Senha Resetada!', description: 'A senha foi resetada para a senha padrão "afeet10".' });
        return data;
      } else if (data && !data.success) {
        const errorMsg = data.error || 'Erro ao resetar senha';
        toast({ variant: 'destructive', title: 'Erro ao resetar senha', description: errorMsg });
        throw new Error(errorMsg);
      }
      
      toast({ title: 'Senha Resetada!', description: 'A senha foi resetada para a senha padrão "afeet10".' });
      return data;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao resetar senha', description: error.message || 'Não foi possível resetar a senha.' });
      throw error;
    }
  }, [toast]);

  // Forms
  const saveForm = useCallback((form) => {
    return handleApiCall(() => api.createForm(form), 'Formulário salvo.');
  }, [handleApiCall]);
  
  const updateForm = useCallback((id, data) => {
    return handleApiCall(() => api.updateForm(id, data), 'Formulário atualizado.');
  }, [handleApiCall]);
  
  const deleteForm = useCallback((id) => {
    return handleApiCall(() => api.deleteForm(id), 'Formulário removido.');
  }, [handleApiCall]);

  // Evaluations
  const addEvaluation = useCallback((evalData) => {
    return handleApiCall(() => api.createEvaluation(evalData), 'Avaliação enviada.');
  }, [handleApiCall]);
  
  const updateEvaluationStatus = useCallback((id, status) => {
    return handleApiCall(() => api.updateEvaluation(id, { status }), 'Status da avaliação atualizado.');
  }, [handleApiCall]);
  
  const approveEvaluation = useCallback((id) => {
    return handleApiCall(() => api.updateEvaluation(id, { status: 'approved' }), 'Avaliação aprovada.');
  }, [handleApiCall]);
  
  const deleteEvaluation = useCallback((id) => {
    return handleApiCall(() => api.deleteEvaluation(id), 'Avaliação removida.');
  }, [handleApiCall]);
  
  // Collaborators
  const addCollaborator = useCallback((collabData) => {
    return handleApiCall(() => api.createCollaborator(collabData), 'Colaborador adicionado.');
  }, [handleApiCall]);
  
  const updateCollaborator = useCallback((id, data) => {
    return handleApiCall(() => api.updateCollaborator(id, data), 'Colaborador atualizado.');
  }, [handleApiCall]);
  
  const deleteCollaborator = useCallback((id) => {
    return handleApiCall(() => api.deleteCollaborator(id), 'Colaborador removido.');
  }, [handleApiCall]);

  // Feedback
  const addFeedback = useCallback((feedbackData) => {
    return handleApiCall(() => api.createFeedback(feedbackData), 'Feedback enviado.');
  }, [handleApiCall]);

  // Returns Planner
  const addReturnsPlanner = useCallback((plannerData) => {
    return handleApiCall(() => api.createReturnsPlanner(plannerData), 'Registro do planner adicionado.');
  }, [handleApiCall]);
  
  const updateReturnsPlanner = useCallback((id, data) => {
    return handleApiCall(() => api.updateReturnsPlanner(id, data), 'Registro do planner atualizado.');
  }, [handleApiCall]);
  
  const deleteReturnsPlanner = useCallback((id) => {
    return handleApiCall(() => api.deleteReturnsPlanner(id), 'Registro do planner removido.');
  }, [handleApiCall]);

  // Physical Missing
  const addPhysicalMissing = useCallback((missingData) => {
    return handleApiCall(() => api.createPhysicalMissing(missingData), 'Falta física registrada.');
  }, [handleApiCall]);
  
  const updatePhysicalMissing = useCallback((id, data) => {
    return handleApiCall(() => api.updatePhysicalMissing(id, data), 'Falta física atualizada.');
  }, [handleApiCall]);
  
  const deletePhysicalMissing = useCallback((id, nfNumber = null, storeId = null) => {
    return handleApiCall(() => api.deletePhysicalMissing(id, nfNumber, storeId), 'Falta física removida.');
  }, [handleApiCall]);

  // Settings
  const updatePatentSettings = useCallback((settings) => {
    return handleApiCall(() => api.upsertAppSettings('patent_settings', settings), 'Patamares de patente atualizados.');
  }, [handleApiCall]);
  
  const updateChaveContent = useCallback((content) => {
    return handleApiCall(() => api.upsertAppSettings('chave_content', { initialContent: content }), 'Conteúdo da CHAVE atualizado.');
  }, [handleApiCall]);
  
  const updateMenuVisibility = useCallback((visibility) => {
    return handleApiCall(() => api.upsertAppSettings('menu_visibility', visibility), 'Visibilidade do menu atualizada.');
  }, [handleApiCall]);
  
  const updateJobRoles = useCallback(async (roles) => {
    try {
      const result = await api.upsertAppSettings('job_roles', roles);
      setJobRoles(roles);
      toast({ title: 'Sucesso!', description: 'Cargos atualizados.' });
      fetchData(); // Refresh all data
      return result;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na Operação', description: error.message });
      throw error;
    }
  }, [toast, fetchData]);

  // Checklist
  const updateChecklist = async (storeId, taskId, isChecked) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr);
      
      const newTasks = { ...(currentChecklist?.tasks || {}), [taskId]: isChecked };
      
      await api.upsertDailyChecklist(storeId, todayStr, newTasks);
      
      setChecklist(prev => ({
        ...prev,
        [storeId]: { ...(prev[storeId] || { date: todayStr }), tasks: newTasks }
      }));
      
    } catch(error){
      toast({ variant: 'destructive', title: 'Erro no Checklist', description: error.message });
    }
  };

  // Gerencial Checklist
  const updateGerencialChecklist = async (storeId, taskId, isChecked) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr);
      
      const newGerencialTasks = { ...(currentChecklist?.gerencialTasks || {}), [taskId]: isChecked };
      
      // Atualizar o registro existente ou criar novo
      const updatedChecklist = {
        store_id: storeId,
        date: todayStr,
        tasks: currentChecklist?.tasks || {},
        gerencialTasks: newGerencialTasks
      };
      
      await api.upsertDailyChecklist(storeId, todayStr, updatedChecklist.tasks, updatedChecklist.gerencialTasks);
      
      setChecklist(prev => ({
        ...prev,
        [storeId]: { 
          ...(prev[storeId] || { date: todayStr }), 
          tasks: updatedChecklist.tasks,
          gerencialTasks: newGerencialTasks 
        }
      }));
      
    } catch(error){
      toast({ variant: 'destructive', title: 'Erro no Checklist Gerencial', description: error.message });
      throw error;
    }
  };

  // Update Gerencial Tasks List
  const updateGerencialTasks = (tasks) => {
    setGerencialTasks(tasks);
  };

  // Update Daily Tasks List
  const updateDailyTasks = (tasks) => {
    setDailyTasks(tasks);
  };

  const value = {
    loading: loading || !isInitialized,
    isInitialized,
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
    addFeedback,
    chaveContent,
    updateChaveContent,
    jobRoles,
    updateJobRoles,
    dailyTasks,
    checklist,
    updateChecklist,
    gerencialTasks,
    updateGerencialChecklist,
    updateGerencialTasks,
    updateDailyTasks,
    menuVisibility,
    updateMenuVisibility,
    returnsPlanner,
    addReturnsPlanner,
    updateReturnsPlanner,
    deleteReturnsPlanner,
    physicalMissing,
    addPhysicalMissing,
    updatePhysicalMissing,
    deletePhysicalMissing,
    fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
