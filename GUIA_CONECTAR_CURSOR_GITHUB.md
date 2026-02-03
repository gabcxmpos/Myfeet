# 🔗 Guia: Conectar Cursor com GitHub

## 📋 Método 1: Usando a Interface do Cursor (Mais Fácil)

### Passo 1: Abrir o Controle de Versão
1. No Cursor, clique no ícone de **Source Control** (controle de versão) na barra lateral esquerda
   - Ou pressione `Ctrl + Shift + G`
   - Ou vá em: **View → Source Control**

### Passo 2: Inicializar o Repositório (se ainda não foi feito)
1. Se você ver "Publish to GitHub" ou "Initialize Repository", clique nele
2. Se não aparecer, clique nos **3 pontinhos (...)** no topo da barra de Source Control
3. Selecione **"Initialize Repository"**

### Passo 3: Fazer Login no GitHub
1. O Cursor vai pedir para fazer login no GitHub
2. Clique em **"Sign in with GitHub"**
3. Uma janela do navegador vai abrir
4. Faça login no GitHub e autorize o Cursor

### Passo 4: Publicar o Repositório
1. Depois de fazer login, volte ao Cursor
2. Clique em **"Publish to GitHub"** (se aparecer)
3. Escolha:
   - **Nome do repositório:** `Myfeet` (ou o nome que preferir)
   - **Visibilidade:** Private (recomendado) ou Public
4. Clique em **"Publish"**

---

## 📋 Método 2: Usando Git no Terminal do Cursor

### Passo 1: Abrir o Terminal
1. No Cursor, pressione `` Ctrl + ` `` (Ctrl + crase)
2. Ou vá em: **Terminal → New Terminal**

### Passo 2: Verificar se Git está instalado
```bash
git --version
```

**Se aparecer erro:**
- Instale o Git: https://git-scm.com/download/win
- Reinicie o Cursor após instalar

### Passo 3: Configurar Git (primeira vez)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### Passo 4: Inicializar o Repositório (se necessário)
```bash
git init
```

### Passo 5: Adicionar arquivos
```bash
git add .
```

### Passo 6: Fazer o primeiro commit
```bash
git commit -m "Initial commit"
```

### Passo 7: Conectar com o GitHub
1. Vá para https://github.com e crie um novo repositório
2. Copie a URL do repositório (ex: `https://github.com/seu-usuario/Myfeet.git`)
3. No terminal do Cursor, execute:

```bash
git remote add origin https://github.com/seu-usuario/Myfeet.git
```

### Passo 8: Fazer push
```bash
git push -u origin main
```

**Se pedir login:**
- Use seu **Personal Access Token** do GitHub (não sua senha)
- Para criar um token: https://github.com/settings/tokens

---

## 📋 Método 3: Usando GitHub Desktop (Mais Visual)

### Passo 1: Instalar GitHub Desktop
1. Baixe: https://desktop.github.com/
2. Instale e faça login

### Passo 2: Adicionar Repositório Local
1. No GitHub Desktop, clique em **File → Add Local Repository**
2. Selecione a pasta do projeto: `C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6`
3. Clique em **"Add Repository"**

### Passo 3: Publicar no GitHub
1. Clique em **"Publish repository"** (botão no topo)
2. Escolha o nome e visibilidade
3. Clique em **"Publish Repository"**

### Passo 4: Usar no Cursor
- O Cursor vai detectar automaticamente o repositório Git
- Use a interface do Cursor para fazer commits e pushes

---

## 🔐 Criar Personal Access Token (se necessário)

Se o GitHub pedir autenticação:

1. Vá para: https://github.com/settings/tokens
2. Clique em **"Generate new token" → "Generate new token (classic)"**
3. Dê um nome: `Cursor Access`
4. Selecione as permissões:
   - ✅ `repo` (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não vai ver ele novamente!)
7. Use este token como senha quando o Git pedir

---

## ✅ Verificar se está Conectado

### No Cursor:
1. Abra Source Control (`Ctrl + Shift + G`)
2. Você deve ver:
   - Lista de arquivos modificados
   - Botão "Sync Changes" ou "Push"
   - Nome do branch (ex: `main`)

### No Terminal:
```bash
git remote -v
```

**Deve mostrar:**
```
origin  https://github.com/seu-usuario/Myfeet.git (fetch)
origin  https://github.com/seu-usuario/Myfeet.git (push)
```

---

## 🚀 Comandos Úteis no Cursor

### Fazer Commit e Push pela Interface:
1. `Ctrl + Shift + G` → Abre Source Control
2. Digite mensagem do commit na caixa de texto
3. Clique em **✓** (checkmark) para fazer commit
4. Clique em **"Sync Changes"** ou **"Push"** para enviar

### Fazer Commit e Push pelo Terminal:
```bash
# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Sua mensagem aqui"

# Fazer push
git push origin main
```

---

## 🆘 Problemas Comuns

### Erro: "Git not found"
**Solução:** Instale o Git: https://git-scm.com/download/win

### Erro: "Authentication failed"
**Solução:** Use Personal Access Token em vez de senha

### Erro: "Repository not found"
**Solução:** Verifique se o repositório existe no GitHub e se você tem acesso

### Erro: "Branch 'main' has no upstream branch"
**Solução:** Execute:
```bash
git push -u origin main
```

### Não aparece Source Control no Cursor
**Solução:** 
1. Vá em **View → Source Control**
2. Ou instale a extensão "Git" no Cursor

---

## 📝 Próximos Passos Após Conectar

1. ✅ Fazer commit dos arquivos modificados
2. ✅ Fazer push para o GitHub
3. ✅ Verificar se os arquivos aparecem no GitHub
4. ✅ Executar scripts SQL no Supabase

---

## 💡 Dica

O **Método 1** (interface do Cursor) é o mais fácil para começar. Se você já tem experiência com Git, use o **Método 2** (terminal).






























