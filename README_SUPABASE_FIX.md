# 🔧 Correção de Foreign Key e Trigger no Supabase

## Problema
O erro `23503: Key is not present in table "users"` ocorre porque a foreign key `app_users_id_fkey` está referenciando uma tabela incorreta ou a confirmação de email está habilitada.

## Solução

### 1. Executar o Script SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase_fix.sql`
4. Isso irá:
   - Verificar a foreign key atual
   - Corrigir a foreign key para referenciar `auth.users(id)`
   - Criar um trigger que cria o perfil automaticamente quando um usuário é criado no auth

### 2. Desabilitar Confirmação de Email

1. No Supabase Dashboard, vá em **Authentication > Settings**
2. Em **Email Auth**, desabilite **"Enable email confirmations"**
3. Isso permite que os usuários sejam criados imediatamente sem confirmação de email

### 3. Verificar se Funcionou

1. Tente criar um usuário pela interface
2. O trigger deve criar o perfil automaticamente em `app_users`
3. Não deve haver mais erros de foreign key

## O que o Script Faz

1. **Verifica a foreign key atual** - Mostra qual tabela está sendo referenciada
2. **Remove foreign key incorreta** - Se houver uma foreign key que referencia uma tabela "users" incorreta
3. **Cria foreign key correta** - Referencia `auth.users(id)` diretamente
4. **Cria função handle_new_user()** - Função que cria o perfil automaticamente
5. **Cria trigger** - Trigger que executa a função quando um usuário é criado no auth

## Notas Importantes

- ✅ O sistema **NÃO** envia email de confirmação ao criar usuários
- ✅ O sistema **APENAS** envia email para reset de senha
- ✅ Todos os novos usuários recebem a senha padrão: `afeet10`
- ✅ Os usuários precisam definir uma nova senha no primeiro acesso

## Troubleshooting

Se ainda houver erros após executar o script:

1. Verifique se a foreign key foi criada corretamente:
   ```sql
   SELECT 
     tc.constraint_name, 
     ccu.table_schema,
     ccu.table_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.table_name = 'app_users' 
     AND tc.constraint_type = 'FOREIGN KEY';
   ```

2. Verifique se o trigger foi criado:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. Verifique se a confirmação de email está desabilitada:
   - Authentication > Settings > Email Auth
   - "Enable email confirmations" deve estar **OFF**


