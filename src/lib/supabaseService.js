import { supabase } from '@/lib/customSupabaseClient';// ============ STORES ============
export const fetchStores = async () => {
  console.log('🔍 [fetchStores] Buscando lojas do servidor...');
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('❌ [fetchStores] Erro ao buscar lojas:', error);
    throw error;
  }
  
  // Log para verificar se os dados JSONB estão sendo retornados
  if (data && data.length > 0) {
    const sampleStore = data[0];
    console.log('📊 [fetchStores] Exemplo de loja retornada:', {
      id: sampleStore.id,
      name: sampleStore.name,
      hasStoreResults: !!sampleStore.store_results,
      hasCollaboratorResults: !!sampleStore.collaborator_results,
      hasGoals: !!sampleStore.goals,
      hasWeights: !!sampleStore.weights,
      storeResultsKeys: sampleStore.store_results ? Object.keys(sampleStore.store_results) : [],
      collaboratorResultsKeys: sampleStore.collaborator_results ? Object.keys(sampleStore.collaborator_results) : []
    });
  }
  
  // Se houver dados, ordenar numericamente pelo código (ex: af011, af013)
  // Isso garante que códigos como "af11" venham depois de "af011"
  if (data && data.length > 0) {
    return data.sort((a, b) => {
      const codeA = (a.code || '').toLowerCase();
      const codeB = (b.code || '').toLowerCase();
      
      // Extrair prefixo alfabético e número
      const matchA = codeA.match(/^([a-z]+)(\d+)$/);
      const matchB = codeB.match(/^([a-z]+)(\d+)$/);
      
      if (matchA && matchB) {
        const prefixA = matchA[1];
        const prefixB = matchB[1];
        const numA = parseInt(matchA[2], 10);
        const numB = parseInt(matchB[2], 10);
        
        // Comparar prefixo primeiro
        if (prefixA !== prefixB) {
          return prefixA.localeCompare(prefixB);
        }
        
        // Se prefixo igual, comparar numericamente
        return numA - numB;
      }
      
      // Fallback para comparação alfabética se não houver padrão
      return codeA.localeCompare(codeB);
    });
  }
  
  console.log(`✅ [fetchStores] ${data?.length || 0} lojas encontradas`);
  return data || [];
};
export const createStore = async (storeData) => {
  const { data, error } = await supabase    .from('stores')    .insert([storeData])    .select()    .single();  
  if (error) throw error;
  return data;
};// Salvar histórico de metas antes de atualizar
export const saveGoalsHistory = async (storeId, goals, weights, changedBy = null) => {  try {  
  const historyData = {      store_id: storeId,      goals: goals || {},      weights: weights || {}  
};        // Se tiver informação do usuário que está fazendo a mudança, adicionar  
  if (changedBy) {      historyData.changed_by = changedBy;  
  }      
  const { error } = await supabase      .from('goals_history')      .insert([historyData]);        // Não lançar erro se a tabela não existir ainda (para não quebrar a aplicação)  
  if (error && error.code !== '42P01') { // 42P01 = table does not exist      console.warn('⚠️ Erro ao salvar histórico de metas (continuando mesmo assim):', error);  
  }
  } catch (error) {    // Não lançar erro - apenas logar    console.warn('⚠️ Erro ao salvar histórico de metas (continuando mesmo assim):', error);
  }
};
export const updateStore = async (id, updates) => {
  // Se estiver atualizando goals ou weights, salvar histórico primeiro
  if (updates.goals || updates.weights) {
    try {
      // Buscar dados atuais da loja
      const { data: currentStore } = await supabase
        .from('stores')
        .select('goals, weights')
        .eq('id', id)
        .single();
      
      // Se encontrou a loja, salvar histórico
      if (currentStore) {
        // Buscar usuário atual se possível
        const { data: { user } } = await supabase.auth.getUser();
        const changedBy = user?.id || null;
        
        // Salvar histórico com os valores que serão atualizados
        await saveGoalsHistory(
          id,
          updates.goals || currentStore.goals,
          updates.weights || currentStore.weights,
          changedBy
        );
      }
    } catch (error) {
      // Não bloquear a atualização se o histórico falhar
      console.warn('⚠️ Erro ao preparar histórico de metas (continuando mesmo assim):', error);
    }
  }
  
  console.log('💾 [updateStore] Atualizando loja:', { 
    id, 
    updates,
    store_results_type: typeof updates.store_results,
    store_results_value: updates.store_results,
    store_results_stringified: JSON.stringify(updates.store_results),
    collaborator_results_type: typeof updates.collaborator_results,
    collaborator_results_value: updates.collaborator_results,
    collaborator_results_stringified: JSON.stringify(updates.collaborator_results)
  });
  
  // Garantir que store_results e collaborator_results sejam objetos válidos JSONB
  const sanitizedUpdates = { ...updates };
  
  // Sanitizar store_results
  if (sanitizedUpdates.store_results !== undefined) {
    if (sanitizedUpdates.store_results === null) {
      sanitizedUpdates.store_results = {};
    } else if (typeof sanitizedUpdates.store_results === 'string') {
      try {
        sanitizedUpdates.store_results = JSON.parse(sanitizedUpdates.store_results);
      } catch (e) {
        console.warn('⚠️ [updateStore] Erro ao parsear store_results como JSON:', e);
        sanitizedUpdates.store_results = {};
      }
    } else if (Array.isArray(sanitizedUpdates.store_results)) {
      console.warn('⚠️ [updateStore] store_results é um array, convertendo para objeto');
      sanitizedUpdates.store_results = {};
    } else if (typeof sanitizedUpdates.store_results !== 'object') {
      console.warn('⚠️ [updateStore] store_results não é um objeto válido, convertendo para objeto vazio');
      sanitizedUpdates.store_results = {};
    }
  }
  
  // Sanitizar collaborator_results
  if (sanitizedUpdates.collaborator_results !== undefined) {
    if (sanitizedUpdates.collaborator_results === null) {
      sanitizedUpdates.collaborator_results = {};
    } else if (typeof sanitizedUpdates.collaborator_results === 'string') {
      try {
        sanitizedUpdates.collaborator_results = JSON.parse(sanitizedUpdates.collaborator_results);
      } catch (e) {
        console.warn('⚠️ [updateStore] Erro ao parsear collaborator_results como JSON:', e);
        sanitizedUpdates.collaborator_results = {};
      }
    } else if (Array.isArray(sanitizedUpdates.collaborator_results)) {
      console.warn('⚠️ [updateStore] collaborator_results é um array, convertendo para objeto');
      sanitizedUpdates.collaborator_results = {};
    } else if (typeof sanitizedUpdates.collaborator_results !== 'object') {
      console.warn('⚠️ [updateStore] collaborator_results não é um objeto válido, convertendo para objeto vazio');
      sanitizedUpdates.collaborator_results = {};
    }
  }
  
  // Sanitizar cto_data
  if (sanitizedUpdates.cto_data !== undefined) {
    console.log('💾 [updateStore] Sanitizando cto_data:', {
      type: typeof sanitizedUpdates.cto_data,
      isNull: sanitizedUpdates.cto_data === null,
      isArray: Array.isArray(sanitizedUpdates.cto_data),
      value: sanitizedUpdates.cto_data
    });
    
    if (sanitizedUpdates.cto_data === null) {
      sanitizedUpdates.cto_data = {};
    } else if (typeof sanitizedUpdates.cto_data === 'string') {
      try {
        sanitizedUpdates.cto_data = JSON.parse(sanitizedUpdates.cto_data);
      } catch (e) {
        console.warn('⚠️ [updateStore] Erro ao parsear cto_data como JSON:', e);
        sanitizedUpdates.cto_data = {};
      }
    } else if (Array.isArray(sanitizedUpdates.cto_data)) {
      console.warn('⚠️ [updateStore] cto_data é um array, convertendo para objeto');
      sanitizedUpdates.cto_data = {};
    } else if (typeof sanitizedUpdates.cto_data !== 'object') {
      console.warn('⚠️ [updateStore] cto_data não é um objeto válido, convertendo para objeto vazio');
      sanitizedUpdates.cto_data = {};
    }
    
    // Garantir que cto_data sempre seja um objeto válido
    if (!sanitizedUpdates.cto_data || typeof sanitizedUpdates.cto_data !== 'object') {
      sanitizedUpdates.cto_data = {};
    }
    
    console.log('✅ [updateStore] cto_data sanitizado:', sanitizedUpdates.cto_data);
  }
  
  // Fazer o update
  const { data: updateData, error: updateError } = await supabase
    .from('stores')
    .update(sanitizedUpdates)
    .eq('id', id)
    .select(); // Adicionar select para verificar se o update foi aplicado
  
  if (updateError) {
    console.error('❌ [updateStore] Erro ao atualizar:', updateError);
    console.error('❌ [updateStore] Código do erro:', updateError.code);
    console.error('❌ [updateStore] Mensagem do erro:', updateError.message);
    console.error('❌ [updateError] Detalhes completos:', JSON.stringify(updateError, null, 2));
    console.error('❌ [updateStore] Updates que causaram erro:', sanitizedUpdates);
    console.error('❌ [updateStore] Store ID:', id);
    
    // Verificar se é erro de permissão/RLS
    if (updateError.code === '42501' || updateError.message?.includes('permission') || updateError.message?.includes('policy')) {
      console.error('🚨 [updateStore] ERRO DE PERMISSÃO/RLS DETECTADO!');
      console.error('🚨 [updateStore] Verifique as políticas RLS da tabela stores no Supabase.');
      console.error('🚨 [updateStore] O usuário precisa ter permissão para UPDATE na tabela stores.');
    }
    
    throw updateError;
  }
  
  // Verificar se o update realmente foi aplicado
  if (updateData && updateData.length > 0) {
    console.log('✅ [updateStore] Update confirmado - dados retornados:', updateData[0]);
  } else {
    console.warn('⚠️ [updateStore] Update executado mas nenhum dado retornado (pode ser problema de RLS)');
  }
  
  console.log('✅ [updateStore] Update executado com sucesso. Buscando dados atualizados...');
  
  // Buscar os dados atualizados separadamente (para evitar problemas com RLS)
  const { data, error: selectError } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (selectError) {
    console.error('❌ [updateStore] Erro ao buscar dados atualizados:', selectError);
    throw selectError;
  }
  
  // Se não encontrou, retornar pelo menos os updates aplicados
  if (!data) {
    console.warn('⚠️ [updateStore] Não foi possível buscar dados atualizados após o update. Retornando updates aplicados.');
    return { id, ...updates };
  }
  
  // Log detalhado dos dados recuperados
  const storeResultsKeys = data.store_results ? Object.keys(data.store_results) : [];
  const collaboratorResultsKeys = data.collaborator_results ? Object.keys(data.collaborator_results) : [];
  const ctoDataKeys = data.cto_data ? Object.keys(data.cto_data) : [];
  
  // Se estamos atualizando cto_data, verificar se foi salvo corretamente
  if (updates.cto_data) {
    console.log('✅ [updateStore] Verificando cto_data salvo:', {
      hasCtoData: !!data.cto_data,
      ctoDataKeys,
      hasMonthlyBills: !!data.cto_data?.monthlyBills,
      hasMonthlySales: !!data.cto_data?.monthlySales,
      monthlyBillsKeys: data.cto_data?.monthlyBills ? Object.keys(data.cto_data.monthlyBills) : [],
      monthlySalesKeys: data.cto_data?.monthlySales ? Object.keys(data.cto_data.monthlySales) : [],
      sentCtoData: updates.cto_data,
      receivedCtoData: data.cto_data
    });
  }
  
  // Se estamos atualizando store_results, verificar se o mês foi salvo
  if (updates.store_results) {
    const updatedMonth = Object.keys(updates.store_results).find(key => 
      typeof updates.store_results[key] === 'object' && updates.store_results[key] !== null
    ) || Object.keys(updates.store_results)[0];
    
    console.log('✅ [updateStore] Dados atualizados recuperados do SERVIDOR:', {
      id: data.id,
      name: data.name,
      hasStoreResults: !!data.store_results,
      hasCollaboratorResults: !!data.collaborator_results,
      storeResultsKeys,
      updatedMonth,
      monthDataInStore: data.store_results?.[updatedMonth],
      monthDataSent: updates.store_results[updatedMonth],
      storeResultsValue: JSON.stringify(data.store_results),
      collaboratorResultsKeys,
      collaboratorResultsValue: JSON.stringify(data.collaborator_results),
      // Verificar se os dados foram realmente salvos
      dataMatches: JSON.stringify(data.store_results) === JSON.stringify(updates.store_results),
      collaboratorMatches: JSON.stringify(data.collaborator_results) === JSON.stringify(updates.collaborator_results)
    });
    
    // Verificar se os dados foram realmente salvos
    if (updatedMonth && data.store_results?.[updatedMonth]) {
      const savedData = data.store_results[updatedMonth];
      const sentData = updates.store_results[updatedMonth];
      const dataMatches = JSON.stringify(savedData) === JSON.stringify(sentData);
      
      if (!dataMatches) {
        console.warn('⚠️ [updateStore] Dados salvos não correspondem aos dados enviados!', {
          saved: savedData,
          sent: sentData
        });
      } else {
        console.log('✅ [updateStore] Dados confirmados no servidor - salvamento bem-sucedido!');
      }
    }
  } else {
    console.log('✅ [updateStore] Dados atualizados recuperados:', {
      id: data.id,
      name: data.name,
      hasStoreResults: !!data.store_results,
      hasCollaboratorResults: !!data.collaborator_results,
      storeResultsKeys,
      collaboratorResultsKeys
    });
  }
  
  // IMPORTANTE: Retornar os dados do servidor (fonte da verdade)
  return data;
};// Buscar histórico de metas de uma loja
export const fetchGoalsHistory = async (storeId, limit = 50) => {  try {  
  const { data, error } = await supabase      .from('goals_history')      .select('*')      .eq('store_id', storeId)      .order('created_at', { ascending: false })      .limit(limit);      
  if (error) throw error;  
  return data || [];
  } catch (error) {    // Se a tabela não existir ainda, retornar array vazio  
  if (error.code === '42P01') { // 42P01 = table does not exist      console.warn('⚠️ Tabela goals_history não existe ainda. Execute o script CRIAR_HISTORICO_METAS.sql');    
  return [];  
  }    throw error;
  }
};
export const deleteStore = async (id) => {
  const { error } = await supabase    .from('stores')    .delete()    .eq('id', id);  
  if (error) throw error;
};// ============ USERS ============
export const fetchAppUsers = async () => {  console.log('🔍 [fetchAppUsers] Iniciando busca de usuários...');  // Buscar usuários da tabela app_users (sem relacionamento automático)
  const { data, error } = await supabase    .from('app_users')    .select('*')    .order('username');  
  if (error) {    console.error('❌ [fetchAppUsers] Erro ao buscar usuários:', error);    throw error;
  }    console.log(`✅ [fetchAppUsers] Usuários encontrados: ${data?.length || 0}`, data);    // Se houver usuários com store_id, buscar dados das lojas
  if (data && data.length > 0) {  
  const storeIds = data      .map(user => user.store_id)      .filter(id => id !== null && id !== undefined);      
  if (storeIds.length > 0) {      try {      
  const { data: storesData } = await supabase          .from('stores')          .select('id, name, code')          .in('id', storeIds)          .order('code', { ascending: true });                // Adicionar dados da loja a cada usuário      
  if (storesData) {        
  const storesMap = new Map(storesData.map(store => [store.id, store]));          data.forEach(user => {          
  if (user.store_id && storesMap.has(user.store_id)) {              user.store = storesMap.get(user.store_id);          
  }        
  });      
  }    
  } catch (storeError) {        // Se falhar ao buscar lojas, continuar sem os dados das lojas        console.log('Erro ao buscar dados das lojas:', storeError);    
  }  
  }
  }  
  return data || [];
};// Buscar email do usuário através do auth.users// Nota: Isso requer uma função edge ou RPC no Supabase que use a service role key// Por enquanto, vamos armazenar o email na tabela app_users ou buscar de outra forma
export const getUserEmail = async (userId) => {  // Tentar buscar o email do usuário  // Como não temos acesso direto ao auth.users com anon key,  // vamos tentar buscar através de uma função RPC ou edge function  // Por enquanto, retornamos null e vamos armazenar o email na tabela app_users    // Solução: Armazenar o email na tabela app_users quando criar o usuário  // ou buscar através de uma função RPC/Edge que use service role key  
  return null;
};
export const createAppUser = async (email, password, userData) => {  // Senha padrão para primeiro acesso
  const DEFAULT_PASSWORD = 'afeet10';    // Se não houver senha fornecida, usar senha padrão  // Todos os novos usuários terão a senha padrão e precisarão definir uma nova senha no primeiro acesso
  const userPassword = password || DEFAULT_PASSWORD;
  const sanitizedEmail = email.trim().toLowerCase();
  
  // IMPORTANTE: Salvar a sessão atual do admin ANTES de criar o usuário
  // Isso permite restaurar a sessão após criar o usuário
  let adminSession = null;
  let adminAccessToken = null;
  let adminRefreshToken = null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();  
    if (session) {
      adminSession = session;
      adminAccessToken = session.access_token;
      adminRefreshToken = session.refresh_token;
      console.log('✅ Sessão do admin salva antes de criar usuário (ID:', session.user.id, ')');
    } else {
      console.log('⚠️ Nenhuma sessão ativa antes de criar usuário');
    }
  } catch (sessionError) {
    console.warn('Erro ao salvar sessão do admin:', sessionError);
  }
  
  // Criar usuário no auth SEM confirmação de email
  // O trigger handle_new_user() criará o registro em app_users automaticamente
  // Não é necessário confirmar email - usuários são criados imediatamente
  
  // IMPORTANTE: Garantir que o role seja passado corretamente
  // Se userData.role não existir ou for vazio, usar 'user' como padrão
  // Mas priorizar o role passado no userData
  // DEBUG: Vamos garantir que o role seja sempre passado explicitamente
  const userRole = userData?.role || 'user';
  const userStatus = userData?.status || 'active';
  const userUsername = userData?.username || sanitizedEmail.split('@')[0];
  const userStoreId = userData?.store_id || null;
  
  // DEBUG: Log dos valores que serão passados
  console.log('📝 Criando usuário com os seguintes dados:', {
    email: sanitizedEmail,
    username: userUsername,
    role: userRole,
    status: userStatus,
    store_id: userStoreId
  });
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password: userPassword,
    options: {
      // Não enviar email de confirmação
      emailRedirectTo: undefined,
      // Incluir dados do usuário nos metadados para o trigger usar
      // IMPORTANTE: Usar os valores explícitos, não o spread que pode sobrescrever
      // DEBUG: Vamos garantir que o role seja passado como string explícita
      data: {
        username: userUsername,
        role: String(userRole), // Garantir que seja string
        status: String(userStatus), // Garantir que seja string
        store_id: userStoreId ? String(userStoreId) : null
      }
    }
  });
  
  if (authError) {
    // Se o erro for de usuário já existente
    if (authError.message?.includes('User already registered') ||
        authError.message?.includes('already registered') ||
        (authError.message?.includes('email') && authError.message?.includes('already'))) {
      throw new Error(`Usuário com o email ${sanitizedEmail} já existe no sistema. Use a função de reset de senha se necessário.`);
    }
    throw authError;
  }
  
  // Verificar se o usuário foi criado
  // Se authData.user for null, pode ser que a confirmação de email esteja habilitada
  // Nesse caso, ainda podemos continuar - o trigger será executado quando o email for confirmado
  if (!authData?.user?.id) {
    // Se o usuário não foi criado imediatamente, pode ser que a confirmação de email esteja habilitada
    // Mas ainda podemos criar o perfil quando o email for confirmado
    // Por enquanto, lançar um erro informativo
    throw new Error(`O usuário não foi criado imediatamente. Isso pode acontecer se a confirmação de email estiver habilitada. Por favor, desabilite a confirmação de email em Authentication > Settings > Email Auth > Desabilite "Enable email confirmations". O sistema não envia email de confirmação, apenas para reset de senha.`);
  }
  
  const userId = authData.user.id;
  
  // IMPORTANTE: O signUp do Supabase cria uma sessão automaticamente para o novo usuário
  // Isso substitui a sessão do admin que está criando o usuário
  // Precisamos restaurar a sessão do admin imediatamente após criar o usuário
  // Usando setSession para restaurar a sessão do admin diretamente
  
  // O trigger handle_new_user() DEVE criar o perfil automaticamente quando um usuário é criado no auth
  // IMPORTANTE: Aguardar ANTES de restaurar a sessão para dar tempo ao trigger executar
  // O trigger precisa que a sessão do novo usuário esteja ativa para funcionar corretamente
  // Aguardar um pouco para o trigger processar (o trigger é executado imediatamente após INSERT no auth.users)
  console.log('⏳ Aguardando trigger criar o perfil...');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Aumentar para 3 segundos para dar mais tempo ao trigger
  
  // Restaurar a sessão do admin DEPOIS de aguardar o trigger
  // Isso garante que o trigger tenha tempo de executar com a sessão do novo usuário
  if (adminSession && adminAccessToken && adminRefreshToken) {
    try {
      // Restaurar a sessão do admin usando setSession
      const { data: restoreData, error: restoreError } = await supabase.auth.setSession({
        access_token: adminAccessToken,
        refresh_token: adminRefreshToken
      });
      
      if (!restoreError && restoreData.session) {
        console.log('✅ Sessão do admin restaurada com sucesso (ID:', restoreData.session.user.id, ')');
        
        // Verificar se a sessão foi realmente restaurada
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        
        if (verifySession && verifySession.user.id === adminSession.user.id) {
          console.log('✅ Verificação: Sessão do admin confirmada - você permanecerá logado');
        } else {
          console.warn('⚠️ Verificação: Sessão pode não ter sido restaurada corretamente');
          // Se a verificação falhou, tentar restaurar novamente
          try {
            await supabase.auth.setSession({
              access_token: adminAccessToken,
              refresh_token: adminRefreshToken
            });
            console.log('✅ Tentativa de restaurar sessão novamente');
          } catch (retryError) {
            console.warn('⚠️ Erro ao tentar restaurar sessão novamente:', retryError);
          }
        }
      } else {
        console.warn('⚠️ Não foi possível restaurar a sessão do admin:', restoreError);
        // Se não conseguir restaurar, o admin precisará fazer login novamente
        console.warn('⚠️ Você precisará fazer login novamente');
      }
    } catch (restoreError) {
      console.error('Erro ao tentar restaurar sessão do admin:', restoreError);
      // Não fazer signOut automaticamente - deixar o usuário decidir
      console.warn('⚠️ Você precisará fazer login novamente');
    }
  } else {
    // Se não temos a sessão do admin salva, não podemos restaurar
    console.warn('⚠️ Não foi possível salvar a sessão do admin');
    console.warn('⚠️ Você será deslogado após criar o usuário e precisará fazer login novamente');
  }
  
  // Verificar se o perfil foi criado pelo trigger
  let profile = null;
  let attempts = 0;
  const maxAttempts = 8; // Aguardar até 8 segundos (2s inicial + 6 tentativas de 1s)
  
  while (attempts < maxAttempts && !profile) {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (existingProfile && !fetchError) {
      profile = existingProfile;
      
      // Se o perfil foi criado pelo trigger, atualizar com os dados adicionais se necessário
      // IMPORTANTE: Garantir que o role seja atualizado corretamente
      const userRole = userData?.role || 'user';
      const userStatus = userData?.status || 'active';
      const userUsername = userData?.username || sanitizedEmail.split('@')[0];
      const userStoreId = userData?.store_id || null;
      
      const needsUpdate =
        (userUsername && existingProfile.username !== userUsername) ||
        (userRole && existingProfile.role !== userRole) ||
        (userStoreId !== null && existingProfile.store_id !== userStoreId);
      
      if (needsUpdate) {
        try {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('app_users')
            .update({
              username: userUsername,
              role: userRole,
              status: userStatus,
              store_id: userStoreId
            })
            .eq('id', userId)
            .select()
            .single();
          
          if (!updateError && updatedProfile) {
            profile = updatedProfile;
            console.log('✅ Perfil atualizado com dados corretos');
          }
        } catch (updateErr) {
          // Se falhar ao atualizar, usar o perfil que já existe
          console.warn('Erro ao atualizar perfil:', updateErr);
        }
      }
      
      // Sessão do admin já foi restaurada no início da função (se possível)
      break;
    }
    
    // Se não encontrou, aguardar e tentar novamente
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Se o trigger não criou o perfil após todas as tentativas, tentar criar manualmente
  if (!profile) {
    console.warn('Trigger não criou o perfil, tentando criar manualmente...');
    
    try {
      // PRIMEIRO: Tentar usar a função RPC (mais confiável - usa SECURITY DEFINER)
      // Aguardar um pouco mais para garantir que o usuário foi commitado no banco
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Tentar usar a função RPC com retry (mais confiável - usa SECURITY DEFINER)
      let rpcSuccess = false;
      let rpcAttempts = 0;
      const maxRpcAttempts = 3;
      
      while (!rpcSuccess && rpcAttempts < maxRpcAttempts) {
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
            p_user_id: userId,
            p_username: userUsername,
            p_role: userRole,
            p_status: userStatus,
            p_store_id: userStoreId,
          });
          
          if (!rpcError && rpcResult?.success) {
            // Se a função RPC funcionou, buscar o perfil criado
            await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar um pouco para garantir
            
            const { data: createdProfile, error: fetchError } = await supabase
              .from('app_users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (createdProfile && !fetchError) {
              profile = createdProfile;
              console.log('✅ Perfil criado via função RPC com sucesso');
              
              // Verificar se o role está correto e atualizar se necessário
              if (profile.role !== userRole) {
                console.warn(`Role do perfil (${profile.role}) diferente do esperado (${userRole}), atualizando...`);
                try {
                  const { data: updatedProfile, error: updateError } = await supabase
                    .from('app_users')
                    .update({ role: userRole, status: userStatus, store_id: userStoreId })
                    .eq('id', userId)
                    .select()
                    .single();
                  
                  if (!updateError && updatedProfile) {
                    profile = updatedProfile;
                    console.log('✅ Perfil atualizado com role correto');
                  }
                } catch (updateErr) {
                  console.warn('Erro ao atualizar role do perfil:', updateErr);
                }
              }
              
              rpcSuccess = true;
              
              // SignOut já foi feito no início da função, não precisa fazer novamente
              return profile;
            } else if (fetchError) {
              console.warn(`Perfil criado via RPC mas erro ao buscar (tentativa ${rpcAttempts + 1}/${maxRpcAttempts}):`, fetchError);
            }
          } else if (rpcError) {
            // Se o erro for 404, a função não existe
            if (rpcError.code === 'PGRST202' || rpcError.message?.includes('not found')) {
              console.warn(`Função RPC não encontrada (tentativa ${rpcAttempts + 1}/${maxRpcAttempts}). Execute o script CRIAR_FUNCAO_RPC_AGORA.sql no Supabase SQL Editor.`);
              break; // Não tentar novamente se a função não existe
            } else {
              console.warn(`Função RPC falhou (tentativa ${rpcAttempts + 1}/${maxRpcAttempts}):`, rpcError);
            }
          }
        } catch (rpcErr) {
          console.warn(`Erro ao chamar função RPC (tentativa ${rpcAttempts + 1}/${maxRpcAttempts}):`, rpcErr);
        }
        
        rpcAttempts++;
        if (!rpcSuccess && rpcAttempts < maxRpcAttempts) {
          // Aguardar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Se a função RPC não funcionou após todas as tentativas, continuar para inserir diretamente
      if (!rpcSuccess) {
        console.warn('Função RPC não funcionou após todas as tentativas, tentando inserir diretamente...');
      }
      
      // SEGUNDO: Se a função RPC não funcionou, tentar inserir diretamente
      // Aguardar mais um pouco para garantir que o usuário foi commitado
      if (!profile) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const profileData = {
          id: userId,
          status: userStatus,
          username: userUsername,
          role: userRole,
          store_id: userStoreId,
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('app_users')
          .insert([profileData])
          .select()
          .single();
        
        if (createError) {
          // Se o erro for de foreign key, verificar se é problema de timing ou foreign key incorreta
          if (createError.code === '23503' || createError.message?.includes('foreign key')) {
            // Verificar se o usuário realmente existe no auth.users
            // Se não existir, pode ser problema de timing ou confirmação de email
            const errorDetails = createError.message || '';
            
            // Tentar verificar se o usuário existe no auth.users
            // Se a função RPC não funcionou e a inserção direta falhou, pode ser que:
            // 1. O usuário ainda não foi commitado (problema de timing)
            // 2. A confirmação de email está habilitada e o usuário não está ativo
            // 3. A foreign key está incorreta (mas o script disse que está correta)
            
            const errorMsg = `❌ ERRO: Não foi possível criar o perfil do usuário.

Usuário criado no auth.users (ID: ${userId}), mas não foi possível criar o perfil em app_users.

CAUSA POSSÍVEL: 
- O trigger não executou automaticamente
- A função RPC create_user_profile não está disponível ou falhou
- Problema de timing: o usuário pode ainda não estar disponível no banco
- A confirmação de email pode estar habilitada (desabilite em Authentication > Settings)

SOLUÇÃO:
1. Verifique se a confirmação de email está DESABILITADA:
   - Authentication > Settings > Email Auth
   - Desabilite "Enable email confirmations"
   - Clique em "Save"

2. Verifique se a função RPC create_user_profile foi criada:
   - Execute o script: SOLUCAO_DEFINITIVA.sql no Supabase SQL Editor
   - Verifique se a função foi criada no PASSO 9

3. Verifique os logs do Supabase para ver se o trigger está executando

4. Tente criar o usuário novamente após alguns segundos

Detalhes do erro: ${createError.message}
Código do erro: ${createError.code}`;
            
            throw new Error(errorMsg);
          }
          
          // Se for outro erro, lançar normalmente
          throw createError;
        }
        
        // Se conseguiu criar manualmente, retornar o perfil criado
        profile = createdProfile;
        console.log('✅ Perfil criado diretamente com sucesso');
        
        // SignOut já foi feito no início da função, não precisa fazer novamente
      }
    } catch (manualCreateError) {
      // Se falhar ao criar manualmente, lançar erro detalhado
      const errorMessage = manualCreateError.message || String(manualCreateError);
      const isForeignKeyError = errorMessage.includes('foreign key') ||
                                errorMessage.includes('23503') ||
                                errorMessage.includes('Key is not present in table');
      
      let errorMsg;
      if (isForeignKeyError) {
        errorMsg = `❌ ERRO: Não foi possível criar o perfil do usuário.

Usuário criado no auth.users (ID: ${userId}), mas não foi possível criar o perfil em app_users.

CAUSA POSSÍVEL:
- Problema de timing: o usuário pode ainda não estar disponível no banco quando tentamos criar o perfil
- A confirmação de email pode estar habilitada (desabilite em Authentication > Settings)
- O trigger não executou e a função RPC não está disponível

SOLUÇÃO:
1. IMPORTANTE: Desabilite a confirmação de email:
   - Authentication > Settings > Email Auth
   - Desabilite "Enable email confirmations"
   - Clique em "Save"

2. Verifique se a função RPC create_user_profile foi criada:
   - Execute o script: SOLUCAO_DEFINITIVA.sql no Supabase SQL Editor
   - Verifique se a função foi criada no PASSO 9

3. Aguarde alguns segundos e tente criar o usuário novamente

4. Se o problema persistir, verifique os logs do Supabase

Detalhes do erro: ${errorMessage}`;
      } else {
        errorMsg = `❌ ERRO: Não foi possível criar o perfil do usuário.

Usuário criado no auth.users (ID: ${userId}), mas não foi possível criar o perfil em app_users.

ERRO: ${errorMessage}

SOLUÇÃO:
1. Desabilite a confirmação de email em Authentication > Settings
2. Execute o script SQL: SOLUCAO_DEFINITIVA.sql no Supabase SQL Editor
3. Verifique se a função create_user_profile foi criada
4. Tente criar o usuário novamente após alguns segundos`;
      }
      
      throw new Error(errorMsg);
    }
  }
  
  // IMPORTANTE: Verificar se o perfil foi criado com o role correto
  // Se não, atualizar o perfil com o role correto
  if (profile) {
    // Verificar se o role está correto
    if (profile.role !== userRole) {
      console.warn(`⚠️ Role do perfil (${profile.role}) diferente do esperado (${userRole}), atualizando...`);
      try {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('app_users')
          .update({
            role: userRole,
            status: userStatus,
            username: userUsername,
            store_id: userStoreId
          })
          .eq('id', userId)
          .select()
          .single();
        
        if (!updateError && updatedProfile) {
          profile = updatedProfile;
          console.log(`✅ Perfil atualizado com role correto: ${userRole}`);
        } else {
          console.error('❌ Erro ao atualizar role do perfil:', updateError);
        }
      } catch (updateErr) {
        console.error('❌ Erro ao atualizar role do perfil:', updateErr);
      }
    } else {
      console.log(`✅ Perfil criado com role correto: ${userRole}`);
    }
  }
  
  // A sessão do admin já foi restaurada (se possível) no início da função
  // Não precisamos fazer nada adicional aqui
  
  return profile;
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
  // Validar ID do usuário
  if (!id) {
    throw new Error('ID do usuário é obrigatório');
  }
  
  // Tentar usar a função RPC para excluir o usuário completamente
  try {
    const { data, error } = await supabase.rpc('delete_user_completely', {
      p_user_id: id
    });
    
    if (error) {
      // Se a função RPC não existir, tentar alternativa
      if (error.code === 'PGRST202' || error.message?.includes('not found')) {
        console.warn('Função RPC não encontrada, tentando método alternativo...');
        
        // Método alternativo: excluir apenas de app_users
        // Nota: Isso não excluirá o usuário de auth.users
        // O usuário ainda existirá no sistema de autenticação
        const { error: deleteError } = await supabase
          .from('app_users')
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        // Avisar que a exclusão foi parcial
        console.warn('⚠️ Usuário excluído apenas de app_users. Execute o script CRIAR_FUNCAO_EXCLUIR_USUARIO.sql no Supabase SQL Editor para excluir completamente.');
        throw new Error('Função RPC não disponível. Execute o script CRIAR_FUNCAO_EXCLUIR_USUARIO.sql no Supabase SQL Editor para excluir completamente.');
      }
      
      throw error;
    }
    
    // Verificar se a função retornou sucesso
    if (data && data.success) {
      console.log('✅ Usuário excluído com sucesso:', data.message);
      return true;
    } else if (data && !data.success) {
      throw new Error(data.error || 'Erro ao excluir usuário');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
};

// Reset de senha de um usuário específico (admin)
// Recebe o email do usuário e envia email de recuperação
export const resetUserPassword = async (email) => {
  const sanitizedEmail = email.trim().toLowerCase();
  
  // Validar email
  if (!sanitizedEmail) {
    throw new Error('Email é obrigatório');
  }
  
  console.log('🔐 [resetUserPassword] Iniciando reset de senha para:', sanitizedEmail);
  
  try {
    // Usar função RPC para resetar a senha para "afeet10"
    const { data, error } = await supabase.rpc('reset_user_password_to_default', {
      p_email: sanitizedEmail
    });
    
    if (error) {
      console.error('❌ [resetUserPassword] Erro ao resetar senha:', error);
      
      // Se a função RPC não existir, fornecer instruções
      if (error.code === 'PGRST202' || error.message?.includes('not found')) {
        throw new Error('A função RPC não está disponível. Execute o script CRIAR_FUNCAO_RESET_SENHA.sql no Supabase SQL Editor para criar a função necessária.');
      }
      
      throw error;
    }
    
    // Verificar se a função retornou sucesso
    if (data && data.success) {
      console.log('✅ [resetUserPassword] Senha resetada com sucesso');
      return true;
    } else if (data && !data.success) {
      const errorMsg = data.error || 'Erro ao resetar senha';
      console.error('❌ [resetUserPassword] Função RPC retornou erro:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Se não houver dados, considerar como sucesso (compatibilidade)
    console.log('✅ [resetUserPassword] Reset concluído (sem dados de retorno)');
    return true;
  } catch (error) {
    console.error('❌ [resetUserPassword] Erro inesperado:', error);
    throw error;
  }
};

// ============ FORMS ============
export const fetchForms = async () => {
  console.log('🔍 [fetchForms] Iniciando busca de formulários...');
  const { data, error } = await supabase
    .from('forms')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ [fetchForms] Erro ao buscar formulários:', error);
    throw error;
  }
  
  console.log(`✅ [fetchForms] Formulários encontrados: ${data?.length || 0}`, data);
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
  if (!id) {    throw new Error('ID do formulário é obrigatório');
  }    console.log('🗑️ Tentando excluir formulário:', id);    // Primeiro, verificar se o formulário existe
  const { data: existingForm, error: fetchError } = await supabase    .from('forms')    .select('id')    .eq('id', id)    .maybeSingle();  
  if (fetchError) {    console.error('❌ Erro ao verificar formulário:', fetchError);    throw fetchError;
  }  
  if (!existingForm) {    console.warn('⚠️ Formulário não encontrado:', id);    // Se não existe, considerar como sucesso (já foi excluído)  
  return { success: true, deleted: false 
};
  }    // Tentar excluir
  const { data, error } = await supabase    .from('forms')    .delete()    .eq('id', id)    .select();  
  if (error) {    console.error('❌ Erro ao excluir formulário:', error);    throw error;
  }    // Verificar se realmente foi excluído
  const { data: verifyDeleted, error: verifyError } = await supabase    .from('forms')    .select('id')    .eq('id', id)    .maybeSingle();  
  if (verifyError && verifyError.code !== 'PGRST116') {    console.error('❌ Erro ao verificar exclusão:', verifyError);    throw verifyError;
  }  
  if (verifyDeleted) {    console.error('❌ Formulário ainda existe após exclusão:', id);    throw new Error('A exclusão falhou. O formulário ainda existe no banco de dados.');
  }    console.log('✅ Formulário excluído com sucesso:', id);
  return { success: true, deleted: true, data 
};
};// ============ EVALUATIONS ============
export const fetchEvaluations = async () => {  // Buscar avaliações sem relacionamento automático
  const { data, error } = await supabase    .from('evaluations')    .select('*')    .order('created_at', { ascending: false });  
  if (error) throw error;    // Se houver dados, buscar informações das lojas e usuários separadamente
  if (data && data.length > 0) {    // Buscar store_ids únicos  
  const storeIds = [...new Set(data.map(evaluation => evaluation.store_id).filter(id => id))];  
  const userIds = [...new Set(data.map(evaluation => evaluation.user_id).filter(id => id))];        // Buscar dados das lojas  
  if (storeIds.length > 0) {      try {      
  const { data: storesData } = await supabase          .from('stores')          .select('id, name, code')          .in('id', storeIds)          .order('code', { ascending: true });              
  if (storesData) {        
  const storesMap = new Map(storesData.map(store => [store.id, store]));          data.forEach(evaluation => {          
  if (evaluation.store_id && storesMap.has(evaluation.store_id)) {              evaluation.store = storesMap.get(evaluation.store_id);          
  }        
  });      
  }    
  } catch (storeError) {        console.log('Erro ao buscar dados das lojas:', storeError);    
  }  
  }        // Buscar IDs dos usuários que aprovaram (approved_by)  
  const approvedByUserIds = [...new Set(data.map(evaluation => evaluation.approved_by).filter(id => id))];  
  const allUserIds = [...new Set([...userIds, ...approvedByUserIds])];        // Buscar dados dos usuários (criadores e aprovadores)  
  if (allUserIds.length > 0) {      try {      
  const { data: usersData } = await supabase          .from('app_users')          .select('id, username')          .in('id', allUserIds);              
  if (usersData) {        
  const usersMap = new Map(usersData.map(user => [user.id, user]));          data.forEach(evaluation => {          
  if (evaluation.user_id && usersMap.has(evaluation.user_id)) {              evaluation.app_user = usersMap.get(evaluation.user_id);          
  }          
  if (evaluation.approved_by && usersMap.has(evaluation.approved_by)) {              evaluation.approved_by_user = usersMap.get(evaluation.approved_by);          
  }        
  });      
  }    
  } catch (userError) {        console.log('Erro ao buscar dados dos usuários:', userError);    
  }  
  }        // Converter snake_case para camelCase para manter consistência com o frontend  
  return data.map(evaluation => ({      ...evaluation,      storeId: evaluation.store_id,      formId: evaluation.form_id,      userId: evaluation.user_id,      approvedBy: evaluation.approved_by,      date: evaluation.created_at || evaluation.date,      approvedByUser: evaluation.approved_by_user || null  
  }));
  }  
  return data || [];
};
export const createEvaluation = async (evaluationData) => {
  // Converter camelCase para snake_case
  // NOTA: A tabela evaluations não tem coluna user_id, então não incluímos
  
  // Validar campos obrigatórios
  if (!evaluationData.storeId && !evaluationData.store_id) {
    throw new Error('storeId é obrigatório');
  }
  if (!evaluationData.formId && !evaluationData.form_id) {
    throw new Error('formId é obrigatório');
  }
  
  const dataToInsert = {
    store_id: evaluationData.storeId || evaluationData.store_id,
    form_id: evaluationData.formId || evaluationData.form_id,
    score: evaluationData.score || 0,
    answers: evaluationData.answers || {},
    pillar: evaluationData.pillar || null,
    status: evaluationData.status || 'pending'
  };
  
  // Limpar campos undefined para evitar problemas
  Object.keys(dataToInsert).forEach(key => {
    if (dataToInsert[key] === undefined) {
      delete dataToInsert[key];
    }
  });
  
  // Garantir que estamos usando apenas snake_case
  // Remover qualquer propriedade em camelCase que possa ter sobrado
  const cleanData = {
    store_id: dataToInsert.store_id,
    form_id: dataToInsert.form_id,
    score: dataToInsert.score,
    answers: dataToInsert.answers,
    pillar: dataToInsert.pillar,
    status: dataToInsert.status
  };
  
  console.log('📤 Enviando avaliação para o banco:', cleanData);
  
  // Especificar explicitamente as colunas no select para evitar incluir user_id
  const { data, error } = await supabase
    .from('evaluations')
    .insert([cleanData])
    .select('id, store_id, form_id, score, answers, pillar, status, created_at, updated_at')
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar avaliação:', error);
    console.error('📋 Dados que tentaram ser inseridos:', cleanData);
    console.error('🔍 Código do erro:', error.code);
    console.error('📝 Mensagem do erro:', error.message);
    throw error;
  }
  
  console.log('✅ Avaliação criada com sucesso:', data);
  
  // Converter snake_case para camelCase no retorno para consistência
  return {
    ...data,
    storeId: data.store_id,
    formId: data.form_id,
    userId: data.user_id || null
  };
};

export const updateEvaluation = async (id, updates) => {
  if (!id) {
    throw new Error('ID da avaliação é obrigatório');
  }
  
  // Converter camelCase para snake_case se necessário
  const updatesToSend = { ...updates };
  
  // Converter approvedBy para approved_by se necessário
  if (updatesToSend.approvedBy !== undefined) {
    updatesToSend.approved_by = updatesToSend.approvedBy;
    delete updatesToSend.approvedBy;
  }
  
  // Remover campos undefined/null que podem causar erro
  Object.keys(updatesToSend).forEach(key => {
    if (updatesToSend[key] === undefined) {
      delete updatesToSend[key];
    }
  });
  
  // Validar que há algo para atualizar
  if (Object.keys(updatesToSend).length === 0) {
    throw new Error('Nenhum campo para atualizar');
  }
  
  console.log('🔄 [updateEvaluation] Atualizando avaliação:', { id, updatesToSend });
  
  const { data, error } = await supabase
    .from('evaluations')
    .update(updatesToSend)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ [updateEvaluation] Erro ao atualizar:', error);
    throw error;
  }
  
  console.log('✅ [updateEvaluation] Avaliação atualizada:', data);
  
  // Converter snake_case para camelCase no retorno
  return {
    ...data,
    storeId: data.store_id,
    formId: data.form_id,
    userId: data.user_id || null,
    approvedBy: data.approved_by || null
  };
};

export const deleteEvaluation = async (id) => {
  if (!id) {
    throw new Error('ID da avaliação é obrigatório');
  }
  
  console.log('🗑️ Tentando excluir avaliação:', id);
  
  // Primeiro, verificar se a avaliação existe
  const { data: existingEvaluation, error: fetchError } = await supabase
    .from('evaluations')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (fetchError) {
    console.error('❌ Erro ao verificar avaliação:', fetchError);
    throw fetchError;
  }
  
  if (!existingEvaluation) {
    console.warn('⚠️ Avaliação não encontrada:', id);
    // Se não existe, considerar como sucesso (já foi excluída)
    return { success: true, deleted: false };
  }
  
  // Tentar excluir
  const { data, error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('❌ Erro ao excluir avaliação:', error);
    throw error;
  }
  
  // Se não houve erro, a exclusão foi bem-sucedida
  // Confiar no resultado do Supabase (pode haver cache/RLS que faz a verificação falhar)
  console.log('✅ Avaliação excluída com sucesso:', id, data);
  return { success: true, deleted: true, data };
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
  
  // Converter store_id para storeId no retorno para manter consistência com o frontend
  if (data && data.length > 0) {
    return data.map(collab => ({
      ...collab,
      storeId: collab.store_id
    }));
  }
  
  return data || [];
};

export const createCollaborator = async (collaboratorData) => {
  // Converter storeId (camelCase) para store_id (snake_case) se necessário
  const dataToInsert = {
    name: collaboratorData.name,
    role: collaboratorData.role,
    store_id: collaboratorData.store_id || collaboratorData.storeId,
    cpf: collaboratorData.cpf || null,
    email: collaboratorData.email || null,
    status: collaboratorData.status || 'ativo'
  };
  
  const { data, error } = await supabase
    .from('collaborators')
    .insert([dataToInsert])
    .select()
    .single();
  
  if (error) throw error;
  
  // Converter store_id para storeId no retorno para manter consistência com o frontend
  if (data) {
    return {
      ...data,
      storeId: data.store_id
    };
  }
  
  return data;
};

export const updateCollaborator = async (id, updates) => {
  // Filtrar apenas campos que existem na tabela (para evitar erros se a coluna não existir)
  const allowedFields = ['name', 'role', 'store_id', 'cpf', 'email', 'status'];
  const filteredUpdates = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });
  
  const { data, error } = await supabase
    .from('collaborators')
    .update(filteredUpdates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Converter store_id para storeId no retorno
  if (data) {
    return {
      ...data,
      storeId: data.store_id
    };
  }
  
  return data;
};

export const deleteCollaborator = async (id) => {
  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ TRAININGS ============
export const fetchTrainings = async (storeId = null) => {
  console.log('🔍 [fetchTrainings] Iniciando busca, storeId:', storeId);
  
  let query = supabase
    .from('trainings')
    .select('*')
    .order('training_date', { ascending: true });
  
  // Se for loja, filtrar por lojas específicas ou treinamentos sem lojas específicas
  if (storeId) {
    // Buscar todos os treinamentos para filtrar no código
    // IMPORTANTE: RLS deve permitir que lojas vejam treinamentos disponíveis
    const { data: allTrainings, error: fetchError } = await supabase
      .from('trainings')
      .select('*')
      .order('training_date', { ascending: true });
    
    if (fetchError) {
      console.error('❌ [fetchTrainings] Erro ao buscar treinamentos:', fetchError);
      console.error('❌ [fetchTrainings] Detalhes do erro:', {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        hint: fetchError.hint
      });
      throw fetchError;
    }
    
    console.log('🔍 [fetchTrainings] StoreId:', storeId);
    console.log('🔍 [fetchTrainings] Total treinamentos no banco:', allTrainings?.length || 0);
    
    // Log de todos os treinamentos para debug
    if (allTrainings && allTrainings.length > 0) {
      console.log('📋 [fetchTrainings] Todos os treinamentos encontrados:');
      allTrainings.forEach(t => {
        console.log(`  - "${t.title}"`, {
          id: t.id,
          store_ids: t.store_ids,
          store_ids_type: typeof t.store_ids,
          store_ids_value: t.store_ids,
          training_date: t.training_date,
          format: t.format
        });
      });
    } else {
      console.warn('⚠️ [fetchTrainings] NENHUM treinamento encontrado no banco!');
      console.warn('⚠️ [fetchTrainings] Verifique se há treinamentos cadastrados e se as políticas RLS estão corretas.');
    }
    
    // Filtrar no código para verificar se a loja está no array de lojas
    const filtered = (allTrainings || []).filter(training => {
      // Se o treinamento não tem lojas específicas (store_ids), está disponível para todos
      if (!training.store_ids || training.store_ids === null || training.store_ids === '') {
        console.log('✅ [fetchTrainings] Treinamento sem lojas específicas (disponível para todos):', training.title);
        // Verificar se é futuro
        const trainingDate = new Date(training.training_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        trainingDate.setHours(0, 0, 0, 0);
        const isFuture = trainingDate >= today;
        if (!isFuture) {
          console.log('❌ [fetchTrainings] Treinamento já passou:', training.title);
        }
        return isFuture;
      }
      
      try {
        let storeIds;
        // JSONB pode vir como array ou como objeto, dependendo de como foi salvo
        if (typeof training.store_ids === 'string') {
          // Tentar parsear como JSON
          try {
            storeIds = JSON.parse(training.store_ids);
          } catch {
            // Se não for JSON válido, pode ser que esteja em outro formato
            console.warn('⚠️ [fetchTrainings] store_ids não é JSON válido, tentando como string simples:', training.store_ids);
            storeIds = [training.store_ids];
          }
        } else if (Array.isArray(training.store_ids)) {
          // Se já é array (JSONB retorna array diretamente)
          storeIds = training.store_ids;
        } else if (training.store_ids && typeof training.store_ids === 'object') {
          // Se for objeto, tentar converter
          storeIds = Object.values(training.store_ids);
        } else {
          storeIds = null;
        }
        
        if (Array.isArray(storeIds) && storeIds.length > 0) {
          // Converter todos para string para comparação (caso alguns sejam UUID e outros string)
          const storeIdsStr = storeIds.map(id => String(id).toLowerCase().trim());
          const storeIdStr = String(storeId).toLowerCase().trim();
          const isIncluded = storeIdsStr.includes(storeIdStr);
          
          console.log(`🔍 [fetchTrainings] Treinamento "${training.title}":`, {
            store_ids_original: storeIds,
            store_ids_string: storeIdsStr,
            store_id_buscado: storeIdStr,
            incluído: isIncluded,
            match_exato: storeIdsStr.some(id => id === storeIdStr)
          });
          
          if (isIncluded) {
            // Verificar se é futuro
            const trainingDate = new Date(training.training_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            trainingDate.setHours(0, 0, 0, 0);
            const isFuture = trainingDate >= today;
            if (!isFuture) {
              console.log('❌ [fetchTrainings] Treinamento já passou:', training.title);
            }
            return isFuture;
          }
          return false;
        }
        
        console.log('❌ [fetchTrainings] Treinamento sem array válido:', training.title, {
          store_ids: training.store_ids,
          store_ids_type: typeof training.store_ids
        });
        return false;
      } catch (error) {
        console.error('❌ [fetchTrainings] Erro ao processar store_ids:', error, {
          training_title: training.title,
          store_ids: training.store_ids
        });
        return false;
      }
    });
    
    console.log('✅ [fetchTrainings] Treinamentos filtrados:', filtered.length);
    if (filtered.length > 0) {
      filtered.forEach(t => {
        console.log(`  - ${t.title} (${t.training_date})`);
      });
    }
    return filtered || [];
  }
  
  // Se for admin, buscar todos os treinamentos
  console.log('🔍 [fetchTrainings] Buscando todos os treinamentos (admin)');
  const { data, error } = await query;
  
  if (error) {
    console.error('❌ [fetchTrainings] Erro ao buscar treinamentos:', error);
    throw error;
  }
  
  console.log('✅ [fetchTrainings] Treinamentos encontrados (admin):', data?.length || 0);
  if (data && data.length > 0) {
    data.forEach(t => {
      console.log(`  - ${t.title} (store_ids: ${t.store_ids})`);
    });
  }
  
  return data || [];
};
export const createTraining = async (trainingData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Processar store_ids: se for string JSON, manter; se for array, converter para JSONB
  let storeIdsValue = null;
  if (trainingData.storeIds || trainingData.store_ids) {
    const rawStoreIds = trainingData.storeIds || trainingData.store_ids;
    if (typeof rawStoreIds === 'string') {
      // Se já é string, pode ser JSON string ou precisa ser parseado
      try {
        const parsed = JSON.parse(rawStoreIds);
        storeIdsValue = Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch {
        // Se não for JSON válido, tratar como null
        storeIdsValue = null;
      }
    } else if (Array.isArray(rawStoreIds) && rawStoreIds.length > 0) {
      // Se é array, usar diretamente (Supabase JSONB aceita arrays)
      storeIdsValue = rawStoreIds;
    }
  }
  
  const dataToInsert = {
    title: trainingData.title,
    description: trainingData.description || null,
    training_date: trainingData.trainingDate || trainingData.training_date,
    time: trainingData.time || null,
    format: trainingData.format,
    brand: trainingData.brand || null,
    store_ids: storeIdsValue, // JSONB aceita array diretamente
    location: trainingData.location || null,
    link: trainingData.link || null,
    max_participants: trainingData.maxParticipants || trainingData.max_participants || null,
    created_by: user?.id || null
  };
  
  console.log('💾 [createTraining] Dados a serem salvos:', {
    title: dataToInsert.title,
    store_ids: dataToInsert.store_ids,
    store_ids_type: typeof dataToInsert.store_ids,
    format: dataToInsert.format,
    link: dataToInsert.link
  });
  
  const { data, error } = await supabase
    .from('trainings')
    .insert([dataToInsert])
    .select()
    .single();
  
  if (error) {
    console.error('❌ [createTraining] Erro ao criar:', error);
    console.error('❌ [createTraining] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }
  
  console.log('✅ [createTraining] Treinamento criado:', {
    id: data.id,
    title: data.title,
    store_ids: data.store_ids,
    store_ids_type: typeof data.store_ids
  });
  return data;
};

export const updateTraining = async (id, updates) => {
  const dataToUpdate = {
    title: updates.title,
    description: updates.description !== undefined ? (updates.description || null) : undefined,
    training_date: updates.trainingDate || updates.training_date,
    time: updates.time !== undefined ? (updates.time || null) : undefined,
    format: updates.format,
    brand: updates.brand !== undefined ? (updates.brand || null) : undefined,
    store_ids: updates.storeIds !== undefined ? (updates.storeIds || null) : (updates.store_ids !== undefined ? (updates.store_ids || null) : undefined),
    location: updates.location !== undefined ? (updates.location || null) : undefined,
    link: updates.link !== undefined ? (updates.link || null) : undefined,
    max_participants: updates.maxParticipants !== undefined ? (updates.maxParticipants || null) : (updates.max_participants !== undefined ? updates.max_participants : undefined),
    registrations_blocked: updates.registrationsBlocked !== undefined ? updates.registrationsBlocked : (updates.registrations_blocked !== undefined ? updates.registrations_blocked : undefined)
  };
  
  // Remove campos undefined (não enviar campos que não foram alterados)
  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });
  
  const { data, error } = await supabase
    .from('trainings')
    .update(dataToUpdate)
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
export const fetchTrainingRegistrations = async (trainingId = null, storeId = null) => {
  let query = supabase
    .from('training_registrations')
    .select(`
      *,
      training:trainings(*),
      collaborator:collaborators(*),
      store:stores(*)
    `)
    .order('registered_at', { ascending: false });
  
  if (trainingId) {
    query = query.eq('training_id', trainingId);
  }
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Formatar dados para manter consistência
  if (data && data.length > 0) {
    return data.map(reg => ({
      ...reg,
      trainingId: reg.training_id,
      collaboratorId: reg.collaborator_id,
      storeId: reg.store_id,
      registeredAt: reg.registered_at
    }));
  }
  
  return data || [];
};

export const createTrainingRegistration = async (registrationData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const dataToInsert = {
    training_id: registrationData.trainingId || registrationData.training_id,
    collaborator_id: registrationData.collaboratorId || registrationData.collaborator_id,
    store_id: registrationData.storeId || registrationData.store_id,
    status: registrationData.status || 'pending',
    registered_by: user?.id || null,
    notes: registrationData.notes || null
  };
  
  const { data, error } = await supabase
    .from('training_registrations')
    .insert([dataToInsert])
    .select(`
      *,
      training:trainings(*),
      collaborator:collaborators(*),
      store:stores(*)
    `)
    .single();
  
  if (error) {
    // Se for erro de duplicata, retornar erro mais amigável
    if (error.code === '23505') {
      throw new Error('Este colaborador já está inscrito neste treinamento.');
    }
    throw error;
  }
  
  // Formatar dados
  if (data) {
    return {
      ...data,
      trainingId: data.training_id,
      collaboratorId: data.collaborator_id,
      storeId: data.store_id,
      registeredAt: data.registered_at
    };
  }
  
  return data;
};

export const updateTrainingRegistration = async (id, updates) => {
  const dataToUpdate = {
    status: updates.status,
    notes: updates.notes,
    presence: updates.presence !== undefined ? updates.presence : undefined
  };
  
  // Remove campos undefined
  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });
  
  const { data, error } = await supabase
    .from('training_registrations')
    .update(dataToUpdate)
    .eq('id', id)
    .select(`
      *,
      training:trainings(*),
      collaborator:collaborators(*),
      store:stores(*)
    `)
    .single();
  
  if (error) throw error;
  
  // Formatar dados
  if (data) {
    return {
      ...data,
      trainingId: data.training_id,
      collaboratorId: data.collaborator_id,
      storeId: data.store_id,
      registeredAt: data.registered_at
    };
  }
  
  return data;
};

export const deleteTrainingRegistration = async (id) => {
  const { error } = await supabase
    .from('training_registrations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============ FEEDBACKS ============
export const fetchFeedbacks = async (storeId = null) => {
  // Buscar feedbacks sem relacionamento automático
  let query = supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (storeId) {
    query = query.eq('store_id', storeId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  // Se houver dados, buscar informações das lojas e colaboradores separadamente
  if (data && data.length > 0) {
    // Buscar store_ids únicos
    const storeIds = [...new Set(data.map(feedback => feedback.store_id).filter(id => id))];
    const collaboratorIds = [...new Set(data.map(feedback => feedback.collaborator_id).filter(id => id))];
    
    // Buscar dados das lojas
    if (storeIds.length > 0) {
      try {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, name, code')
          .in('id', storeIds)
          .order('code', { ascending: true });
        
        if (storesData) {
          const storesMap = new Map(storesData.map(store => [store.id, store]));
          data.forEach(feedback => {
            if (feedback.store_id && storesMap.has(feedback.store_id)) {
              feedback.store = storesMap.get(feedback.store_id);
            }
          });
        }
      } catch (storeError) {
        console.log('Erro ao buscar dados das lojas:', storeError);
      }
    }
    
    // Buscar dados dos colaboradores
    if (collaboratorIds.length > 0) {
      try {
        const { data: collaboratorsData } = await supabase
          .from('collaborators')
          .select('id, name')
          .in('id', collaboratorIds);
        
        if (collaboratorsData) {
          const collaboratorsMap = new Map(collaboratorsData.map(collab => [collab.id, collab]));
          data.forEach(feedback => {
            if (feedback.collaborator_id && collaboratorsMap.has(feedback.collaborator_id)) {
              feedback.collaborator = collaboratorsMap.get(feedback.collaborator_id);
            }
          });
        }
      } catch (collabError) {
        console.log('Erro ao buscar dados dos colaboradores:', collabError);
      }
    }
    
    // Converter store_id e collaborator_id para storeId e collaboratorId no retorno para manter consistência com o frontend
    return data.map(feedback => ({
      ...feedback,
      storeId: feedback.store_id,
      collaboratorId: feedback.collaborator_id,
      feedbackText: feedback.feedback_text,
      developmentPoint: feedback.development_point ?? null,
      isPromotionCandidate: feedback.is_promotion_candidate ?? false,
      satisfaction: feedback.satisfaction ?? null,
      managerSatisfaction: feedback.manager_satisfaction ?? null,
      manager_satisfaction: feedback.manager_satisfaction ?? null,
      collaboratorSatisfaction: feedback.collaborator_satisfaction ?? null,
      collaborator_satisfaction: feedback.collaborator_satisfaction ?? null,
      date: feedback.created_at ?? feedback.date
    }));
  }
  
  return data || [];
};
export const createFeedback = async (feedbackData) => {  // Validar campos obrigatórios
  const feedbackText = feedbackData.feedback_text || feedbackData.feedbackText || '';
  const storeId = feedbackData.store_id || feedbackData.storeId;
  const collaboratorId = feedbackData.collaborator_id || feedbackData.collaboratorId;  
  if (!storeId) {    throw new Error('store_id é obrigatório');
  }
  if (!collaboratorId) {    throw new Error('collaborator_id é obrigatório');
  }
  if (!feedbackText) {    throw new Error('feedback_text é obrigatório');
  }    try {    // Buscar o nome do colaborador antes de inserir    // A tabela feedbacks requer collaborator_name (NOT NULL)  
  const { data: collaborator, error: collaboratorError } = await supabase      .from('collaborators')      .select('name')      .eq('id', collaboratorId)      .single();      
  if (collaboratorError || !collaborator) {      throw new Error(`Colaborador não encontrado: ${collaboratorError?.message || 'ID inválido'}`);  
  }        // Criar objeto com campos obrigatórios (incluindo collaborator_name)  
  const basicData = {      feedback_text: feedbackText,      store_id: storeId,      collaborator_id: collaboratorId,      collaborator_name: collaborator.name  // Campo obrigatório NOT NULL  
};        // Preparar campos opcionais (serão adicionados depois da inserção básica se necessário)  
  const optionalFields = {
};  
  if (feedbackData.development_point || feedbackData.developmentPoint) {      optionalFields.development_point = feedbackData.development_point || feedbackData.developmentPoint;  
  }  
  if (feedbackData.satisfaction !== undefined) {      optionalFields.satisfaction = feedbackData.satisfaction;  
  }
  if (feedbackData.manager_satisfaction !== undefined || feedbackData.managerSatisfaction !== undefined) {
    optionalFields.manager_satisfaction = feedbackData.manager_satisfaction !== undefined
      ? feedbackData.manager_satisfaction
      : feedbackData.managerSatisfaction;
  } else if (feedbackData.managerSatisfaction !== undefined) {
    optionalFields.manager_satisfaction = feedbackData.managerSatisfaction;
  }
  if (feedbackData.collaborator_satisfaction !== undefined || feedbackData.collaboratorSatisfaction !== undefined) {
    optionalFields.collaborator_satisfaction = feedbackData.collaborator_satisfaction !== undefined
      ? feedbackData.collaborator_satisfaction
      : feedbackData.collaboratorSatisfaction;
  } else if (feedbackData.collaboratorSatisfaction !== undefined) {
    optionalFields.collaborator_satisfaction = feedbackData.collaboratorSatisfaction;
  }
  if (feedbackData.is_promotion_candidate !== undefined || feedbackData.isPromotionCandidate !== undefined) {      optionalFields.is_promotion_candidate = feedbackData.is_promotion_candidate !== undefined         ? feedbackData.is_promotion_candidate         : feedbackData.isPromotionCandidate;  
  }        // Se temos campos opcionais, adicionar ao objeto básico para inserir tudo de uma vez    // Isso evita fazer UPDATE depois e funciona melhor com cache do PostgREST  
  const dataToInsert = {      ...basicData,      ...optionalFields  
};        // Inserir todos os dados de uma vez  
  const { data: insertedData, error: insertError } = await supabase      .from('feedbacks')      .insert([dataToInsert])      .select('*')      .single();      
  if (insertError) {      // Se o INSERT falhar com campos opcionais, tentar apenas com campos obrigatórios    
  if (insertError.code === 'PGRST204' || Object.keys(optionalFields).length > 0) {        console.warn('⚠️ Tentando inserir apenas com campos obrigatórios...');              
  const { data: basicInsertData, error: basicInsertError } = await supabase          .from('feedbacks')          .insert([basicData])          .select('*')          .single();              
  if (basicInsertError) {          console.error('Erro ao inserir feedback (campos básicos):', basicInsertError);          throw new Error(`Erro ao criar feedback: ${basicInsertError.message}`);      
  }                // Se inserção básica funcionou, retornar dados      
  return {          ...basicInsertData,          storeId: basicInsertData.store_id,          collaboratorId: basicInsertData.collaborator_id,          feedbackText: basicInsertData.feedback_text,          developmentPoint: optionalFields.development_point ?? null,          isPromotionCandidate: optionalFields.is_promotion_candidate ?? false,          satisfaction: optionalFields.satisfaction ?? null,          managerSatisfaction: optionalFields.manager_satisfaction ?? null,          manager_satisfaction: optionalFields.manager_satisfaction ?? null,          collaboratorSatisfaction: optionalFields.collaborator_satisfaction ?? null,          collaborator_satisfaction: optionalFields.collaborator_satisfaction ?? null      
};    
  }            console.error('Erro ao inserir feedback:', insertError);      throw new Error(`Erro ao criar feedback: ${insertError.message}`);  
  }        // Se inserção funcionou, retornar dados formatados  
  if (insertedData) {    
  return {        ...insertedData,        storeId: insertedData.store_id,        collaboratorId: insertedData.collaborator_id,        feedbackText: insertedData.feedback_text,        developmentPoint: insertedData.development_point ?? null,        isPromotionCandidate: insertedData.is_promotion_candidate ?? false,        satisfaction: insertedData.satisfaction ?? null,        managerSatisfaction: insertedData.manager_satisfaction ?? null,        manager_satisfaction: insertedData.manager_satisfaction ?? null,        collaboratorSatisfaction: insertedData.collaborator_satisfaction ?? null,        collaborator_satisfaction: insertedData.collaborator_satisfaction ?? null    
};  
  }        throw new Error('Erro ao criar feedback: Nenhum dado retornado');    
  } catch (error) {    console.error('Erro ao criar feedback:', error);    throw error;
  }
};
export const deleteFeedback = async (feedbackId) => {
  if (!feedbackId) {
    throw new Error('ID do feedback é obrigatório');
  }
  
  console.log('🗑️ Tentando excluir feedback:', feedbackId);
  
  // Primeiro, verificar se o feedback existe
  const { data: existingFeedback, error: fetchError } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('id', feedbackId)
    .maybeSingle();
  
  if (fetchError) {
    console.error('❌ Erro ao verificar feedback:', fetchError);
    throw fetchError;
  }
  
  if (!existingFeedback) {
    console.warn('⚠️ Feedback não encontrado:', feedbackId);
    // Se não existe, considerar como sucesso (já foi excluído)
    return { success: true, deleted: false };
  }
  
  // Tentar excluir
  const { data, error } = await supabase
    .from('feedbacks')
    .delete()
    .eq('id', feedbackId)
    .select();
  
  if (error) {
    console.error('❌ Erro ao excluir feedback:', error);
    throw error;
  }
  
  // Se não houve erro, a exclusão foi bem-sucedida
  // Confiar no resultado do Supabase (pode haver cache/RLS que faz a verificação falhar)
  console.log('✅ Feedback excluído com sucesso:', feedbackId, data);
  return { success: true, deleted: true, data };
};

// Excluir múltiplos feedbacks baseado em níveis de satisfação
export const deleteFeedbacksBySatisfaction = async (satisfactionLevels) => {
  if (!satisfactionLevels || !Array.isArray(satisfactionLevels) || satisfactionLevels.length === 0) {
    throw new Error('Níveis de satisfação são obrigatórios e devem ser um array não vazio');
  }
  
  // Converter strings para números se necessário
  const levels = satisfactionLevels.map(level => parseInt(level, 10));
  
  console.log('🗑️ Tentando excluir feedbacks com satisfação:', levels);
  
  // Buscar feedbacks que correspondem aos níveis de satisfação
  const { data: feedbacksToDelete, error: fetchError } = await supabase
    .from('feedbacks')
    .select('id')
    .in('satisfaction', levels);
  
  if (fetchError) {
    console.error('❌ Erro ao buscar feedbacks:', fetchError);
    throw fetchError;
  }
  
  if (!feedbacksToDelete || feedbacksToDelete.length === 0) {
    console.log('ℹ️ Nenhum feedback encontrado para excluir');
    return { success: true, deleted: 0, total: 0 };
  }
  
  const feedbackIds = feedbacksToDelete.map(fb => fb.id);
  console.log(`🗑️ Excluindo ${feedbackIds.length} feedback(s)...`);
  
  // Excluir todos os feedbacks encontrados
  const { data, error } = await supabase
    .from('feedbacks')
    .delete()
    .in('id', feedbackIds)
    .select();
  
  if (error) {
    console.error('❌ Erro ao excluir feedbacks:', error);
    throw error;
  }
  
  const deletedCount = data?.length || 0;
  console.log(`✅ ${deletedCount} feedback(s) excluído(s) com sucesso`);
  return { success: true, deleted: deletedCount, total: feedbackIds.length };
};// ============ DAILY CHECKLISTS ============// Função genérica para buscar checklist por tipo (operacional ou gerencial)
export const fetchDailyChecklist = async (storeId, date, checklistType = 'operacional') => {  // Validar parâmetros
  if (!storeId) {    console.error('❌ storeId é obrigatório para buscar checklist');    throw new Error('storeId é obrigatório');
  }
  if (!date) {    console.error('❌ date é obrigatório para buscar checklist');    throw new Error('date é obrigatório');
  }    // Buscar todos os checklists para essa loja e data (pode haver operacional e gerencial)
  const { data: checklists, error } = await supabase    .from('daily_checklists')    .select('*')    .eq('store_id', storeId)    .eq('date', date);  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found    // Se não encontrou dados, retornar null
  if (!checklists || checklists.length === 0) return null;    // Buscar checklist com o tipo específico
  const checklistWithType = checklists.find(c => c.checklist_type === checklistType);  
  if (checklistWithType) {  
  return checklistWithType;
  }    // Se não encontrou com tipo e estamos buscando operacional, buscar legado (sem tipo)
  if (checklistType === 'operacional') {  
  const legacyChecklist = checklists.find(c => !c.checklist_type || c.checklist_type === null);  
  if (legacyChecklist) {    
  return legacyChecklist;  
  }
  }    // Não encontrou checklist do tipo solicitado
  return null;
};
export const upsertDailyChecklist = async (storeId, date, tasks, checklistType = 'operacional') => {
  // Validar parâmetros
  if (!storeId) {
    console.error('❌ storeId é obrigatório para salvar checklist');
    throw new Error('storeId é obrigatório');
  }
  if (!date) {
    console.error('❌ date é obrigatório para salvar checklist');
    throw new Error('date é obrigatório');
  }
  
  // IMPORTANTE: A constraint única agora é store_id + date + checklist_type
  // Isso significa que pode haver DOIS checklists separados (operacional e gerencial) para a mesma loja/data
  // Agora podemos fazer UPDATE/INSERT normalmente por tipo
  
  // Preparar dados do checklist
  const checklistData = {
    store_id: storeId,
    date,
    tasks,
    checklist_type: checklistType
  };
  
  // ESTRATÉGIA: Verificar se existe checklist com o tipo específico
  // 1. Buscar checklist com store_id + date + checklist_type
  // 2. Se existe, fazer UPDATE
  // 3. Se não existe, fazer INSERT
  
  try {
    // Primeiro, verificar se existe checklist legado (sem tipo) para operacional
    if (checklistType === 'operacional') {
      try {
        const { data: existingChecklist, error: fetchError } = await supabase
          .from('daily_checklists')
          .select('id')
          .eq('store_id', storeId)
          .eq('date', date)
          .is('checklist_type', null)
          .maybeSingle();
        
        // Se encontrou checklist legado, atualizar ele para incluir o tipo
        if (!fetchError && existingChecklist) {
          const { error: updateError } = await supabase
            .from('daily_checklists')
            .update({ tasks, checklist_type: 'operacional' })
            .eq('id', existingChecklist.id);
          
          if (!updateError) {
            // Buscar dados atualizados
            const { data: updatedData, error: refetchError } = await supabase
              .from('daily_checklists')
              .select('*')
              .eq('id', existingChecklist.id)
              .single();
            
            if (!refetchError) return updatedData;
          }
          // Se update falhou, continuar para verificar se existe com tipo
        }
      } catch (legacyError) {
        // Se houver erro ao buscar legado, continuar normalmente
        console.warn('Erro ao buscar checklist legado:', legacyError);
      }
    }
    
    // Verificar se existe checklist com o tipo específico
    const { data: existingWithType, error: fetchError } = await supabase
      .from('daily_checklists')
      .select('id')
      .eq('store_id', storeId)
      .eq('date', date)
      .eq('checklist_type', checklistType)
      .maybeSingle();
    
    if (!fetchError && existingWithType) {
      // Existe um checklist com este tipo, fazer UPDATE
      // IMPORTANTE: Não usar .select() no UPDATE para evitar erro 406
      const { error: updateError } = await supabase
        .from('daily_checklists')
        .update({ tasks })
        .eq('id', existingWithType.id);
      
      if (updateError) {
        // Se UPDATE falhar, buscar novamente para retornar o que existe
        console.warn('Erro ao atualizar checklist, buscando registro existente:', updateError);
        const { data: currentData, error: refetchError } = await supabase
          .from('daily_checklists')
          .select('*')
          .eq('id', existingWithType.id)
          .single();
        
        if (refetchError) {
          // Se não conseguir buscar, lançar o erro do update
          throw updateError;
        }
        
        return currentData;
      }
      
      // Buscar dados atualizados após o update
      const { data: updatedData, error: refetchError } = await supabase
        .from('daily_checklists')
        .select('*')
        .eq('id', existingWithType.id)
        .single();
      
      if (refetchError) {
        // Se não conseguir buscar, retornar os dados esperados
        return {
          ...existingWithType,
          store_id: storeId,
          date,
          tasks,
          checklist_type: checklistType
        };
      }
      
      return updatedData;
    }
    
    // Se não existe, fazer INSERT
    // Se falhar com 409/23505 (já existe), fazer UPDATE como fallback
    const { data: insertedData, error: insertError } = await supabase
      .from('daily_checklists')
      .insert([checklistData])
      .select('*')
      .single();
    
    if (!insertError && insertedData) {
      return insertedData;
    }
    
    // Se insert falhou com conflito, fazer UPDATE
    if (insertError) {
      const isConflict = insertError.code === '23505' ||
                        insertError.code === 'PGRST301' ||
                        insertError.code === '409' ||
                        insertError.message?.includes('duplicate') ||
                        insertError.message?.includes('unique') ||
                        insertError.message?.includes('conflict');
      
      if (isConflict) {
        // Tentar UPDATE novamente (pode ter sido criado entre a busca e o insert)
        const { error: updateError } = await supabase
          .from('daily_checklists')
          .update({ tasks })
          .eq('store_id', storeId)
          .eq('date', date)
          .eq('checklist_type', checklistType);
        
        if (updateError) {
          // Se UPDATE falhar, buscar o que existe
          const { data: existingData, error: fetchExistingError } = await supabase
            .from('daily_checklists')
            .select('*')
            .eq('store_id', storeId)
            .eq('date', date)
            .eq('checklist_type', checklistType)
            .maybeSingle();
          
          if (fetchExistingError) {
            // Se não conseguir buscar, lançar o erro do insert
            throw insertError;
          }
          
          return existingData;
        }
        
        // Buscar dados atualizados
        const { data: updatedData, error: fetchUpdatedError } = await supabase
          .from('daily_checklists')
          .select('*')
          .eq('store_id', storeId)
          .eq('date', date)
          .eq('checklist_type', checklistType)
          .single();
        
        if (fetchUpdatedError) {
          // Se não conseguir buscar, lançar o erro do insert
          throw insertError;
        }
        
        return updatedData;
      }
      
      // Se não é erro de conflito, lançar o erro
      throw insertError;
    }
    
    return insertedData;
  } catch (error) {
    console.error('Erro ao fazer upsert do checklist:', error);
    throw error;
  }
};

// Buscar histórico de checklists por loja e intervalo de datas e tipo
export const fetchChecklistHistory = async (storeId, startDate, endDate, checklistType = 'operacional') => {
  let query = supabase
    .from('daily_checklists')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', startDate)
    .lte('date', endDate);
  
  // Se a tabela tiver campo checklist_type, filtrar
  // Caso contrário, retornar todos e filtrar depois
  const { data, error } = await query.order('date', { ascending: false });
  
  if (error) throw error;
  
  // Filtrar por tipo se necessário
  if (data && data.length > 0) {
    return data.filter(item => {
      // Se tem tipo, comparar
      if (item.checklist_type) {
        return item.checklist_type === checklistType;
      }
      // Se não tem tipo, é checklist operacional (legado)
      return checklistType === 'operacional';
    });
  }
  
  return data || [];
};// Buscar todas as tarefas do checklist operacional (configuração)
export const fetchChecklistTasks = async () => {
  const tasks = await fetchAppSettings('daily_checklist_tasks');  // Se não houver tarefas salvas, retornar array vazio (será criado pela primeira vez)
  if (!tasks) return [];  // Se tasks for um array, retornar diretamente
  if (Array.isArray(tasks)) return tasks;  // Se tasks for um objeto com tasks, retornar tasks
  if (tasks && tasks.tasks && Array.isArray(tasks.tasks)) return tasks.tasks;
  return [];
};// Buscar todas as tarefas do checklist gerencial (configuração)
export const fetchGerencialChecklistTasks = async () => {
  const tasks = await fetchAppSettings('daily_checklist_gerencial_tasks');  // Se não houver tarefas salvas, retornar array vazio (será criado pela primeira vez)
  if (!tasks) return [];  // Se tasks for um array, retornar diretamente
  if (Array.isArray(tasks)) return tasks;  // Se tasks for um objeto com tasks, retornar tasks
  if (tasks && tasks.tasks && Array.isArray(tasks.tasks)) return tasks.tasks;
  return [];
};// Salvar tarefas do checklist operacional (configuração)
export const saveChecklistTasks = async (tasks) => {
  return await upsertAppSettings('daily_checklist_tasks', tasks);
};// Salvar tarefas do checklist gerencial (configuração)
export const saveGerencialChecklistTasks = async (tasks) => {
  return await upsertAppSettings('daily_checklist_gerencial_tasks', tasks);
};// ============ JOB ROLES (CARGOS) ============
export const fetchJobRoles = async () => {
  const roles = await fetchAppSettings('job_roles');
  if (!roles) return [];
  if (Array.isArray(roles)) return roles.filter(role => typeof role === 'string' && role.trim().length > 0);
  if (roles?.roles && Array.isArray(roles.roles)) {  
  return roles.roles.filter(role => typeof role === 'string' && role.trim().length > 0);
  }
  return [];
};
export const saveJobRoles = async (roles) => {
  if (!Array.isArray(roles)) {    throw new Error('Lista de cargos inválida.');
  }
  return await upsertAppSettings('job_roles', roles);
};// Buscar checklist de uma data específica para histórico (operacional)
export const fetchChecklistByDate = async (storeId, date) => {
  return await fetchDailyChecklist(storeId, date, 'operacional');
};// Buscar checklist gerencial de uma data específica para histórico
export const fetchGerencialChecklistByDate = async (storeId, date) => {
  return await fetchDailyChecklist(storeId, date, 'gerencial');
};// ======== CHECKLIST AUDIT ========const normalizeChecklistType = (checklistType) => checklistType || 'operacional';
export const fetchChecklistAudit = async (storeId, date, checklistType = 'operacional') => {
  if (!storeId || !date) return null;
  const { data, error } = await supabase    .from('checklist_audits')    .select('*')    .eq('store_id', storeId)    .eq('date', date)    .eq('checklist_type', normalizeChecklistType(checklistType))    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};
export const fetchChecklistAuditsByDate = async (date, checklistType = null) => {
  if (!date) return [];  let query = supabase    .from('checklist_audits')    .select('*')    .eq('date', date);
  if (checklistType) {    query = query.eq('checklist_type', normalizeChecklistType(checklistType));
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
export const fetchChecklistAuditsRange = async (storeId, startDate, endDate, checklistType = 'operacional') => {
  if (!storeId || !startDate || !endDate) return [];
  const { data, error } = await supabase    .from('checklist_audits')    .select('*')    .eq('store_id', storeId)    .eq('checklist_type', normalizeChecklistType(checklistType))    .gte('date', startDate)    .lte('date', endDate);
  if (error) throw error;
  return data || [];
};
export const upsertChecklistAudit = async ({ storeId, date, checklistType = 'operacional', auditedBy, auditedByName }) => {
  if (!storeId || !date) {    throw new Error('storeId e date são obrigatórios para registrar auditoria.');
  }
  const payload = {    store_id: storeId,    date,    checklist_type: normalizeChecklistType(checklistType),    audited_by: auditedBy || null,    audited_by_name: auditedByName || null,
};
  const { data, error } = await supabase    .from('checklist_audits')    .upsert(payload, { onConflict: 'store_id,date,checklist_type' })    .select('*')    .single();
  if (error) throw error;
  return data;
};
export const deleteChecklistAudit = async (storeId, date, checklistType = 'operacional') => {
  if (!storeId || !date) return;
  const { error } = await supabase    .from('checklist_audits')    .delete()    .eq('store_id', storeId)    .eq('date', date)    .eq('checklist_type', normalizeChecklistType(checklistType));
  if (error) throw error;
};// Buscar todas as auditorias com informações das lojas
export const fetchAllChecklistAudits = async (startDate = null, endDate = null, checklistType = null) => {  let query = supabase    .from('checklist_audits')    .select(`      *,      stores (        id,        name,        code,        bandeira,        supervisor      )    `)    .order('date', { ascending: false });  
  if (startDate) {    query = query.gte('date', startDate);
  }
  if (endDate) {    query = query.lte('date', endDate);
  }
  if (checklistType) {    query = query.eq('checklist_type', normalizeChecklistType(checklistType));
  }  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};// ============ APP SETTINGS ============
export const fetchAppSettings = async (key) => {
  const { data, error } = await supabase    .from('app_settings')    .select('*')    .eq('key', key)    .single();  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.value;
};
export const upsertAppSettings = async (key, value) => {
  const { data, error } = await supabase    .from('app_settings')    .upsert({      key,      value  
  }, {      onConflict: 'key'  
  })    .select()    .single();  
  if (error) throw error;
  return data;
};

// ============ CURRENT USER ============
export const fetchCurrentUserProfile = async () => {
  try {
    // Tentar obter o usuário atual
    // Se falhar com 403, a sessão está expirada e devemos retornar null sem mais tentativas
    let authUser = null;
    try {
      const { data, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        // Se for erro 403 ou 401, a sessão está expirada - não tentar mais nada
        if (getUserError.status === 403 || getUserError.status === 401) {
          console.warn('⚠️ Sessão expirada ou inválida (403/401). Retornando null sem tentar sessão local.');
          // Limpar sessão local se existir
          try {
            localStorage.removeItem('sb-hzwmacltgiyanukgvfvn-auth-token');
          } catch (e) {
            // Ignorar erros ao limpar
          }
          return null;
        } else {
          throw getUserError;
        }
      } else {
        authUser = data?.user;
      }
    } catch (authError) {
      // Se for erro 403/401, não logar como erro crítico - apenas retornar null
      if (authError.status === 403 || authError.status === 401) {
        console.warn('⚠️ Erro de autenticação (403/401). Sessão expirada.');
        return null;
      }
      console.error('❌ Erro ao obter usuário:', authError);
      // Se não conseguir obter usuário, retornar null
      return null;
    }
    
    if (!authUser) return null;
    
    // Buscar perfil do usuário (sem relacionamento automático com stores)
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    
    if (error) {
      // Se o erro for que não encontrou o perfil, retornar null
      if (error.code === 'PGRST116') {
        return null;
      }
      // Se o erro for de relacionamento não encontrado (PGRST200),
      // ainda tentar buscar sem relacionamento
      if (error.code === 'PGRST200') {
        // Já estamos buscando sem relacionamento, então este erro não deveria acontecer
        // Mas se acontecer, retornar null para permitir que o código continue
        console.warn('Erro PGRST200 ao buscar perfil:', error);
        return null;
      }
      throw error;
    }
    
    // Se não houver dados, retornar null
    if (!data) {
      return null;
    }
    
    // Se houver store_id, buscar dados da loja separadamente
    if (data?.store_id) {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id, name, code')
          .eq('id', data.store_id)
          .maybeSingle();
        
        if (storeData) {
          data.store = storeData;
        }
      } catch (storeError) {
        // Se falhar ao buscar a loja, não impedir o login
        // Apenas logar o erro sem propagar
        console.log('Erro ao buscar dados da loja (não crítico):', storeError);
      }
    }
    
    return data;
  } catch (error) {
    // Capturar qualquer erro inesperado e retornar null em vez de propagar
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
};// ============ RETURNS (DEVOLUÇÕES) ============
export const fetchReturns = async () => {
  const { data, error } = await supabase    .from('returns')    .select('*')    .order('created_at', { ascending: false });  
  if (error) {    // Se a tabela não existir, retornar array vazio (para não quebrar a aplicação)  
  if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {      console.warn('⚠️ Tabela returns não existe ainda. Retornando array vazio.');    
  return [];  
  }    throw error;
  }  
  return data || [];
};
export const createReturn = async (returnData) => {  // Converter camelCase para snake_case
  const dataToInsert = {    store_id: returnData.store_id || returnData.storeId,    brand: returnData.brand,    nf_number: returnData.nf_number || returnData.nfNumber || 'SEM_NF',    nf_emission_date: returnData.nf_emission_date || returnData.nfEmissionDate || null,    nf_value: returnData.nf_value !== undefined && returnData.nf_value !== null ? returnData.nf_value : (returnData.nfValue !== undefined && returnData.nfValue !== null ? returnData.nfValue : null),    volume_quantity: returnData.volume_quantity || returnData.volumeQuantity,    date: returnData.date,    admin_status: returnData.admin_status || returnData.adminStatus || 'aguardando_coleta',    collected_at: returnData.collected_at || returnData.collectedAt || null,    created_by: returnData.created_by || returnData.createdBy || null
};
  const { data, error } = await supabase    .from('returns')    .insert([dataToInsert])    .select()    .single();  
  if (error) throw error;
  return data;
};
export const updateReturn = async (id, updates) => {  // Buscar status anterior para histórico
  const { data: currentReturn } = await supabase    .from('returns')    .select('admin_status')    .eq('id', id)    .single();  
  const oldStatus = currentReturn?.admin_status;    // Converter camelCase para snake_case
  const dataToUpdate = {
};  
  if (updates.store_id !== undefined || updates.storeId !== undefined) {    dataToUpdate.store_id = updates.store_id || updates.storeId;
  }
  if (updates.brand !== undefined) dataToUpdate.brand = updates.brand;
  if (updates.nf_number !== undefined || updates.nfNumber !== undefined) {    dataToUpdate.nf_number = updates.nf_number || updates.nfNumber;
  }
  if (updates.nf_emission_date !== undefined || updates.nfEmissionDate !== undefined) {    dataToUpdate.nf_emission_date = updates.nf_emission_date || updates.nfEmissionDate;
  }
  if (updates.nf_value !== undefined || updates.nfValue !== undefined) {    dataToUpdate.nf_value = updates.nf_value !== undefined && updates.nf_value !== null ? updates.nf_value : (updates.nfValue !== undefined && updates.nfValue !== null ? updates.nfValue : null);
  }
  if (updates.volume_quantity !== undefined || updates.volumeQuantity !== undefined) {    dataToUpdate.volume_quantity = updates.volume_quantity || updates.volumeQuantity;
  }
  if (updates.date !== undefined) dataToUpdate.date = updates.date;
  if (updates.admin_status !== undefined || updates.adminStatus !== undefined) {    dataToUpdate.admin_status = updates.admin_status || updates.adminStatus;
  }
  if (updates.collected_at !== undefined || updates.collectedAt !== undefined) {    dataToUpdate.collected_at = updates.collected_at || updates.collectedAt;
  }
  const { data, error } = await supabase    .from('returns')    .update(dataToUpdate)    .eq('id', id)    .select()    .single();  
  if (error) throw error;    // Salvar histórico se status mudou
  const newStatus = dataToUpdate.admin_status;
  if (oldStatus && newStatus && oldStatus !== newStatus) {    try {    
  const { data: { user } } = await supabase.auth.getUser();      await saveReturnStatusHistory(id, oldStatus, newStatus, user?.id || null);  
  } catch (historyError) {      console.warn('⚠️ Erro ao salvar histórico de status:', historyError);  
  }
  }  
  return data;
};
export const deleteReturn = async (id) => {
  const { error } = await supabase    .from('returns')    .delete()    .eq('id', id);  
  if (error) throw error;
  return true;
};// Salvar histórico de mudanças de status de devolução
export const saveReturnStatusHistory = async (returnId, oldStatus, newStatus, changedBy = null) => {  try {  
  const historyData = {      return_id: returnId,      old_status: oldStatus,      new_status: newStatus,      changed_at: new Date().toISOString()  
};      
  if (changedBy) {      historyData.changed_by = changedBy;  
  }      
  const { error } = await supabase      .from('returns_status_history')      .insert([historyData]);        // Não lançar erro se a tabela não existir ainda  
  if (error && error.code !== '42P01') {      console.warn('⚠️ Erro ao salvar histórico de status (continuando mesmo assim):', error);  
  }
  } catch (error) {    console.warn('⚠️ Erro ao salvar histórico de status (continuando mesmo assim):', error);
  }
};// ============ PHYSICAL MISSING (FALTA FÍSICA) ============
export const fetchPhysicalMissing = async () => {
  const { data, error } = await supabase    .from('physical_missing')    .select('*')    .order('created_at', { ascending: false });  
  if (error) {    // Se a tabela não existir, retornar array vazio  
  if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {      console.warn('⚠️ Tabela physical_missing não existe ainda. Retornando array vazio.');    
  return [];  
  }    throw error;
  }  
  return data || [];
};
export const createPhysicalMissing = async (missingData) => {
  const dataToInsert = {    store_id: missingData.store_id || missingData.storeId,    brand: missingData.brand || null,    nf_number: missingData.nf_number || missingData.nfNumber || null,    sku: missingData.sku || null,    color: missingData.color || null,    size: missingData.size || null,    sku_info: missingData.sku_info || missingData.skuInfo || null,    cost_value: missingData.cost_value !== undefined && missingData.cost_value !== null ? missingData.cost_value : (missingData.costValue !== undefined && missingData.costValue !== null ? missingData.costValue : null),    quantity: missingData.quantity !== undefined && missingData.quantity !== null ? missingData.quantity : null,    total_value: missingData.total_value !== undefined && missingData.total_value !== null ? missingData.total_value : (missingData.totalValue !== undefined && missingData.totalValue !== null ? missingData.totalValue : null),    moved_to_defect: missingData.moved_to_defect !== undefined ? missingData.moved_to_defect : (missingData.movedToDefect !== undefined ? missingData.movedToDefect : false),    status: missingData.status || 'processo_aberto',    created_by: missingData.created_by || missingData.createdBy || null,    // Novo campo de tipo (array JSON ou texto)    missing_type: missingData.missing_type ? (Array.isArray(missingData.missing_type) ? missingData.missing_type : [missingData.missing_type]) : null,    // Campos de divergência (o que faltou)    divergence_missing_brand: missingData.divergence_missing_brand || null,    divergence_missing_sku: missingData.divergence_missing_sku || null,    divergence_missing_color: missingData.divergence_missing_color || null,    divergence_missing_size: missingData.divergence_missing_size || null,    divergence_missing_quantity: missingData.divergence_missing_quantity !== undefined && missingData.divergence_missing_quantity !== null ? missingData.divergence_missing_quantity : null,    divergence_missing_cost_value: missingData.divergence_missing_cost_value !== undefined && missingData.divergence_missing_cost_value !== null ? missingData.divergence_missing_cost_value : null,    // Campos de divergência (o que sobrou no lugar)    divergence_surplus_brand: missingData.divergence_surplus_brand || null,    divergence_surplus_sku: missingData.divergence_surplus_sku || null,    divergence_surplus_color: missingData.divergence_surplus_color || null,    divergence_surplus_size: missingData.divergence_surplus_size || null,    divergence_surplus_quantity: missingData.divergence_surplus_quantity !== undefined && missingData.divergence_surplus_quantity !== null ? missingData.divergence_surplus_quantity : null,    divergence_surplus_cost_value: missingData.divergence_surplus_cost_value !== undefined && missingData.divergence_surplus_cost_value !== null ? missingData.divergence_surplus_cost_value : null
};    // Campos antigos para compatibilidade (só incluir se fornecidos)
  if (missingData.product_name || missingData.productName) {    dataToInsert.product_name = missingData.product_name || missingData.productName;
  }
  if (missingData.product_code || missingData.productCode) {    dataToInsert.product_code = missingData.product_code || missingData.productCode;
  }
  if (missingData.notes) {    dataToInsert.notes = missingData.notes;
  }
  const { data, error } = await supabase    .from('physical_missing')    .insert([dataToInsert])    .select()    .single();  
  if (error) throw error;
  return data;
};
export const updatePhysicalMissing = async (id, updates) => {
  const dataToUpdate = {
};  
  if (updates.store_id !== undefined || updates.storeId !== undefined) {    dataToUpdate.store_id = updates.store_id || updates.storeId;
  }
  if (updates.brand !== undefined) dataToUpdate.brand = updates.brand;
  if (updates.nf_number !== undefined || updates.nfNumber !== undefined) {    dataToUpdate.nf_number = updates.nf_number || updates.nfNumber;
  }
  if (updates.sku !== undefined) dataToUpdate.sku = updates.sku;
  if (updates.color !== undefined) dataToUpdate.color = updates.color;
  if (updates.size !== undefined) dataToUpdate.size = updates.size;
  if (updates.sku_info !== undefined || updates.skuInfo !== undefined) {    dataToUpdate.sku_info = updates.sku_info || updates.skuInfo;
  }
  if (updates.cost_value !== undefined || updates.costValue !== undefined) {    dataToUpdate.cost_value = updates.cost_value !== undefined && updates.cost_value !== null ? updates.cost_value : (updates.costValue !== undefined && updates.costValue !== null ? updates.costValue : null);
  }
  if (updates.quantity !== undefined && updates.quantity !== null) {    dataToUpdate.quantity = updates.quantity;
  }
  if (updates.total_value !== undefined || updates.totalValue !== undefined) {    dataToUpdate.total_value = updates.total_value !== undefined && updates.total_value !== null ? updates.total_value : (updates.totalValue !== undefined && updates.totalValue !== null ? updates.totalValue : null);
  }
  if (updates.moved_to_defect !== undefined || updates.movedToDefect !== undefined) {    dataToUpdate.moved_to_defect = updates.moved_to_defect !== undefined ? updates.moved_to_defect : updates.movedToDefect;
  }  // Campos antigos para compatibilidade
  if (updates.product_name !== undefined || updates.productName !== undefined) {    dataToUpdate.product_name = updates.product_name || updates.productName;
  }
  if (updates.product_code !== undefined || updates.productCode !== undefined) {    dataToUpdate.product_code = updates.product_code || updates.productCode;
  }
  if (updates.notes !== undefined) dataToUpdate.notes = updates.notes;
  if (updates.status !== undefined) dataToUpdate.status = updates.status;
  const { data, error } = await supabase    .from('physical_missing')    .update(dataToUpdate)    .eq('id', id)    .select()    .single();  
  if (error) throw error;
  return data;
};
export const deletePhysicalMissing = async (id) => {
  const { error } = await supabase    .from('physical_missing')    .delete()    .eq('id', id);  
  if (error) throw error;
  return true;
};// ============ RETURNS PLANNER ============
export const fetchReturnsPlanner = async () => {  console.log('🔍 [fetchReturnsPlanner] Iniciando busca de planner de devoluções...');
  const { data, error } = await supabase    .from('returns_planner')    .select('*')    .order('opening_date', { ascending: false });  
  if (error) {    console.error('❌ [fetchReturnsPlanner] Erro ao buscar planner:', error);    throw error;
  }    console.log(`✅ [fetchReturnsPlanner] Registros encontrados: ${data?.length || 0}`);
  return data || [];
};
export const createReturnsPlanner = async (plannerData) => {
  const { data: { user } } = await supabase.auth.getUser();  
  const dataToInsert = {    store_id: plannerData.store_id || null,    supervisor: plannerData.supervisor || null,    return_type: plannerData.return_type,    opening_date: plannerData.opening_date,    brand: plannerData.brand || null,    case_number: plannerData.case_number || null,    invoice_number: plannerData.invoice_number || null,    invoice_issue_date: plannerData.invoice_issue_date || null,    return_value: plannerData.return_value ? parseFloat(plannerData.return_value) : null,    items_quantity: plannerData.items_quantity ? parseInt(plannerData.items_quantity) : null,    status: plannerData.status || 'Aguardando aprovação da marca',    responsible_user_id: plannerData.responsible_user_id || null,    created_by: user?.id || null,
};
  const { data, error } = await supabase    .from('returns_planner')    .insert([dataToInsert])    .select()    .single();  
  if (error) throw error;
  return data;
};
export const updateReturnsPlanner = async (id, updates) => {
  const dataToUpdate = {
};  
  if (updates.store_id !== undefined) dataToUpdate.store_id = updates.store_id || null;
  if (updates.supervisor !== undefined) dataToUpdate.supervisor = updates.supervisor || null;
  if (updates.return_type !== undefined) dataToUpdate.return_type = updates.return_type;
  if (updates.opening_date !== undefined) dataToUpdate.opening_date = updates.opening_date;
  if (updates.brand !== undefined) dataToUpdate.brand = updates.brand || null;
  if (updates.case_number !== undefined) dataToUpdate.case_number = updates.case_number || null;
  if (updates.invoice_number !== undefined) dataToUpdate.invoice_number = updates.invoice_number || null;
  if (updates.invoice_issue_date !== undefined) dataToUpdate.invoice_issue_date = updates.invoice_issue_date || null;
  if (updates.return_value !== undefined) dataToUpdate.return_value = updates.return_value ? parseFloat(updates.return_value) : null;
  if (updates.items_quantity !== undefined) dataToUpdate.items_quantity = updates.items_quantity ? parseInt(updates.items_quantity) : null;
  if (updates.status !== undefined) dataToUpdate.status = updates.status;
  if (updates.responsible_user_id !== undefined) dataToUpdate.responsible_user_id = updates.responsible_user_id || null;
  const { data, error } = await supabase    .from('returns_planner')    .update(dataToUpdate)    .eq('id', id)    .select()    .single();  
  if (error) throw error;
  return data;
};
export const deleteReturnsPlanner = async (id) => {
  const { error } = await supabase    .from('returns_planner')    .delete()    .eq('id', id);  
  if (error) throw error;
  return true;
};// ============ ACIONAMENTOS ============
export const fetchAcionamentos = async () => {
  const { data, error } = await supabase    .from('acionamentos')    .select('*')    .order('created_at', { ascending: false });  
  if (error) throw error;
  return data || [];
};
export const createAcionamento = async (acionamentoData) => {
  const { data, error } = await supabase    .from('acionamentos')    .insert([{      store_id: acionamentoData.store_id,      motivo: acionamentoData.motivo,      status: acionamentoData.status || 'em_tratativa',      user_id: acionamentoData.user_id || null  
  }])    .select()    .single();  
  if (error) throw error;
  return data;
};
export const updateAcionamento = async (id, updates) => {
  const { data, error } = await supabase    .from('acionamentos')    .update({      store_id: updates.store_id,      motivo: updates.motivo,      status: updates.status,      updated_at: new Date().toISOString()  
  })    .eq('id', id)    .select()    .single();  
  if (error) throw error;
  return data;
};
export const deleteAcionamento = async (id) => {
  const { error } = await supabase    .from('acionamentos')    .delete()    .eq('id', id);  
  if (error) throw error;
  return true;
};// ============ ALERTAS E COMUNICADOS ============
export const fetchAlerts = async (storeId = null) => {  let query = supabase    .from('alerts')    .select('*')    .order('created_at', { ascending: false });  
  const { data, error } = await query;  
  if (error) throw error;
  return data || [];
};
export const createAlert = async (alertData) => {
  const { data: { user } } = await supabase.auth.getUser();  
  const { data, error } = await supabase    .from('alerts')    .insert([{      title: alertData.title,      message: alertData.message,      created_by: user?.id || null,      expires_at: alertData.expires_at || null,      is_active: alertData.is_active !== undefined ? alertData.is_active : true,      store_ids: alertData.store_ids && alertData.store_ids.length > 0 ? alertData.store_ids : null,      franqueado_names: alertData.franqueado_names && alertData.franqueado_names.length > 0 ? alertData.franqueado_names : null,      bandeira_names: alertData.bandeira_names && alertData.bandeira_names.length > 0 ? alertData.bandeira_names : null  
  }])    .select()    .single();  
  if (error) throw error;
  return data;
};
export const updateAlert = async (id, updates) => {
  const dataToUpdate = {
};  
  if (updates.title !== undefined) dataToUpdate.title = updates.title;
  if (updates.message !== undefined) dataToUpdate.message = updates.message;
  if (updates.expires_at !== undefined) dataToUpdate.expires_at = updates.expires_at || null;
  if (updates.is_active !== undefined) dataToUpdate.is_active = updates.is_active;
  if (updates.store_ids !== undefined) dataToUpdate.store_ids = updates.store_ids && updates.store_ids.length > 0 ? updates.store_ids : null;
  if (updates.franqueado_names !== undefined) dataToUpdate.franqueado_names = updates.franqueado_names && updates.franqueado_names.length > 0 ? updates.franqueado_names : null;
  if (updates.bandeira_names !== undefined) dataToUpdate.bandeira_names = updates.bandeira_names && updates.bandeira_names.length > 0 ? updates.bandeira_names : null;
  const { data, error } = await supabase    .from('alerts')    .update(dataToUpdate)    .eq('id', id)    .select()    .single();  
  if (error) throw error;
  return data;
};
export const deleteAlert = async (id) => {
  const { error } = await supabase    .from('alerts')    .delete()    .eq('id', id);  
  if (error) throw error;
  return true;
};// Buscar alertas não visualizados por um usuário/loja
export const fetchUnreadAlerts = async (storeId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !storeId) return [];  // Buscar informações da loja
  const { data: store, error: storeError } = await supabase    .from('stores')    .select('id, franqueado, bandeira')    .eq('id', storeId)    .single();  
  if (storeError || !store) return [];  // Buscar alertas ativos
  const { data: alerts, error: alertsError } = await supabase    .from('alerts')    .select('*')    .eq('is_active', true)    .order('created_at', { ascending: false });  
  if (alertsError) throw alertsError;
  if (!alerts || alerts.length === 0) return [];  // Buscar visualizações do usuário
  const { data: views, error: viewsError } = await supabase    .from('alert_views')    .select('alert_id')    .eq('user_id', user.id);  
  if (viewsError) throw viewsError;  
  const viewedAlertIds = new Set((views || []).map(v => v.alert_id));    // Filtrar alertas não visualizados e destinados à loja
  const unreadAlerts = alerts.filter(alert => {    // Verificar se já foi visualizado  
  if (viewedAlertIds.has(alert.id)) return false;        // Verificar se o alerta não expirou  
  if (alert.expires_at && new Date(alert.expires_at) < new Date()) {    
  return false;  
  }        // Se não tem destinatários específicos, é para todas as lojas  
  if (!alert.store_ids && !alert.franqueado_names && !alert.bandeira_names) {    
  return true;  
  }        // Verificar se a loja está na lista de destinatários  
  if (alert.store_ids && alert.store_ids.length > 0) {    
  if (alert.store_ids.includes(storeId)) {      
  return true;    
  }  
  }        // Verificar se o franqueado está na lista  
  if (alert.franqueado_names && alert.franqueado_names.length > 0) {    
  if (store.franqueado && alert.franqueado_names.includes(store.franqueado)) {      
  return true;    
  }  
  }        // Verificar se a bandeira está na lista  
  if (alert.bandeira_names && alert.bandeira_names.length > 0) {    
  if (store.bandeira && alert.bandeira_names.includes(store.bandeira)) {      
  return true;    
  }  
  }      
  return false;
  });  
  return unreadAlerts || [];
};// Marcar alerta como visualizado
export const markAlertAsViewed = async (alertId, storeId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {    throw new Error('Usuário não autenticado');
  }
  if (!storeId) {    throw new Error('ID da loja não fornecido');
  }  console.log('📝 Marcando alerta como visualizado:', { alertId, storeId, userId: user.id });
  const { data, error } = await supabase    .from('alert_views')    .insert([{      alert_id: alertId,      user_id: user.id,      store_id: storeId  
  }])    .select()    .single();  
  if (error) {    console.error('❌ Erro ao inserir visualização:', error);    // Se já existe, não é erro - retornar sucesso  
  if (error.code === '23505') { // Unique violation      console.log('✅ Visualização já existe, retornando sucesso');    
  return { id: alertId, viewed: true, already_exists: true 
};  
  }    throw error;
  }    console.log('✅ Visualização registrada com sucesso:', data);
  return data;
};// Buscar visualizações de um alerta (para comunicação ver quem visualizou)
export const fetchAlertViews = async (alertId) => {  // Buscar visualizações primeiro
  const { data: views, error: viewsError } = await supabase    .from('alert_views')    .select('*, store:stores(id, name, code, bandeira, franqueado)')    .eq('alert_id', alertId)    .order('viewed_at', { ascending: false });  
  if (viewsError) throw viewsError;
  if (!views || views.length === 0) return [];  // Buscar dados dos usuários da tabela app_users
  const userIds = views.map(v => v.user_id).filter(Boolean);
  if (userIds.length === 0) return views;
  const { data: users, error: usersError } = await supabase    .from('app_users')    .select('id, username, email, role')    .in('id', userIds);
  if (usersError) {    console.warn('Erro ao buscar usuários:', usersError);    // Retornar views mesmo sem dados de usuário  
  return views || [];
  }  // Combinar dados
  const usersMap = new Map(users.map(u => [u.id, u]));
  return views.map(view => ({    ...view,    user: usersMap.get(view.user_id) || null
  }));
};

// Buscar lojas destinatárias de um alerta (para comparar com visualizações)
export const fetchAlertRecipients = async (alertId) => {
  // Buscar o alerta primeiro
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select('store_ids, franqueado_names, bandeira_names')
    .eq('id', alertId)
    .single();
  
  if (alertError) throw alertError;
  if (!alert) return [];
  
  let query = supabase
    .from('stores')
    .select('id, name, code, bandeira, franqueado');
  
  // Se tem lojas específicas
  if (alert.store_ids && alert.store_ids.length > 0) {
    query = query.in('id', alert.store_ids);
  }
  // Se tem franqueados específicos
  else if (alert.franqueado_names && alert.franqueado_names.length > 0) {
    query = query.in('franqueado', alert.franqueado_names);
  }
  // Se tem bandeiras específicas
  else if (alert.bandeira_names && alert.bandeira_names.length > 0) {
    query = query.in('bandeira', alert.bandeira_names);
  }
  // Se não tem destinatários específicos, retornar todas as lojas
  // (não aplicamos filtro)
  
  const { data, error } = await query.order('name');
  
  if (error) throw error;
  return data || [];
};

// ============ RETURNS PROCESSING CAPACITY (CAPACIDADE DE PROCESSAMENTO) ============
export const fetchReturnsCapacity = async () => {
  const { data, error } = await supabase
    .from('returns_processing_capacity')
    .select('*')
    .order('data_referencia', { ascending: false })
    .order('store_id', { ascending: true })
    .order('mu', { ascending: true });
  
  if (error) {
    // Se a tabela não existir, retornar array vazio
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('⚠️ Tabela returns_processing_capacity não existe ainda. Retornando array vazio.');
      return [];
    }
    throw error;
  }
  return data || [];
};

export const createReturnsCapacity = async (capacityData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const dataToInsert = {
    store_id: capacityData.store_id || capacityData.storeId,
    mu: capacityData.mu,
    capacidade_estoque: capacityData.capacidade_estoque || capacityData.capacidadeEstoque || 0,
    estoque_atual: capacityData.estoque_atual !== undefined ? capacityData.estoque_atual : (capacityData.estoqueAtual !== undefined ? capacityData.estoqueAtual : 0),
    sku: capacityData.sku || 0,
    ate_4_pecas: capacityData.ate_4_pecas !== undefined ? capacityData.ate_4_pecas : (capacityData.ate4Pecas !== undefined ? capacityData.ate4Pecas : 0),
    percentual_ultimas_pecas: capacityData.percentual_ultimas_pecas !== undefined ? capacityData.percentual_ultimas_pecas : (capacityData.percentualUltimasPecas !== undefined ? capacityData.percentualUltimasPecas : 0),
    capacidade_estoque_venda: capacityData.capacidade_estoque_venda !== undefined ? capacityData.capacidade_estoque_venda : (capacityData.capacidadeEstoqueVenda !== undefined ? capacityData.capacidadeEstoqueVenda : 0),
    data_referencia: capacityData.data_referencia || capacityData.dataReferencia || new Date().toISOString().split('T')[0],
    created_by: user?.id || null
  };
  
  const { data, error } = await supabase
    .from('returns_processing_capacity')
    .insert([dataToInsert])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateReturnsCapacity = async (id, updates) => {
  const dataToUpdate = {};
  
  if (updates.store_id !== undefined || updates.storeId !== undefined) {
    dataToUpdate.store_id = updates.store_id || updates.storeId;
  }
  if (updates.mu !== undefined) dataToUpdate.mu = updates.mu;
  if (updates.capacidade_estoque !== undefined || updates.capacidadeEstoque !== undefined) {
    dataToUpdate.capacidade_estoque = updates.capacidade_estoque !== undefined ? updates.capacidade_estoque : updates.capacidadeEstoque;
  }
  if (updates.estoque_atual !== undefined || updates.estoqueAtual !== undefined) {
    dataToUpdate.estoque_atual = updates.estoque_atual !== undefined ? updates.estoque_atual : updates.estoqueAtual;
  }
  if (updates.sku !== undefined) dataToUpdate.sku = updates.sku;
  if (updates.ate_4_pecas !== undefined || updates.ate4Pecas !== undefined) {
    dataToUpdate.ate_4_pecas = updates.ate_4_pecas !== undefined ? updates.ate_4_pecas : updates.ate4Pecas;
  }
  if (updates.percentual_ultimas_pecas !== undefined || updates.percentualUltimasPecas !== undefined) {
    dataToUpdate.percentual_ultimas_pecas = updates.percentual_ultimas_pecas !== undefined ? updates.percentual_ultimas_pecas : updates.percentualUltimasPecas;
  }
  if (updates.capacidade_estoque_venda !== undefined || updates.capacidadeEstoqueVenda !== undefined) {
    dataToUpdate.capacidade_estoque_venda = updates.capacidade_estoque_venda !== undefined ? updates.capacidade_estoque_venda : updates.capacidadeEstoqueVenda;
  }
  if (updates.data_referencia !== undefined || updates.dataReferencia !== undefined) {
    dataToUpdate.data_referencia = updates.data_referencia || updates.dataReferencia;
  }
  
  const { data, error } = await supabase
    .from('returns_processing_capacity')
    .update(dataToUpdate)
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
  return true;
};
