
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';

// ============ STORES ============
export const fetchStores = async () => {
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
  const { data, error } = await supabase
    .from('app_users')
    .select('*, stores(name)')
    .order('username');
  
  if (error) throw error;
  return data || [];
};

export const createAppUser = async (email, password, userData) => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
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

// ============ FORMS ============
export const fetchForms = async () => {
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
    
    // Se a tabela não existir, continuar sem filtrar visualizações
    if (viewedError && viewedError.code !== 'PGRST116' && viewedError.code !== '42P01') {
      console.warn('Erro ao buscar alertas visualizados:', viewedError);
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
      // Se a tabela não existir, apenas logar o erro mas não quebrar
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.warn('Tabela alert_views não encontrada:', error);
        return { id: alertId, store_id: storeId, viewed_at: new Date().toISOString() };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao marcar alerta como visualizado:', error);
    throw error;
  }
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
