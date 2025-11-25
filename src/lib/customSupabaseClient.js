import { createClient } from '@supabase/supabase-js';

// Usa variáveis de ambiente se disponíveis, caso contrário usa valores padrão (desenvolvimento)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Função para limpar sessão expirada
const clearExpiredSession = () => {
  if (typeof window === 'undefined') return;
  try {
    // Limpar todos os tokens do Supabase
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  } catch (e) {
    console.warn('Erro ao limpar sessão expirada:', e);
  }
};

// Configuração do cliente Supabase com opções de autenticação e persistência
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usar localStorage para persistir sessão entre navegadores/dispositivos
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Auto refresh de tokens
    autoRefreshToken: true,
    // Persistir sessão
    persistSession: true,
    // Detectar mudanças de sessão automaticamente
    detectSessionInUrl: true,
    // Fluxo de autenticação
    flowType: 'pkce',
  },
  // Configurações globais
  global: {
    headers: {
      'x-client-info': 'myfeet-painel-ppad',
    },
    // Interceptar erros de autenticação
    fetch: async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        
        // Se for erro 403 em rotas de autenticação, limpar sessão
        if (response.status === 403 && typeof window !== 'undefined') {
          try {
            const urlString = typeof url === 'string' ? url : url.url || url.toString();
            const urlObj = urlString.startsWith('http') 
              ? new URL(urlString) 
              : new URL(urlString, window.location.origin);
            
            if (urlObj.pathname.includes('/auth/v1/') && 
                (urlObj.pathname.includes('/user') || urlObj.pathname.includes('/logout'))) {
              console.warn('⚠️ Erro 403 detectado em rota de autenticação. Limpando sessão local...');
              clearExpiredSession();
              // Disparar evento customizado para o AuthContext tratar
              window.dispatchEvent(new CustomEvent('supabase-session-expired'));
            }
          } catch (urlError) {
            // Se houver erro ao parsear URL, ainda verificar se a string contém as rotas
            const urlString = typeof url === 'string' ? url : url.url || url.toString();
            if (urlString.includes('/auth/v1/') && 
                (urlString.includes('/user') || urlString.includes('/logout'))) {
              console.warn('⚠️ Erro 403 detectado em rota de autenticação. Limpando sessão local...');
              clearExpiredSession();
              window.dispatchEvent(new CustomEvent('supabase-session-expired'));
            }
          }
        }
        
        return response;
      } catch (error) {
        // Se houver erro de rede e for rota de auth, pode ser sessão expirada
        if (typeof window !== 'undefined' && 
            (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError'))) {
          try {
            const urlString = typeof url === 'string' ? url : url.url || url.toString();
            if (urlString.includes('/auth/v1/')) {
              console.warn('⚠️ Erro de rede em rota de autenticação. Pode ser sessão expirada.');
            }
          } catch (e) {
            // Ignorar erros ao verificar URL
          }
        }
        throw error;
      }
    },
  },
  // Configurações de realtime (se necessário)
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Log de configuração (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Client Configurado:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    storage: typeof window !== 'undefined' ? 'localStorage disponível' : 'localStorage não disponível',
  });
}