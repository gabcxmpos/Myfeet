# 🎯 Guia: Cursor + Git (Sem GitHub Desktop)

## ✅ Você NÃO precisa do GitHub Desktop!

Você pode usar o Cursor diretamente com Git via terminal. É mais simples!

---

## 🚀 PASSO 1: Abrir Terminal no Cursor

### Como fazer:
1. **Pressione:** `` Ctrl + ` `` (Ctrl + crase)
   - **OU** vá em: **Terminal → New Terminal**
   - **OU** clique em **Terminal** no menu superior

### O que você vai ver:
- Uma janela de terminal aparece na parte inferior do Cursor
- Você verá algo como: `C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6>`

---

## 🔗 PASSO 2: Verificar se Git está Instalado

### No terminal, digite:
```bash
git --version
```

### Pressione Enter

### O que você deve ver:
- ✅ `git version 2.x.x` → Git está instalado! Continue.
- ❌ `'git' não é reconhecido` → Precisa instalar Git

### Se precisar instalar Git:
1. Baixe: https://git-scm.com/download/win
2. Instale (deixe todas as opções padrão)
3. **Reinicie o Cursor**
4. Tente novamente: `git --version`

---

## 🔧 PASSO 3: Configurar Git (Primeira Vez)

### Se for a primeira vez usando Git, configure:

```bash
git config --global user.name "Seu Nome"
```

**Pressione Enter**

```bash
git config --global user.email "seu-email@exemplo.com"
```

**Pressione Enter**

**Substitua:**
- `"Seu Nome"` pelo seu nome real
- `"seu-email@exemplo.com"` pelo email do seu GitHub

---

## 🔍 PASSO 4: Verificar se Já Está Conectado

### No terminal, digite:
```bash
git remote -v
```

### Pressione Enter

### O que você vai ver:

**✅ Se estiver conectado:**
```
origin  https://github.com/gabcxmpos/Myfeet.git (fetch)
origin  https://github.com/gabcxmpos/Myfeet.git (push)
```
→ **Já está conectado!** Pule para PASSO 6

**❌ Se NÃO estiver conectado:**
```
(nada aparece ou erro)
```
→ Continue com PASSO 5

---

## 🔗 PASSO 5: Conectar com GitHub

### No terminal, digite:
```bash
git remote add origin https://github.com/gabcxmpos/Myfeet.git
```

### Pressione Enter

### Se aparecer erro "remote origin already exists":
```bash
git remote set-url origin https://github.com/gabcxmpos/Myfeet.git
```

### Pressione Enter

### Verifique novamente:
```bash
git remote -v
```

### Pressione Enter

**Deve mostrar:**
```
origin  https://github.com/gabcxmpos/Myfeet.git (fetch)
origin  https://github.com/gabcxmpos/Myfeet.git (push)
```

✅ **Conectado!**

---

## 📦 PASSO 6: Ver Status dos Arquivos

### No terminal, digite:
```bash
git status
```

### Pressione Enter

### O que você vai ver:
- Lista de arquivos **modificados** (em vermelho)
- Lista de arquivos **novos** (não rastreados, em vermelho)
- Ou mensagem: "nothing to commit, working tree clean"

---

## ➕ PASSO 7: Adicionar Arquivos

### Para adicionar TODOS os arquivos:
```bash
git add .
```

### Pressione Enter

### Verifique novamente:
```bash
git status
```

### Pressione Enter

### O que você vai ver:
- Arquivos agora aparecem em **verde** (staged)
- Mensagem: "Changes to be committed"

---

## 💾 PASSO 8: Fazer Commit

### No terminal, digite:
```bash
git commit -m "feat: Adicionar novos perfis de login e otimizar mobile"
```

### Pressione Enter

### O que você vai ver:
- Mensagem: "X files changed, Y insertions(+), Z deletions(-)"
- Commit criado com sucesso!

---

## 🚀 PASSO 9: Fazer Push para GitHub

### No terminal, digite:
```bash
git push origin main
```

### Pressione Enter

### Se pedir autenticação:

**Username:** `gabcxmpos` (seu usuário do GitHub)

**Password:** Use seu **Personal Access Token** (NÃO sua senha!)

### Como criar Personal Access Token:
1. Vá para: https://github.com/settings/tokens
2. Clique em **"Generate new token" → "Generate new token (classic)"**
3. Dê um nome: `Cursor Access`
4. Selecione permissão: ✅ `repo`
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não vai ver ele novamente!)
7. Use este token como senha quando o Git pedir

### O que você vai ver:
- Barra de progresso
- Mensagem: "Writing objects: 100%"
- Mensagem: "To https://github.com/gabcxmpos/Myfeet.git"
- ✅ **Push concluído!**

---

## ✅ PASSO 10: Verificar no GitHub

1. **Abra seu navegador**
2. **Vá para:** https://github.com/gabcxmpos/Myfeet
3. **Verifique:**
   - Seus arquivos aparecem atualizados
   - O último commit mostra sua mensagem
   - Data/hora do último push

---

## 📋 COMANDOS RÁPIDOS - Copie e Cole

### Sequência completa (se já estiver conectado):

```bash
# Ver status
git status

# Adicionar tudo
git add .

# Fazer commit
git commit -m "feat: Adicionar novos perfis de login e otimizar mobile"

# Fazer push
git push origin main
```

---

## 🎯 RESUMO - O Que Fazer no Terminal

| Passo | Comando | O Que Faz |
|-------|---------|-----------|
| 1 | `git --version` | Verifica se Git está instalado |
| 2 | `git config --global user.name "Nome"` | Configura seu nome |
| 3 | `git config --global user.email "email"` | Configura seu email |
| 4 | `git remote -v` | Verifica se está conectado |
| 5 | `git remote add origin URL` | Conecta com GitHub |
| 6 | `git status` | Vê arquivos modificados |
| 7 | `git add .` | Adiciona arquivos |
| 8 | `git commit -m "mensagem"` | Faz commit |
| 9 | `git push origin main` | Envia para GitHub |

---

## 🆘 PROBLEMAS COMUNS

### "git não é reconhecido"
**Solução:** Instale Git: https://git-scm.com/download/win

### "Authentication failed"
**Solução:** Use Personal Access Token (não sua senha)

### "remote origin already exists"
**Solução:** 
```bash
git remote set-url origin https://github.com/gabcxmpos/Myfeet.git
```

### "Updates were rejected"
**Solução:**
```bash
git pull origin main
git push origin main
```

### "Branch 'main' has no upstream branch"
**Solução:**
```bash
git push -u origin main
```

---

## 💡 DICA

**Você pode usar o terminal do Cursor OU a interface Source Control:**

- **Terminal:** Mais controle, comandos diretos
- **Source Control (`Ctrl + Shift + G`):** Mais visual, cliques

**Ambos fazem a mesma coisa!** Use o que preferir.

---

## ✅ CHECKLIST

- [ ] Abri terminal no Cursor (`` Ctrl + ` ``)
- [ ] Verifiquei se Git está instalado (`git --version`)
- [ ] Configurei Git (nome e email)
- [ ] Verifiquei conexão (`git remote -v`)
- [ ] Conectei com GitHub (se necessário)
- [ ] Adicionei arquivos (`git add .`)
- [ ] Fiz commit (`git commit -m "mensagem"`)
- [ ] Fiz push (`git push origin main`)
- [ ] Verifiquei no GitHub que funcionou

---

## 🎉 PRONTO!

Agora você sabe usar Git direto no terminal do Cursor, sem precisar do GitHub Desktop!

**Tudo funciona perfeitamente assim!** 🚀






























