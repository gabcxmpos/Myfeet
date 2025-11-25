# 🔗 Conectar Cursor com Repositório GitHub Existente

## 📍 Seu Repositório
**URL:** https://github.com/gabcxmpos/Myfeet

---

## 🚀 Método 1: Usando a Interface do Cursor (Mais Fácil)

### Passo 1: Abrir Source Control
1. No Cursor, pressione `Ctrl + Shift + G`
2. Ou clique no ícone de **Source Control** na barra lateral esquerda

### Passo 2: Verificar se já está conectado
- Se você ver "Sync Changes" ou o nome do branch `main`, já está conectado!
- Se não, continue com os próximos passos

### Passo 3: Clonar o Repositório (se necessário)
Se você ainda não tem o código local conectado:

1. Clique nos **3 pontinhos (...)** no topo da barra de Source Control
2. Selecione **"Clone Repository"**
3. Cole a URL: `https://github.com/gabcxmpos/Myfeet.git`
4. Escolha a pasta onde quer salvar
5. O Cursor vai abrir a pasta automaticamente

---

## 🚀 Método 2: Conectar Repositório Existente Local

Se você já tem o código local (pasta atual), mas não está conectado ao GitHub:

### Passo 1: Abrir Terminal no Cursor
1. Pressione `` Ctrl + ` `` (Ctrl + crase)
2. Ou vá em **Terminal → New Terminal**

### Passo 2: Verificar se já tem Git inicializado
```bash
git status
```

**Se aparecer:**
- ✅ "On branch main" → Já está inicializado, vá para Passo 4
- ❌ "not a git repository" → Continue com Passo 3

### Passo 3: Inicializar Git (se necessário)
```bash
git init
```

### Passo 4: Adicionar Remote do GitHub
```bash
git remote add origin https://github.com/gabcxmpos/Myfeet.git
```

**Se aparecer erro "remote origin already exists":**
```bash
git remote set-url origin https://github.com/gabcxmpos/Myfeet.git
```

### Passo 5: Verificar se está conectado
```bash
git remote -v
```

**Deve mostrar:**
```
origin  https://github.com/gabcxmpos/Myfeet.git (fetch)
origin  https://github.com/gabcxmpos/Myfeet.git (push)
```

### Passo 6: Fazer Pull do GitHub (sincronizar)
```bash
git pull origin main
```

**Se der erro de branch:**
```bash
git branch -M main
git pull origin main --allow-unrelated-histories
```

### Passo 7: Adicionar e Fazer Commit das Mudanças Locais
```bash
git add .
git commit -m "Atualização: novos perfis de login e otimizações mobile"
```

### Passo 8: Fazer Push para o GitHub
```bash
git push -u origin main
```

**Se pedir autenticação:**
- Use seu **Personal Access Token** (não sua senha)
- Para criar: https://github.com/settings/tokens

---

## 🔐 Criar Personal Access Token (se necessário)

1. Vá para: https://github.com/settings/tokens
2. Clique em **"Generate new token" → "Generate new token (classic)"**
3. Dê um nome: `Cursor Access`
4. Selecione permissões:
   - ✅ `repo` (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não vai ver ele novamente!)
7. Use este token como senha quando o Git pedir

---

## ✅ Verificar se Está Conectado

### No Cursor:
1. Abra Source Control (`Ctrl + Shift + G`)
2. Você deve ver:
   - ✅ Lista de arquivos modificados
   - ✅ Botão "Sync Changes" ou "Push"
   - ✅ Nome do branch: `main`
   - ✅ Nome do remote: `origin`

### No Terminal:
```bash
git remote -v
git status
```

---

## 🚀 Comandos Rápidos para Atualizar

### Adicionar todas as mudanças:
```bash
git add .
```

### Fazer commit:
```bash
git commit -m "feat: Adicionar novos perfis de login e otimizar mobile"
```

### Fazer push:
```bash
git push origin main
```

### Ou tudo de uma vez (pela interface):
1. `Ctrl + Shift + G` → Source Control
2. Digite mensagem do commit
3. Clique em **✓** (checkmark)
4. Clique em **"Sync Changes"** ou **"Push"**

---

## 📋 Checklist de Arquivos para Commit

### Arquivos NOVOS:
- [ ] `src/lib/useOptimizedRefresh.js`
- [ ] `1_EXECUTAR_PRIMEIRO_SUPABASE.sql`
- [ ] `2_EXECUTAR_SEGUNDO_SUPABASE.sql`
- [ ] `ADICIONAR_ROLE_DEVOLUCOES_SIMPLES.sql`
- [ ] `ADICIONAR_ROLES_ADICIONAIS.sql`
- [ ] `EXCLUIR_USUARIOS_ESPECIFICOS.sql`
- [ ] `VERIFICAR_USUARIOS_ESPECIFICOS.sql`
- [ ] `GUIA_EXECUCAO_SUPABASE.md`
- [ ] `GUIA_CONECTAR_CURSOR_GITHUB.md`
- [ ] `CONECTAR_CURSOR_REPOSITORIO_EXISTENTE.md` (este arquivo)
- [ ] `RELATORIO_COMPLETO_VERIFICACAO.md`

### Arquivos MODIFICADOS:
- [ ] `src/components/Sidebar.jsx`
- [ ] `src/App.jsx`
- [ ] `src/pages/ReturnsManagement.jsx`
- [ ] `src/pages/UserManagement.jsx`
- [ ] `src/pages/MenuVisibilitySettings.jsx`
- [ ] `src/pages/Dashboard.jsx`
- [ ] `src/pages/StoresManagement.jsx`
- [ ] `src/pages/FeedbackManagement.jsx`
- [ ] `src/pages/Analytics.jsx`
- [ ] `src/pages/GoalsPanel.jsx`
- [ ] `src/pages/FormBuilder.jsx`
- [ ] `src/contexts/DataContext.jsx`
- [ ] `src/lib/supabaseService.js`
- [ ] `index.html`

### Arquivo CRÍTICO:
- [ ] `src/pages/ChecklistAuditAnalytics.jsx` (verificar se está no GitHub)

---

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
**Solução:**
```bash
git remote set-url origin https://github.com/gabcxmpos/Myfeet.git
```

### Erro: "Authentication failed"
**Solução:** Use Personal Access Token em vez de senha

### Erro: "Updates were rejected"
**Solução:**
```bash
git pull origin main --rebase
git push origin main
```

### Erro: "Branch 'main' has no upstream branch"
**Solução:**
```bash
git push -u origin main
```

### Não aparece Source Control no Cursor
**Solução:**
1. Vá em **View → Source Control**
2. Ou instale a extensão "Git" no Cursor

---

## 📝 Próximos Passos

1. ✅ Conectar Cursor com GitHub
2. ✅ Fazer commit dos arquivos modificados
3. ✅ Fazer push para o GitHub
4. ✅ Verificar se os arquivos aparecem em https://github.com/gabcxmpos/Myfeet
5. ✅ Executar scripts SQL no Supabase

---

## 💡 Dica

Se você já tem o código local e o repositório no GitHub, use o **Método 2** para conectar. É mais rápido e direto!

