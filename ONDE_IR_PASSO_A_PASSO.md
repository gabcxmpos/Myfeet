# 🗺️ ONDE IR - Guia Visual Passo a Passo

## 📍 SITUAÇÃO ATUAL
Você está em: `C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6`

Seu repositório GitHub: https://github.com/gabcxmpos/Myfeet

---

## 🎯 PASSO 1: Conectar Cursor com GitHub

### No Cursor:

1. **Abra o Source Control:**
   - Pressione `Ctrl + Shift + G`
   - **OU** clique no ícone de **Git** na barra lateral esquerda (ícone de ramo de árvore)
   - **OU** vá em: **View → Source Control**

2. **Verifique se já está conectado:**
   - Se você ver "Sync Changes" ou o nome do branch `main` → ✅ Já está conectado!
   - Se não, continue...

3. **Se não estiver conectado, abra o Terminal:**
   - Pressione `` Ctrl + ` `` (Ctrl + crase)
   - **OU** vá em: **Terminal → New Terminal**

4. **No Terminal, execute:**
```bash
git remote add origin https://github.com/gabcxmpos/Myfeet.git
```

5. **Verifique se funcionou:**
```bash
git remote -v
```

**Deve mostrar:**
```
origin  https://github.com/gabcxmpos/Myfeet.git (fetch)
origin  https://github.com/gabcxmpos/Myfeet.git (push)
```

---

## 🎯 PASSO 2: Adicionar Arquivos para Commit

### No Cursor - Source Control:

1. **Abra Source Control:** `Ctrl + Shift + G`

2. **Você verá uma lista de arquivos modificados:**
   - Arquivos com **"M"** (Modified) = Modificados
   - Arquivos com **"U"** (Untracked) = Novos

3. **Para adicionar TODOS os arquivos:**
   - Clique no **"+"** ao lado de "Changes" (ou "Changes (X)")
   - **OU** no terminal: `git add .`

4. **Os arquivos vão para "Staged Changes"**

---

## 🎯 PASSO 3: Fazer Commit

### No Cursor - Source Control:

1. **Na caixa de texto no topo** (onde diz "Message"), digite:
```
feat: Adicionar novos perfis de login e otimizar mobile
```

2. **Clique no ícone de ✓ (checkmark)** no topo da barra
   - **OU** pressione `Ctrl + Enter`

3. **Pronto! Commit feito!**

---

## 🎯 PASSO 4: Fazer Push para GitHub

### No Cursor - Source Control:

1. **Depois do commit, você verá:**
   - Um botão **"Sync Changes"** (com ícone de setas circulares)
   - **OU** um botão **"Push"**

2. **Clique em "Sync Changes" ou "Push"**

3. **Se pedir autenticação:**
   - Use seu **Personal Access Token** (não sua senha)
   - Para criar: https://github.com/settings/tokens

4. **Pronto! Arquivos enviados para o GitHub!**

---

## 🎯 PASSO 5: Verificar no GitHub

### No Navegador:

1. **Abra:** https://github.com/gabcxmpos/Myfeet

2. **Você deve ver:**
   - Seus arquivos atualizados
   - O último commit com sua mensagem
   - Data/hora do último push

---

## 🎯 PASSO 6: Executar Scripts SQL no Supabase

### No Supabase Dashboard:

1. **Acesse:** https://supabase.com/dashboard

2. **Selecione seu projeto**

3. **Vá em:** **SQL Editor** (no menu lateral esquerdo)

4. **Execute o PASSO 1:**
   - Abra o arquivo `1_EXECUTAR_PRIMEIRO_SUPABASE.sql` no Cursor
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** ou pressione `Ctrl + Enter`
   - Verifique se "devoluções" aparece na lista

5. **Execute o PASSO 2:**
   - Abra o arquivo `2_EXECUTAR_SEGUNDO_SUPABASE.sql` no Cursor
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"**
   - Verifique se todos os roles aparecem na lista

---

## 📍 RESUMO - Onde Ir em Cada Passo

| Passo | Onde Ir | O Que Fazer |
|-------|---------|-------------|
| **1. Conectar** | Cursor → Terminal (`Ctrl + \``) | `git remote add origin https://github.com/gabcxmpos/Myfeet.git` |
| **2. Adicionar** | Cursor → Source Control (`Ctrl + Shift + G`) | Clicar no "+" ao lado de "Changes" |
| **3. Commit** | Cursor → Source Control | Digitar mensagem e clicar em ✓ |
| **4. Push** | Cursor → Source Control | Clicar em "Sync Changes" ou "Push" |
| **5. Verificar** | Navegador → https://github.com/gabcxmpos/Myfeet | Ver se arquivos foram atualizados |
| **6. SQL** | Supabase → SQL Editor | Executar scripts SQL |

---

## 🖱️ Atalhos Rápidos no Cursor

- `Ctrl + Shift + G` → Abre Source Control
- `` Ctrl + ` `` → Abre Terminal
- `Ctrl + Enter` → Faz commit (quando estiver no Source Control)
- `Ctrl + K, Ctrl + S` → Abre atalhos de teclado

---

## ✅ Checklist Visual

### No Cursor (Source Control):
- [ ] Vejo lista de arquivos modificados
- [ ] Cliquei no "+" para adicionar
- [ ] Digitei mensagem do commit
- [ ] Cliquei no ✓ para fazer commit
- [ ] Cliquei em "Sync Changes" ou "Push"
- [ ] Vejo mensagem de sucesso

### No GitHub:
- [ ] Abri https://github.com/gabcxmpos/Myfeet
- [ ] Vejo meus arquivos atualizados
- [ ] Vejo o último commit com minha mensagem

### No Supabase:
- [ ] Abri SQL Editor
- [ ] Executei `1_EXECUTAR_PRIMEIRO_SUPABASE.sql`
- [ ] Executei `2_EXECUTAR_SEGUNDO_SUPABASE.sql`
- [ ] Verifiquei que todos os roles foram adicionados

---

## 🆘 Se Algo Não Funcionar

### "Git não encontrado"
- Instale Git: https://git-scm.com/download/win
- Reinicie o Cursor

### "Authentication failed"
- Crie Personal Access Token: https://github.com/settings/tokens
- Use o token como senha

### "Remote origin already exists"
- No terminal: `git remote set-url origin https://github.com/gabcxmpos/Myfeet.git`

### Não vejo Source Control
- Vá em: **View → Source Control**
- Ou instale extensão "Git" no Cursor

---

## 💡 Dica Final

**Comece pelo mais fácil:**
1. Abra Source Control (`Ctrl + Shift + G`)
2. Se já estiver conectado, só precisa fazer commit e push
3. Se não estiver, use o terminal para conectar primeiro

**Tudo pronto para começar!** 🚀

