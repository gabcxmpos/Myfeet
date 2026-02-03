# 🔧 Correção do Erro de Build no Vercel

## ❌ Erro Encontrado

```
Error: Could not load /vercel/path0/src/pages/PatrimonyManagement (imported by src/App.jsx): ENOENT: no such file or directory
```

## 🔍 Causa do Problema

O erro indica que o arquivo `PatrimonyManagement.jsx` não está sendo encontrado durante o build no Vercel. Isso geralmente acontece quando:

1. **Os arquivos não foram commitados no Git**
2. **Os arquivos estão no `.gitignore`**
3. **Os arquivos não foram enviados para o repositório remoto**

## ✅ Solução

### Passo 1: Verificar se os arquivos existem localmente

Execute no terminal:

```bash
ls -la src/pages/PatrimonyManagement.jsx
ls -la src/pages/StorePatrimony.jsx
ls -la src/pages/PhysicalMissing.jsx
```

### Passo 2: Verificar se os arquivos estão no Git

```bash
git status
```

Se os arquivos aparecerem como "untracked" ou "modified", você precisa commitá-los.

### Passo 3: Adicionar os arquivos ao Git

```bash
# Adicionar todos os arquivos modificados
git add src/pages/PatrimonyManagement.jsx
git add src/pages/StorePatrimony.jsx
git add src/pages/PhysicalMissing.jsx
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/pages/MenuVisibilitySettings.jsx
git add src/lib/supabaseService.js

# Ou adicionar todos os arquivos de uma vez
git add .
```

### Passo 4: Fazer commit

```bash
git commit -m "feat: adicionar rotas e funcionalidades de Patrimônio e Falta Física"
```

### Passo 5: Fazer push para o repositório

```bash
git push origin main
```

## 📋 Arquivos que DEVEM estar no Git

Certifique-se de que estes arquivos estão commitados:

- ✅ `src/pages/PatrimonyManagement.jsx`
- ✅ `src/pages/StorePatrimony.jsx`
- ✅ `src/pages/PhysicalMissing.jsx`
- ✅ `src/App.jsx` (com os novos imports)
- ✅ `src/components/Sidebar.jsx` (com o novo item de menu)
- ✅ `src/pages/MenuVisibilitySettings.jsx` (com o novo item)
- ✅ `src/lib/supabaseService.js` (com as funções de Physical Missing)

## 🔍 Verificar .gitignore

Certifique-se de que o `.gitignore` NÃO está ignorando arquivos `.jsx`:

```bash
cat .gitignore | grep -i jsx
```

Se houver algo como `*.jsx` ou `src/pages/*.jsx`, remova essas linhas.

## 🚀 Após o Push

Após fazer o push, o Vercel irá:
1. Detectar o novo commit
2. Fazer o build automaticamente
3. Deploy da nova versão

## ⚠️ Se o Problema Persistir

Se após fazer o push o erro continuar, verifique:

1. **Branch correta**: Certifique-se de que está fazendo push para a branch `main` (ou a branch configurada no Vercel)
2. **Arquivos no repositório remoto**: Verifique no GitHub/GitLab se os arquivos estão lá
3. **Cache do Vercel**: Tente limpar o cache do build no Vercel

## 📝 Comandos Rápidos

```bash
# Verificar status
git status

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "fix: adicionar arquivos faltantes para build"

# Push
git push origin main
```

---

**Nota:** O Vite está configurado corretamente para resolver extensões `.jsx` automaticamente. O problema é que os arquivos não estão no repositório Git.
