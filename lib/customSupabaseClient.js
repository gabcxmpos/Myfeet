import { createClient } from '@supabase/supabase-js';

// Usa variáveis de ambiente se disponíveis, caso contrário usa valores padrão (desenvolvimento)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);