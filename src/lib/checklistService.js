// ============================================
// SERVIÇOS PARA OS NOVOS CHECKLISTS
// Devoluções, Motorista e Comunicação
// ============================================

import { supabase } from '@/lib/customSupabaseClient';

// ============================================
// CHECKLIST DE DEVOLUÇÕES
// ============================================

// Buscar tarefas do checklist de devoluções (por usuário)
export const fetchDevolucoesTasks = async (userId = null) => {
  let query = supabase
    .from('checklist_devolucoes_tasks')
    .select('*')
    .eq('is_active', true);
  
  // Se userId for fornecido, filtrar por usuário, senão buscar todas (admin)
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  query = query.order('task_order', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.warn('⚠️ Tabela checklist_devolucoes_tasks não existe ainda.');
      return [];
    }
    throw error;
  }
  
  return data || [];
};

// Buscar todas as tarefas (incluindo inativas) - para admin gerenciar (opcionalmente por usuário)
export const fetchAllDevolucoesTasks = async (userId = null) => {
  let query = supabase
    .from('checklist_devolucoes_tasks')
    .select('*');
  
  // Se userId for fornecido, filtrar por usuário
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  query = query.order('task_order', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  
  return data || [];
};

// Criar tarefa de devoluções (admin, com user_id)
export const createDevolucoesTask = async (taskData) => {
  const { data, error } = await supabase
    .from('checklist_devolucoes_tasks')
    .insert([{
      task_text: taskData.task_text,
      task_order: taskData.task_order || 0,
      is_active: taskData.is_active !== undefined ? taskData.is_active : true,
      user_id: taskData.user_id || null, // user_id é obrigatório para identificar o usuário
      created_by: taskData.created_by || null
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Atualizar tarefa de devoluções (admin)
export const updateDevolucoesTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('checklist_devolucoes_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Deletar tarefa de devoluções (admin)
export const deleteDevolucoesTask = async (id) => {
  const { error } = await supabase
    .from('checklist_devolucoes_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
};

// Buscar execução do checklist de devoluções (por usuário)
export const fetchDevolucoesExecution = async (userId) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('checklist_devolucoes_execution')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return null;
    }
    throw error;
  }
  
  return data || null;
};

// Criar ou atualizar execução do checklist de devoluções
export const upsertDevolucoesExecution = async (userId, tasks) => {
  if (!userId) throw new Error('user_id é obrigatório');
  
  // Verificar se já existe
  const existing = await fetchDevolucoesExecution(userId);
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('checklist_devolucoes_execution')
      .update({
        tasks,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('checklist_devolucoes_execution')
      .insert([{
        user_id: userId,
        tasks,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Limpar/zerar checklist de devoluções (admin - para todos ou usuário específico)
export const clearDevolucoesExecution = async (userId = null) => {
  if (userId) {
    // Limpar para usuário específico
    const { error } = await supabase
      .from('checklist_devolucoes_execution')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return { success: true };
  } else {
    // Limpar todos - buscar todos os IDs primeiro e depois deletar
    const { data: allExecutions, error: fetchError } = await supabase
      .from('checklist_devolucoes_execution')
      .select('id')
      .limit(10000); // Limite de segurança
    
    if (fetchError) throw fetchError;
    
    if (!allExecutions || allExecutions.length === 0) {
      return { success: true, message: 'Nenhum registro para limpar' };
    }
    
    // Deletar todos usando IN com os IDs
    const ids = allExecutions.map(e => e.id);
    const { error: deleteError } = await supabase
      .from('checklist_devolucoes_execution')
      .delete()
      .in('id', ids);
    
    if (deleteError) throw deleteError;
    return { success: true };
  }
};

// ============================================
// CHECKLIST DE MOTORISTA (ROTAS)
// ============================================

// Buscar rotas do checklist motorista (por usuário)
export const fetchMotoristaRoutes = async (userId = null) => {
  let query = supabase
    .from('checklist_motorista_routes')
    .select('*')
    .eq('is_active', true);
  
  // Se userId for fornecido, filtrar por usuário, senão buscar todas (admin)
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  query = query.order('route_order', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.warn('⚠️ Tabela checklist_motorista_routes não existe ainda.');
      return [];
    }
    throw error;
  }
  
  return data || [];
};

// Buscar todas as rotas (incluindo inativas) - para admin gerenciar (opcionalmente por usuário)
export const fetchAllMotoristaRoutes = async (userId = null) => {
  let query = supabase
    .from('checklist_motorista_routes')
    .select('*');
  
  // Se userId for fornecido, filtrar por usuário
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  
  return data || [];
};

// Criar rota do motorista (admin, com user_id)
export const createMotoristaRoute = async (routeData) => {
  const { data, error } = await supabase
    .from('checklist_motorista_routes')
    .insert([{
      route_name: routeData.route_name,
      route_order: routeData.route_order || 0,
      is_active: routeData.is_active !== undefined ? routeData.is_active : true,
      user_id: routeData.user_id || null, // user_id é obrigatório para identificar o usuário
      created_by: routeData.created_by || null,
      route_date: routeData.route_date || null, // Data da rota
      stores_selected: routeData.stores_selected || [] // Array de store_ids (JSONB)
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Atualizar rota do motorista (admin)
export const updateMotoristaRoute = async (id, updates) => {
  const { data, error } = await supabase
    .from('checklist_motorista_routes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Deletar rota do motorista (admin)
export const deleteMotoristaRoute = async (id) => {
  const { error } = await supabase
    .from('checklist_motorista_routes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
};

// Buscar execução do checklist motorista (por usuário)
export const fetchMotoristaExecution = async (userId) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('checklist_motorista_execution')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return null;
    }
    throw error;
  }
  
  return data || null;
};

// Criar ou atualizar execução do checklist motorista
export const upsertMotoristaExecution = async (userId, routes) => {
  if (!userId) throw new Error('user_id é obrigatório');
  
  // Verificar se já existe
  const existing = await fetchMotoristaExecution(userId);
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('checklist_motorista_execution')
      .update({
        routes,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('checklist_motorista_execution')
      .insert([{
        user_id: userId,
        routes,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Limpar/zerar checklist motorista (admin - para todos ou usuário específico)
export const clearMotoristaExecution = async (userId = null) => {
  if (userId) {
    // Limpar para usuário específico
    const { error } = await supabase
      .from('checklist_motorista_execution')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return { success: true };
  } else {
    // Limpar todos - buscar todos os IDs primeiro e depois deletar
    const { data: allExecutions, error: fetchError } = await supabase
      .from('checklist_motorista_execution')
      .select('id')
      .limit(10000); // Limite de segurança
    
    if (fetchError) throw fetchError;
    
    if (!allExecutions || allExecutions.length === 0) {
      return { success: true, message: 'Nenhum registro para limpar' };
    }
    
    // Deletar todos usando IN com os IDs
    const ids = allExecutions.map(e => e.id);
    const { error: deleteError } = await supabase
      .from('checklist_motorista_execution')
      .delete()
      .in('id', ids);
    
    if (deleteError) throw deleteError;
    return { success: true };
  }
};

// ============================================
// CHECKLIST DE COMUNICAÇÃO
// ============================================

// Buscar tarefas do checklist de comunicação (do próprio usuário)
export const fetchComunicacaoTasks = async (userId) => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('checklist_comunicacao_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('task_order', { ascending: true });
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  
  return data || [];
};

// Criar tarefa de comunicação
export const createComunicacaoTask = async (userId, taskData) => {
  if (!userId) throw new Error('user_id é obrigatório');
  
  const { data, error } = await supabase
    .from('checklist_comunicacao_tasks')
    .insert([{
      user_id: userId,
      task_text: taskData.task_text,
      task_order: taskData.task_order || 0,
      is_active: taskData.is_active !== undefined ? taskData.is_active : true
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Atualizar tarefa de comunicação
export const updateComunicacaoTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('checklist_comunicacao_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Deletar tarefa de comunicação
export const deleteComunicacaoTask = async (id) => {
  const { error } = await supabase
    .from('checklist_comunicacao_tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
};

// Buscar execução do checklist de comunicação (por usuário)
export const fetchComunicacaoExecution = async (userId) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('checklist_comunicacao_execution')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return null;
    }
    throw error;
  }
  
  return data || null;
};

// Criar ou atualizar execução do checklist de comunicação
export const upsertComunicacaoExecution = async (userId, tasks) => {
  if (!userId) throw new Error('user_id é obrigatório');
  
  // Verificar se já existe
  const existing = await fetchComunicacaoExecution(userId);
  
  if (existing) {
    // Atualizar
    const { data, error } = await supabase
      .from('checklist_comunicacao_execution')
      .update({
        tasks,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Criar novo
    const { data, error } = await supabase
      .from('checklist_comunicacao_execution')
      .insert([{
        user_id: userId,
        tasks,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Limpar/zerar checklist de comunicação (apenas admin - para todos ou usuário específico)
export const clearComunicacaoExecution = async (userId = null) => {
  if (userId) {
    // Limpar para usuário específico
    const { error } = await supabase
      .from('checklist_comunicacao_execution')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return { success: true };
  } else {
    // Limpar todos - buscar todos os IDs primeiro e depois deletar
    const { data: allExecutions, error: fetchError } = await supabase
      .from('checklist_comunicacao_execution')
      .select('id')
      .limit(10000); // Limite de segurança
    
    if (fetchError) throw fetchError;
    
    if (!allExecutions || allExecutions.length === 0) {
      return { success: true, message: 'Nenhum registro para limpar' };
    }
    
    // Deletar todos usando IN com os IDs
    const ids = allExecutions.map(e => e.id);
    const { error: deleteError } = await supabase
      .from('checklist_comunicacao_execution')
      .delete()
      .in('id', ids);
    
    if (deleteError) throw deleteError;
    return { success: true };
  }
};

