// Script de verificação de conexões e configurações
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE';

console.log('🔍 Verificando conexões e configurações...\n');

// 1. Verificar configurações do Supabase
console.log('1️⃣ Verificando configurações do Supabase:');
console.log(`   URL: ${supabaseUrl ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`   Key: ${supabaseAnonKey ? '✅ Configurado' : '❌ Não configurado'}\n`);

// 2. Testar conexão com Supabase
console.log('2️⃣ Testando conexão com Supabase...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

try {
  const { data, error } = await supabase.from('app_users').select('count').limit(1);
  
  if (error) {
    console.log(`   ❌ Erro na conexão: ${error.message}`);
    console.log(`   Código: ${error.code || 'N/A'}\n`);
  } else {
    console.log('   ✅ Conexão com Supabase estabelecida com sucesso!\n');
  }
} catch (err) {
  console.log(`   ❌ Erro ao conectar: ${err.message}\n`);
}

// 3. Verificar autenticação
console.log('3️⃣ Verificando autenticação...');
try {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.log(`   ⚠️  Erro ao obter sessão: ${error.message}`);
  } else if (session) {
    console.log(`   ✅ Sessão ativa encontrada`);
    console.log(`   Usuário: ${session.user.email || session.user.id}`);
  } else {
    console.log('   ℹ️  Nenhuma sessão ativa (normal se não estiver logado)');
  }
} catch (err) {
  console.log(`   ❌ Erro: ${err.message}`);
}

console.log('\n✅ Verificação concluída!');





























