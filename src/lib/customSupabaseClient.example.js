import { createClient } from '@supabase/supabase-js';

// Exemplo de configuração com variáveis de ambiente
// Para usar, renomeie este arquivo para customSupabaseClient.js
// e crie um arquivo .env na raiz do projeto com:
// VITE_SUPABASE_URL=sua-url-do-supabase
// VITE_SUPABASE_ANON_KEY=sua-chave-anon

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon-aqui';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);











