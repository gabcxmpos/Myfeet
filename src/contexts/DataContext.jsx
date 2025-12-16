
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
    { id: 'task-1', text: 'Abertura Operacional', sector: 'ABERTURA' },
    { id: 'task-2', text: 'Limpeza da loja', sector: 'OPERACIONAL' },
    { id: 'task-3', text: 'Five Minutes - KPIs', sector: 'KPIS/RELATÓRIOS' },
    { id: 'task-4', text: 'Pedidos SFS - Manhã', sector: 'DIGITAL' },
    { id: 'task-5', text: 'Caixa dia anterior e Depósito', sector: 'OPERACIONAL' },
    { id: 'task-6', text: 'Relatório de Performance KPIs', sector: 'KPIS/RELATÓRIOS' },
    { id: 'task-7', text: 'Relatório de Performance Produto', sector: 'KPIS/RELATÓRIOS' },
    { id: 'task-8', text: 'Acompanhamento Planilha Chegada de Pedidos', sector: 'KPIS/RELATÓRIOS' },
    { id: 'task-9', text: 'Ativações CRM', sector: 'CRM' },
    { id: 'task-10', text: 'Organização de Loja Operacional durante dia', sector: 'OPERACIONAL' },
    { id: 'task-11', text: 'Organização de Loja Visual Merchandising', sector: 'VISUAL MERCHANDISING' },
    { id: 'task-12', text: 'Pedidos SFS - Tarde', sector: 'DIGITAL' },
    { id: 'task-13', text: 'Jornada de atendimento', sector: 'ATENDIMENTO' },
    { id: 'task-14', text: 'Pedidos Digital Haass noite', sector: 'DIGITAL' },
    { id: 'task-15', text: 'Pedidos Digital Haass fechamento', sector: 'DIGITAL' },
    { id: 'task-16', text: 'Virtual Gate', sector: 'DIGITAL' },
    { id: 'task-17', text: 'Perdas e Danos', sector: 'OUTROS' },
    { id: 'task-18', text: 'Tom Ticket', sector: 'OUTROS' },
    { id: 'task-19', text: 'SLA/NPS Digital', sector: 'DIGITAL' },
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
  const [trainings, setTrainings] = useState([]);
  const [trainingRegistrations, setTrainingRegistrations] = useState([]);
  
  // App Settings
  const [patentSettings, setPatentSettings] = useState({ bronze: 0, prata: 70, ouro: 85, platina: 95 });
  const [chaveContent, setChaveContent] = useState('');
  const [menuVisibility, setMenuVisibility] = useState({});
  const [checklist, setChecklist] = useState({});
  const [jobRoles, setJobRoles] = useState([]);
  const [dailyTasksState, setDailyTasksState] = useState(dailyTasks); // Estado para dailyTasks
  const [gerencialTasks, setGerencialTasks] = useState([]);
  const [returns, setReturns] = useState([]);
  const [returnsPlanner, setReturnsPlanner] = useState([]);
  const [returnsCapacity, setReturnsCapacity] = useState([]);
  const [physicalMissing, setPhysicalMissing] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 [DataContext] Iniciando carregamento de dados do Supabase...');
      
      const [
        fetchedStores,
        fetchedUsers,
        fetchedForms,
        fetchedEvaluations,
        fetchedCollaborators,
        fetchedFeedbacks,
        fetchedTrainings,
        fetchedTrainingRegistrations,
        fetchedPatents,
        fetchedChave,
        fetchedMenu,
        fetchedJobRoles,
        fetchedDailyTasks,
        fetchedGerencialTasks,
        fetchedReturns,
        fetchedReturnsPlanner,
        fetchedReturnsCapacity,
        fetchedPhysicalMissing,
      ] = await Promise.all([
        api.fetchStores(),
        api.fetchAppUsers(),
        api.fetchForms(),
        api.fetchEvaluations(),
        api.fetchCollaborators(),
        api.fetchFeedbacks(),
        api.fetchTrainings(),
        api.fetchTrainingRegistrations(),
        api.fetchAppSettings('patent_settings'),
        api.fetchAppSettings('chave_content'),
        api.fetchAppSettings('menu_visibility'),
        api.fetchJobRoles(),
        api.fetchAppSettings('daily_tasks'),
        api.fetchAppSettings('gerencial_tasks'),
        api.fetchReturns(),
        api.fetchReturnsPlanner(),
        api.fetchReturnsCapacity(),
        api.fetchPhysicalMissing(),
      ]);

      console.log('✅ [DataContext] Dados carregados:', {
        stores: fetchedStores?.length || 0,
        users: fetchedUsers?.length || 0,
        forms: fetchedForms?.length || 0,
        evaluations: fetchedEvaluations?.length || 0,
        collaborators: fetchedCollaborators?.length || 0,
        feedbacks: fetchedFeedbacks?.length || 0,
        trainings: fetchedTrainings?.length || 0,
        trainingRegistrations: fetchedTrainingRegistrations?.length || 0,
        jobRoles: fetchedJobRoles?.length || 0,
        returns: fetchedReturns?.length || 0,
        returnsPlanner: fetchedReturnsPlanner?.length || 0,
        returnsCapacity: fetchedReturnsCapacity?.length || 0,
        physicalMissing: fetchedPhysicalMissing?.length || 0,
      });

      setStores(fetchedStores || []);
      setUsers(fetchedUsers || []);
      setForms(fetchedForms || []);
      setEvaluations(fetchedEvaluations || []);
      setCollaborators(fetchedCollaborators || []);
      setFeedbacks(fetchedFeedbacks || []);
      setTrainings(fetchedTrainings || []);
      setTrainingRegistrations(fetchedTrainingRegistrations || []);
      setReturns(fetchedReturns || []);
      setReturnsPlanner(fetchedReturnsPlanner || []);
      setReturnsCapacity(fetchedReturnsCapacity || []);
      setPhysicalMissing(fetchedPhysicalMissing || []);
      
      if (fetchedPatents) setPatentSettings(fetchedPatents);
      if (fetchedChave) setChaveContent(fetchedChave.initialContent);
      if (fetchedMenu) setMenuVisibility(fetchedMenu);
      if (fetchedJobRoles && Array.isArray(fetchedJobRoles)) setJobRoles(fetchedJobRoles);
      // Se não há tarefas diárias configuradas, usar as padrão
      if (!fetchedDailyTasks || !Array.isArray(fetchedDailyTasks) || fetchedDailyTasks.length === 0) {
        setDailyTasksState(dailyTasks);
        console.log('📋 [DataContext] Tarefas diárias padrão inicializadas:', dailyTasks.length);
      } else {
        setDailyTasksState(fetchedDailyTasks);
      }
      // Se não há tarefas gerenciais configuradas, inicializar com estrutura padrão por setor
      if (!fetchedGerencialTasks || !Array.isArray(fetchedGerencialTasks) || fetchedGerencialTasks.length === 0) {
        const defaultGerencialTasks = [
          // AMBIENTACAO
          { id: 'amb-tag-size', text: 'TAG SIZE', sector: 'AMBIENTACAO' },
          { id: 'amb-tag-price', text: 'TAG PRICE', sector: 'AMBIENTACAO' },
          { id: 'amb-twall', text: 'TWALL', sector: 'AMBIENTACAO' },
          { id: 'amb-som', text: 'SOM', sector: 'AMBIENTACAO' },
          { id: 'amb-uniforme', text: 'UNIFORME', sector: 'AMBIENTACAO' },
          { id: 'amb-engage', text: 'ENGAGE', sector: 'AMBIENTACAO' },
          { id: 'amb-passadori-a', text: 'PASSADORI A', sector: 'AMBIENTACAO' },
          { id: 'amb-limpeza', text: 'LIMPEZA', sector: 'AMBIENTACAO' },
          { id: 'amb-reposicao', text: 'REPOSICAO', sector: 'AMBIENTACAO' },
          { id: 'amb-telas-digitais', text: 'TELAS DIGITAIS', sector: 'AMBIENTACAO' },
          // DIGITAL
          { id: 'dig-sla', text: 'SLA', sector: 'DIGITAL' },
          { id: 'dig-cancelamentos', text: 'CANCELAMENTOS', sector: 'DIGITAL' },
          { id: 'dig-clientes', text: 'CLIENTES', sector: 'DIGITAL' },
          { id: 'dig-devolucoes', text: 'DEVOLUCOES', sector: 'DIGITAL' },
          // ADMINISTRATIVO
          { id: 'adm-recebimento', text: 'RECEBIMENTO', sector: 'ADMINISTRATIVO' },
          { id: 'adm-devolucoes', text: 'DEVOLUCOES', sector: 'ADMINISTRATIVO' },
          { id: 'adm-depositos', text: 'DEPOSITOS', sector: 'ADMINISTRATIVO' },
          { id: 'adm-notas-transf-pendentes', text: 'NOTAS TRANSF PENDENTES', sector: 'ADMINISTRATIVO' },
          { id: 'adm-notas-consumo', text: 'NOTAS CONSUMO', sector: 'ADMINISTRATIVO' },
          { id: 'adm-fechamento-caixa', text: 'FECHAMENTO CAIXA', sector: 'ADMINISTRATIVO' },
          { id: 'adm-inventario', text: 'INVENTARIO', sector: 'ADMINISTRATIVO' },
          { id: 'adm-malotes', text: 'MALOTES', sector: 'ADMINISTRATIVO' },
          // PESSOAS
          { id: 'pes-escala', text: 'ESCALA', sector: 'PESSOAS' },
          { id: 'pes-headcount', text: 'HEADCOUNT', sector: 'PESSOAS' },
          { id: 'pes-ferias', text: 'FÉRIAS', sector: 'PESSOAS' },
          { id: 'pes-beneficios', text: 'BENEFICIOS', sector: 'PESSOAS' },
          { id: 'pes-premiacoes', text: 'PREMIACOES', sector: 'PESSOAS' },
          { id: 'pes-fb-lideranca', text: 'FB LIDERANÇA', sector: 'PESSOAS' },
        ];
        setGerencialTasks(defaultGerencialTasks);
        console.log('📋 [DataContext] Tarefas gerenciais padrão inicializadas:', defaultGerencialTasks.length);
      } else {
        setGerencialTasks(fetchedGerencialTasks);
      }

      console.log('✅ [DataContext] Todos os dados foram atualizados no estado');

    } catch (error) {
      console.error('❌ [DataContext] Erro ao carregar dados:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
    } finally {
      setLoading(false);
      console.log('✅ [DataContext] Carregamento finalizado');
    }
  }, [toast]);

  // Carregar checklists do dia atual
  const loadTodayChecklists = useCallback(async () => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const fetchedStores = await api.fetchStores();
      
      const checklistData = {};
      for (const store of fetchedStores) {
        try {
          const dayChecklist = await api.fetchDailyChecklist(store.id, todayStr);
          if (dayChecklist) {
            checklistData[store.id] = {
              date: todayStr,
              tasks: dayChecklist.tasks || {},
              gerencialTasks: dayChecklist.gerencialTasks || {}
            };
            console.log(`✅ [DataContext] Checklist carregado para loja ${store.id}:`, {
              tasks: Object.keys(dayChecklist.tasks || {}).length,
              gerencialTasks: Object.keys(dayChecklist.gerencialTasks || {}).length
            });
          } else {
            // Inicializar vazio se não existe
            checklistData[store.id] = {
              date: todayStr,
              tasks: {},
              gerencialTasks: {}
            };
          }
        } catch (error) {
          // Ignorar erros de checklist não encontrado
          if (error.code !== 'PGRST116') {
            console.warn(`Erro ao carregar checklist da loja ${store.id}:`, error);
          }
          // Inicializar vazio em caso de erro
          checklistData[store.id] = {
            date: todayStr,
            tasks: {},
            gerencialTasks: {}
          };
        }
      }
      
      // Substituir completamente ao invés de fazer merge para garantir sincronização
      setChecklist(checklistData);
      console.log('✅ [DataContext] Checklists do dia carregados:', Object.keys(checklistData).length);
    } catch (error) {
      console.error('❌ [DataContext] Erro ao carregar checklists do dia:', error);
    }
  }, []);

  // Subscription para atualizações em tempo real dos checklists
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Subscription para mudanças nos checklists
    const checklistSubscription = supabase
      .channel('daily_checklists_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'daily_checklists',
          filter: `date=eq.${todayStr}`
        },
        async (payload) => {
          console.log('🔄 [DataContext] Mudança detectada no checklist:', payload);
          
          // Recarregar o checklist específico que mudou
          const storeId = payload.new?.store_id || payload.old?.store_id;
          if (storeId) {
            try {
              const updatedChecklist = await api.fetchDailyChecklist(
                storeId,
                payload.new?.date || payload.old?.date || todayStr
              );
              
              if (updatedChecklist) {
                setChecklist(prev => ({
                  ...prev,
                  [storeId]: {
                    date: updatedChecklist.date,
                    tasks: updatedChecklist.tasks || {},
                    gerencialTasks: updatedChecklist.gerencialTasks || {}
                  }
                }));
                console.log('✅ [DataContext] Checklist atualizado via subscription:', storeId);
              } else if (payload.eventType === 'DELETE') {
                // Se foi deletado, remover do estado
                setChecklist(prev => {
                  const updated = { ...prev };
                  delete updated[storeId];
                  return updated;
                });
              }
            } catch (error) {
              console.error('❌ [DataContext] Erro ao recarregar checklist:', error);
            }
          }
        }
      )
      .subscribe();
    
    // Subscription para mudanças nas avaliações
    const evaluationsSubscription = supabase
      .channel('evaluations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evaluations'
        },
        async (payload) => {
          console.log('🔄 [DataContext] Mudança detectada em avaliação:', payload);
          // Recarregar avaliações
          try {
            const updatedEvaluations = await api.fetchEvaluations();
            setEvaluations(updatedEvaluations || []);
            console.log('✅ [DataContext] Avaliações atualizadas via subscription');
          } catch (error) {
            console.error('❌ [DataContext] Erro ao recarregar avaliações:', error);
          }
        }
      )
      .subscribe();
    
    // Subscription para mudanças nas lojas (para resultados)
    const storesSubscription = supabase
      .channel('stores_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores'
        },
        async (payload) => {
          console.log('🔄 [DataContext] Mudança detectada em loja:', payload);
          // Recarregar lojas
          try {
            const updatedStores = await api.fetchStores();
            setStores(updatedStores || []);
            console.log('✅ [DataContext] Lojas atualizadas via subscription');
          } catch (error) {
            console.error('❌ [DataContext] Erro ao recarregar lojas:', error);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(checklistSubscription);
      supabase.removeChannel(evaluationsSubscription);
      supabase.removeChannel(storesSubscription);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      loadTodayChecklists();
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
      setJobRoles([]);
      setGerencialTasks([]);
      setReturns([]);
      setReturnsPlanner([]);
      setReturnsCapacity([]);
      setPhysicalMissing([]);
      setChecklist({});
    }
  }, [isAuthenticated, fetchData, loadTodayChecklists]);
  
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
  const approveEvaluation = (id) => handleApiCall(() => api.updateEvaluation(id, { status: 'approved' }), 'Avaliação aprovada com sucesso!');
  const deleteEvaluation = (id) => handleApiCall(() => api.deleteEvaluation(id), 'Avaliação removida.');
  
  // Collaborators
  const addCollaborator = (collabData) => handleApiCall(() => api.createCollaborator(collabData), 'Colaborador adicionado.');
  const deleteCollaborator = (id) => handleApiCall(() => api.deleteCollaborator(id), 'Colaborador removido.');

  // Feedback
  const addFeedback = (feedbackData) => handleApiCall(() => api.createFeedback(feedbackData), 'Feedback enviado.');

  // Returns
  const addReturn = (returnData) => handleApiCall(() => api.createReturn(returnData), 'Devolução adicionada.');
  const updateReturn = (id, data) => handleApiCall(() => api.updateReturn(id, data), 'Devolução atualizada.');
  const deleteReturn = (id) => handleApiCall(() => api.deleteReturn(id), 'Devolução removida.');

  // Returns Planner
  const addReturnsPlanner = (plannerData) => handleApiCall(() => api.createReturnsPlanner(plannerData), 'Planner adicionado.');
  const updateReturnsPlanner = (id, data) => handleApiCall(() => api.updateReturnsPlanner(id, data), 'Planner atualizado.');
  const deleteReturnsPlanner = (id) => handleApiCall(() => api.deleteReturnsPlanner(id), 'Planner removido.');

  // Returns Capacity
  const addReturnsCapacity = (capacityData) => handleApiCall(() => api.createReturnsCapacity(capacityData), 'Capacidade adicionada.');
  const updateReturnsCapacity = (id, data) => handleApiCall(() => api.updateReturnsCapacity(id, data), 'Capacidade atualizada.');
  const deleteReturnsCapacity = (id) => handleApiCall(() => api.deleteReturnsCapacity(id), 'Capacidade removida.');

  // Physical Missing
  const addPhysicalMissing = (missingData) => handleApiCall(() => api.createPhysicalMissing(missingData), 'Falta física adicionada.');
  const updatePhysicalMissing = (id, data) => handleApiCall(() => api.updatePhysicalMissing(id, data), 'Falta física atualizada.');
  const deletePhysicalMissing = (id, nfNumber = null, storeId = null) => handleApiCall(() => api.deletePhysicalMissing(id, nfNumber, storeId), 'Falta física removida.');

  // Trainings
  const addTraining = (trainingData) => handleApiCall(() => api.createTraining(trainingData), 'Treinamento criado.');
  const updateTraining = (id, data) => handleApiCall(() => api.updateTraining(id, data), 'Treinamento atualizado.');
  const deleteTraining = (id) => handleApiCall(() => api.deleteTraining(id), 'Treinamento removido.');

  // Training Registrations
  const addTrainingRegistration = (registrationData) => handleApiCall(() => api.createTrainingRegistration(registrationData), 'Inscrição realizada.');
  const updateTrainingRegistration = (id, data) => handleApiCall(() => api.updateTrainingRegistration(id, data), 'Inscrição atualizada.');
  const deleteTrainingRegistration = (id) => handleApiCall(() => api.deleteTrainingRegistration(id), 'Inscrição removida.');

  // Settings
  const updatePatentSettings = (settings) => handleApiCall(() => api.upsertAppSettings('patent_settings', settings), 'Patamares de patente atualizados.');
  const updateChaveContent = (content) => handleApiCall(() => api.upsertAppSettings('chave_content', { initialContent: content }), 'Conteúdo da CHAVE atualizado.');
  const updateMenuVisibility = (visibility) => handleApiCall(() => api.upsertAppSettings('menu_visibility', visibility), 'Visibilidade do menu atualizada.');
  const updateJobRoles = (roles) => handleApiCall(() => api.updateJobRoles(roles), 'Cargos atualizados.');

  // Checklist
  const updateChecklist = async (storeId, taskId, isChecked) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Atualizar estado local PRIMEIRO para feedback visual imediato
      setChecklist(prev => {
        const currentStoreChecklist = prev[storeId] || { date: todayStr, tasks: {}, gerencialTasks: {} };
        const existingTasks = currentStoreChecklist.tasks || {};
        const existingGerencialTasks = currentStoreChecklist.gerencialTasks || {};
        const newTasks = { ...existingTasks, [taskId]: isChecked };
        
        return {
          ...prev,
          [storeId]: { 
            ...currentStoreChecklist,
            date: todayStr,
            tasks: newTasks,
            gerencialTasks: existingGerencialTasks 
          }
        };
      });
      
      // Depois salvar no banco de forma assíncrona
      const saveToDatabase = async () => {
        try {
          // Buscar o estado atual do banco para garantir que temos a versão mais recente
          const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr);
          const existingTasks = currentChecklist?.tasks || {};
          const existingGerencialTasks = currentChecklist?.gerencialTasks || {};
          
          // Aplicar a mudança sobre o estado atual do banco
          const newTasks = isChecked
            ? { ...existingTasks, [taskId]: true }
            : (() => {
                const updated = { ...existingTasks };
                delete updated[taskId];
                return updated;
              })();
          
          const checklistData = {
            tasks: newTasks,
            gerencialTasks: existingGerencialTasks
          };
          
          await api.upsertDailyChecklist(storeId, todayStr, checklistData);
          
          // Atualizar o contexto com os dados salvos
          setChecklist(prev => ({
            ...prev,
            [storeId]: {
              date: todayStr,
              tasks: newTasks,
              gerencialTasks: existingGerencialTasks
            }
          }));
          
          console.log('✅ [updateChecklist] Checklist salvo no banco:', { storeId, taskId, isChecked });
        } catch (error) {
          console.error('❌ [updateChecklist] Erro ao salvar no banco:', error);
          // Reverter mudança local em caso de erro
          setChecklist(prev => {
            const currentStoreChecklist = prev[storeId] || { date: todayStr, tasks: {}, gerencialTasks: {} };
            const existingTasks = currentStoreChecklist.tasks || {};
            const existingGerencialTasks = currentStoreChecklist.gerencialTasks || {};
            // Reverter a mudança removendo ou adicionando a task
            const revertedTasks = isChecked 
              ? (() => {
                  const reverted = { ...existingTasks };
                  delete reverted[taskId];
                  return reverted;
                })()
              : { ...existingTasks, [taskId]: true };
            
            return {
              ...prev,
              [storeId]: { 
                ...currentStoreChecklist,
                date: todayStr,
                tasks: revertedTasks,
                gerencialTasks: existingGerencialTasks 
              }
            };
          });
          toast({ variant: 'destructive', title: 'Erro no Checklist', description: error.message });
        }
      };
      
      // Executar salvamento em segundo plano (não bloquear UI)
      saveToDatabase();
      
    } catch(error){
      console.error('❌ [updateChecklist] Erro:', error);
      toast({ variant: 'destructive', title: 'Erro no Checklist', description: error.message });
    }
  };

  // Checklist Gerencial
  const updateGerencialChecklist = async (storeId, taskId, isChecked) => {
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Atualizar estado local PRIMEIRO para feedback visual imediato
      setChecklist(prev => {
        const currentStoreChecklist = prev[storeId] || { date: todayStr, tasks: {}, gerencialTasks: {} };
        const existingTasks = currentStoreChecklist.tasks || {};
        const existingGerencialTasks = currentStoreChecklist.gerencialTasks || {};
        const newGerencialTasks = { ...existingGerencialTasks, [taskId]: isChecked };
        
        return {
          ...prev,
          [storeId]: { 
            ...currentStoreChecklist,
            date: todayStr,
            tasks: existingTasks,
            gerencialTasks: newGerencialTasks 
          }
        };
      });
      
      // Depois salvar no banco de forma assíncrona
      const saveToDatabase = async () => {
        try {
          // Buscar o estado atual do banco para garantir que temos a versão mais recente
          const currentChecklist = await api.fetchDailyChecklist(storeId, todayStr);
          const existingTasks = currentChecklist?.tasks || {};
          const existingGerencialTasks = currentChecklist?.gerencialTasks || {};
          
          // Aplicar a mudança sobre o estado atual do banco
          const newGerencialTasks = isChecked
            ? { ...existingGerencialTasks, [taskId]: true }
            : (() => {
                const updated = { ...existingGerencialTasks };
                delete updated[taskId];
                return updated;
              })();
          
          const checklistData = {
            tasks: existingTasks,
            gerencialTasks: newGerencialTasks
          };
          
          await api.upsertDailyChecklist(storeId, todayStr, checklistData);
          
          // Atualizar o contexto com os dados salvos
          setChecklist(prev => ({
            ...prev,
            [storeId]: {
              date: todayStr,
              tasks: existingTasks,
              gerencialTasks: newGerencialTasks
            }
          }));
          
          console.log('✅ [updateGerencialChecklist] Checklist salvo no banco:', { storeId, taskId, isChecked });
        } catch (error) {
          console.error('❌ [updateGerencialChecklist] Erro ao salvar no banco:', error);
          // Reverter mudança local em caso de erro
          setChecklist(prev => {
            const currentStoreChecklist = prev[storeId] || { date: todayStr, tasks: {}, gerencialTasks: {} };
            const existingGerencialTasks = currentStoreChecklist.gerencialTasks || {};
            const revertedGerencialTasks = { ...existingGerencialTasks };
            if (isChecked) {
              delete revertedGerencialTasks[taskId];
            } else {
              revertedGerencialTasks[taskId] = true;
            }
            
            return {
              ...prev,
              [storeId]: { 
                ...currentStoreChecklist,
                gerencialTasks: revertedGerencialTasks 
              }
            };
          });
          toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar a alteração. Tente novamente.' });
        }
      };
      
      // Executar salvamento sem bloquear
      saveToDatabase();
      
      console.log('✅ [updateGerencialChecklist] Estado local atualizado:', { storeId, taskId, isChecked });
      
    } catch(error){
      console.error('❌ [updateGerencialChecklist] Erro:', error);
      toast({ variant: 'destructive', title: 'Erro no Checklist Gerencial', description: error.message });
    }
  };

  // Atualizar tarefas do checklist diário
  const updateChecklistTasks = async (tasks) => {
    return handleApiCall(() => api.upsertAppSettings('daily_tasks', tasks), 'Tarefas do checklist diário atualizadas.');
  };

  // Atualizar tarefas do checklist gerencial
  const updateGerencialChecklistTasks = async (tasks) => {
    return handleApiCall(() => api.upsertAppSettings('gerencial_tasks', tasks), 'Tarefas do checklist gerencial atualizadas.');
  };

  // Atualizar dailyTasks no estado local e no banco
  const updateDailyTasks = async (tasks) => {
    try {
      await api.upsertAppSettings('daily_tasks', tasks);
      setDailyTasksState(tasks);
      toast({ title: 'Sucesso', description: 'Tarefas do checklist diário atualizadas!' });
    } catch (error) {
      console.error('Erro ao atualizar dailyTasks:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao atualizar tarefas.' });
      throw error;
    }
  };

  // Atualizar gerencialTasks no estado local e no banco
  const updateGerencialTasks = async (tasks) => {
    try {
      await api.upsertAppSettings('gerencial_tasks', tasks);
      setGerencialTasks(tasks);
      toast({ title: 'Sucesso', description: 'Tarefas do PPAD gerencial atualizadas!' });
    } catch (error) {
      console.error('Erro ao atualizar gerencialTasks:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao atualizar tarefas.' });
      throw error;
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
    deleteCollaborator,
    feedbacks,
    addFeedback,
    trainings,
    addTraining,
    updateTraining,
    deleteTraining,
    trainingRegistrations,
    addTrainingRegistration,
    updateTrainingRegistration,
    deleteTrainingRegistration,
    jobRoles,
    updateJobRoles,
    chaveContent,
    updateChaveContent,
    dailyTasks: dailyTasksState,
    checklist,
    updateChecklist,
    menuVisibility,
    updateMenuVisibility,
    gerencialTasks,
    updateGerencialChecklist,
    updateGerencialChecklistTasks,
    updateChecklistTasks,
    updateDailyTasks,
    updateGerencialTasks,
    returns,
    addReturn,
    updateReturn,
    deleteReturn,
    returnsPlanner,
    addReturnsPlanner,
    updateReturnsPlanner,
    deleteReturnsPlanner,
    returnsCapacity,
    addReturnsCapacity,
    updateReturnsCapacity,
    deleteReturnsCapacity,
    physicalMissing,
    addPhysicalMissing,
    updatePhysicalMissing,
    deletePhysicalMissing,
    fetchData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
