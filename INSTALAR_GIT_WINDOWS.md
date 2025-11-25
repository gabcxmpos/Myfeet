# 📥 INSTALAR GIT NO WINDOWS

## 🔧 Opção 1: Instalar Git (Recomendado)

### Passo 1: Baixar Git

1. **Acesse:** [git-scm.com/download/win](https://git-scm.com/download/win)
2. **Baixe** a versão mais recente (64-bit Git for Windows Setup)
3. **Execute** o instalador baixado

### Passo 2: Instalar Git

Durante a instalação, **aceite as opções padrão** (só clique em "Next"):
- ✅ Use Git from the command line and also from 3rd-party software
- ✅ Checkout Windows-style, commit Unix-style line endings
- ✅ Use MinTTY (the default terminal of MSYS2)
- ✅ Default (fast-forward or merge)
- ✅ Git Credential Manager
- ✅ Enable file system caching

### Passo 3: Verificar Instalação

1. **Feche e reabra** o terminal/PowerShell
2. **Execute:**
   ```bash
   git --version
   ```
3. **Se aparecer algo como:** `git version 2.x.x` → ✅ Git instalado!

### Passo 4: Configurar Git (primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

**Substitua:**
- `Seu Nome` = seu nome completo ou username do GitHub
- `seu-email@exemplo.com` = email usado na conta do GitHub

---

## 🌐 Opção 2: Usar GitHub Desktop (Mais Fácil - Interface Gráfica)

Se preferir uma interface gráfica ao invés de comandos:

### Passo 1: Baixar GitHub Desktop

1. **Acesse:** [desktop.github.com](https://desktop.github.com)
2. **Baixe** GitHub Desktop para Windows
3. **Instale** o aplicativo

### Passo 2: Conectar ao GitHub

1. **Abra** GitHub Desktop
2. **Faça login** com sua conta GitHub
3. **Configure** seu nome e email

### Passo 3: Publicar Repositório

1. **No GitHub Desktop:**
   - File > Add Local Repository
   - Selecione a pasta do projeto: `C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6`
   - Clique em "Add repository"

2. **Publicar no GitHub:**
   - Clique em "Publish repository" (canto superior direito)
   - Nome: `myfeet-painel-ppad`
   - Marque "Keep this code private" (se quiser privado)
   - Clique em "Publish repository"

3. **✅ Pronto!** Repositório criado no GitHub!

---

## 🔄 Opção 3: GitHub Web (Upload Manual)

Se não quiser instalar nada agora:

### Passo 1: Criar Repositório no GitHub

1. **Acesse:** [github.com](https://github.com)
2. **Faça login**
3. **Clique em "+"** (canto superior direito) > "New repository"
4. **Nome:** `myfeet-painel-ppad`
5. **Visibilidade:** Private (recomendado)
6. **NÃO marque** nada (README, .gitignore, license)
7. **Clique em "Create repository"**

### Passo 2: Criar ZIP do Projeto

1. **Crie um ZIP** da pasta do projeto:
   - Pasta: `C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6`
   - Excluir: `node_modules`, `dist` (para diminuir tamanho)

2. **No GitHub:**
   - Na página do repositório criado
   - Clique em "uploading an existing file"
   - Arraste o ZIP ou selecione arquivos
   - Faça commit

**⚠️ Nota:** Esta opção NÃO cria histórico Git, apenas faz upload dos arquivos.

---

## ✅ RECOMENDAÇÃO

**Para usar com Vercel (deploy automático):**

1. **Instale Git** (Opção 1) - melhor para trabalhar com código
2. **OU use GitHub Desktop** (Opção 2) - mais fácil, interface gráfica

**NÃO use** a Opção 3 (upload manual) se quiser deploy automático no Vercel.

---

## 🎯 Qual Opção Você Prefere?

- **Opção 1 (Git CLI):** Mais profissional, controle total
- **Opção 2 (GitHub Desktop):** Mais fácil, interface visual
- **Opção 3 (Upload Web):** Rápido, mas sem histórico Git

**Após escolher, me avise e continuamos!** 😊










