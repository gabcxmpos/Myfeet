# 🚀 PASSO A PASSO: CONECTAR AO GITHUB

## ✅ Passo 1: INSTALAR GIT (se ainda não tiver)

Escolha uma opção:

### Opção A: Git via Terminal (Recomendado)
1. Baixe: https://git-scm.com/download/win
2. Instale (aceite opções padrão)
3. Reabra o terminal
4. Verifique: `git --version`

### Opção B: GitHub Desktop (Mais Fácil)
1. Baixe: https://desktop.github.com
2. Instale e faça login

---

## 📦 Passo 2: PREPARAR PROJETO LOCAL

### Se escolheu Git (Terminal):

```bash
# 1. Ir para pasta do projeto
cd "C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6"

# 2. Inicializar Git
git init

# 3. Adicionar todos os arquivos
git add .

# 4. Configurar nome e email (só primeira vez)
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"

# 5. Fazer primeiro commit
git commit -m "Initial commit - Projeto PPAD MyFeet"
```

### Se escolheu GitHub Desktop:
1. Abra GitHub Desktop
2. File > Add Local Repository
3. Selecione a pasta do projeto
4. Clique em "Add repository"

---

## 🌐 Passo 3: CRIAR REPOSITÓRIO NO GITHUB

1. **Acesse:** https://github.com
2. **Faça login**
3. **Clique em "+"** (canto superior direito)
4. **Selecione:** "New repository"
5. **Configure:**
   - **Repository name:** `myfeet-painel-ppad`
   - **Description:** `Painel PPAD - Sistema de Gestão MyFeet`
   - **Visibilidade:** 
     - ✅ **Private** (recomendado)
     - ⚪ Public
   - **NÃO marque:**
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
6. **Clique em:** "Create repository"

---

## 🔗 Passo 4: CONECTAR PROJETO AO GITHUB

### Se escolheu Git (Terminal):

**4.1. GitHub mostrará comandos - copie a URL do repositório:**
   - Exemplo: `https://github.com/seu-usuario/myfeet-painel-ppad.git`

**4.2. Execute no terminal:**

```bash
# Adicionar repositório remoto
git remote add origin https://github.com/SEU-USUARIO/myfeet-painel-ppad.git

# Renomear branch para main
git branch -M main

# Enviar para GitHub
git push -u origin main
```

**4.3. Primeira vez pedirá login:**
   - **Username:** seu username do GitHub
   - **Password:** use **Personal Access Token** (não senha normal)

**Como criar Personal Access Token:**
1. GitHub > Settings (ícone perfil) > Developer settings
2. Personal access tokens > Tokens (classic)
3. Generate new token (classic)
4. Nome: `Vercel Deploy`
5. Marque: ✅ `repo` (acesso completo aos repositórios)
6. Generate token
7. **COPIE O TOKEN** (só aparece uma vez!)
8. Use o token como senha ao fazer push

### Se escolheu GitHub Desktop:

1. **Clique em:** "Publish repository" (canto superior direito)
2. **Configure:**
   - **Name:** `myfeet-painel-ppad`
   - ✅ **Keep this code private** (se quiser privado)
3. **Clique em:** "Publish repository"
4. **✅ Pronto!** Código no GitHub!

---

## ✅ Passo 5: VERIFICAR

1. **Acesse:** https://github.com/seu-usuario/myfeet-painel-ppad
2. **Verifique se todos os arquivos estão lá**
3. **✅ Sucesso!** Projeto no GitHub!

---

## 🎯 PRÓXIMO PASSO: CONECTAR AO VERCEL

Após conectar ao GitHub, vamos conectar ao Vercel para deploy automático!

---

## 🆘 PROBLEMAS?

### Erro: "git não é reconhecido"
→ **Solução:** Instale o Git (Passo 1)

### Erro: "repository not found"
→ **Solução:** Verifique se o nome do repositório está correto

### Erro: "authentication failed"
→ **Solução:** Use Personal Access Token, não senha normal

### Erro: "remote origin already exists"
→ **Solução:** 
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/myfeet-painel-ppad.git
```

---

**Precisa de ajuda? Me avise qual opção você escolheu!** 😊










