# 🔧 Guia para Corrigir Problema de Salvamento de Resultados

## Problema Identificado

Os dados de faturamento e vendas não estão sendo salvos no Supabase, mesmo mostrando mensagem de sucesso. Isso geralmente é causado por **políticas RLS (Row Level Security)** que não permitem que usuários de loja atualizem os campos `store_results` e `collaborator_results`.

## Solução

Execute o script SQL `CORRIGIR_RLS_STORES_RESULTS.sql` no Supabase para corrigir as permissões.

### Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Abra o arquivo `CORRIGIR_RLS_STORES_RESULTS.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter`

4. **Verificar se Funcionou**
   - O script deve executar sem erros
   - Você verá uma mensagem de sucesso
   - As políticas RLS serão criadas/atualizadas

### O que o Script Faz

O script cria políticas RLS que permitem:
- ✅ **Lojas** (`loja`, `loja_franquia`) atualizarem seus próprios resultados
- ✅ **Admin de Loja** (`admin_loja`) atualizar resultados da loja
- ✅ **Colaboradores** (`colaborador`) atualizar resultados da loja
- ✅ **Admin e Supervisores** atualizarem todas as lojas

### Verificar se Está Funcionando

Após executar o script:

1. **No Console do Navegador** (F12):
   - Abra a aba "Console"
   - Tente salvar resultados novamente
   - Procure por mensagens de erro ou sucesso

2. **Verificar Erros**:
   - Se aparecer erro `42501` ou `permission denied`, as políticas ainda não estão corretas
   - Se aparecer `✅ [updateStore] Update confirmado`, está funcionando!

3. **Testar no Supabase**:
   - Vá em "Table Editor" > "stores"
   - Selecione uma loja
   - Verifique se os campos `store_results` e `collaborator_results` estão sendo atualizados

### Se Ainda Não Funcionar

1. **Verificar se o usuário está autenticado**:
   - No console do navegador, verifique se há sessão ativa
   - Verifique se o `auth.uid()` retorna o ID do usuário

2. **Verificar se o usuário tem role correto**:
   - Vá em "Table Editor" > "app_users"
   - Verifique se o usuário tem `role` e `store_id` corretos

3. **Verificar políticas RLS**:
   - No Supabase, vá em "Authentication" > "Policies"
   - Verifique se as políticas para `stores` estão listadas
   - Verifique se estão habilitadas (toggle ON)

4. **Testar manualmente no SQL Editor**:
   ```sql
   -- Substitua 'ID_DO_USUARIO' e 'ID_DA_LOJA' pelos valores corretos
   UPDATE public.stores 
   SET store_results = '{"2024-12": {"faturamento": 1000}}'::jsonb
   WHERE id = 'ID_DA_LOJA';
   ```
   - Se funcionar, você verá "UPDATE 1"
   - Se não funcionar, verá erro de permissão

### Logs de Debug

O código agora mostra logs detalhados no console:
- `💾 [updateStore] Atualizando loja:` - Início da atualização
- `✅ [updateStore] Update confirmado` - Sucesso
- `❌ [updateStore] Erro ao atualizar:` - Erro (com detalhes)
- `🚨 [updateStore] ERRO DE PERMISSÃO/RLS DETECTADO!` - Erro de permissão específico

## Próximos Passos

Após executar o script e verificar que está funcionando:

1. ✅ Teste salvando resultados de uma loja
2. ✅ Verifique se os dados persistem após sair e voltar
3. ✅ Verifique se o cálculo do pilar Performance está funcionando
4. ✅ Teste com diferentes perfis de usuário (loja, admin_loja, colaborador)

## Suporte

Se ainda tiver problemas:
1. Verifique os logs no console do navegador (F12)
2. Verifique os logs no Supabase (Logs > Postgres Logs)
3. Compartilhe as mensagens de erro específicas























