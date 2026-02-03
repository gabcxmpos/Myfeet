# 📦 O que Atualizar no GitHub

## ✅ PASTAS E ARQUIVOS QUE DEVEM SER ATUALIZADOS

### 1. 📁 **PASTA `src/` (TODO O CONTEÚDO)**

**Esta é a pasta principal do código fonte. ATUALIZE TUDO:**

```
src/
├── App.jsx                          ✅ ATUALIZAR
├── main.jsx                         ✅ ATUALIZAR
├── index.css                        ✅ ATUALIZAR
├── components/                      ✅ ATUALIZAR TUDO
│   ├── Sidebar.jsx                  ✅ ATUALIZAR (menu reorganizado)
│   ├── Header.jsx                   ✅ ATUALIZAR
│   ├── MainLayout.jsx               ✅ ATUALIZAR
│   └── ui/                          ✅ ATUALIZAR TUDO
├── contexts/                        ✅ ATUALIZAR TUDO
│   ├── DataContext.jsx              ✅ ATUALIZAR (subscriptions, checklists)
│   └── SupabaseAuthContext.jsx      ✅ ATUALIZAR
├── lib/                             ✅ ATUALIZAR TUDO
│   ├── supabaseService.js           ✅ ATUALIZAR (funções corrigidas)
│   ├── customSupabaseClient.js      ✅ ATUALIZAR
│   └── ...                          ✅ ATUALIZAR TUDO
└── pages/                           ✅ ATUALIZAR TUDO
    ├── StoresManagement.jsx         ✅ ATUALIZAR (avaliações corrigidas)
    ├── StartEvaluation.jsx          ✅ ATUALIZAR (async corrigido)
    ├── ResultsManagement.jsx        ✅ ATUALIZAR (atualização corrigida)
    ├── StoreChecklistsPage.jsx      ✅ ATUALIZAR (novo arquivo)
    ├── StoreDailyChecklist.jsx      ✅ ATUALIZAR (novo arquivo)
    ├── StoreGerencialChecklist.jsx  ✅ ATUALIZAR (novo arquivo)
    ├── DailyChecklist.jsx           ✅ ATUALIZAR (admin/supervisor view)
    ├── GerencialChecklist.jsx       ✅ ATUALIZAR (admin/supervisor view)
    ├── ManageChecklists.jsx         ✅ ATUALIZAR (novo arquivo)
    ├── AnalisesPage.jsx             ✅ ATUALIZAR (novo arquivo)
    ├── GestaoMetasPage.jsx          ✅ ATUALIZAR (novo arquivo)
    ├── StoresCTO.jsx                ✅ ATUALIZAR (valor complementar)
    ├── StoresCTOAnalytics.jsx       ✅ ATUALIZAR (colunas novas)
    ├── PhysicalMissing.jsx          ✅ ATUALIZAR (múltiplos itens)
    ├── ReturnsManagement.jsx        ✅ ATUALIZAR (permissões devoluções)
    └── ...                          ✅ ATUALIZAR TODOS OS OUTROS
```

### 2. 📄 **ARQUIVOS DE CONFIGURAÇÃO (RAIZ DO PROJETO)**

```
✅ ATUALIZAR:
├── package.json                     ✅ ATUALIZAR
├── vite.config.js                   ✅ ATUALIZAR
├── vercel.json                      ✅ ATUALIZAR
├── netlify.toml                     ✅ ATUALIZAR
├── postcss.config.js                ✅ ATUALIZAR
├── tailwind.config.js               ✅ ATUALIZAR (se existir)
└── .gitignore                       ✅ ATUALIZAR (se modificado)
```

### 3. 📄 **ARQUIVOS SQL (OPCIONAL - mas recomendado)**

**Os scripts SQL podem ser enviados para documentação:**

```
✅ RECOMENDADO ENVIAR:
├── ADICIONAR_COLUNA_GERENCIAL_TASKS.sql              ✅ ENVIAR
├── CORRIGIR_RLS_DELETE_COMPLETO.sql                  ✅ ENVIAR
├── CORRIGIR_RELACIONAMENTO_APP_USERS_STORES.sql      ✅ ENVIAR
└── VERIFICAR_TODOS_USUARIOS_LOJAS.sql                ✅ ENVIAR (novo)
```

### 4. 📄 **ARQUIVOS DE DOCUMENTAÇÃO (OPCIONAL)**

```
✅ OPCIONAL (mas útil):
├── RESUMO_ATUALIZAR_PRODUCAO.md                      ✅ ENVIAR (novo)
├── CHECKLIST_DEPLOY_PRODUCAO.md                       ✅ ENVIAR (novo)
└── O_QUE_ATUALIZAR_GITHUB.md                         ✅ ENVIAR (este arquivo)
```

### 5. 📁 **PASTA `public/` (se houver mudanças)**

```
public/
├── index.html                        ✅ VERIFICAR SE MODIFICADO
└── ...                               ✅ VERIFICAR OUTROS ARQUIVOS
```

---

## ❌ O QUE NÃO DEVE SER ENVIADO

### Arquivos que estão no `.gitignore`:

```
❌ NÃO ENVIAR:
├── node_modules/                    ❌ NUNCA ENVIAR
├── dist/                            ❌ NUNCA ENVIAR
├── build/                           ❌ NUNCA ENVIAR
├── .env                             ❌ NUNCA ENVIAR (variáveis sensíveis)
├── .env.local                       ❌ NUNCA ENVIAR
├── .env.production.local            ❌ NUNCA ENVIAR
├── *.log                            ❌ NUNCA ENVIAR
└── backup-*.zip                     ❌ NUNCA ENVIAR
```

---

## 🚀 COMANDOS PARA ATUALIZAR NO GITHUB

### Opção 1: Usando GitHub Desktop (Mais Fácil)

1. **Abra o GitHub Desktop**
2. **Selecione o repositório**
3. **Veja as mudanças:**
   - Todas as pastas `src/` aparecerão como modificadas
   - Novos arquivos aparecerão como "Untracked"
4. **Adicione tudo:**
   - Clique em "Select all" ou selecione manualmente
5. **Faça commit:**
   - Escreva uma mensagem: `"Atualização completa: checklists, avaliações, resultados e correções"`
6. **Faça push:**
   - Clique em "Push origin"

### Opção 2: Usando Terminal/Git Bash

```bash
# 1. Ver o status
git status

# 2. Adicionar todas as mudanças
git add src/
git add package.json
git add vite.config.js
git add vercel.json
git add netlify.toml
git add *.sql
git add *.md

# OU adicionar tudo de uma vez (cuidado com .gitignore)
git add .

# 3. Ver o que será commitado
git status

# 4. Fazer commit
git commit -m "Atualização completa: checklists, avaliações, resultados e correções

- Adicionada coluna gerencialTasks para checklists
- Corrigidas aprovações e visualizações de avaliações
- Corrigida atualização de valores na gestão de resultados
- Adicionadas subscriptions em tempo real
- Novas páginas: StoreChecklistsPage, ManageChecklists, AnalisesPage, GestaoMetasPage
- Correções de sincronização e atualização em todo o sistema"

# 5. Fazer push
git push origin main
# ou
git push origin master
```

---

## 📋 CHECKLIST RÁPIDO

- [ ] Atualizar pasta `src/` completa
- [ ] Atualizar `package.json`
- [ ] Atualizar `vite.config.js`
- [ ] Atualizar `vercel.json`
- [ ] Atualizar `netlify.toml`
- [ ] Adicionar scripts SQL importantes (opcional)
- [ ] Adicionar documentação (opcional)
- [ ] Verificar que `node_modules/` NÃO está sendo enviado
- [ ] Verificar que `.env` NÃO está sendo enviado
- [ ] Fazer commit com mensagem descritiva
- [ ] Fazer push para o GitHub

---

## 🎯 RESUMO: O QUE É MAIS IMPORTANTE

### **CRÍTICO (deve ser atualizado):**
1. ✅ Toda a pasta `src/` - **TODO O CÓDIGO FONTE**
2. ✅ Arquivos de configuração (`package.json`, `vite.config.js`, etc.)

### **IMPORTANTE (recomendado):**
3. ✅ Scripts SQL principais (para documentação)
4. ✅ Documentação de deploy

### **OPCIONAL:**
5. ⚠️ Outros arquivos `.md` de documentação

---

## ⚠️ ATENÇÃO

- **NUNCA** envie arquivos `.env` ou com credenciais
- **NUNCA** envie `node_modules/` (muito pesado)
- **NUNCA** envie `dist/` ou `build/` (são gerados no deploy)
- **SEMPRE** verifique o `.gitignore` antes de fazer commit

---

**Última atualização:** $(date)








