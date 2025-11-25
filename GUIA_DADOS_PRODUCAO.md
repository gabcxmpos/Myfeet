# 📊 Guia: Dados em Desenvolvimento vs Produção

## ✅ Resposta Rápida

**SIM, os dados que você está criando agora (usuários e lojas) FICARÃO SALVOS quando lançar em produção**, **MAS** você está usando o **MESMO banco de dados** para desenvolvimento e produção.

## 🔍 Situação Atual

Atualmente, sua aplicação está configurada para usar o **mesmo projeto Supabase** tanto em desenvolvimento quanto em produção:

```javascript
// src/lib/customSupabaseClient.js
const supabaseUrl = 'https://hzwmacltgiyanukgvfvn.supabase.co';
const supabaseAnonKey = 'eyJhbGci...';
```

Isso significa:
- ✅ Todos os dados que você criar agora **ficarão salvos**
- ✅ Quando você lançar em produção, os dados já estarão lá
- ⚠️ **PROBLEMA**: Você está usando o mesmo banco para desenvolvimento e produção
- ⚠️ **RISCO**: Se você testar algo e criar dados de teste, eles aparecerão em produção

## 🎯 O Que Você Precisa Saber

### 1. Dados Persistem Permanentemente

Os dados criados no Supabase são **permanentes** e ficam salvos no banco de dados. Eles não são apagados quando você reinicia a aplicação ou faz deploy.

### 2. Mesmo Banco para Dev e Produção

Como você está usando o mesmo projeto Supabase, todos os dados criados durante o desenvolvimento estarão disponíveis em produção.

### 3. Recomendação: Separar Ambientes

**IDEALMENTE**, você deveria ter:
- **Ambiente de Desenvolvimento**: Um projeto Supabase separado para testes
- **Ambiente de Produção**: Outro projeto Supabase para produção real

## 🚀 Opções para Você

### Opção 1: Continuar com o Mesmo Banco (Mais Simples)

**Vantagens:**
- ✅ Mais simples - não precisa configurar nada
- ✅ Dados já criados ficam disponíveis em produção
- ✅ Não precisa migrar dados

**Desvantagens:**
- ⚠️ Dados de teste podem aparecer em produção
- ⚠️ Mudanças no banco durante desenvolvimento afetam produção
- ⚠️ Não há isolamento entre ambientes

**Quando usar:**
- Projetos pequenos ou pessoais
- Quando você quer que os dados de desenvolvimento fiquem em produção
- Quando não há risco de criar dados de teste

### Opção 2: Separar Ambientes (Recomendado para Produção)

**Vantagens:**
- ✅ Ambiente de desenvolvimento isolado
- ✅ Dados de teste não afetam produção
- ✅ Você pode testar mudanças sem risco
- ✅ Melhor para projetos que vão para produção real

**Desvantagens:**
- ⚠️ Requer configuração adicional
- ⚠️ Precisa gerenciar dois projetos Supabase
- ⚠️ Pode precisar migrar dados manualmente

**Quando usar:**
- Projetos que vão para produção real
- Quando você quer testar sem afetar produção
- Quando você precisa de isolamento entre ambientes

## 📝 Como Separar Ambientes (Opcional)

Se você quiser separar desenvolvimento de produção, siga estes passos:

### Passo 1: Criar Projeto Supabase para Produção

1. Acesse https://app.supabase.com
2. Crie um **novo projeto** para produção
3. Anote a URL e a chave anon do novo projeto

### Passo 2: Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://hzwmacltgiyanukgvfvn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

2. Crie um arquivo `.env.production` para produção:
```env
VITE_SUPABASE_URL=https://seu-projeto-producao.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-producao
```

3. Atualize `customSupabaseClient.js`:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Passo 3: Migrar Dados (Se Necessário)

Se você quiser migrar os dados de desenvolvimento para produção:

1. Exporte os dados do projeto de desenvolvimento
2. Importe os dados no projeto de produção
3. Execute os scripts SQL no projeto de produção

## ✅ Recomendação para Seu Caso

**Se você está criando usuários e lojas que devem aparecer em produção:**

1. **Continue usando o mesmo banco** - é mais simples
2. **Tenha cuidado ao criar dados de teste** - apenas crie dados que realmente devem estar em produção
3. **Se precisar testar algo**, teste em uma conta separada ou marque os dados de teste de forma clara

## 🔒 Importante: Backup

**SEMPRE faça backup dos seus dados importantes:**

1. No Supabase Dashboard, vá em **Settings > Database**
2. Configure backups automáticos
3. Ou exporte os dados manualmente periodicamente

## 📋 Checklist Antes de Lançar em Produção

- [ ] Verificar se todos os dados importantes estão salvos
- [ ] Remover dados de teste (se houver)
- [ ] Verificar se as configurações estão corretas
- [ ] Fazer backup dos dados
- [ ] Testar a aplicação em produção antes de lançar
- [ ] Verificar se os scripts SQL foram executados no banco de produção

## 🆘 Precisa de Ajuda?

Se você quiser ajuda para:
- Separar ambientes de desenvolvimento e produção
- Migrar dados para um novo projeto
- Configurar variáveis de ambiente
- Fazer backup dos dados

Me avise que eu ajudo você a configurar!











