
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { fetchCurrentUserProfile } from '@/lib/supabaseService';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await fetchCurrentUserProfile();
      
      // Se o perfil não existir ou não tiver status, criar/atualizar com status 'active'
      if (!profile || !profile.status) {
        // Se o perfil não existe, pode ser que o usuário foi criado apenas no auth
        // Neste caso, tentar atualizar o status se o perfil existir mas sem status
        if (profile && !profile.status) {
          try {
            const { data: updatedProfile } = await supabase
              .from('app_users')
              .update({ status: 'active' })
              .eq('id', authUser.id)
              .select('*')
              .single();
            
            // Se houver store_id, buscar dados da loja separadamente
            if (updatedProfile?.store_id) {
              try {
                const { data: storeData } = await supabase
                  .from('stores')
                  .select('id, name, code')
                  .eq('id', updatedProfile.store_id)
                  .maybeSingle();
                
                if (storeData) {
                  updatedProfile.store = storeData;
                }
              } catch (storeError) {
                console.log('Erro ao buscar dados da loja:', storeError);
              }
            }
            
            if (updatedProfile) {
              setUser({
                id: authUser.id,
                email: authUser.email,
                username: updatedProfile.username || authUser.email,
                role: updatedProfile.role || 'loja',
                status: 'active',
                storeId: updatedProfile.store_id || updatedProfile.store?.id,
                storeName: updatedProfile.store?.name,
              });
              setLoading(false);
              return;
            }
          } catch (updateError) {
            console.error('Erro ao atualizar status do usuário:', updateError);
          }
        }
      }
      
      // Se status for null ou undefined, tratar como 'active' (para compatibilidade)
      const userStatus = profile?.status || 'active';
      
      // IMPORTANTE: Admin e supervisor NÃO devem ter storeId
      // Apenas usuários com role 'loja' devem ter storeId
      const userRole = profile?.role || 'loja';
      const userStoreId = (userRole === 'loja') ? (profile?.store_id || profile?.store?.id) : null;
      const userStoreName = (userRole === 'loja') ? (profile?.store?.name) : null;
      
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: profile?.username || authUser.email,
        role: userRole,
        status: userStatus,
        storeId: userStoreId,
        storeName: userStoreName,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Se o erro for relacionado a relacionamento não encontrado (PGRST200), 
      // ainda permitir login mas sem dados do perfil
      if (error.code === 'PGRST200' || error.code === 'PGRST116') {
        // Se o erro for que o perfil não existe ou relacionamento não encontrado,
        // ainda permitir login mas criar um usuário básico com dados do auth
        setUser({
          id: authUser.id,
          email: authUser.email,
          username: authUser.email?.split('@')[0] || 'Usuário',
          role: 'user',
          status: 'active',
          storeId: null,
          storeName: null,
        });
        
        if (error.code === 'PGRST116') {
          toast({
            variant: "warning",
            title: "Perfil não encontrado",
            description: "Seu perfil não foi encontrado. Entre em contato com o administrador.",
          });
        }
      } else {
        // Para outros erros, mostrar mensagem mas não bloquear completamente
        console.error('Erro ao carregar perfil:', error);
        // Ainda permitir login com dados básicos do auth
        setUser({
          id: authUser.id,
          email: authUser.email,
          username: authUser.email?.split('@')[0] || 'Usuário',
          role: 'user',
          status: 'active',
          storeId: null,
          storeName: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Handler para sessão expirada detectada pelo interceptor
    const handleSessionExpired = () => {
      console.warn('⚠️ Evento de sessão expirada recebido. Limpando dados...');
      setSession(null);
      setUser(null);
      setLoading(false);
    };
    
    // Ouvir evento customizado de sessão expirada
    window.addEventListener('supabase-session-expired', handleSessionExpired);
    
    // Get initial session com tratamento de erro
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          // Se houver erro 403/401, limpar dados locais
          if (error.status === 403 || error.status === 401) {
            console.warn('⚠️ Sessão inicial expirada (403/401). Limpando dados locais...');
            setSession(null);
            setUser(null);
            // Limpar storage
            try {
              localStorage.removeItem('sb-hzwmacltgiyanukgvfvn-auth-token');
              sessionStorage.clear();
            } catch (e) {
              console.warn('Erro ao limpar storage:', e);
            }
            setLoading(false);
            return;
          }
        }
        setSession(session);
        loadUserProfile(session?.user);
      })
      .catch((err) => {
        console.error('Erro ao obter sessão inicial:', err);
        // Se houver erro inesperado, limpar dados e continuar
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Evento de autenticação:', event, session?.user?.id);
        
        // Se o evento for de sessão expirada ou erro, limpar dados
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          console.warn('⚠️ Sessão expirada ou inválida. Limpando dados...');
          setSession(null);
          setUser(null);
          try {
            localStorage.removeItem('sb-hzwmacltgiyanukgvfvn-auth-token');
            sessionStorage.clear();
          } catch (e) {
            console.warn('Erro ao limpar storage:', e);
          }
          return;
        }
        
        // IMPORTANTE: Se o evento for SIGNED_IN e a sessão for de um usuário recém-criado,
        // verificar se é realmente um login legítimo ou se é apenas resultado de criar um usuário
        if (event === 'SIGNED_IN' && session) {
          // Aguardar um pouco para verificar se é uma criação de usuário em andamento
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se o perfil existe - se não existir, pode ser criação de usuário
          try {
            const { data: profile } = await supabase
              .from('app_users')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
            
            // Se o perfil não existe E o evento foi SIGNED_IN recentemente,
            // pode ser que estamos criando um usuário - ignorar este evento
            if (!profile) {
              console.log('⚠️ Evento SIGNED_IN ignorado - perfil não existe (criação de usuário em andamento)');
              // Não atualizar a sessão nem carregar o perfil neste caso
              // O processo de criação de usuário vai gerenciar a sessão
              return;
            }
          } catch (error) {
            // Se houver erro ao verificar, processar normalmente
            console.warn('Erro ao verificar perfil durante SIGNED_IN:', error);
            // Se for erro 403/401, limpar dados
            if (error.status === 403 || error.status === 401) {
              setSession(null);
              setUser(null);
              return;
            }
          }
        }
        
        // Se chegou aqui, é um evento legítimo - processar normalmente
        setSession(session);
        loadUserProfile(session?.user);
      }
    );

    // Cleanup: remover event listener e unsubscribe da subscription
    return () => {
      window.removeEventListener('supabase-session-expired', handleSessionExpired);
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signIn = useCallback(async (email, password) => {
    try {
      // Validação de entrada
      if (!email || !password) {
        const error = { message: 'Email e senha são obrigatórios' };
        toast({
          variant: "destructive",
          title: "Falha no Login",
          description: error.message,
        });
        return { success: false, error };
      }

      // Garantir que o email está em minúsculas e sem espaços
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();

      console.log('🔐 Tentando fazer login com:', { 
        email: sanitizedEmail, 
        passwordLength: sanitizedPassword.length,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (error) {
        console.error('❌ Erro de autenticação:', {
          message: error.message,
          status: error.status,
          code: error.code,
          email: sanitizedEmail,
          timestamp: new Date().toISOString()
        });
        let errorMessage = "Credenciais inválidas";
        
        // Mensagens de erro mais específicas
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = "Email ou senha incorretos. Verifique suas credenciais.";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu email antes de fazer login.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          variant: "destructive",
          title: "Falha no Login",
          description: errorMessage,
        });
        return { success: false, error };
      }

      // Atualizar last_login após login bem-sucedido
      if (data?.user) {
        try {
          await supabase
            .from('app_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          // Não bloquear o login se falhar ao atualizar last_login
          console.warn('⚠️ Erro ao atualizar last_login:', updateError);
        }
      }
      
      // Check if user is blocked
      const profile = await fetchCurrentUserProfile();
      
      // Se o perfil não existir, permitir login mas mostrar aviso
      if (!profile) {
        toast({
          variant: "warning",
          title: "Login realizado",
          description: "Seu perfil não foi encontrado. Entre em contato com o administrador.",
        });
        return { success: true, data };
      }
      
      // Se o status for null ou undefined, atualizar para 'active'
      if (!profile.status) {
        try {
          await supabase
            .from('app_users')
            .update({ status: 'active' })
            .eq('id', data.user.id);
          profile.status = 'active';
        } catch (updateError) {
          console.error('Erro ao atualizar status do usuário:', updateError);
        }
      }
      
      if (profile.status === 'blocked') {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Acesso Bloqueado",
          description: "Sua conta foi bloqueada. Entre em contato com o administrador.",
        });
        return { success: false, error: { message: 'User blocked' } };
      }

      // Verificar se o usuário está usando a senha padrão "afeet10"
      // Se estiver, redirecionar para definir nova senha
      const DEFAULT_PASSWORD = 'afeet10';
      const isUsingDefaultPassword = sanitizedPassword === DEFAULT_PASSWORD;
      
      if (isUsingDefaultPassword) {
        toast({
          variant: "info",
          title: "Primeiro Acesso",
          description: "Por favor, defina uma nova senha para sua conta.",
        });
        return { 
          success: true, 
          data,
          firstAccess: true 
        };
      }

      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${profile.username || sanitizedEmail}!`,
      });

      return { success: true, data, firstAccess: false };
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
      return { success: false, error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      // Tentar fazer signOut no Supabase
      const { error } = await supabase.auth.signOut();

      // IMPORTANTE: Sempre limpar dados locais, mesmo se houver erro
      // O erro "Session from session_id claim in JWT does not exist" é comum
      // quando a sessão já expirou no servidor, mas ainda precisamos limpar localmente
      
      // Limpar estado local independentemente de erro
      setSession(null);
      setUser(null);
      
      // Limpar storage local
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Erro ao limpar storage:', storageError);
      }

      // Se o erro for sobre sessão não encontrada, ignorar (é esperado em sessões expiradas)
      if (error) {
        const isSessionNotFoundError = 
          error.message?.includes('session_id') || 
          error.message?.includes('does not exist') ||
          error.message?.includes('Session from session_id');
        
        if (isSessionNotFoundError) {
          // Sessão já expirou - logout local foi bem-sucedido mesmo assim
          toast({
            title: "Logout realizado",
            description: "Sessão encerrada com sucesso.",
          });
          return { error: null };
        } else {
          // Outro tipo de erro - ainda assim limpar localmente
          toast({
            variant: "warning",
            title: "Logout realizado",
            description: "Dados locais limpos. A sessão já havia expirado.",
          });
          return { error: null };
        }
      }

      // Logout bem-sucedido
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });

      return { error: null };
    } catch (err) {
      // Em caso de erro inesperado, ainda limpar dados locais
      setSession(null);
      setUser(null);
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Erro ao limpar storage:', storageError);
      }

      toast({
        title: "Logout realizado",
        description: "Dados locais limpos.",
      });

      return { error: null };
    }
  }, [toast]);

  // Reset de senha - reseta para senha padrão "afeet10" sem enviar email
  const resetPassword = useCallback(async (email) => {
    try {
      const sanitizedEmail = email.trim().toLowerCase();
      
      if (!sanitizedEmail) {
        const error = { message: 'Email é obrigatório' };
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
        return { success: false, error };
      }

      // Usar função RPC para resetar a senha para "afeet10"
      const { data, error } = await supabase.rpc('reset_user_password_to_default', {
        p_email: sanitizedEmail
      });

      if (error) {
        // Se a função RPC não existir, fornecer instruções
        if (error.code === 'PGRST202' || error.message?.includes('not found')) {
          const errorMsg = {
            message: `A função RPC não está disponível. Execute o script CRIAR_FUNCAO_RESET_SENHA.sql no Supabase SQL Editor para criar a função necessária.`
          };
          toast({
            variant: "destructive",
            title: "Erro ao resetar senha",
            description: errorMsg.message,
            duration: 10000
          });
          return { success: false, error: errorMsg };
        }
        
        toast({
          variant: "destructive",
          title: "Erro ao resetar senha",
          description: error.message || "Não foi possível resetar a senha.",
        });
        return { success: false, error };
      }

      // Verificar se a função retornou sucesso
      if (data && data.success) {
        toast({
          title: "Senha Resetada!",
          description: "A senha foi resetada para a senha padrão 'afeet10'. Você pode fazer login com essa senha.",
        });
        return { success: true };
      } else if (data && !data.success) {
        const error = { message: data.error || 'Erro ao resetar senha' };
        toast({
          variant: "destructive",
          title: "Erro ao resetar senha",
          description: error.message,
        });
        return { success: false, error };
      }

      // Se não houver dados, considerar como sucesso (compatibilidade)
      toast({
        title: "Senha Resetada!",
        description: "A senha foi resetada para a senha padrão 'afeet10'.",
      });
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
      });
      return { success: false, error };
    }
  }, [toast]);

  // Atualizar senha (usado no reset e primeiro acesso)
  const updatePassword = useCallback(async (newPassword) => {
    try {
      console.log('🔐 Atualizando senha...');
      
      if (!newPassword || newPassword.length < 6) {
        const error = { message: 'A senha deve ter pelo menos 6 caracteres' };
        console.error('❌ Erro de validação:', error.message);
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
        return { success: false, error };
      }

      // Validar se a senha não é a senha padrão
      const DEFAULT_PASSWORD = 'afeet10';
      if (newPassword === DEFAULT_PASSWORD) {
        const error = { message: 'A senha não pode ser a senha padrão. Por favor, escolha uma senha diferente.' };
        console.error('❌ Erro: Tentativa de usar senha padrão');
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
        return { success: false, error };
      }

      // Verificar se há sessão ativa antes de atualizar
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        const error = { message: 'Não há sessão ativa. Por favor, faça login novamente.' };
        console.error('❌ Erro: Sem sessão ativa');
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        });
        return { success: false, error };
      }

      console.log('✅ Sessão ativa encontrada, atualizando senha...');
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        toast({
          variant: "destructive",
          title: "Erro ao atualizar senha",
          description: error.message || "Não foi possível atualizar a senha.",
        });
        return { success: false, error };
      }

      // Senha atualizada com sucesso
      console.log('✅ Senha atualizada com sucesso');
      
      // Atualizar a sessão para garantir que está sincronizada
      const { data: { session: updatedSession } } = await supabase.auth.getSession();
      if (updatedSession) {
        setSession(updatedSession);
        console.log('✅ Sessão atualizada após mudança de senha');
      }

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi atualizada com sucesso.",
      });

      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar senha:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado.",
      });
      return { success: false, error };
    }
  }, [toast]);

  // Verificar se precisa definir senha (verificando se está usando senha padrão)
  const checkNeedsPasswordChange = useCallback(async () => {
    // Esta função não é mais necessária, pois verificamos no login
    // Mas mantemos para compatibilidade
    return false;
  }, []);

  const value = useMemo(() => {
    // Considerar autenticado se tiver sessão e usuário, e o status não for 'blocked'
    // Se status for null/undefined, tratar como 'active' (compatibilidade)
    const isUserActive = !user || user.status !== 'blocked';
    const isAuthenticated = !!session && !!user && isUserActive;
    
    return {
      user,
      session,
      loading,
      isAuthenticated,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      checkNeedsPasswordChange,
    };
  }, [user, session, loading, signIn, signOut, resetPassword, updatePassword, checkNeedsPasswordChange]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
