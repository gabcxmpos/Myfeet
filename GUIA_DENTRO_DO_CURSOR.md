# 🎯 Guia Completo DENTRO DO CURSOR

## 📍 Você está aqui: Cursor aberto na pasta do projeto

---

## 🚀 PASSO 1: Abrir Source Control (Controle de Versão)

### Como fazer:
1. **Pressione:** `Ctrl + Shift + G`
   - **OU** clique no ícone de **Git** na barra lateral esquerda
   - É o ícone que parece um ramo de árvore (branch)

### O que você vai ver:
- Uma barra lateral vai abrir à esquerda
- No topo vai ter: **"SOURCE CONTROL"** ou **"CONTROLE DE CÓDIGO-FONTE"**
- Abaixo vai ter uma lista de arquivos

### Se você ver:
- ✅ **"Sync Changes"** ou **"Sincronizar Mudanças"** → Já está conectado! Pule para PASSO 3
- ❌ Lista de arquivos sem botão de sync → Continue com PASSO 2

---

## 🔗 PASSO 2: Conectar com GitHub (se necessário)

### Como fazer:
1. **Pressione:** `` Ctrl + ` `` (Ctrl + crase)
   - Isso abre o **Terminal** na parte inferior do Cursor

2. **No terminal, digite:**
```bash
git remote add origin https://github.com/gabcxmpos/Myfeet.git
```

3. **Pressione Enter**

4. **Verifique se funcionou, digite:**
```bash
git remote -v
```

5. **Pressione Enter**

### O que você deve ver:
```
origin  https://github.com/gabcxmpos/Myfeet.git (fetch)
origin  https://github.com/gabcxmpos/Myfeet.git (push)
```

✅ **Se aparecer isso, está conectado!**

❌ **Se aparecer erro "remote origin already exists":**
- Digite: `git remote set-url origin https://github.com/gabcxmpos/Myfeet.git`
- Pressione Enter

---

## 📦 PASSO 3: Adicionar Arquivos para Commit

### Como fazer:
1. **Volte para Source Control:** `Ctrl + Shift + G`

2. **Você verá uma lista de arquivos:**
   - Arquivos com **"M"** = Modificados
   - Arquivos com **"U"** = Novos (não rastreados)

3. **Para adicionar TODOS os arquivos:**
   - **Opção A:** Clique no **"+"** ao lado de **"Changes"** ou **"Mudanças"**
   - **Opção B:** No terminal, digite: `git add .` e pressione Enter

4. **Os arquivos vão para "Staged Changes" ou "Mudanças Preparadas"**

### O que você vai ver:
- Uma nova seção aparece: **"Staged Changes"**
- Todos os arquivos que você adicionou aparecem lá

---

## 💾 PASSO 4: Fazer Commit

### Como fazer:
1. **Ainda no Source Control** (`Ctrl + Shift + G`)

2. **No topo, há uma caixa de texto** que diz:
   - **"Message"** ou **"Mensagem"**
   - **"Type commit message"** ou **"Digite mensagem do commit"**

3. **Clique nessa caixa e digite:**
```
feat: Adicionar novos perfis de login e otimizar mobile
```

4. **Depois de digitar, você tem 2 opções:**
   - **Opção A:** Clique no ícone **✓ (checkmark)** no topo da barra
   - **Opção B:** Pressione `Ctrl + Enter`

### O que você vai ver:
- Uma mensagem aparece: **"Committed"** ou **"Commit realizado"**
- Os arquivos saem de "Staged Changes"
- Aparece um botão: **"Sync Changes"** ou **"Push"**

---

## 🚀 PASSO 5: Fazer Push para GitHub

### Como fazer:
1. **Ainda no Source Control** (`Ctrl + Shift + G`)

2. **Procure por um dos botões:**
   - **"Sync Changes"** (com ícone de setas circulares)
   - **"Push"** (com ícone de seta para cima)
   - **"Sincronizar Mudanças"**

3. **Clique no botão**

4. **Se pedir autenticação:**
   - **Username:** Seu usuário do GitHub (gabcxmpos)
   - **Password:** Use seu **Personal Access Token** (não sua senha)
   - Para criar token: https://github.com/settings/tokens

### O que você vai ver:
- Uma barra de progresso aparece
- Mensagem: **"Pushed"** ou **"Enviado"**
- Os arquivos foram enviados para o GitHub!

---

## ✅ PASSO 6: Verificar se Funcionou

### Como fazer:
1. **Abra seu navegador**

2. **Vá para:** https://github.com/gabcxmpos/Myfeet

3. **Verifique:**
   - Seus arquivos aparecem atualizados
   - O último commit mostra sua mensagem
   - Data/hora do último push

---

## 🎯 RESUMO VISUAL - Onde Clicar

```
┌─────────────────────────────────────┐
│  CURSOR                              │
├─────────────────────────────────────┤
│  [Barra Lateral]                    │
│  📁 Explorer                        │
│  🔍 Search                          │
│  🌿 Source Control ← CLIQUE AQUI!   │
│  🐛 Run and Debug                   │
│  📦 Extensions                      │
├─────────────────────────────────────┤
│  [Área Principal]                   │
│                                     │
│  SOURCE CONTROL                     │
│  ┌─────────────────────────────┐   │
│  │ Message: [Digite aqui]      │   │
│  │ ✓ (checkmark) ← CLIQUE!    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Changes                            │
│  ┌─────────────────────────────┐   │
│  │ + (plus) ← CLIQUE PARA     │   │
│  │   ADICIONAR ARQUIVOS       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Lista de arquivos]                │
│                                     │
│  Sync Changes ← CLIQUE PARA PUSH!  │
└─────────────────────────────────────┘
```

---

## ⌨️ ATALHOS DE TECLADO ÚTEIS

| Ação | Atalho |
|------|--------|
| Abrir Source Control | `Ctrl + Shift + G` |
| Abrir Terminal | `` Ctrl + ` `` |
| Fazer Commit | `Ctrl + Enter` (quando estiver no Source Control) |
| Fechar Painel | `Ctrl + B` |
| Fechar Terminal | `` Ctrl + ` `` novamente |

---

## 🆘 PROBLEMAS COMUNS

### "Não vejo Source Control"
**Solução:**
1. Vá em: **View → Source Control**
2. Ou pressione: `Ctrl + Shift + G`

### "Não vejo botão Sync Changes"
**Solução:**
1. Faça o commit primeiro (PASSO 4)
2. Depois o botão aparece

### "Erro ao fazer push - Authentication failed"
**Solução:**
1. Crie Personal Access Token: https://github.com/settings/tokens
2. Use o token como senha (não sua senha do GitHub)

### "Terminal não abre"
**Solução:**
1. Vá em: **Terminal → New Terminal**
2. Ou pressione: `` Ctrl + ` ``

---

## 📝 CHECKLIST - Marque Conforme Faz

- [ ] Abri Source Control (`Ctrl + Shift + G`)
- [ ] Verifiquei se está conectado (vi "Sync Changes" ou conectei)
- [ ] Adicionei arquivos (cliquei no "+" ou `git add .`)
- [ ] Fiz commit (digitei mensagem e cliquei em ✓)
- [ ] Fiz push (cliquei em "Sync Changes")
- [ ] Verifiquei no GitHub que os arquivos foram atualizados

---

## 🎉 PRONTO!

Depois de fazer tudo isso, seus arquivos estarão no GitHub!

**Próximo passo:** Executar os scripts SQL no Supabase (veja `GUIA_EXECUCAO_SUPABASE.md`)

---

## 💡 DICA FINAL

**Se você se perder:**
1. Pressione `Ctrl + Shift + G` para voltar ao Source Control
2. Sempre comece por aí!

**Tudo pronto para começar!** 🚀






























