# 🔗 GUIA: CONECTAR PROJETO AO GITHUB E VERCEL

## 📋 Pré-requisitos
- ✅ Conta no GitHub criada
- ✅ Conta no Vercel criada
- ✅ Git instalado no computador

---

## 🚀 PASSO 1: INICIALIZAR REPOSITÓRIO GIT (se ainda não tiver)

### 1.1. Verificar se já é um repositório Git:
```bash
git status
```

**Se aparecer erro "not a git repository":**
```bash
git init
```

### 1.2. Adicionar todos os arquivos:
```bash
git add .
```

### 1.3. Fazer primeiro commit:
```bash
git commit -m "Initial commit - Projeto PPAD MyFeet"
```

---

## 📦 PASSO 2: CRIAR REPOSITÓRIO NO GITHUB

### 2.1. Acessar GitHub:
1. **Acesse:** [github.com](https://github.com)
2. **Faça login** na sua conta

### 2.2. Criar novo repositório:
1. **Clique no ícone "+"** (canto superior direito)
2. **Selecione:** "New repository"
3. **Configure:**
   - **Repository name:** `myfeet-painel-ppad` (ou outro nome de sua escolha)
   - **Description:** `Painel PPAD - Sistema de Gestão MyFeet`
   - **Visibilidade:** 
     - ✅ **Private** (recomendado para projetos privados)
     - ⚪ **Public** (se quiser tornar público)
   - **NÃO marque** "Add a README file" (já temos arquivos)
   - **NÃO marque** "Add .gitignore" (já criamos um)
   - **NÃO marque** "Choose a license" (a menos que queira)
4. **Clique em:** "Create repository"

### 2.3. GitHub mostrará instruções - **COPIE O LINK DO REPOSITÓRIO:**
   - Exemplo: `https://github.com/seu-usuario/myfeet-painel-ppad.git`
   - Ou: `git@github.com:seu-usuario/myfeet-painel-ppad.git`

---

## 🔗 PASSO 3: CONECTAR PROJETO LOCAL AO GITHUB

### 3.1. Adicionar repositório remoto:

**Opção A - HTTPS (mais fácil):**
```bash
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
```

**Opção B - SSH (mais seguro, se tiver configurado):**
```bash
git remote add origin git@github.com:SEU-USUARIO/SEU-REPOSITORIO.git
```

**Substitua:**
- `SEU-USUARIO` = seu username do GitHub
- `SEU-REPOSITORIO` = nome do repositório que você criou

### 3.2. Renomear branch para main (se necessário):
```bash
git branch -M main
```

### 3.3. Fazer push para GitHub:
```bash
git push -u origin main
```

**⚠️ Primeira vez pedirá login:**
- **Username:** seu username do GitHub
- **Password:** use um **Personal Access Token** (não sua senha normal)

**Como criar Personal Access Token:**
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token
3. Marque: `repo` (acesso completo aos repositórios)
4. Copie o token gerado
5. Use o token como senha

---

## 🌐 PASSO 4: CONECTAR AO VERCEL

### 4.1. Acessar Vercel:
1. **Acesse:** [vercel.com](https://vercel.com)
2. **Faça login** (pode usar conta GitHub)

### 4.2. Conectar repositório:
1. **Clique em:** "Add New Project" (ou "New Project")
2. **Escolha:** "Import Git Repository"
3. **Selecione:** GitHub (ou GitLab/Bitbucket se usar outro)
4. **Autorize** Vercel a acessar seus repositórios (se necessário)
5. **Encontre e selecione** seu repositório: `myfeet-painel-ppad` (ou o nome que você deu)
6. **Clique em:** "Import"

### 4.3. Configurar projeto:
1. **Project Name:** `myfeet-painel-ppad` (ou outro nome)
2. **Framework Preset:** Vite (deve detectar automaticamente)
3. **Root Directory:** `./` (deixe como está)
4. **Build Command:** `npm run build` (já vem preenchido)
5. **Output Directory:** `dist` (já vem preenchido)
6. **Install Command:** `npm install` (já vem preenchido)

### 4.4. **CONFIGURAR VARIÁVEIS DE AMBIENTE:**

**⚠️ MUITO IMPORTANTE! Configure antes de fazer deploy:**

1. **Clique em:** "Environment Variables"
2. **Adicione as seguintes variáveis:**

   **Variável 1:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://hzwmacltgiyanukgvfvn.supabase.co`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

   **Variável 2:**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6d21hY2x0Z2l5YW51a2d2ZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTI3NzEsImV4cCI6MjA3ODUyODc3MX0.qNKol-AHSxhfKfBAjtRvR82H_d-tCEYmHJiawVqNTGE`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

3. **Clique em:** "Save" para cada variável

### 4.5. Fazer deploy:
1. **Clique em:** "Deploy"
2. **Aguarde** o build (pode levar 1-2 minutos)
3. **✅ Deploy concluído!** Você receberá uma URL tipo: `https://myfeet-painel-ppad.vercel.app`

---

## 🔒 PASSO 5: CONFIGURAR CORS NO SUPABASE

**⚠️ CRÍTICO: Sem isso, o login não funcionará!**

### 5.1. Copiar URL de produção do Vercel:
- Exemplo: `https://myfeet-painel-ppad.vercel.app`

### 5.2. Configurar no Supabase:
1. **Acesse:** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Selecione seu projeto**
3. **Vá em:** Settings > API
4. **Role para baixo:** "CORS Settings" ou "Additional Allowed URLs"
5. **Adicione sua URL do Vercel:**
   - `https://myfeet-painel-ppad.vercel.app`
   - `https://*.vercel.app` (opcional - permite todas subdomínios Vercel)
6. **Clique em:** "Save"

---

## ✅ PASSO 6: VERIFICAR DEPLOY

### 6.1. Testar URL de produção:
1. **Acesse** a URL fornecida pelo Vercel
2. **Teste login:**
   - Usuário admin/supervisor
   - Verifique se funciona

### 6.2. Verificar console do navegador:
1. **Abra DevTools** (F12)
2. **Vá em Console**
3. **Verifique se há erros**
4. **Se houver erro de CORS:** volte ao Passo 5

---

## 🔄 DEPLOYS FUTUROS (AUTOMÁTICO)

Após a configuração inicial, **todos os deploys serão automáticos:**

1. **Faça alterações** no código
2. **Commit e push** para GitHub:
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push
   ```
3. **Vercel detecta automaticamente** o push
4. **Deploy automático** em ~1-2 minutos
5. **URL de Preview** criada automaticamente para cada push
6. **URL de Production** atualizada se fizer merge na branch `main`

---

## 📝 COMANDOS ÚTEIS

### Ver status do Git:
```bash
git status
```

### Adicionar arquivos:
```bash
git add .
```

### Fazer commit:
```bash
git commit -m "Mensagem descritiva"
```

### Fazer push:
```bash
git push
```

### Ver repositórios remotos:
```bash
git remote -v
```

---

## 🆘 PROBLEMAS COMUNS

### Erro: "repository not found"
- **Solução:** Verifique se o nome do repositório está correto
- Verifique se você tem permissão no repositório

### Erro: "authentication failed"
- **Solução:** Use Personal Access Token ao invés de senha
- Token deve ter permissão `repo`

### Erro: "CORS policy" no navegador
- **Solução:** Configure CORS no Supabase (Passo 5)
- Adicione a URL exata do Vercel

### Build falha no Vercel
- **Solução:** 
  - Verifique se as variáveis de ambiente estão configuradas
  - Verifique logs de build no Vercel Dashboard
  - Certifique-se que `package.json` tem o script `build`

---

## ✅ CHECKLIST FINAL

- [ ] Repositório Git inicializado localmente
- [ ] Repositório criado no GitHub
- [ ] Projeto conectado ao GitHub (git remote add)
- [ ] Código enviado para GitHub (git push)
- [ ] Projeto importado no Vercel
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy realizado com sucesso
- [ ] URL de produção funcionando
- [ ] CORS configurado no Supabase
- [ ] Login testado em produção

---

## 🎉 PRONTO!

Seu projeto está conectado ao GitHub e Vercel! 🚀

**Próximos passos:**
- Fazer alterações no código
- Commit e push para GitHub
- Deploy automático no Vercel

**Precisa de ajuda?** Me avise! 😊










