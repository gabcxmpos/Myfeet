# Guia: Executar Script RLS para CTO_DATA

## Problema
Os dados de CTO não estão sendo salvos no Supabase porque faltam políticas RLS (Row Level Security) que permitam aos perfis `admin` e `financeiro` atualizarem a coluna `cto_data` na tabela `stores`.

## Solução
Execute o script `CORRIGIR_RLS_CTO_DATA.sql` no Supabase SQL Editor.

## Passo a Passo

### 1. Acesse o Supabase Dashboard
- Vá para o projeto no Supabase
- Clique em "SQL Editor" no menu lateral

### 2. Execute o Script
- Abra o arquivo `CORRIGIR_RLS_CTO_DATA.sql`
- Copie todo o conteúdo
- Cole no SQL Editor do Supabase
- Clique em "Run" ou pressione `Ctrl+Enter`

### 3. Verifique os Resultados
O script irá:
- ✅ Criar a coluna `cto_data` se ela não existir
- ✅ Habilitar RLS na tabela `stores` se necessário
- ✅ Criar políticas RLS para `admin` e `financeiro` atualizarem `cto_data`
- ✅ Mostrar as políticas criadas na saída

### 4. Verificação Manual (Opcional)
Execute estas queries para verificar:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'stores'
    AND column_name = 'cto_data';

-- Verificar políticas criadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'stores'
    AND policyname LIKE '%cto_data%';

-- Testar salvamento (substitua o UUID pela ID de uma loja)
SELECT id, name, cto_data 
FROM public.stores 
WHERE id = 'UUID-DA-LOJA-AQUI';
```

### 5. Teste no Sistema
Após executar o script:
1. Faça login com perfil `admin` ou `financeiro`
2. Vá para "Lojas para CTO"
3. Cadastre informações básicas de uma loja
4. Verifique se os dados são salvos e persistem após recarregar a página

## Troubleshooting

### Erro: "permission denied"
- Verifique se você está logado como um usuário com permissões de administrador no Supabase
- Verifique se o usuário tem o role `admin` ou `financeiro` na tabela `app_users`

### Erro: "column does not exist"
- O script deve criar a coluna automaticamente
- Se o erro persistir, execute manualmente:
```sql
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS cto_data JSONB DEFAULT '{}'::jsonb;
```

### Dados ainda não salvam após executar o script
- Verifique o console do navegador (F12) para ver erros específicos
- Verifique se as políticas foram criadas corretamente (query acima)
- Verifique se o usuário logado tem o role correto (`admin` ou `financeiro`)

## Estrutura Esperada do cto_data

```json
{
  "m2": 150.50,
  "aluguelMin": 15000.00,
  "aluguelPercentual": 12.5,
  "monthlySales": {
    "2024-01": 150000.00,
    "2024-02": 160000.00
  },
  "monthlyBills": {
    "2024-01": {
      "amm": 15000.00,
      "ammDiscount": 500.00,
      "fpp": 5000.00,
      "cond": 3000.00,
      "additionalCosts": [
        { "id": "1", "description": "IPTU", "value": 500.00 }
      ]
    }
  },
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```























