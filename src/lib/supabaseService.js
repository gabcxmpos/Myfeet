import { supabase } from '@/lib/customSupabaseClient';

// ============ STORES ============
export const fetchStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  
  if (error) throw error;
  
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

// Salvar histórico de metas antes de atualizar
export const saveGoalsHistory = async (storeId, goals, weights, changedBy = null) => {
  try {
    const historyData = {
      store_id: storeId,
      goals: goals || {},
      weights: weights || {}
    };
    
    // Se tiver informação do usuário que está fazendo a mudança, adicionar
    if (changedBy) {
      historyData.changed_by = changedBy;
    }
    
    const { error } = await supabase
      .from('goals_history')
      .insert([historyData]);
    
    // Não lançar erro se a tabela não existir ainda (para não quebrar a aplicação)
    if (error && error.code !== '42P01') { // 42P01 = table does not exist
      console.warn('⚠️ Erro ao salvar histórico de metas (continuando mesmo assim):', error);
    }
  } catch (error) {
    // Não lançar erro - apenas logar
    console.warn('⚠️ Erro ao salvar histórico de metas (continuando mesmo assim):', error);
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
  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Buscar histórico de metas de uma loja
export const fetchGoalsHistory = async (storeId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('goals_history')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    // Se a tabela não existir ainda, retornar array vazio
    if (error.code === '42P01') { // 42P01 = table does not exist
      console.warn('⚠️ Tabela goals_history não existe ainda. Execute o script CRIAR_HISTORICO_METAS.sql');
      return [];
    }
    throw error;
  }
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
  // Buscar usuários da tabela app_users (sem relacionamento automático)
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .order('username');
  
  if (error) throw error;
  
  // Se houver usuários com store_id, buscar dados das lojas
  if (data && data.length > 0) {
    const storeIds = data
      .map(user => user.store_id)
      .filter(id => id !== null && id !== undefined);
    
    if (storeIds.length > 0) {
      try {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, name, code')
          .in('id', storeIds)
          .order('code', { ascending: true });
        
        // Adicionar dados da loja a cada usuário
        if (storesData) {
          const storesMap = new Map(storesData.map(store => [store.id, store]));
          data.forEach(user => {
            if (user.store_id && storesMap.has(user.store_id)) {
              user.store = storesMap.get(user.store_id);
            }
          });
        }
      } catch (storeError) {
        // Se falhar ao buscar lojas, continuar sem os dados das lojas
        console.log('Erro ao buscar dados das lojas:', storeError);
      }
    }
  }
  
  return data || [];
};

// Buscar email do usuário através do auth.users
// Nota: Isso requer uma função edge ou RPC no Supabase que use a service role key
// Por enquanto, vamos armazenar o email na tabela app_users ou buscar de outra forma
export const getUserEmail = async (userId) => {
  // Tentar buscar o email do usuário
  // Como não temos acesso direto ao auth.users com anon key,
  // vamos tentar buscar através de uma função RPC ou edge function
  // Por enquanto, retornamos null e vamos armazenar o email na tabela app_users
  
  // Solução: Armazenar o email na tabela app_users quando criar o usuário
  // ou buscar através de uma função RPC/Edge que use service role key
  
  return null;
};

export const createAppUser = async (email, password, userData) => {
  // Senha padrão para primeiro acesso
  const DEFAULT_PASSWORD = 'afeet10';
  
  // Se não houver senha fornecida, usar senha padrão
  // Todos os novos usuários terão a senha padrão e precisarão definir uma nova senha no primeiro acesso
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
  const DEFAULT_PASSWORD = 'afeet10';
  
  // Validar email
  if (!sanitizedEmail) {
    throw new Error('Email é obrigatório');
  }
  
  // Tentar usar a função RPC para resetar a senha para a senha padrão
  try {
    const { data, error } = await supabase.rpc('reset_user_password_to_default', {
      p_email: sanitizedEmail
    });
    
    if (error) {
      // Se a função RPC não existir, tentar alternativa
      if (error.code === 'PGRST202' || error.message?.includes('not found')) {
        console.warn('Função RPC não encontrada, tentando método alternativo...');
        
        // Método alternativo: usar a API Admin do Supabase
        // Como não temos acesso direto à API Admin, vamos usar uma abordagem diferente
        // Buscar o usuário pelo email e usar updateUser se o usuário estiver logado
        // Mas isso não funciona para outros usuários
        
        // Por enquanto, vamos lançar um erro com instruções
        throw new Error(`Não foi possível resetar a senha. A função RPC não está disponível. Execute o script CRIAR_FUNCAO_RESET_SENHA.sql no Supabase SQL Editor para criar a função necessária.`);
      }
      
      throw error;
    }
    
    // Verificar se a função retornou sucesso
    if (data && data.success) {
      console.log('✅ Senha resetada com sucesso:', data.message);
      return true;
    } else if (data && !data.success) {
      throw new Error(data.error || 'Erro ao resetar senha');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    throw error;
  }
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
  if (!id) {
    throw new Error('ID do formulário é obrigatório');
  }
  
  console.log('🗑️ Tentando excluir formulário:', id);
  
  // Primeiro, verificar se o formulário existe
  const { data: existingForm, error: fetchError } = await supabase
    .from('forms')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (fetchError) {
    console.error('❌ Erro ao verificar formulário:', fetchError);
    throw fetchError;
  }
  
  if (!existingForm) {
    console.warn('⚠️ Formulário não encontrado:', id);
    // Se não existe, considerar como sucesso (já foi excluído)
    return { success: true, deleted: false };
  }
  
  // Tentar excluir
  const { data, error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('❌ Erro ao excluir formulário:', error);
    throw error;
  }
  
  // Verificar se realmente foi excluído
  const { data: verifyDeleted, error: verifyError } = await supabase
    .from('forms')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (verifyError && verifyError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar exclusão:', verifyError);
    throw verifyError;
  }
  
  if (verifyDeleted) {
    console.error('❌ Formulário ainda existe após exclusão:', id);
    throw new Error('A exclusão falhou. O formulário ainda existe no banco de dados.');
  }
  
  console.log('✅ Formulário excluído com sucesso:', id);
  return { success: true, deleted: true, data };
};

// ============ EVALUATIONS ============
export const fetchEvaluations = async () => {
  // Buscar avaliações sem relacionamento automático
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Se houver dados, buscar informações das lojas e usuários separadamente
  if (data && data.length > 0) {
    // Buscar store_ids únicos
    const storeIds = [...new Set(data.map(evaluation => evaluation.store_id).filter(id => id))];
    const userIds = [...new Set(data.map(evaluation => evaluation.user_id).filter(id => id))];
    
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
          data.forEach(evaluation => {
            if (evaluation.store_id && storesMap.has(evaluation.store_id)) {
              evaluation.store = storesMap.get(evaluation.store_id);
            }
          });
        }
      } catch (storeError) {
        console.log('Erro ao buscar dados das lojas:', storeError);
      }
    }
    
    // Buscar dados dos usuários
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabase
          .from('app_users')
          .select('id, username')
          .in('id', userIds);
        
        if (usersData) {
          const usersMap = new Map(usersData.map(user => [user.id, user]));
          data.forEach(evaluation => {
            if (evaluation.user_id && usersMap.has(evaluation.user_id)) {
              evaluation.app_user = usersMap.get(evaluation.user_id);
            }
          });
        }
      } catch (userError) {
        console.log('Erro ao buscar dados dos usuários:', userError);
      }
    }
    
    // Converter snake_case para camelCase para manter consistência com o frontend
    return data.map(evaluation => ({
      ...evaluation,
      storeId: evaluation.store_id,
      formId: evaluation.form_id,
      userId: evaluation.user_id,
      date: evaluation.created_at || evaluation.date
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
  
  // Verificar se realmente foi excluída
  const { data: verifyDeleted, error: verifyError } = await supabase
    .from('evaluations')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  
  if (verifyError && verifyError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar exclusão:', verifyError);
    throw verifyError;
  }
  
  if (verifyDeleted) {
    console.error('❌ Avaliação ainda existe após exclusão:', id);
    throw new Error('A exclusão falhou. A avaliação ainda existe no banco de dados.');
  }
  
  console.log('✅ Avaliação excluída com sucesso:', id);
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
    store_id: collaboratorData.store_id || collaboratorData.storeId
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

export const deleteCollaborator = async (id) => {
  const { error } = await supabase
    .from('collaborators')
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
      developmentPoint: feedback.development_point || null,
      isPromotionCandidate: feedback.is_promotion_candidate || false,
      satisfaction: feedback.satisfaction || 3,
      date: feedback.created_at || feedback.date
    }));
  }
  
  return data || [];
};

export const createFeedback = async (feedbackData) => {
  // Validar campos obrigatórios
  const feedbackText = feedbackData.feedback_text || feedbackData.feedbackText || '';
  const storeId = feedbackData.store_id || feedbackData.storeId;
  const collaboratorId = feedbackData.collaborator_id || feedbackData.collaboratorId;
  
  if (!storeId) {
    throw new Error('store_id é obrigatório');
  }
  if (!collaboratorId) {
    throw new Error('collaborator_id é obrigatório');
  }
  if (!feedbackText) {
    throw new Error('feedback_text é obrigatório');
  }
  
  try {
    // Buscar o nome do colaborador antes de inserir
    // A tabela feedbacks requer collaborator_name (NOT NULL)
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('collaborators')
      .select('name')
      .eq('id', collaboratorId)
      .single();
    
    if (collaboratorError || !collaborator) {
      throw new Error(`Colaborador não encontrado: ${collaboratorError?.message || 'ID inválido'}`);
    }
    
    // Criar objeto com campos obrigatórios (incluindo collaborator_name)
    const basicData = {
      feedback_text: feedbackText,
      store_id: storeId,
      collaborator_id: collaboratorId,
      collaborator_name: collaborator.name  // Campo obrigatório NOT NULL
    };
    
    // Preparar campos opcionais (serão adicionados depois da inserção básica se necessário)
    const optionalFields = {};
    if (feedbackData.development_point || feedbackData.developmentPoint) {
      optionalFields.development_point = feedbackData.development_point || feedbackData.developmentPoint;
    }
    if (feedbackData.satisfaction !== undefined) {
      optionalFields.satisfaction = feedbackData.satisfaction;
    }
    if (feedbackData.is_promotion_candidate !== undefined || feedbackData.isPromotionCandidate !== undefined) {
      optionalFields.is_promotion_candidate = feedbackData.is_promotion_candidate !== undefined 
        ? feedbackData.is_promotion_candidate 
        : feedbackData.isPromotionCandidate;
    }
    
    // Se temos campos opcionais, adicionar ao objeto básico para inserir tudo de uma vez
    // Isso evita fazer UPDATE depois e funciona melhor com cache do PostgREST
    const dataToInsert = {
      ...basicData,
      ...optionalFields
    };
    
    // Inserir todos os dados de uma vez
    const { data: insertedData, error: insertError } = await supabase
      .from('feedbacks')
      .insert([dataToInsert])
      .select('*')
      .single();
    
    if (insertError) {
      // Se o INSERT falhar com campos opcionais, tentar apenas com campos obrigatórios
      if (insertError.code === 'PGRST204' || Object.keys(optionalFields).length > 0) {
        console.warn('⚠️ Tentando inserir apenas com campos obrigatórios...');
        
        const { data: basicInsertData, error: basicInsertError } = await supabase
          .from('feedbacks')
          .insert([basicData])
          .select('*')
          .single();
        
        if (basicInsertError) {
          console.error('Erro ao inserir feedback (campos básicos):', basicInsertError);
          throw new Error(`Erro ao criar feedback: ${basicInsertError.message}`);
        }
        
        // Se inserção básica funcionou, retornar dados
        return {
          ...basicInsertData,
          storeId: basicInsertData.store_id,
          collaboratorId: basicInsertData.collaborator_id,
          feedbackText: basicInsertData.feedback_text,
          developmentPoint: optionalFields.development_point || null,
          isPromotionCandidate: optionalFields.is_promotion_candidate || false,
          satisfaction: optionalFields.satisfaction || 3
        };
      }
      
      console.error('Erro ao inserir feedback:', insertError);
      throw new Error(`Erro ao criar feedback: ${insertError.message}`);
    }
    
    // Se inserção funcionou, retornar dados formatados
    if (insertedData) {
      return {
        ...insertedData,
        storeId: insertedData.store_id,
        collaboratorId: insertedData.collaborator_id,
        feedbackText: insertedData.feedback_text,
        developmentPoint: insertedData.development_point || null,
        isPromotionCandidate: insertedData.is_promotion_candidate || false,
        satisfaction: insertedData.satisfaction || 3
      };
    }
    
    throw new Error('Erro ao criar feedback: Nenhum dado retornado');
    
  } catch (error) {
    console.error('Erro ao criar feedback:', error);
    throw error;
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
  
  // Verificar se realmente foi excluído
  const { data: verifyDeleted, error: verifyError } = await supabase
    .from('feedbacks')
    .select('id')
    .eq('id', feedbackId)
    .maybeSingle();
  
  if (verifyError && verifyError.code !== 'PGRST116') {
    console.error('❌ Erro ao verificar exclusão:', verifyError);
    throw verifyError;
  }
  
  if (verifyDeleted) {
    console.error('❌ Feedback ainda existe após exclusão:', feedbackId);
    throw new Error('A exclusão falhou. O feedback ainda existe no banco de dados.');
  }
  
  console.log('✅ Feedback excluído com sucesso:', feedbackId);
  return { success: true, deleted: true, data };
};

// ============ DAILY CHECKLISTS ============
// Função genérica para buscar checklist por tipo (operacional ou gerencial)
export const fetchDailyChecklist = async (storeId, date, checklistType = 'operacional') => {
  // Validar parâmetros
  if (!storeId) {
    console.error('❌ storeId é obrigatório para buscar checklist');
    throw new Error('storeId é obrigatório');
  }
  if (!date) {
    console.error('❌ date é obrigatório para buscar checklist');
    throw new Error('date é obrigatório');
  }
  
  // Buscar todos os checklists para essa loja e data (pode haver operacional e gerencial)
  const { data: checklists, error } = await supabase
    .from('daily_checklists')
    .select('*')
    .eq('store_id', storeId)
    .eq('date', date);
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  
  // Se não encontrou dados, retornar null
  if (!checklists || checklists.length === 0) return null;
  
  // Buscar checklist com o tipo específico
  const checklistWithType = checklists.find(c => c.checklist_type === checklistType);
  
  if (checklistWithType) {
    return checklistWithType;
  }
  
  // Se não encontrou com tipo e estamos buscando operacional, buscar legado (sem tipo)
  if (checklistType === 'operacional') {
    const legacyChecklist = checklists.find(c => !c.checklist_type || c.checklist_type === null);
    if (legacyChecklist) {
      return legacyChecklist;
    }
  }
  
  // Não encontrou checklist do tipo solicitado
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
};

// Buscar todas as tarefas do checklist operacional (configuração)
export const fetchChecklistTasks = async () => {
  const tasks = await fetchAppSettings('daily_checklist_tasks');
  // Se não houver tarefas salvas, retornar array vazio (será criado pela primeira vez)
  if (!tasks) return [];
  // Se tasks for um array, retornar diretamente
  if (Array.isArray(tasks)) return tasks;
  // Se tasks for um objeto com tasks, retornar tasks
  if (tasks && tasks.tasks && Array.isArray(tasks.tasks)) return tasks.tasks;
  return [];
};

// Buscar todas as tarefas do checklist gerencial (configuração)
export const fetchGerencialChecklistTasks = async () => {
  const tasks = await fetchAppSettings('daily_checklist_gerencial_tasks');
  // Se não houver tarefas salvas, retornar array vazio (será criado pela primeira vez)
  if (!tasks) return [];
  // Se tasks for um array, retornar diretamente
  if (Array.isArray(tasks)) return tasks;
  // Se tasks for um objeto com tasks, retornar tasks
  if (tasks && tasks.tasks && Array.isArray(tasks.tasks)) return tasks.tasks;
  return [];
};

// Salvar tarefas do checklist operacional (configuração)
export const saveChecklistTasks = async (tasks) => {
  return await upsertAppSettings('daily_checklist_tasks', tasks);
};

// Salvar tarefas do checklist gerencial (configuração)
export const saveGerencialChecklistTasks = async (tasks) => {
  return await upsertAppSettings('daily_checklist_gerencial_tasks', tasks);
};

// Buscar checklist de uma data específica para histórico (operacional)
export const fetchChecklistByDate = async (storeId, date) => {
  return await fetchDailyChecklist(storeId, date, 'operacional');
};

// Buscar checklist gerencial de uma data específica para histórico
export const fetchGerencialChecklistByDate = async (storeId, date) => {
  return await fetchDailyChecklist(storeId, date, 'gerencial');
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
  try {
    // Tentar obter o usuário atual
    // Se falhar com 403, pode ser que a sessão esteja expirada
    let authUser = null;
    try {
      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError) {
        // Se for erro 403 ou 401, a sessão pode estar expirada
        if (getUserError.status === 403 || getUserError.status === 401) {
          console.warn('⚠️ Sessão expirada ou inválida (403/401). Tentando obter da sessão local...');
          // Tentar obter da sessão local
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            authUser = session.user;
          } else {
            throw getUserError;
          }
        } else {
          throw getUserError;
        }
      } else {
        authUser = data?.user;
      }
    } catch (authError) {
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
};
