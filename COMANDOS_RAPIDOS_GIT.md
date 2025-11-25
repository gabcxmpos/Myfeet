# ⚡ COMANDOS RÁPIDOS - GIT E GITHUB

## 📦 Inicializar e Configurar

```bash
# Inicializar repositório Git (se ainda não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer primeiro commit
git commit -m "Initial commit - Projeto PPAD MyFeet"

# Adicionar repositório remoto (substitua com sua URL)
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Renomear branch para main
git branch -M main

# Enviar para GitHub (primeira vez)
git push -u origin main
```

---

## 🔄 Trabalho Diário

```bash
# Ver status
git status

# Adicionar arquivos específicos
git add nome-do-arquivo.js
# OU adicionar tudo
git add .

# Fazer commit
git commit -m "Descrição do que foi alterado"

# Enviar para GitHub
git push
```

---

## 📋 Exemplos de Mensagens de Commit

```bash
# Adicionar nova funcionalidade
git commit -m "feat: adicionar funcionalidade de exportação"

# Corrigir bug
git commit -m "fix: corrigir erro no login"

# Atualizar estilo
git commit -m "style: melhorar layout do dashboard"

# Atualizar documentação
git commit -m "docs: atualizar guia de deploy"

# Refatoração
git commit -m "refactor: otimizar código do DataContext"
```

---

## 🔍 Verificar e Diagnosticar

```bash
# Ver histórico de commits
git log

# Ver repositórios remotos configurados
git remote -v

# Ver branches
git branch

# Ver diferenças não commitadas
git diff
```

---

## 🔧 Configurar Git (primeira vez)

```bash
# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email
git config --global user.email "seu-email@exemplo.com"

# Ver configurações
git config --list
```

---

## 🆘 Problemas Comuns

```bash
# Desfazer última modificação em arquivo (ANTES de git add)
git checkout -- nome-do-arquivo.js

# Desfazer git add (remover do stage)
git reset HEAD nome-do-arquivo.js

# Ver informações do repositório
git remote show origin
```

---

## 📝 Checklist para Primeiro Push

1. ✅ `git init` (se necessário)
2. ✅ `git add .`
3. ✅ `git commit -m "Initial commit"`
4. ✅ Criar repositório no GitHub
5. ✅ `git remote add origin [URL]`
6. ✅ `git branch -M main`
7. ✅ `git push -u origin main`

---

**💡 Dica:** Após configurar uma vez, você só precisa de:
```bash
git add .
git commit -m "sua mensagem"
git push
```










