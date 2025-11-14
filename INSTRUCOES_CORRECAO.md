# 🔧 INSTRUÇÕES PARA CORRIGIR O PROBLEMA DE CRIAÇÃO DE USUÁRIOS

## ❌ Problema
Ao tentar criar um novo usuário, aparece o erro:
```
Key is not present in table "users"
insert or update on table "app_users" violates foreign key constraint "app_users_id_fkey"
```

## ✅ Solução

### Passo 1: Executar o Script SQL no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://app.supabase.com
   - Faça login na sua conta
   - Selecione o projeto correto

2. **Abra o SQL Editor:**
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New query"** ou use a área de texto existente

3. **Execute o Script:**
   - Abra o arquivo `SOLUCAO_COMPLETA.sql` no seu projeto
   - Copie **TODO** o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** ou pressione **Ctrl+Enter** (ou **Cmd+Enter** no Mac)

4. **Verifique os Resultados:**
   - O script irá mostrar várias verificações
   - **IMPORTANTE:** Todas as verificações devem mostrar **✅ CORRETO** ou **✅ CRIADO**
   - Se alguma verificação mostrar **❌**, leia a mensagem de erro e corrija

### Passo 2: Desabilitar Confirmação de Email

1. **Acesse as Configurações de Autenticação:**
   - No menu lateral esquerdo, clique em **"Authentication"**
   - Clique em **"Settings"** (Configurações)

2. **Desabilite a Confirmação de Email:**
   - Role até a seção **"Email Auth"**
   - Encontre a opção **"Enable email confirmations"**
   - **Desabilite** essa opção (desmarque o checkbox)
   - Clique em **"Save"** (Salvar)

### Passo 3: Verificar se Funcionou

1. **Teste Criar um Usuário:**
   - Volte para a aplicação
   - Tente criar um novo usuário
   - O usuário deve ser criado com sucesso

2. **Verificar no Supabase:**
   - Vá em **"Table Editor"** no Supabase
   - Selecione a tabela **"app_users"**
   - Verifique se o novo usuário aparece na tabela

## 📋 O que o Script SQL Faz

O script `SOLUCAO_COMPLETA.sql` faz o seguinte:

1. **Diagnostica** qual tabela a foreign key está referenciando
2. **Remove** todas as foreign keys incorretas da tabela `app_users`
3. **Cria** a foreign key correta que referencia `auth.users(id)`
4. **Cria/Recria** a função `handle_new_user()` que cria o perfil automaticamente
5. **Cria/Recria** o trigger `on_auth_user_created` que executa a função quando um usuário é criado
6. **Verifica** se tudo foi criado corretamente

## ⚠️ Observações Importantes

- **Execute o script completo:** Não execute apenas partes do script
- **Verifique os resultados:** Todas as verificações devem mostrar ✅
- **Desabilite a confirmação de email:** Isso é obrigatório para o sistema funcionar
- **Após executar o script:** Tente criar um usuário novamente

## 🆘 Se Ainda Não Funcionar

Se após executar o script ainda houver problemas:

1. **Verifique os Logs do Supabase:**
   - Vá em **"Logs"** no menu lateral
   - Procure por erros relacionados ao trigger ou à função

2. **Verifique a Estrutura da Tabela:**
   - Vá em **"Table Editor"** > **"app_users"**
   - Verifique se a coluna `id` existe e é do tipo `UUID`

3. **Verifique se o Trigger Foi Criado:**
   - Execute esta query no SQL Editor:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```
   - Deve retornar uma linha com o trigger

4. **Verifique se a Foreign Key Está Correta:**
   - Execute esta query no SQL Editor:
   ```sql
   SELECT 
     tc.constraint_name,
     ccu.table_schema,
     ccu.table_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.constraint_column_usage ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.table_name = 'app_users'
     AND tc.constraint_type = 'FOREIGN KEY';
   ```
   - Deve mostrar `auth.users` como tabela referenciada

## 📞 Suporte

Se o problema persistir após seguir todas as instruções:
1. Verifique os logs do Supabase
2. Verifique se há erros no console do navegador
3. Entre em contato com o suporte técnico


