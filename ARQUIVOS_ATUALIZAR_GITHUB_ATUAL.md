# 📋 Arquivos para Atualizar no GitHub - Correções Atuais

## 🎯 Resumo das Alterações

Esta atualização inclui:
1. ✅ Checkbox "Não possui NF" nas devoluções pendentes
2. ✅ Botão hamburger corrigido (abrir/fechar sidebar)
3. ✅ Menu de visibilidade funcional e sincronizado
4. ✅ Agenda de Treinamentos disponível para supervisores
5. ✅ Melhorias no toggle da sidebar

---

## 📁 Arquivos Modificados

### 1. **src/pages/ReturnsManagement.jsx**
**Localização:** `src/pages/ReturnsManagement.jsx`

**Alterações:**
- Adicionado checkbox "Não possui NF" ao lado do campo "Número da NF"
- Campos de NF ficam desabilitados quando "Não possui NF" está marcado
- Validação ajustada para não exigir NF quando o checkbox está marcado
- Exibição para admin mostra "Não possui NF" quando não há número de NF
- Salvamento salva `null` para campos de NF quando checkbox está marcado

---

### 2. **src/components/Header.jsx**
**Localização:** `src/components/Header.jsx`

**Alterações:**
- Corrigido botão hamburger (3 linhas) para funcionar corretamente
- Simplificado para um único botão que funciona em todas as telas
- Adicionado handler `handleToggleSidebar` com verificação de segurança

---

### 3. **src/components/Sidebar.jsx**
**Localização:** `src/components/Sidebar.jsx`

**Alterações:**
- Adicionado "Agenda de Treinamentos" para supervisores (além de admin)
- Alterado de `roles: ['admin']` para `roles: ['admin', 'supervisor']`

---

### 4. **src/components/MainLayout.jsx**
**Localização:** `src/components/MainLayout.jsx`

**Alterações:**
- Ajustado toggle da sidebar para funcionar em desktop e mobile
- Adicionada transição suave quando a sidebar abre/fecha
- Ajustado espaçamento do conteúdo principal com `ml-[256px]` ou `ml-[80px]`
- Sidebar agora funciona com `fixed` em vez de `static`

---

### 5. **src/pages/MenuVisibilitySettings.jsx**
**Localização:** `src/pages/MenuVisibilitySettings.jsx`

**Alterações:**
- Corrigido menu de visibilidade para funcionar corretamente
- Adicionado `useEffect` para sincronizar estado com contexto
- Adicionado "Agenda de Treinamentos" na lista de itens do menu
- Melhorado tratamento de erros e feedback ao usuário
- Adicionado estado de loading durante salvamento
- Adicionado `fetchData()` após salvar para garantir sincronização

---

### 6. **src/contexts/DataContext.jsx**
**Localização:** `src/contexts/DataContext.jsx`

**Alterações:**
- Melhorado `updateMenuVisibility` para atualizar estado local imediatamente
- Adicionado tratamento de erros mais robusto
- Adicionado `fetchData()` após salvar para garantir sincronização

---

## 🚀 Como Atualizar no GitHub

### Opção 1: Usar o Script PowerShell (Recomendado)

1. Abra o PowerShell na raiz do projeto
2. Execute:
   ```powershell
   .\atualizar-github-atual.ps1
   ```
3. Confirme as operações quando solicitado

### Opção 2: Usar o Script Batch

1. Abra o CMD na raiz do projeto
2. Execute:
   ```cmd
   atualizar-github-atual.bat
   ```
3. Confirme as operações quando solicitado

### Opção 3: Comandos Manuais

Se preferir fazer manualmente:

```bash
# Adicionar arquivos
git add src/pages/ReturnsManagement.jsx
git add src/components/Header.jsx
git add src/components/Sidebar.jsx
git add src/components/MainLayout.jsx
git add src/pages/MenuVisibilitySettings.jsx
git add src/contexts/DataContext.jsx

# Fazer commit
git commit -m "fix: Corrigir menu de visibilidade, botão hamburger e adicionar checkbox 'Não possui NF'"

# Fazer push
git push origin main
```

---

## ✅ Checklist Antes de Enviar

- [ ] Todos os arquivos listados acima foram modificados
- [ ] Testou localmente e está funcionando
- [ ] Servidor de desenvolvimento está rodando sem erros
- [ ] Verificou que não há erros de lint

---

## 📝 Mensagem de Commit Sugerida

```
fix: Corrigir menu de visibilidade, botão hamburger e adicionar checkbox 'Não possui NF'

- Corrigido menu de visibilidade com sincronização de estado
- Adicionado checkbox 'Não possui NF' nas devoluções pendentes
- Corrigido botão hamburger para abrir/fechar sidebar corretamente
- Adicionado Agenda de Treinamentos para supervisores
- Melhorado toggle da sidebar em desktop e mobile
- Melhorado updateMenuVisibility com atualização imediata de estado
```

---

## 🔄 Após o Push

1. Aguarde alguns minutos para o Vercel fazer o build automaticamente
2. Verifique o deploy no painel do Vercel
3. Teste as funcionalidades na versão online

---

## 📞 Em Caso de Problemas

Se houver algum erro durante o commit ou push:
1. Verifique se o Git está instalado e configurado
2. Verifique suas credenciais do GitHub
3. Verifique se há conflitos: `git status`
4. Se necessário, faça pull primeiro: `git pull origin main`





