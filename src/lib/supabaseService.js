
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { 
  mockStores, 
  mockUsers, 
  mockDailyTasks, 
  mockGerencialTasks, 
  mockChecklists,
  generateMockChecklistHistory,
  mockForms,
  generateMockEvaluations,
  mockCollaborators,
  generateMockFeedbacks,
  mockSettings,
  mockMenuVisibility,
  mockJobRoles
} from './mockData';

// Modo de desenvolvimento com dados fictícios
// Para ativar temporariamente: defina como true
// Para usar dados reais do servidor: defina como false
const USE_MOCK_DATA = false; // DESATIVADO - Usando dados reais do servidor

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Modo Mock Data:', USE_MOCK_DATA ? 'ATIVADO ✅' : 'DESATIVADO ❌ (Dados reais do servidor)');
}

// ============ STORES ============
export const fetchStores = async () => {
  if (USE_MOCK_DATA) {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStores;
  }
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const createStore = async (storeData) => {
  const { data, error } = await supabase
    .from('stores')
    .insert([storeData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateStore = async (id, updates) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteStore = async (id) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ USERS ============
export const fetchAppUsers = async () => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers.map(user => ({
      ...user,
      username: user.name,
      stores: user.storeId ? { name: mockStores.find(s => s.id === user.storeId)?.name } : null
    }));
  }
  
  const { data, error } = await supabase
    .from('app_users')
    .select('*, stores(name)')
    .order('username');
  
  if (error) throw error;
  return data || [];
};

export const createAppUser = async (email, password, userData) => {
  // Use default password if not provided
  const userPassword = password && password.trim() !== '' ? password : 'afeet10';
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: userPassword,
  });
  
  if (authError) throw authError;
  
  // Create app user profile
  const { data, error } = await supabase
      .from('app_users')
    .insert([{
      id: authData.user.id,
      ...userData
    }])
            .select()
            .single();
          
  if (error) throw error;
  return data;
};

export const updateAppUser = async (id, updates) => {
  const { data, error } = await supabase
    .from('app_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteAppUser = async (id) => {
  const { error } = await supabase
          .from('app_users')
          .delete()
          .eq('id', id);
        
  if (error) throw error;
};

export const updateLastLogin = async (userId) => {
  const { error } = await supabase
    .from('app_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);
  
  if (error) {
    // Não lançar erro se a coluna não existir (compatibilidade)
    console.warn('Erro ao atualizar last_login:', error);
  }
};

// ============ FORMS ============
export const fetchForms = async () => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockForms;
  }
  
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createForm = async (formData) => {
  const { data, error } = await supabase
    .from('forms')
    .insert([formData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateForm = async (id, updates) => {
  const { data, error } = await supabase
    .from('forms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteForm = async (id) => {
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ EVALUATIONS ============
export const fetchEvaluations = async () => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const evaluations = generateMockEvaluations();
    return evaluations.map(evaluation => ({
      ...evaluation,
      stores: { name: mockStores.find(s => s.id === evaluation.storeId)?.name, code: mockStores.find(s => s.id === evaluation.storeId)?.code },
      app_users: { username: mockUsers.find(u => u.id === evaluation.userId)?.name }
    }));
  }
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, stores(name, code), app_users(username)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createEvaluation = async (evaluationData) => {
  const { data, error } = await supabase
    .from('evaluations')
    .insert([evaluationData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEvaluation = async (id, updates) => {
  const { data, error } = await supabase
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEvaluation = async (id) => {
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ COLLABORATORS ============
export const fetchCollaborators = async (storeId = null) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let collaborators = mockCollaborators;
    if (storeId) {
      collaborators = collaborators.filter(c => c.storeId === storeId);
    }
    return collaborators;
  }
  
  let query = supabase
    .from('collaborators')
    .select('*')
    .order('name');
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const createCollaborator = async (collaboratorData) => {
  const { data, error } = await supabase
    .from('collaborators')
    .insert([collaboratorData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCollaborator = async (id) => {
  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ FEEDBACKS ============
export const fetchFeedbacks = async (storeId = null) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    let feedbacks = generateMockFeedbacks();
    if (storeId) {
      feedbacks = feedbacks.filter(f => f.storeId === storeId);
    }
    return feedbacks.map(f => ({
      ...f,
      stores: { name: mockStores.find(s => s.id === f.storeId)?.name },
      collaborators: { name: mockCollaborators.find(c => c.storeId === f.storeId)?.name }
    }));
  }
  
  let query = supabase
    .from('feedbacks')
    .select('*, stores(name), collaborators(name)')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const createFeedback = async (feedbackData) => {
  const { data, error } = await supabase
      .from('feedbacks')
    .insert([feedbackData])
    .select()
      .single();
    
  if (error) throw error;
  return data;
};

// ============ DAILY CHECKLISTS ============
export const fetchDailyChecklist = async (storeId, date) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const checklist = mockChecklists[storeId];
    if (!checklist) return null;
    return {
      store_id: storeId,
      date,
      tasks: checklist.tasks,
      gerencialTasks: checklist.gerencialTasks,
      is_audited: false
    };
  }
  
  const { data, error } = await supabase
    .from('daily_checklists')
    .select('*')
    .eq('store_id', storeId)
    .eq('date', date)
    .maybeSingle(); // Usa maybeSingle() ao invés de single() para evitar erros quando não há registro
  
  // maybeSingle() retorna null quando não há registro, sem gerar erro
  if (error) {
    throw error; // Apenas erros reais serão lançados
  }
  return data; // Retorna null se não houver registro, ou o objeto se houver
};

export const upsertDailyChecklist = async (storeId, date, tasks, gerencialTasks = null) => {
  // Primeiro, verificar se já existe um registro
  const existing = await fetchDailyChecklist(storeId, date);
  
  // Preparar dados para update/insert
  const updateData = { tasks };
  if (gerencialTasks !== null) {
    updateData.gerencialTasks = gerencialTasks;
  }
  
  if (existing) {
    // Se existe, fazer UPDATE
    // Preservar gerencialTasks existente se não foi fornecido
    if (gerencialTasks === null && existing.gerencialTasks) {
      updateData.gerencialTasks = existing.gerencialTasks;
    }
    
    const { data, error } = await supabase
      .from('daily_checklists')
      .update(updateData)
      .eq('store_id', storeId)
      .eq('date', date)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Se não existe, fazer INSERT
    const insertData = {
      store_id: storeId,
      date,
      tasks
    };
    if (gerencialTasks !== null) {
      insertData.gerencialTasks = gerencialTasks;
    }
    
    const { data, error } = await supabase
      .from('daily_checklists')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const fetchChecklistHistory = async (storeId, days = 7) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockChecklistHistory(storeId, days);
  }
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('daily_checklists')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: false });
    
    if (error) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return [];
      }
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de checklist:', error);
    return [];
  }
};

// ============ APP SETTINGS ============
export const fetchAppSettings = async (key) => {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Retornar dados mock específicos para cada chave
    if (key === 'patent_settings') {
      return mockSettings.patent_settings;
    }
    if (key === 'chave_content') {
      return { initialContent: mockSettings.chave_content };
    }
    if (key === 'menu_visibility') {
      return mockMenuVisibility;
    }
    if (key === 'job_roles') {
      return mockJobRoles;
    }
    if (key === 'daily_tasks') {
      return mockDailyTasks;
    }
    if (key === 'gerencial_tasks') {
      return mockGerencialTasks;
    }
    
    return mockSettings[key] || null;
  }
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', key)
    .maybeSingle(); // Usa maybeSingle() para evitar erros quando não há registro
  
  if (error) throw error; // Apenas erros reais serão lançados
  return data?.value; // Retorna undefined se não houver registro
};

export const upsertAppSettings = async (key, value) => {
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({
      key,
      value
    }, {
      onConflict: 'key'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ============ CURRENT USER ============
export const fetchCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('app_users')
    .select('*, stores(id, name, code)')
    .eq('id', user.id)
    .single();
  
  if (error) throw error;
  return data;
};

// ============ ALERTS ============
export const fetchUnreadAlerts = async (storeId) => {
  try {
    // Buscar alertas que não foram visualizados pela loja
    // Assumindo que existe uma tabela 'alert_views' para rastrear visualizações
    const { data: viewedAlerts, error: viewedError } = await supabase
      .from('alert_views')
      .select('alert_id')
      .eq('store_id', storeId);
    
    // Se a tabela não existir ou RLS bloquear, continuar sem filtrar visualizações (silenciosamente)
    if (viewedError) {
      if (viewedError.code === 'PGRST116' || viewedError.code === '42P01' || viewedError.code === '42501') {
        // Tabela não encontrada ou RLS bloqueando - não é crítico, continuar silenciosamente
        // Não logar erro para não poluir o console
      } else {
        console.warn('Erro ao buscar alertas visualizados:', viewedError);
      }
    }
    
    const viewedAlertIds = (viewedAlerts || []).map(v => v.alert_id);
    
    // Buscar todos os alertas (a coluna é store_ids - plural - e é um array)
    const { data: allAlertsData, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (alertsError) {
      // Se a tabela não existir, retornar array vazio
      if (alertsError.code === '42P01' || alertsError.code === 'PGRST116') {
        console.warn('Tabela de alertas não encontrada');
        return [];
      }
      throw alertsError;
    }
    
    // Filtrar alertas: globais (store_ids null ou vazio) ou que contenham o storeId
    const allAlerts = (allAlertsData || []).filter(alert => {
      // Se não tem store_ids ou está vazio, é global
      if (!alert.store_ids || alert.store_ids.length === 0) {
        return true;
      }
      // Se store_ids é um array e contém o storeId
      if (Array.isArray(alert.store_ids) && alert.store_ids.includes(storeId)) {
        return true;
      }
      return false;
    });
    
    // Remover duplicatas e filtrar alertas já visualizados e expirados
    const uniqueAlerts = Array.from(new Map(allAlerts.map(a => [a.id, a])).values());
    const now = new Date();
    
    const unreadAlerts = uniqueAlerts.filter(alert => {
      // Excluir alertas já visualizados
      if (viewedAlertIds.includes(alert.id)) {
        return false;
      }
      
      // Filtrar alertas expirados
      if (alert.expires_at) {
        return new Date(alert.expires_at) >= now;
      }
      
      return true;
    });
    
    // Ordenar por data de criação (mais recente primeiro)
    return unreadAlerts.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Erro ao buscar alertas não lidos:', error);
    // Retornar array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
};

export const markAlertAsViewed = async (alertId, storeId) => {
  try {
    // Criar registro de visualização
    const { data, error } = await supabase
      .from('alert_views')
      .insert({
        alert_id: alertId,
        store_id: storeId,
        viewed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      // Se a tabela não existir ou RLS bloquear, retornar objeto simulado sem logar erro
      if (error.code === '42P01' || error.code === 'PGRST116' || error.code === '42501') {
        // RLS bloqueando ou tabela não encontrada - não é crítico, retornar silenciosamente
        // Retornar objeto simulado para não quebrar a aplicação
        return { id: alertId, store_id: storeId, viewed_at: new Date().toISOString() };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    // Se for erro de RLS ou tabela não encontrada, não propagar o erro e retornar silenciosamente
    if (error.code === '42501' || error.code === '42P01' || error.code === 'PGRST116') {
      // Retornar objeto simulado sem logar erro
      return { id: alertId, store_id: storeId, viewed_at: new Date().toISOString() };
    }
    // Para outros erros, também retornar silenciosamente para não quebrar a UX
    // O importante é que o alerta seja removido da lista localmente
    return { id: alertId, store_id: storeId, viewed_at: new Date().toISOString() };
  }
};

// Buscar todos os alertas (para gerenciamento)
export const fetchAlerts = async () => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela de alertas não encontrada');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    // Retornar array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
};

// Criar novo alerta
export const createAlert = async (alertData) => {
  const alertPayload = {
    title: alertData.title,
    message: alertData.message,
    expires_at: alertData.expires_at || null,
    is_active: alertData.is_active !== undefined ? alertData.is_active : true,
    store_ids: alertData.store_ids && alertData.store_ids.length > 0 ? alertData.store_ids : null,
    franqueado_names: alertData.franqueado_names && alertData.franqueado_names.length > 0 ? alertData.franqueado_names : null,
    bandeira_names: alertData.bandeira_names && alertData.bandeira_names.length > 0 ? alertData.bandeira_names : null
  };
  
  const { data, error } = await supabase
    .from('alerts')
    .insert([alertPayload])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Atualizar alerta existente
export const updateAlert = async (id, alertData) => {
  const updatePayload = {
    title: alertData.title,
    message: alertData.message,
    expires_at: alertData.expires_at || null,
    is_active: alertData.is_active !== undefined ? alertData.is_active : true,
    store_ids: alertData.store_ids && alertData.store_ids.length > 0 ? alertData.store_ids : null,
    franqueado_names: alertData.franqueado_names && alertData.franqueado_names.length > 0 ? alertData.franqueado_names : null,
    bandeira_names: alertData.bandeira_names && alertData.bandeira_names.length > 0 ? alertData.bandeira_names : null
  };
  
  const { data, error } = await supabase
    .from('alerts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Deletar alerta
export const deleteAlert = async (id) => {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Buscar visualizações de um alerta específico
export const fetchAlertViews = async (alertId) => {
  try {
    // Buscar apenas as visualizações básicas com informações da loja
    // Não tentar fazer join com app_users pois pode não haver relacionamento
    const { data: views, error: viewsError } = await supabase
      .from('alert_views')
      .select('*, store:stores(id, name, code, bandeira, franqueado)')
      .eq('alert_id', alertId)
      .order('viewed_at', { ascending: false });
    
    if (viewsError) {
      // Se a tabela não existir, RLS bloquear ou houver erro, retornar array vazio (silenciosamente)
      if (viewsError.code === '42P01' || viewsError.code === 'PGRST116' || viewsError.code === 'PGRST200' || viewsError.code === '42501') {
        // Não logar erro de RLS para não poluir o console
        return [];
      }
      throw viewsError;
    }
    
    // Se houver user_id nas visualizações, tentar buscar informações do usuário separadamente
    if (views && views.length > 0 && views.some(v => v.user_id)) {
      const viewsWithUser = await Promise.all(
        views.map(async (view) => {
          // Se não houver user_id, retornar como está
          if (!view.user_id) {
            return { ...view, user: null };
          }
          
          // Tentar buscar informações do usuário na tabela app_users se existir
          try {
            const { data: appUser, error: userError } = await supabase
              .from('app_users')
              .select('id, username, email')
              .eq('id', view.user_id)
              .single();
            
            // Se não houver erro e encontrar usuário, adicionar informações
            if (!userError && appUser) {
              return { ...view, user: appUser };
            }
          } catch (err) {
            // Se não conseguir buscar, continuar sem informações do usuário
            // Não logar erro para não poluir o console
          }
          
          // Retornar sem informações do usuário se não conseguir buscar
          return { ...view, user: null };
        })
      );
      
      return viewsWithUser || [];
    }
    
    // Se não houver user_id ou não conseguir buscar, retornar views sem informações de usuário
    return (views || []).map(view => ({ ...view, user: null }));
  } catch (error) {
    console.error('Erro ao buscar visualizações:', error);
    // Se houver erro, retornar array vazio para não quebrar a aplicação
    return [];
  }
};

// Buscar destinatários de um alerta (lojas que devem receber o alerta)
export const fetchAlertRecipients = async (alertId) => {
  // Buscar o alerta primeiro
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select('store_ids, franqueado_names, bandeira_names')
    .eq('id', alertId)
    .single();
  
  if (alertError) throw alertError;
  
  // Se não tem filtros, retornar todas as lojas
  if ((!alert.store_ids || alert.store_ids.length === 0) && 
      (!alert.franqueado_names || alert.franqueado_names.length === 0) &&
      (!alert.bandeira_names || alert.bandeira_names.length === 0)) {
    const { data: allStores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .order('name');
    
    if (storesError) throw storesError;
    return allStores || [];
  }
  
  // Buscar todas as lojas e filtrar em memória (mais flexível para múltiplos critérios OR)
  const { data: allStores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  
  if (storesError) throw storesError;
  
  // Filtrar lojas que correspondem a qualquer um dos critérios
  const filteredStores = (allStores || []).filter(store => {
    // Se tem lojas específicas e a loja está na lista
    if (alert.store_ids && alert.store_ids.length > 0) {
      if (alert.store_ids.includes(store.id)) {
        return true;
      }
    }
    
    // Se tem franqueados e a loja pertence a um dos franqueados
    if (alert.franqueado_names && alert.franqueado_names.length > 0) {
      if (store.franqueado && alert.franqueado_names.includes(store.franqueado)) {
        return true;
      }
    }
    
    // Se tem bandeiras e a loja pertence a uma das bandeiras
    if (alert.bandeira_names && alert.bandeira_names.length > 0) {
      if (store.bandeira && alert.bandeira_names.includes(store.bandeira)) {
        return true;
      }
    }
    
    return false;
  });
  
  return filteredStores;
};

// ============ NON CONVERSION REPORTS ============
export const fetchNonConversionRecords = async (storeId, startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('non_conversion_records')
      .select('*')
      .eq('store_id', storeId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) {
      const startDateStr = typeof startDate === 'string' 
        ? startDate 
        : format(startDate, 'yyyy-MM-dd');
      query = query.gte('date', startDateStr);
    }

    if (endDate) {
      const endDateStr = typeof endDate === 'string' 
        ? endDate 
        : format(endDate, 'yyyy-MM-dd');
      query = query.lte('date', endDateStr);
    }

    const { data, error } = await query;

    if (error) {
      // Se a tabela não existir, retornar array vazio
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela non_conversion_records não encontrada');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar registros de não conversão:', error);
    return [];
  }
};

export const createNonConversionRecord = async (recordData) => {
  try {
    const { data, error } = await supabase
      .from('non_conversion_records')
      .insert([{
        ...recordData,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      // Se a tabela não existir, apenas logar o erro
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela non_conversion_records não encontrada:', error);
        throw new Error('Tabela de registros de não conversão não encontrada. Verifique se a tabela foi criada no banco de dados.');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar registro de não conversão:', error);
    throw error;
  }
};

// ============ RETURNS PLANNER ============
export const fetchReturnsPlanner = async () => {
  const { data, error } = await supabase
    .from('returns_planner')
    .select('*, stores(name, code)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createReturnsPlanner = async (plannerData) => {
  const { data, error } = await supabase
    .from('returns_planner')
    .insert([plannerData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReturnsPlanner = async (id, updates) => {
  const { data, error } = await supabase
    .from('returns_planner')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteReturnsPlanner = async (id) => {
  const { error } = await supabase
    .from('returns_planner')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ RETURNS (PENDING RETURNS) ============
export const fetchReturns = async () => {
  const { data, error } = await supabase
    .from('returns')
    .select('*, stores(name, code)')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createReturn = async (returnData) => {
  const { data, error } = await supabase
    .from('returns')
    .insert([returnData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReturn = async (id, updates) => {
  const { data, error } = await supabase
    .from('returns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteReturn = async (id) => {
  const { error } = await supabase
    .from('returns')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ PATRIMONY (EQUIPMENTS) ============
export const fetchEquipments = async (storeId = null) => {
  let query = supabase
    .from('equipments')
    .select('*, stores(id, name, code)')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const createEquipment = async (equipmentData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('equipments')
    .insert([{
      ...equipmentData,
      created_by: user?.id,
      updated_by: user?.id
    }])
    .select('*, stores(id, name, code)')
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEquipment = async (id, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('equipments')
    .update({
      ...updates,
      updated_by: user?.id
    })
    .eq('id', id)
    .select('*, stores(id, name, code)')
    .single();
  
  if (error) throw error;
  return data;
};

// Função específica para lojas atualizarem apenas o status de condição
export const updateEquipmentCondition = async (id, conditionStatus) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Erro de autenticação:', authError);
    throw new Error('Usuário não autenticado');
  }
  
  console.log('🔄 [updateEquipmentCondition] Atualizando:', { id, conditionStatus, userId: user.id });
  
  // Fazer o UPDATE - garantir que está sendo persistido
  // Primeiro fazer UPDATE sem SELECT para garantir persistência
  const { error: updateError } = await supabase
    .from('equipments')
    .update({
      condition_status: conditionStatus,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (updateError) {
    console.error('❌ [updateEquipmentCondition] Erro ao atualizar:', updateError);
    console.error('❌ [updateEquipmentCondition] Detalhes do erro:', {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint
    });
    throw updateError;
  }
  
  console.log('✅ [updateEquipmentCondition] UPDATE bem-sucedido - dados persistidos no banco');
  
  // Tentar buscar dados atualizados (pode falhar por RLS, mas não é crítico)
  try {
    const { data: updateData } = await supabase
      .from('equipments')
      .select('id, condition_status, updated_at, updated_by')
      .eq('id', id)
      .single();
    
    if (updateData) {
      console.log('✅ [updateEquipmentCondition] Dados confirmados:', updateData);
      return updateData;
    }
  } catch (selectError) {
    console.log('⚠️ [updateEquipmentCondition] SELECT bloqueado por RLS (não crítico, UPDATE já foi feito)');
  }
  
  // Retornar dados básicos mesmo se SELECT falhar
  return {
    id,
    condition_status: conditionStatus,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  };
};

export const deleteEquipment = async (id) => {
  const { error } = await supabase
    .from('equipments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ EQUIPMENT TYPES MANAGEMENT ============
export const fetchEquipmentTypes = async () => {
  const { data, error } = await supabase
    .from('equipment_types')
    .select('*')
    .order('is_custom', { ascending: true })
    .order('label', { ascending: true });
  
  if (error) {
    // Se a tabela não existir, retornar tipos padrão
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
  return data || [];
};

export const createEquipmentType = async (equipmentTypeData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('equipment_types')
    .insert([{
      ...equipmentTypeData,
      is_custom: true,
      created_by: user?.id
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateEquipmentType = async (id, updates) => {
  const { data, error } = await supabase
    .from('equipment_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteEquipmentType = async (id) => {
  // Buscar o tipo primeiro para verificar o nome
  const { data: typeData, error: fetchError } = await supabase
    .from('equipment_types')
    .select('name')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;
  
  if (!typeData) {
    throw new Error('Tipo de equipamento não encontrado.');
  }
  
  // Verificar se há equipamentos usando este tipo (pelo nome, não pelo ID)
  const { data: equipments } = await supabase
    .from('equipments')
    .select('id')
    .eq('equipment_type', typeData.name)
    .limit(1);
  
  if (equipments && equipments.length > 0) {
    throw new Error('Não é possível excluir este tipo pois existem equipamentos cadastrados com ele.');
  }
  
  const { error } = await supabase
    .from('equipment_types')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ PATRIMONY (CHIPS) ============
export const fetchChips = async (storeId = null) => {
  let query = supabase
    .from('chips')
    .select('*, stores(id, name, code)')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const createChip = async (chipData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('chips')
    .insert([{
      ...chipData,
      created_by: user?.id,
      updated_by: user?.id
    }])
    .select('*, stores(id, name, code)')
    .single();
  
  if (error) throw error;
  return data;
};

export const updateChip = async (id, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('chips')
    .update({
      ...updates,
      updated_by: user?.id
    })
    .eq('id', id)
    .select('*, stores(id, name, code)')
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteChip = async (id) => {
  const { error } = await supabase
    .from('chips')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ PHYSICAL MISSING ============
export const fetchPhysicalMissing = async (storeId = null) => {
  let query = supabase
    .from('physical_missing')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const createPhysicalMissing = async (missingData) => {
  const { data, error } = await supabase
    .from('physical_missing')
    .insert([missingData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePhysicalMissing = async (id, updates) => {
  const { data, error } = await supabase
    .from('physical_missing')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deletePhysicalMissing = async (id, nfNumber = null, storeId = null) => {
  let query = supabase
    .from('physical_missing')
    .delete();
  
  // Se nfNumber e storeId forem fornecidos, deletar todos os registros da mesma NF
  if (nfNumber && storeId) {
    query = query.eq('nf_number', nfNumber).eq('store_id', storeId);
  } else {
    query = query.eq('id', id);
  }
  
  const { error } = await query;
  
  if (error) throw error;
};

// ============ TRAININGS ============
export const fetchTrainings = async () => {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('training_date', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createTraining = async (trainingData) => {
  const { data, error } = await supabase
    .from('trainings')
    .insert([{
      title: trainingData.title,
      description: trainingData.description || null,
      training_date: trainingData.trainingDate,
      time: trainingData.time || null,
      format: trainingData.format,
      link: trainingData.format === 'online' ? trainingData.link : null,
      location: trainingData.format === 'presencial' ? trainingData.location : null,
      brand: trainingData.brand || null,
      store_ids: trainingData.storeIds && trainingData.storeIds.length > 0 ? JSON.stringify(trainingData.storeIds) : null,
      max_participants: trainingData.maxParticipants ? parseInt(trainingData.maxParticipants) : null,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTraining = async (id, updates) => {
  const updateData = {};
  const trainingFormat = updates.format !== undefined ? updates.format : null;
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.trainingDate !== undefined) updateData.training_date = updates.trainingDate;
  if (updates.time !== undefined) updateData.time = updates.time;
  if (updates.format !== undefined) updateData.format = updates.format;
  if (updates.link !== undefined) updateData.link = trainingFormat === 'online' ? updates.link : null;
  if (updates.location !== undefined) updateData.location = trainingFormat === 'presencial' ? updates.location : null;
  if (updates.brand !== undefined) updateData.brand = updates.brand;
  if (updates.storeIds !== undefined) {
    updateData.store_ids = updates.storeIds && updates.storeIds.length > 0 ? JSON.stringify(updates.storeIds) : null;
  }
  if (updates.maxParticipants !== undefined) {
    updateData.max_participants = updates.maxParticipants ? parseInt(updates.maxParticipants) : null;
  }
  
  const { data, error } = await supabase
    .from('trainings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTraining = async (id) => {
  const { error } = await supabase
    .from('trainings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ TRAINING REGISTRATIONS ============
export const fetchTrainingRegistrations = async () => {
  const { data, error } = await supabase
    .from('training_registrations')
    .select('*, trainings(*), collaborators(*), stores(*)')
    .order('registered_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createTrainingRegistration = async (registrationData) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .insert([{
      training_id: registrationData.trainingId,
      collaborator_id: registrationData.collaboratorId,
      store_id: registrationData.storeId,
      status: registrationData.status || 'pending',
    }])
    .select('*, trainings(*), collaborators(*), stores(*)')
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTrainingRegistration = async (id, updates) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .update(updates)
    .eq('id', id)
    .select('*, trainings(*), collaborators(*), stores(*)')
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteTrainingRegistration = async (id) => {
  const { error } = await supabase
    .from('training_registrations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
