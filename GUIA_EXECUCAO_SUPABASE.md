# 📋 Guia de Execução no Supabase

## ⚠️ IMPORTANTE: Execute na Ordem!

### 📌 PASSO 1: Adicionar Role "devoluções"
**Arquivo:** `1_EXECUTAR_PRIMEIRO_SUPABASE.sql`

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `1_EXECUTAR_PRIMEIRO_SUPABASE.sql`
4. Copie e cole o conteúdo no SQL Editor
5. Execute o script
6. **Verifique** se o valor "devoluções" aparece na lista de verificação

**Comando principal:**
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'devoluções';
```

**Se der erro:** Execute apenas esta linha em uma nova query:
```sql
ALTER TYPE user_role ADD VALUE 'devoluções';
```

---

### 📌 PASSO 2: Adicionar Roles Adicionais
**Arquivo:** `2_EXECUTAR_SEGUNDO_SUPABASE.sql`

1. **Aguarde** o PASSO 1 ser concluído com sucesso
2. Abra o arquivo `2_EXECUTAR_SEGUNDO_SUPABASE.sql`
3. Copie e cole o conteúdo no SQL Editor
4. Execute o script
5. **Verifique** se todos os valores aparecem na lista:
   - devoluções ✅
   - comunicação ✅
   - financeiro ✅
   - rh ✅
   - motorista ✅

**Comandos principais:**
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'comunicação';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'financeiro';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'rh';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'motorista';
```

**Se der erro:** Execute cada comando em uma query separada (sem IF NOT EXISTS)

---

## ✅ Verificação Final

Execute esta query para verificar se todos os roles foram adicionados:

```sql
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;
```

**Você deve ver:**
- admin
- supervisor
- loja
- devoluções ✅
- comunicação ✅
- financeiro ✅
- rh ✅
- motorista ✅
- user (se existir)

---

## 🚨 Problemas Comuns

### Erro: "cannot alter type ... because it is used by a table"
**Solução:** Isso é normal. Execute cada `ALTER TYPE` em uma query separada.

### Erro: "syntax error at or near IF"
**Solução:** Use a versão sem `IF NOT EXISTS`:
```sql
ALTER TYPE user_role ADD VALUE 'devoluções';
```

### A coluna role não é um enum
**Solução:** Execute a parte do script que verifica e atualiza constraints CHECK (está no final do PASSO 2).

---

## 📝 Após Executar

1. ✅ Verifique se todos os roles aparecem na lista
2. ✅ Teste criar um usuário com perfil "Devoluções" no sistema
3. ✅ Teste criar usuários com os outros novos perfis
4. ✅ Se tudo funcionar, você pode prosseguir para atualizar o GitHub

---

## ⏭️ Próximos Passos

Após executar os scripts SQL com sucesso:
1. Testar criação de usuários no sistema
2. Fazer commit e push para GitHub
3. Verificar se tudo funciona em produção

