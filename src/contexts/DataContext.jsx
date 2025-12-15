
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

// These can be fetched from app_settings as well
const dailyTasks = [
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
      ]);

      setStores(fetchedStores);
      setUsers(fetchedUsers);
      setForms(fetchedForms);
      setEvaluations(fetchedEvaluations);
      setCollaborators(fetchedCollaborators);
      setFeedbacks(fetchedFeedbacks);
      
      if (fetchedPatents) setPatentSettings(fetchedPatents);
      if (fetchedChave) setChaveContent(fetchedChave.initialContent);
      if (fetchedMenu) setMenuVisibility(fetchedMenu);

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
  const addUser = (email, password, data) => handleApiCall(() => api.createAppUser(email, password, data), 'Usuário criado.');
  const updateUser = (id, data) => handleApiCall(() => api.updateAppUser(id, data), 'Usuário atualizado.');
  const deleteUser = (id) => handleApiCall(() => api.deleteAppUser(id), 'Usuário removido.');

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

  const value = {
    loading,
    users,
    addUser,
    updateUser,
    deleteUser,
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
    checklist,
    updateChecklist,
    menuVisibility,
    updateMenuVisibility,
    fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
