# 🔍 Debug - Planner de Devoluções

## ✅ Verificações Realizadas

### 1. Arquivos Corrigidos:
- ✅ Removida declaração duplicada de `getStoreName`
- ✅ Adicionado tratamento de erros para datas inválidas
- ✅ Verificado imports e exports

### 2. Rota Configurada:
- ✅ Rota `/returns-planner` no `App.jsx`
- ✅ Permissões: `['devoluções', 'admin']`
- ✅ Componente importado corretamente

### 3. Menu Configurado:
- ✅ Item no `Sidebar.jsx`
- ✅ Ícone: `Calendar`
- ✅ Roles: `['devoluções', 'admin']`

---

## 🐛 Possíveis Problemas

### Problema 1: Menu não aparece
**Causa:** Usuário não tem perfil "devoluções" ou "admin"
**Solução:** Verificar perfil do usuário logado

### Problema 2: Página não carrega
**Causa:** Erro de runtime (datas inválidas, tabela não existe)
**Solução:** Verificar console do navegador (F12)

### Problema 3: Erro ao buscar dados
**Causa:** Tabela `returns_planner` não existe no Supabase
**Solução:** Executar script SQL `CRIAR_TABELA_PLANNER_DEVOLUCOES.sql`

---

## 🔧 Como Verificar

### 1. Verificar Perfil do Usuário:
```javascript
// No console do navegador (F12):
// Verificar se o usuário tem role 'devoluções' ou 'admin'
```

### 2. Verificar Console:
- Abrir DevTools (F12)
- Ir em "Console"
- Procurar por erros em vermelho
- Copiar mensagens de erro

### 3. Verificar Rede:
- Abrir DevTools (F12)
- Ir em "Network"
- Tentar acessar a página
- Verificar se há requisições falhando

### 4. Verificar Tabela no Supabase:
```sql
-- Executar no Supabase SQL Editor:
SELECT * FROM returns_planner LIMIT 1;
```

---

## 📋 Checklist de Diagnóstico

- [ ] Usuário tem perfil "devoluções" ou "admin"?
- [ ] Menu aparece no sidebar?
- [ ] Ao clicar, a página carrega?
- [ ] Há erros no console (F12)?
- [ ] Tabela `returns_planner` existe no Supabase?
- [ ] Script SQL foi executado?

---

## 🚀 Próximos Passos

1. **Informar qual é o problema específico:**
   - Menu não aparece?
   - Página não carrega?
   - Erro no console?
   - Outro problema?

2. **Verificar console do navegador:**
   - Abrir F12
   - Ir em Console
   - Copiar mensagens de erro

3. **Verificar perfil do usuário:**
   - Qual perfil está logado?
   - É "devoluções" ou "admin"?

---

**Por favor, informe:**
- O que exatamente não está funcionando?
- Há alguma mensagem de erro no console?
- Qual perfil você está usando para testar?






























