# Como Separar Ambientes de Desenvolvimento e Produção

## Passo 1: Criar Projeto Supabase para Produção

1. Acesse https://app.supabase.com
2. Crie um **novo projeto** para produção
3. Anote:
   - **URL do projeto**: `https://seu-projeto-producao.supabase.co`
   - **Chave Anon**: (encontre em Settings > API)

## Passo 2: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto (para desenvolvimento):
```env
VITE_SUPABASE_URL=https://hzwmacltgiyanukgvfvn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE
```

2. Crie um arquivo `.env.production` (para produção):
```env
VITE_SUPABASE_URL=https://seu-projeto-producao.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-producao
```

3. Adicione `.env` e `.env.production` ao `.gitignore`:
```gitignore
.env
.env.local
.env.production
```

## Passo 3: Atualizar customSupabaseClient.js

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Passo 4: Migrar Dados para Produção (Opcional)

Se você quiser migrar os dados de desenvolvimento para produção:

1. Exporte os dados do projeto de desenvolvimento
2. Importe os dados no projeto de produção
3. Execute os scripts SQL no projeto de produção:
   - `EXECUTAR_AGORA.sql`
   - `CRIAR_FUNCAO_RPC_AGORA.sql`
   - `CORRIGIR_ROLE_E_MANTER_SESSAO.sql`

## Passo 5: Configurar no Servidor de Produção

Ao fazer deploy em produção, configure as variáveis de ambiente:

- **Vercel**: Settings > Environment Variables
- **Netlify**: Site settings > Environment variables
- **Outros**: Configure as variáveis de ambiente no servidor

## Importante

- ✅ Desenvolvimento usará o arquivo `.env`
- ✅ Produção usará o arquivo `.env.production`
- ✅ Dados de teste não afetarão produção
- ✅ Você pode testar mudanças sem risco


