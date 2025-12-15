
import { supabase } from '@/lib/customSupabaseClient';

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
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
};

export const upsertDailyChecklist = async (storeId, date, tasks) => {
  const { data, error } = await supabase
          .from('daily_checklists')
    .upsert({
          store_id: storeId,
          date,
      tasks
    }, {
      onConflict: 'store_id,date'
    })
    .select()
      .single();
  
  if (error) throw error;
  return data;
};

// ============ APP SETTINGS ============
export const fetchAppSettings = async (key) => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', key)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value;
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
export const fetchAlerts = async () => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createAlert = async (alertData) => {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alertData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAlert = async (id, updates) => {
  const { data, error } = await supabase
    .from('alerts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteAlert = async (id) => {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const fetchAlertViews = async (alertId) => {
  const { data, error } = await supabase
    .from('alert_views')
    .select('*, app_users(username), stores(name, code)')
    .eq('alert_id', alertId)
    .order('viewed_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const fetchAlertRecipients = async (alertId) => {
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select('store_ids, franqueado_names, bandeira_names')
    .eq('id', alertId)
    .single();
  
  if (alertError || !alert) return [];
  
  let query = supabase
    .from('stores')
    .select('id, name, code, franqueado, bandeira');
  
  const filters = [];
  
  // Se há lojas específicas, filtrar por elas
  if (alert.store_ids && Array.isArray(alert.store_ids) && alert.store_ids.length > 0) {
    query = query.in('id', alert.store_ids);
  }
  
  // Se há franqueados específicos, filtrar por eles
  if (alert.franqueado_names && Array.isArray(alert.franqueado_names) && alert.franqueado_names.length > 0) {
    query = query.in('franqueado', alert.franqueado_names);
  }
  
  // Se há bandeiras específicas, filtrar por elas
  if (alert.bandeira_names && Array.isArray(alert.bandeira_names) && alert.bandeira_names.length > 0) {
    query = query.in('bandeira', alert.bandeira_names);
  }
  
  // Se não há filtros específicos, retornar todas as lojas
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

export const fetchUnreadAlerts = async (storeId) => {
  if (!storeId) return [];
  
  // Buscar a loja para obter franqueado e bandeira
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, franqueado, bandeira')
    .eq('id', storeId)
    .single();
  
  if (storeError || !store) return [];
  
  // Buscar alertas ativos que se aplicam a esta loja
  const { data: allAlerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (alertsError) throw alertsError;
  if (!allAlerts || allAlerts.length === 0) return [];
  
  // Filtrar alertas que se aplicam a esta loja
  const applicableAlerts = allAlerts.filter(alert => {
    // Verificar se o alerta se aplica à loja específica
    if (alert.store_ids && alert.store_ids.length > 0) {
      if (!alert.store_ids.includes(storeId)) return false;
    }
    
    // Verificar se o alerta se aplica ao franqueado
    if (alert.franqueado_names && alert.franqueado_names.length > 0) {
      if (!alert.franqueado_names.includes(store.franqueado)) return false;
    }
    
    // Verificar se o alerta se aplica à bandeira
    if (alert.bandeira_names && alert.bandeira_names.length > 0) {
      if (!alert.bandeira_names.includes(store.bandeira)) return false;
    }
    
    // Se não há filtros específicos, o alerta se aplica a todas as lojas
    return true;
  });
  
  // Buscar visualizações existentes para esta loja
  const { data: views, error: viewsError } = await supabase
    .from('alert_views')
    .select('alert_id')
    .eq('store_id', storeId);
  
  if (viewsError) throw viewsError;
  
  const viewedAlertIds = new Set((views || []).map(v => v.alert_id));
  
  // Filtrar apenas alertas não visualizados
  const unreadAlerts = applicableAlerts.filter(alert => {
    // Verificar se expirou
    if (alert.expires_at && new Date(alert.expires_at) < new Date()) {
      return false;
    }
    
    // Verificar se já foi visualizado
    return !viewedAlertIds.has(alert.id);
  });
  
  return unreadAlerts;
};

export const markAlertAsViewed = async (alertId, storeId) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !storeId) {
    throw new Error('Usuário ou loja não identificados');
  }
  
  // Verificar se já existe uma visualização
  const { data: existingView } = await supabase
    .from('alert_views')
    .select('id')
    .eq('alert_id', alertId)
    .eq('store_id', storeId)
    .single();
  
  if (existingView) {
    // Atualizar visualização existente
    const { data, error } = await supabase
      .from('alert_views')
      .update({ 
        viewed_at: new Date().toISOString(),
        user_id: user.id
      })
      .eq('id', existingView.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Criar nova visualização
    const { data, error } = await supabase
      .from('alert_views')
      .insert([{
        alert_id: alertId,
        store_id: storeId,
        user_id: user.id,
        viewed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
