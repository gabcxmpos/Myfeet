# 📦 Arquivos para Atualizar no GitHub - Correções Returns Planner

## ✅ ARQUIVOS MODIFICADOS (OBRIGATÓRIO)

### 1. **`src/pages/ReturnsPlanner.jsx`** ⚠️ **CRÍTICO**

**O que foi alterado:**
- ✅ Adicionada validação obrigatória para campo "Data Emissão NF" (`invoice_issue_date`)
- ✅ Normalização de dados antes de enviar ao banco (números como números, strings vazias como null)
- ✅ Adicionado `await fetchData()` após salvar registro para atualizar lista imediatamente
- ✅ Adicionado `await fetchData()` após excluir registro para atualizar lista imediatamente
- ✅ Melhorado tratamento de erros com `console.error` para debug
- ✅ Labels atualizados com asterisco (*) para indicar campos obrigatórios
- ✅ Atributo `required` adicionado nos inputs de data

**Linhas modificadas:**
- Linha ~224-228: Validação obrigatória da data de emissão NF
- Linha ~277-300: Normalização de dados e atualização após salvar
- Linha ~302-313: Atualização após excluir
- Linhas ~1235 e ~1431: Labels e inputs atualizados

---

## 📄 ARQUIVOS NOVOS (OPCIONAL - mas recomendado)

### 2. **`CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql`** (Recomendado)

**O que faz:**
- Cria política RLS para permitir DELETE no `returns_planner` para perfis:
  - `admin`
  - `supervisor`
  - `supervisor_franquia`
  - `devoluções`

**Status:** Recomendado enviar para documentação

---

### 3. **`VERIFICAR_POLITICA_DELETE_RETURNS_PLANNER.sql`** (Opcional)

**O que faz:**
- Script de verificação para checar se as políticas RLS estão corretas

**Status:** Opcional (útil para debug)

---

### 4. **`CORRECOES_RETURNS_PLANNER.md`** (Opcional)

**O que faz:**
- Documentação das correções realizadas

**Status:** Opcional (útil para referência)

---

## 🚀 RESUMO: O QUE ENVIAR PARA O GITHUB

### **OBRIGATÓRIO:**
```
✅ src/pages/ReturnsPlanner.jsx
```

### **RECOMENDADO:**
```
✅ CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql
```

### **OPCIONAL:**
```
⚠️ VERIFICAR_POLITICA_DELETE_RETURNS_PLANNER.sql
⚠️ CORRECOES_RETURNS_PLANNER.md
⚠️ ATUALIZAR_GITHUB_RETURNS_PLANNER.md (este arquivo)
```

---

## 📋 COMANDOS PARA ATUALIZAR NO GITHUB

### Opção 1: GitHub Desktop

1. Abra o GitHub Desktop
2. Você verá `src/pages/ReturnsPlanner.jsx` como modificado
3. Selecione o arquivo
4. (Opcional) Selecione também os arquivos SQL e MD se quiser enviá-los
5. Escreva mensagem de commit:
   ```
   Correções no Returns Planner: validação data NF obrigatória, normalização de dados e atualização automática da lista
   ```
6. Clique em "Commit"
7. Clique em "Push origin"

### Opção 2: Terminal/Git Bash

```bash
# Adicionar arquivo modificado (obrigatório)
git add src/pages/ReturnsPlanner.jsx

# Adicionar arquivos opcionais (se quiser)
git add CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql
git add VERIFICAR_POLITICA_DELETE_RETURNS_PLANNER.sql
git add CORRECOES_RETURNS_PLANNER.md

# Ver o que será commitado
git status

# Fazer commit
git commit -m "Correções no Returns Planner: validação data NF obrigatória, normalização de dados e atualização automática da lista

- Adicionada validação obrigatória para campo Data Emissão NF
- Normalização de dados antes de enviar ao banco (números como números)
- Atualização automática da lista após salvar/excluir registros
- Melhorado tratamento de erros para debug"

# Fazer push
git push origin main
# ou
git push origin master
```

---

## ✅ CHECKLIST

- [ ] Arquivo `src/pages/ReturnsPlanner.jsx` está modificado
- [ ] (Opcional) Arquivo `CORRIGIR_RLS_DELETE_RETURNS_PLANNER.sql` adicionado
- [ ] Commit feito com mensagem descritiva
- [ ] Push realizado para o GitHub

---

## 🔍 VERIFICAÇÃO PÓS-UPDATE

Após atualizar no GitHub, verifique:

1. ✅ O arquivo `ReturnsPlanner.jsx` aparece atualizado no GitHub
2. ✅ As mudanças estão visíveis no histórico de commits
3. ✅ Se fez deploy automático (Vercel/Netlify), verifique se o build passou

---

**Última atualização:** $(date)








