# 🔍 Verificação de Autenticação Online - Supabase

## ⚠️ Problema Relatado
Não foi possível fazer login em outro PC com outro usuário. O sistema precisa estar funcionando online com o Supabase.

## ✅ Checklist de Verificação

### 1. Verificar Configuração do Supabase Dashboard

#### 1.1. Provider de Email Habilitado
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Providers**
4. Verifique se o provider **"Email"** está **HABILITADO** (toggle ligado)
5. Clique no provider "Email" e verifique:
   - ✅ **Enable signup**: HABILITADO
   - ✅ **Confirm email**: DESABILITADO (para não exigir confirmação)

#### 1.2. Confirmação de Email Desabilitada
1. Vá em **Authentication** > **Settings**
2. Procure por **"Enable email confirmations"**
3. Verifique se está **DESABILITADO** (desmarcado)
4. Clique em **Save** se necessário

#### 1.3. Site URL Configurado
1. Vá em **Authentication** > **URL Configuration**
2. Verifique se o **Site URL** está configurado corretamente
3. Adicione URLs permitidas em **Redirect URLs** se necessário:
   - `http://localhost:3000`
   - `http://localhost:3000/**`
   - Sua URL de produção (se houver)

### 2. Verificar Credenciais do Supabase

#### 2.1. URL e Chave Anon
- **URL**: `https://hzwmacltgiyanukgvfvn.supabase.co`
- **Chave Anon**: Verifique se está correta no código (`src/lib/customSupabaseClient.js`)

#### 2.2. Testar Conexão
1. Abra o console do navegador (F12)
2. Tente fazer login
3. Verifique se há erros de conexão no console
4. Procure por mensagens como:
   - `Failed to fetch`
   - `Network error`
   - `CORS error`
   - `Invalid API key`

### 3. Verificar Configuração do Código

#### 3.1. Cliente Supabase
O arquivo `src/lib/customSupabaseClient.js` deve estar configurado com:
- ✅ URL do Supabase correta
- ✅ Chave anon correta
- ✅ Persistência de sessão habilitada (localStorage)
- ✅ Auto refresh de tokens habilitado

#### 3.2. Variáveis de Ambiente (Opcional)
Se estiver usando variáveis de ambiente:
- Verifique se `.env` existe na raiz do projeto
- Verifique se contém:
  ```
  VITE_SUPABASE_URL=https://hzwmacltgiyanukgvfvn.supabase.co
  VITE_SUPABASE_ANON_KEY=sua_chave_aqui
  ```

### 4. Testar Login em Diferentes Dispositivos

#### 4.1. Teste Local
1. No PC principal, abra o navegador
2. Acesse a aplicação
3. Tente fazer login com um usuário
4. Verifique se funciona

#### 4.2. Teste em Outro PC
1. No outro PC, abra o navegador
2. Acesse a mesma URL da aplicação
3. Tente fazer login com outro usuário
4. Verifique se funciona

#### 4.3. Verificar Console do Navegador
1. Abra o console (F12)
2. Vá na aba **Console**
3. Procure por:
   - ✅ Mensagens de sucesso: `🔔 Evento de autenticação: SIGNED_IN`
   - ❌ Mensagens de erro: `Erro de autenticação`, `Failed to fetch`
4. Vá na aba **Network**
5. Procure por requisições para `supabase.co`
6. Verifique se retornam status `200` ou `201`

### 5. Problemas Comuns e Soluções

#### Problema: "Email logins are disabled"
**Solução**: 
1. Vá em Authentication > Providers
2. Habilite o provider "Email"
3. Salve as alterações

#### Problema: "Invalid login credentials"
**Solução**:
1. Verifique se o email está correto (minúsculas, sem espaços)
2. Verifique se a senha está correta
3. Verifique se o usuário existe no Supabase (Authentication > Users)

#### Problema: "Email not confirmed"
**Solução**:
1. Vá em Authentication > Settings
2. Desabilite "Enable email confirmations"
3. Salve as alterações

#### Problema: Erro de CORS
**Solução**:
1. Verifique se a URL do site está configurada no Supabase
2. Adicione a URL em Authentication > URL Configuration > Redirect URLs

#### Problema: "Failed to fetch" ou erro de rede
**Solução**:
1. Verifique sua conexão com a internet
2. Verifique se o Supabase está online: https://status.supabase.com
3. Verifique se há firewall bloqueando conexões
4. Tente em outro navegador

#### Problema: Sessão não persiste
**Solução**:
1. Verifique se o navegador permite cookies/localStorage
2. Tente em modo anônimo/privado
3. Limpe o cache e cookies
4. Verifique se há extensões bloqueando localStorage

### 6. Verificar Usuários no Supabase

#### 6.1. Listar Usuários
1. Vá em **Authentication** > **Users**
2. Verifique se os usuários existem
3. Verifique se estão ativos (não bloqueados)

#### 6.2. Verificar Perfis
1. Vá em **Table Editor** > **app_users**
2. Verifique se os usuários têm perfis criados
3. Verifique se o `status` está como `'active'`

### 7. Testar Funcionalidades Online

#### 7.1. Teste de Conexão
```javascript
// No console do navegador (F12)
import { supabase } from './src/lib/customSupabaseClient.js';
const { data, error } = await supabase.auth.getSession();
console.log('Sessão:', data, 'Erro:', error);
```

#### 7.2. Teste de Login
```javascript
// No console do navegador
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'seu@email.com',
  password: 'sua_senha'
});
console.log('Login:', data, 'Erro:', error);
```

### 8. Logs de Debug

O sistema agora inclui logs de debug. Verifique o console do navegador para:
- `🔧 Supabase Client Configurado` - Confirma que o cliente foi inicializado
- `🔔 Evento de autenticação` - Mostra eventos de login/logout
- `Tentando fazer login com` - Mostra tentativas de login
- `Erro de autenticação` - Mostra erros de login

## 📋 Resumo da Verificação

Execute esta verificação na seguinte ordem:

1. ✅ **Supabase Dashboard**: Provider de email habilitado
2. ✅ **Supabase Dashboard**: Confirmação de email desabilitada
3. ✅ **Supabase Dashboard**: Site URL configurado
4. ✅ **Código**: Cliente Supabase configurado corretamente
5. ✅ **Teste Local**: Login funciona no PC principal
6. ✅ **Teste Remoto**: Login funciona em outro PC
7. ✅ **Console**: Sem erros no console do navegador
8. ✅ **Network**: Requisições ao Supabase retornam sucesso

## 🎯 Próximos Passos

Se após verificar tudo acima o problema persistir:

1. **Capture os logs do console** (F12 > Console)
2. **Capture as requisições de rede** (F12 > Network > Filtrar por "supabase")
3. **Verifique o status do Supabase**: https://status.supabase.com
4. **Teste com outro navegador** (Chrome, Firefox, Edge)
5. **Teste em modo anônimo/privado**

## 📞 Informações de Suporte

- **URL do Supabase**: https://hzwmacltgiyanukgvfvn.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/hzwmacltgiyanukgvfvn
- **Status**: https://status.supabase.com

