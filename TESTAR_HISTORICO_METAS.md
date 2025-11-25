# 📋 Como Testar o Histórico de Metas

## ✅ Verificação no Supabase

1. **Execute o script de verificação:**
   - Abra o Supabase Dashboard
   - Vá em SQL Editor
   - Execute o arquivo: `VERIFICAR_HISTORICO_METAS.sql`
   - Verifique os resultados

## ✅ Teste no Código

### 1. Verificar se a função está sendo chamada

O código já está implementado para salvar histórico automaticamente quando:
- Metas (`goals`) são atualizadas
- Pesos (`weights`) são atualizados

**Localização:** `src/lib/supabaseService.js`
- Função `saveGoalsHistory` (linha 59)
- Função `updateStore` (linha 86) - Modificada para salvar histórico antes de atualizar
- Função `fetchGoalsHistory` (linha 128) - Para buscar histórico

### 2. Como testar manualmente

1. **Atualizar metas de uma loja:**
   - Vá para a página de Metas (Goals Panel)
   - Selecione uma loja
   - Altere os valores das metas
   - Clique em "Salvar Alterações"

2. **Verificar no console do navegador:**
   - Abra o DevTools (F12)
   - Vá na aba Console
   - Procure por mensagens de erro ou avisos relacionados a `goals_history`
   - Se ver: `⚠️ Tabela goals_history não existe ainda` → Tabela não foi criada
   - Se não ver mensagens de erro → Tabela existe e está funcionando!

3. **Verificar no Supabase:**
   - Vá para Table Editor no Supabase
   - Procure pela tabela `goals_history`
   - Verifique se há novos registros após atualizar metas

### 3. Teste com código JavaScript

Você pode testar diretamente no console do navegador:

```javascript
// Importar a função (ajuste o caminho conforme necessário)
import { fetchGoalsHistory } from './lib/supabaseService';

// Buscar histórico de uma loja
const storeId = 'SEU_STORE_ID_AQUI';
const history = await fetchGoalsHistory(storeId);
console.log('Histórico de metas:', history);
```

## ✅ Verificação de Funcionamento

### Sinais de que está funcionando:
- ✅ Nenhum erro no console sobre `goals_history`
- ✅ Registros aparecendo na tabela `goals_history` após atualizar metas
- ✅ Função `fetchGoalsHistory` retorna dados (não array vazio)

### Sinais de que NÃO está funcionando:
- ❌ Erro no console: `Tabela goals_history não existe ainda`
- ❌ Erro: `relation "goals_history" does not exist`
- ❌ Função `fetchGoalsHistory` retorna array vazio mesmo após atualizar metas

## 🔧 Solução de Problemas

### Se a tabela não existir:
1. Execute o script `CRIAR_HISTORICO_METAS.sql` no Supabase SQL Editor
2. Verifique se todas as etapas foram concluídas com sucesso
3. Execute o script `VERIFICAR_HISTORICO_METAS.sql` para confirmar

### Se a tabela existir mas não está salvando:
1. Verifique as políticas RLS (Row Level Security)
2. Verifique se o usuário tem permissão para inserir
3. Verifique os logs do Supabase para erros específicos

## 📝 Próximos Passos (Opcional)

Se quiser criar uma interface visual para o histórico:

1. Criar componente `GoalsHistory.jsx`
2. Adicionar botão "Ver Histórico" na página de Metas
3. Exibir histórico em uma modal ou página separada

O código já está pronto para buscar o histórico (`fetchGoalsHistory`), só falta criar a interface!











