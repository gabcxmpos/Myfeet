# Guia para Criar a Coluna CTO_DATA

## Problema
Ao tentar salvar os dados básicos de CTO, você recebe o erro:
```
Could not find the 'cto_data' column of 'stores' in the schema cache
```

## Solução
Execute o script SQL `CRIAR_COLUNA_CTO_DATA.sql` no Supabase.

## Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Ou acesse diretamente: https://supabase.com/dashboard/project/[SEU_PROJETO]/sql/new

3. **Execute o Script**
   - Abra o arquivo `CRIAR_COLUNA_CTO_DATA.sql`
   - Copie todo o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verifique o Resultado**
   - O script mostrará uma mensagem de sucesso se a coluna foi criada
   - Ou informará se a coluna já existe
   - Uma query de verificação será executada automaticamente para confirmar

## Estrutura da Coluna

A coluna `cto_data` será criada como:
- **Tipo**: JSONB
- **Valor padrão**: `{}` (objeto JSON vazio)
- **Permite NULL**: Não (sempre terá um objeto JSON)

## Após Executar o Script

1. Recarregue a página da aplicação
2. Tente salvar os dados básicos novamente
3. O erro não deve mais aparecer

## Verificação Manual

Se quiser verificar manualmente se a coluna foi criada:

```sql
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'cto_data';
```

Este comando deve retornar uma linha com:
- `column_name`: `cto_data`
- `data_type`: `jsonb`
- `column_default`: `'{}'::jsonb`























