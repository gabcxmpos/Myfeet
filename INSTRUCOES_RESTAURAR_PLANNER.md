# Instruções para Restaurar Registros do Planner de Devoluções

## Problema
Todos os registros de devolução no planner desapareceram.

## Solução em 4 Passos

### PASSO 0: Verificar Valores do Enum (IMPORTANTE!)
Execute o script `VERIFICAR_VALORES_ENUM_USER_ROLE.sql` no Supabase SQL Editor.

**O que este script faz:**
- Lista todos os valores válidos do enum `user_role`
- Verifica o tipo da coluna `role` em `app_users`
- Mostra quais valores estão sendo usados

**Por que é importante:**
- Evita erros como "invalid input value for enum"
- Mostra exatamente quais valores você pode usar nas políticas RLS

### PASSO 1: Diagnosticar o Problema
Execute o script `DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql` no Supabase SQL Editor.

**O que este script faz:**
- Verifica se a tabela existe
- Conta quantos registros existem (mesmo que não visíveis)
- Verifica políticas RLS
- Verifica seu perfil de usuário
- Identifica o problema

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo do arquivo `DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql`
4. Clique em RUN (ou pressione Ctrl+Enter)
5. Analise os resultados

### PASSO 2: Verificar Histórico e Backup
Execute o script `VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql` no Supabase SQL Editor.

**O que este script faz:**
- Verifica se há tabelas de backup
- Verifica se há histórico de auditoria
- Verifica se há registros soft deleted (com coluna deleted_at)
- Fornece recomendações de restauração

**Como executar:**
1. No mesmo SQL Editor do Supabase
2. Cole o conteúdo do arquivo `VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql`
3. Clique em RUN
4. Veja se há opções de restauração disponíveis

### PASSO 3: Corrigir Políticas RLS e Restaurar Visibilidade
Execute o script `VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql` no Supabase SQL Editor.

**O que este script faz:**
- Corrige todas as políticas RLS (SELECT, INSERT, UPDATE, DELETE)
- Garante que usuários com perfil correto possam ver os registros
- Verifica a estrutura da tabela
- Mostra quantos registros estão visíveis após a correção

**Como executar:**
1. No mesmo SQL Editor do Supabase
2. Cole o conteúdo do arquivo `VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql`
3. Clique em RUN
4. Verifique se os registros aparecem agora

## Possíveis Cenários

### Cenário 1: Registros Existem mas Não São Visíveis
**Sintoma:** O diagnóstico mostra que há registros na tabela, mas você não consegue vê-los.

**Solução:** 
- Execute o PASSO 3 (VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql)
- Isso corrigirá as políticas RLS e os registros aparecerão novamente

### Cenário 2: Registros Foram Deletados
**Sintoma:** O diagnóstico mostra que a tabela está vazia (0 registros).

**Soluções possíveis:**
1. **Se houver backup do Supabase:**
   - Vá em Database > Backups no Supabase Dashboard
   - Restaure o backup mais recente antes da exclusão

2. **Se houver tabela de backup:**
   - O PASSO 2 identificará tabelas de backup
   - Restaure manualmente usando INSERT INTO

3. **Se houver registros soft deleted (deleted_at):**
   - Execute: `UPDATE returns_planner SET deleted_at = NULL WHERE deleted_at IS NOT NULL;`

4. **Se não houver backup:**
   - Os registros precisarão ser recriados manualmente
   - Use o botão "+ Novo Registro" na interface

### Cenário 3: Problema com Perfil de Usuário
**Sintoma:** O diagnóstico mostra que seu perfil não tem permissão.

**Solução:**
- Verifique seu perfil em `app_users`
- Atualize para um dos seguintes perfis:
  - `devoluções`
  - `admin`
  - `supervisor`
  - `supervisor_franquia`
  - `devoluções_simples`

## Verificação Final

Após executar os scripts, verifique:

1. **No Supabase Dashboard:**
   - Vá em Table Editor > returns_planner
   - Veja se os registros aparecem

2. **Na aplicação:**
   - Acesse a página do Planner de Devoluções
   - Verifique se os registros aparecem na lista

## Se Nada Funcionar

1. **Verifique os logs do Supabase:**
   - Vá em Logs > Postgres Logs
   - Procure por erros relacionados a `returns_planner`

2. **Verifique o código da aplicação:**
   - Verifique se há filtros ou condições que podem estar ocultando registros
   - Verifique se a query está correta

3. **Contate o suporte:**
   - Se você tem acesso ao backup do banco de dados, restaure-o
   - Se não tem backup, os registros precisarão ser recriados manualmente

## Arquivos Criados

1. `DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql` - Diagnóstico completo
2. `VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql` - Verificar backups
3. `VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql` - Corrigir políticas RLS
4. `INSTRUCOES_RESTAURAR_PLANNER.md` - Este arquivo

## Ordem de Execução Recomendada

1. ✅ `VERIFICAR_VALORES_ENUM_USER_ROLE.sql` (PRIMEIRO - importante!)
2. ✅ `DIAGNOSTICO_COMPLETO_PLANNER_DEVOLUCOES.sql` (segundo)
3. ✅ `VERIFICAR_HISTORICO_E_BACKUP_PLANNER.sql` (terceiro)
4. ✅ `VERIFICAR_E_RESTAURAR_PLANNER_DEVOLUCOES.sql` (quarto)

Execute nesta ordem para ter uma visão completa do problema antes de aplicar correções.

