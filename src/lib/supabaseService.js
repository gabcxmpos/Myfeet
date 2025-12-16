
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';

// ============ STORES ============
export const fetchStores = async () => {
  console.log('🔍 [fetchStores] Buscando lojas...');
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('code', { ascending: true });  // Ordenar por código em ordem crescente
  
  if (error) {
    console.error('❌ [fetchStores] Erro ao buscar lojas:', error);
    throw error;
  }
  
  console.log('✅ [fetchStores] Lojas encontradas:', data?.length || 0);
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
    .select('*')
    .order('username');
  
  if (error) throw error;
  
  // Retornar dados simples - o código não precisa de relacionamento aninhado
  // Se necessário, as lojas podem ser buscadas separadamente
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
  console.log('🔍 [fetchForms] Buscando formulários...');
  
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ [fetchForms] Erro ao buscar formulários:', error);
    throw error;
  }
  
  console.log('✅ [fetchForms] Formulários encontrados:', data?.length || 0);
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
  console.log('🔍 [fetchEvaluations] Buscando avaliações...');
  
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ [fetchEvaluations] Erro ao buscar avaliações:', error);
    throw error;
  }
  
  console.log('✅ [fetchEvaluations] Avaliações encontradas:', data?.length || 0);
  
  // Buscar informações relacionadas separadamente se necessário
  if (data && data.length > 0) {
    const storeIds = [...new Set(data.filter(e => e.storeId || e.store_id).map(e => e.storeId || e.store_id))];
    const userIds = [...new Set(data.filter(e => e.userId || e.user_id).map(e => e.userId || e.user_id))];
    
    const storesMap = new Map();
    const usersMap = new Map();
    
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, code')
        .in('id', storeIds);
      
      if (storesData) {
        storesData.forEach(s => storesMap.set(s.id, s));
      }
    }
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, username')
        .in('id', userIds);
      
      if (usersData) {
        usersData.forEach(u => usersMap.set(u.id, u));
      }
    }
    
    return data.map(evaluation => {
      // Normalizar campos - aceitar tanto camelCase quanto snake_case
      const storeId = evaluation.storeId || evaluation.store_id;
      const userId = evaluation.userId || evaluation.user_id;
      
      const store = storeId && storesMap.get(storeId) ? storesMap.get(storeId) : null;
      const user = userId && usersMap.get(userId) ? usersMap.get(userId) : null;
      
      // Garantir que storeId e userId estejam presentes no objeto retornado
      return {
        ...evaluation,
        storeId: storeId || evaluation.storeId || evaluation.store_id,
        store_id: storeId || evaluation.storeId || evaluation.store_id,
        userId: userId || evaluation.userId || evaluation.user_id,
        user_id: userId || evaluation.userId || evaluation.user_id,
        stores: store ? { name: store.name, code: store.code } : null,
        app_user: user ? { username: user.username } : null  // Formato esperado: app_user (singular)
      };
    });
  }
  
  // Se não há dados, retornar array vazio
  if (!data || data.length === 0) {
    console.log('⚠️ [fetchEvaluations] Nenhuma avaliação encontrada no banco');
    return [];
  }
  
  // Se há dados mas não passou pelo processamento acima, retornar dados originais
  console.log('⚠️ [fetchEvaluations] Retornando dados sem processamento de relacionamentos');
  return data || [];
};

export const createEvaluation = async (evaluationData) => {
  // Normalizar campos para snake_case (formato do banco)
  const normalizedData = {
    ...evaluationData,
    store_id: evaluationData.store_id || evaluationData.storeId,
    form_id: evaluationData.form_id || evaluationData.formId,
    // user_id não existe na tabela evaluations, então não incluímos
  };
  
  // Remover campos camelCase duplicados se existirem
  delete normalizedData.storeId;
  delete normalizedData.formId;
  delete normalizedData.userId; // Remover se existir, mas não enviar ao banco
  delete normalizedData.user_id; // Garantir que não seja enviado
  
  const { data, error } = await supabase
    .from('evaluations')
    .insert([normalizedData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ [createEvaluation] Erro ao criar avaliação:', error);
    throw error;
  }
  
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
  console.log('🔍 [fetchFeedbacks] Buscando feedbacks...', storeId ? `para loja ${storeId}` : 'todas');
  
  let query = supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ [fetchFeedbacks] Erro ao buscar feedbacks:', error);
    throw error;
  }
  
  console.log('✅ [fetchFeedbacks] Feedbacks encontrados:', data?.length || 0);
  
  // Buscar informações relacionadas separadamente se necessário
  if (data && data.length > 0) {
    const storeIds = [...new Set(data.filter(f => f.storeId || f.store_id).map(f => f.storeId || f.store_id))];
    const collaboratorIds = [...new Set(data.filter(f => f.collaboratorId || f.collaborator_id).map(f => f.collaboratorId || f.collaborator_id))];
    
    const storesMap = new Map();
    const collaboratorsMap = new Map();
    
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', storeIds);
      
      if (storesData) {
        storesData.forEach(s => storesMap.set(s.id, s));
      }
    }
    
    if (collaboratorIds.length > 0) {
      const { data: collaboratorsData } = await supabase
        .from('collaborators')
        .select('id, name')
        .in('id', collaboratorIds);
      
      if (collaboratorsData) {
        collaboratorsData.forEach(c => collaboratorsMap.set(c.id, c));
      }
    }
    
    return data.map(feedback => ({
      ...feedback,
      stores: feedback.storeId || feedback.store_id ? (storesMap.get(feedback.storeId || feedback.store_id) ? {
        name: storesMap.get(feedback.storeId || feedback.store_id).name
      } : null) : null,
      collaborators: feedback.collaboratorId || feedback.collaborator_id ? (collaboratorsMap.get(feedback.collaboratorId || feedback.collaborator_id) ? {
        name: collaboratorsMap.get(feedback.collaboratorId || feedback.collaborator_id).name
      } : null) : null
    }));
  }
  
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
  // Tentar buscar com todas as colunas, mas se gerencialTasks não existir, buscar apenas tasks
  let { data, error } = await supabase
    .from('daily_checklists')
    .select('id, store_id, date, tasks, gerencialTasks')
    .eq('store_id', storeId)
    .eq('date', date)
    .maybeSingle();
  
  // Se erro for de coluna não encontrada, tentar sem gerencialTasks
  if (error && (error.code === 'PGRST204' || error.message?.includes('gerencialTasks'))) {
    console.warn('⚠️ [fetchDailyChecklist] Coluna gerencialTasks não encontrada, buscando apenas tasks');
    const retry = await supabase
      .from('daily_checklists')
      .select('id, store_id, date, tasks')
      .eq('store_id', storeId)
      .eq('date', date)
      .maybeSingle();
    
    if (retry.error && retry.error.code !== 'PGRST116') {
      console.error('❌ [fetchDailyChecklist] Erro ao buscar checklist:', retry.error);
      throw retry.error;
    }
    
    // Se encontrou dados mas sem gerencialTasks, adicionar como objeto vazio
    if (retry.data) {
      return {
        ...retry.data,
        gerencialTasks: {}
      };
    }
    
    return retry.data || null;
  }
  
  if (error && error.code !== 'PGRST116') {
    console.error('❌ [fetchDailyChecklist] Erro ao buscar checklist:', error);
    throw error;
  }
  
  // Garantir que gerencialTasks existe mesmo se não veio do banco
  if (data && !data.gerencialTasks) {
    data.gerencialTasks = {};
  }
  
  return data || null;
};

export const upsertDailyChecklist = async (storeId, date, checklistData) => {
  // checklistData pode ser um objeto com { tasks, gerencialTasks } ou apenas tasks (objeto de tasks)
  let tasks = {};
  let gerencialTasks = null;
  
  if (checklistData && typeof checklistData === 'object') {
    // Se tem propriedade tasks, usar ela
    if ('tasks' in checklistData) {
      tasks = checklistData.tasks || {};
      gerencialTasks = checklistData.gerencialTasks || null;
    } 
    // Se não tem propriedade tasks mas tem gerencialTasks, então checklistData é tasks
    else if ('gerencialTasks' in checklistData) {
      tasks = {};
      gerencialTasks = checklistData.gerencialTasks;
    }
    // Se não tem nenhuma propriedade conhecida, assumir que é um objeto de tasks
    else {
      tasks = checklistData;
      gerencialTasks = null;
    }
  }
  
  // Primeiro, verificar se já existe um registro para esta loja e data
  const existing = await fetchDailyChecklist(storeId, date);
  
  // Preparar dados para update/insert
  const updateData = {
    tasks: tasks || {}
  };
  
  // Tentar adicionar gerencialTasks apenas se foi passado
  // Se a coluna não existir, o Supabase vai ignorar ou dar erro, mas vamos tratar
  if (gerencialTasks !== null) {
    updateData.gerencialTasks = gerencialTasks;
  } else if (existing && existing.gerencialTasks) {
    // Preservar gerencialTasks existente se não foi passado novo valor
    updateData.gerencialTasks = existing.gerencialTasks;
  }
  
  if (existing) {
    // Se existe, fazer update
    let { data, error } = await supabase
      .from('daily_checklists')
      .update(updateData)
      .eq('store_id', storeId)
      .eq('date', date)
      .select('id, store_id, date, tasks, gerencialTasks')
      .single();
    
    // Se erro for de coluna não encontrada, tentar sem gerencialTasks
    if (error && (error.code === 'PGRST204' || error.message?.includes('gerencialTasks'))) {
      console.warn('⚠️ [upsertDailyChecklist] Coluna gerencialTasks não encontrada, salvando apenas tasks');
      const { tasks: tasksOnly } = updateData;
      const retry = await supabase
        .from('daily_checklists')
        .update({ tasks: tasksOnly })
        .eq('store_id', storeId)
        .eq('date', date)
        .select('id, store_id, date, tasks')
        .single();
      
      if (retry.error) {
        console.error('❌ [upsertDailyChecklist] Erro ao atualizar checklist:', retry.error);
        throw retry.error;
      }
      
      // Adicionar gerencialTasks vazio para manter compatibilidade
      return {
        ...retry.data,
        gerencialTasks: existing.gerencialTasks || {}
      };
    }
    
    if (error) {
      console.error('❌ [upsertDailyChecklist] Erro ao atualizar checklist:', error);
      throw error;
    }
    
    // Garantir que gerencialTasks existe na resposta
    if (data && !data.gerencialTasks) {
      data.gerencialTasks = existing.gerencialTasks || {};
    }
    
    console.log('✅ [upsertDailyChecklist] Checklist atualizado:', { storeId, date, updateData });
    return data;
  } else {
    // Se não existe, fazer insert
    const insertData = {
      store_id: storeId,
      date,
      tasks: tasks || {}
    };
    
    // Tentar adicionar gerencialTasks se foi passado
    if (gerencialTasks !== null) {
      insertData.gerencialTasks = gerencialTasks;
    }
    
    let { data, error } = await supabase
      .from('daily_checklists')
      .insert(insertData)
      .select('id, store_id, date, tasks, gerencialTasks')
      .single();
    
    // Se erro for de coluna não encontrada, tentar sem gerencialTasks
    if (error && (error.code === 'PGRST204' || error.message?.includes('gerencialTasks'))) {
      console.warn('⚠️ [upsertDailyChecklist] Coluna gerencialTasks não encontrada, criando apenas com tasks');
      const { gerencialTasks: _, ...insertWithoutGerencial } = insertData;
      const retry = await supabase
        .from('daily_checklists')
        .insert(insertWithoutGerencial)
        .select('id, store_id, date, tasks')
        .single();
      
      if (retry.error) {
        console.error('❌ [upsertDailyChecklist] Erro ao criar checklist:', retry.error);
        throw retry.error;
      }
      
      // Adicionar gerencialTasks vazio para manter compatibilidade
      return {
        ...retry.data,
        gerencialTasks: {}
      };
    }
    
    if (error) {
      console.error('❌ [upsertDailyChecklist] Erro ao criar checklist:', error);
      throw error;
    }
    
    // Garantir que gerencialTasks existe na resposta
    if (data && !data.gerencialTasks) {
      data.gerencialTasks = {};
    }
    
    console.log('✅ [upsertDailyChecklist] Checklist criado:', { storeId, date, insertData });
    return data;
  }
};

// Buscar histórico de checklists dos últimos N dias
export const fetchChecklistHistory = async (storeId, days = 7) => {
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
  
  if (error) throw error;
  return data || [];
};

// ============ APP SETTINGS ============
export const fetchAppSettings = async (key) => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle(); // Usar maybeSingle ao invés de single para não dar erro quando não existe
    
    // Se não encontrou registro ou erro específico de "não encontrado", retornar null
    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST200') {
      console.warn(`Erro ao buscar app_settings para key "${key}":`, error);
      return null;
    }
    
    return data?.value || null;
  } catch (err) {
    console.warn(`Erro ao buscar app_settings para key "${key}":`, err);
    return null;
  }
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
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [fetchCurrentUserProfile] Erro ao obter usuário do auth:', authError);
      throw authError;
    }
    
    if (!user) {
      console.warn('⚠️ [fetchCurrentUserProfile] Nenhum usuário autenticado');
      return null;
    }
    
    console.log('🔍 [fetchCurrentUserProfile] Buscando perfil para usuário:', user.id);
    
    // Usar maybeSingle para não dar erro se não encontrar
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('❌ [fetchCurrentUserProfile] Erro ao buscar perfil:', error);
      throw error;
    }
    
    if (!data) {
      console.warn('⚠️ [fetchCurrentUserProfile] Perfil não encontrado para usuário:', user.id);
      return null;
    }
    
    console.log('✅ [fetchCurrentUserProfile] Perfil encontrado:', {
      id: data.id,
      username: data.username,
      role: data.role,
      store_id: data.store_id
    });
    
    // Buscar informações da loja separadamente se necessário
    if (data && data.store_id) {
      console.log('🔍 [fetchCurrentUserProfile] Buscando dados da loja:', data.store_id);
      
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, code')
        .eq('id', data.store_id)
        .maybeSingle();
      
      if (storeError) {
        console.warn('⚠️ [fetchCurrentUserProfile] Erro ao buscar loja:', storeError);
      } else if (storeData) {
        console.log('✅ [fetchCurrentUserProfile] Loja encontrada:', storeData);
        return {
          ...data,
          store: storeData  // Formato esperado pelo código: store (singular)
        };
      } else {
        console.warn('⚠️ [fetchCurrentUserProfile] Loja não encontrada para store_id:', data.store_id);
      }
    }
    
    console.log('✅ [fetchCurrentUserProfile] Retornando perfil sem loja');
    return data;
  } catch (error) {
    console.error('❌ [fetchCurrentUserProfile] Erro completo:', error);
    throw error;
  }
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
    .select('*')
    .eq('alert_id', alertId)
    .order('viewed_at', { ascending: false });
  
  if (error) throw error;
  
  // Buscar informações relacionadas separadamente se necessário
  if (data && data.length > 0) {
    const userIds = [...new Set(data.filter(v => v.user_id).map(v => v.user_id))];
    const storeIds = [...new Set(data.filter(v => v.store_id).map(v => v.store_id))];
    
    const usersMap = new Map();
    const storesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, username')
        .in('id', userIds);
      
      if (usersData) {
        usersData.forEach(u => usersMap.set(u.id, u));
      }
    }
    
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name, code')
        .in('id', storeIds);
      
      if (storesData) {
        storesData.forEach(s => storesMap.set(s.id, s));
      }
    }
    
    return data.map(view => ({
      ...view,
      app_users: view.user_id ? (usersMap.get(view.user_id) ? {
        username: usersMap.get(view.user_id).username
      } : null) : null,
      stores: view.store_id ? (storesMap.get(view.store_id) ? {
        name: storesMap.get(view.store_id).name,
        code: storesMap.get(view.store_id).code
      } : null) : null
    }));
  }
  
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

// ============ TRAININGS ============
export const fetchTrainings = async () => {
  try {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Se a tabela não existe ou coluna não existe, retornar array vazio
      if (error.code === '42P01' || error.code === '42703') {
        console.warn('⚠️ [fetchTrainings] Tabela ou coluna não existe:', error.message);
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.warn('Erro ao buscar trainings:', error);
    return [];
  }
};

export const createTraining = async (trainingData) => {
  const { data, error } = await supabase
    .from('trainings')
    .insert([trainingData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTraining = async (id, updates) => {
  const { data, error } = await supabase
    .from('trainings')
    .update(updates)
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
  try {
    const { data, error } = await supabase
      .from('training_registrations')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      // Se a tabela não existe ou coluna não existe, retornar array vazio
      if (error.code === '42P01' || error.code === '42703') {
        console.warn('⚠️ [fetchTrainingRegistrations] Tabela ou coluna não existe:', error.message);
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.warn('Erro ao buscar training_registrations:', error);
    return [];
  }
};

export const createTrainingRegistration = async (registrationData) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .insert([registrationData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateTrainingRegistration = async (id, updates) => {
  const { data, error } = await supabase
    .from('training_registrations')
    .update(updates)
    .eq('id', id)
    .select()
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

// ============ JOB ROLES ============
export const fetchJobRoles = async () => {
  try {
    const jobRolesSetting = await fetchAppSettings('job_roles');
    if (jobRolesSetting && Array.isArray(jobRolesSetting)) {
      return jobRolesSetting;
    }
    return [];
  } catch (error) {
    console.warn('Erro ao buscar job_roles:', error);
    return [];
  }
};

export const updateJobRoles = async (roles) => {
  return await upsertAppSettings('job_roles', roles);
};

// ============ RETURNS ============
export const fetchReturns = async () => {
  console.log('🔍 [fetchReturns] Buscando devoluções...');
  
  try {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Se a tabela não existe, retornar array vazio
      if (error.code === '42P01') {
        console.warn('⚠️ [fetchReturns] Tabela returns não existe');
        return [];
      }
      console.error('❌ [fetchReturns] Erro ao buscar devoluções:', error);
      throw error;
    }
    
    console.log('✅ [fetchReturns] Devoluções encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchReturns] Erro completo:', error);
    return [];
  }
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

// ============ RETURNS PLANNER ============
export const fetchReturnsPlanner = async () => {
  console.log('🔍 [fetchReturnsPlanner] Buscando planner de devoluções...');
  
  try {
    const { data, error } = await supabase
      .from('returns_planner')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Se a tabela não existe, retornar array vazio
      if (error.code === '42P01') {
        console.warn('⚠️ [fetchReturnsPlanner] Tabela returns_planner não existe');
        return [];
      }
      console.error('❌ [fetchReturnsPlanner] Erro ao buscar planner:', error);
      throw error;
    }
    
    console.log('✅ [fetchReturnsPlanner] Planner encontrado:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchReturnsPlanner] Erro completo:', error);
    return [];
  }
};

export const createReturnsPlanner = async (plannerData) => {
  console.log('📤 [createReturnsPlanner] Criando registro com dados:', plannerData);
  
  const { data, error } = await supabase
    .from('returns_planner')
    .insert([plannerData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ [createReturnsPlanner] Erro ao criar:', error);
    throw error;
  }
  
  console.log('✅ [createReturnsPlanner] Registro criado com sucesso:', data);
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

// ============ RETURNS CAPACITY ============
export const fetchReturnsCapacity = async () => {
  console.log('🔍 [fetchReturnsCapacity] Buscando capacidade de devoluções...');
  
  try {
    const { data, error } = await supabase
      .from('returns_processing_capacity')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('⚠️ [fetchReturnsCapacity] Tabela returns_processing_capacity não existe');
        return [];
      }
      console.error('❌ [fetchReturnsCapacity] Erro ao buscar capacidade:', error);
      return [];
    }
    
    console.log('✅ [fetchReturnsCapacity] Capacidades encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchReturnsCapacity] Erro completo:', error);
    return [];
  }
};

export const createReturnsCapacity = async (capacityData) => {
  const { data, error } = await supabase
    .from('returns_processing_capacity')
    .insert([capacityData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReturnsCapacity = async (id, updates) => {
  const { data, error } = await supabase
    .from('returns_processing_capacity')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteReturnsCapacity = async (id) => {
  const { error } = await supabase
    .from('returns_processing_capacity')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ PHYSICAL MISSING ============
export const fetchPhysicalMissing = async () => {
  console.log('🔍 [fetchPhysicalMissing] Buscando faltas físicas...');
  
  try {
    const { data, error } = await supabase
      .from('physical_missing')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === '42P01') {
        console.warn('⚠️ [fetchPhysicalMissing] Tabela physical_missing não existe');
        return [];
      }
      console.error('❌ [fetchPhysicalMissing] Erro ao buscar faltas físicas:', error);
      throw error;
    }
    
    console.log('✅ [fetchPhysicalMissing] Faltas físicas encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ [fetchPhysicalMissing] Erro completo:', error);
    return [];
  }
};

export const createPhysicalMissing = async (missingData) => {
  // Especificar explicitamente as colunas que existem na tabela (excluindo 'items' que não existe)
  const { data, error } = await supabase
    .from('physical_missing')
    .insert([missingData])
    .select('id, nf_number, moved_to_defect, store_id, status, missing_type, brand, sku, color, size, sku_info, cost_value, quantity, total_value, created_at, updated_at')
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
  console.log('🗑️ [deletePhysicalMissing] Iniciando exclusão:', { id, nfNumber, storeId });
  
  // Se nfNumber e storeId forem fornecidos, deletar todos os registros com essa NF e store_id
  // (apenas os que não estão finalizados, para manter consistência com o agrupamento)
  // Caso contrário, deletar apenas pelo ID
  if (nfNumber && storeId) {
    console.log('🗑️ [deletePhysicalMissing] Deletando por NF e store_id:', { nfNumber, storeId });
    const { data, error } = await supabase
      .from('physical_missing')
      .delete()
      .eq('nf_number', nfNumber)
      .eq('store_id', storeId)
      .neq('status', 'nota_finalizada') // Não deletar registros finalizados
      .select();
    
    if (error) {
      console.error('❌ [deletePhysicalMissing] Erro ao deletar por NF:', error);
      throw error;
    }
    console.log('✅ [deletePhysicalMissing] Registros deletados por NF:', data?.length || 0, data);
    return data;
  } else {
    console.log('🗑️ [deletePhysicalMissing] Deletando por ID:', id);
    const { data, error } = await supabase
      .from('physical_missing')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('❌ [deletePhysicalMissing] Erro ao deletar por ID:', error);
      throw error;
    }
    console.log('✅ [deletePhysicalMissing] Registro deletado por ID:', data);
    return data;
  }
};
