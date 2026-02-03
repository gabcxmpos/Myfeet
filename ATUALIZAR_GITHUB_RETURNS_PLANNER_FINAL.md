# 📦 Atualizar GitHub - Correção Returns Planner

## ✅ ARQUIVO MODIFICADO (OBRIGATÓRIO)

### **`src/pages/ReturnsPlanner.jsx`** ⚠️ **CRÍTICO**

**O que foi alterado:**
- ✅ Removida validação obrigatória do campo "Data Emissão NF" (`invoice_issue_date`)
- ✅ Removido asterisco (*) do label "Data Emissão NF"
- ✅ Removido atributo `required` do input de data
- ✅ Adicionada normalização para converter `invoice_issue_date` vazio para `null` (evita erro 400)
- ✅ Adicionado comentário explicando que data e número da nota não são obrigatórios

**Motivo:** O caso pode ser aberto antes da aprovação da marca, então esses dados podem não estar disponíveis ainda.

---

## 🚀 COMANDOS PARA ATUALIZAR

### Opção 1: GitHub Desktop

1. Abra o GitHub Desktop
2. Você verá `src/pages/ReturnsPlanner.jsx` como modificado
3. Selecione o arquivo
4. Escreva mensagem de commit:
   ```
   Correção Returns Planner: Data de emissão NF agora é opcional
   ```
5. Clique em "Commit"
6. Clique em "Push origin"

### Opção 2: Terminal/Git Bash

```bash
# Adicionar arquivo modificado
git add src/pages/ReturnsPlanner.jsx

# Ver o que será commitado
git status

# Fazer commit
git commit -m "Correção Returns Planner: Data de emissão NF agora é opcional

- Removida validação obrigatória da data de emissão NF
- Campo agora pode ficar vazio (caso pode ser aberto antes da aprovação da marca)
- Normalização de dados: campos vazios convertidos para null"

# Fazer push
git push origin main
# ou
git push origin master
```

---

## ✅ CHECKLIST

- [ ] Arquivo `src/pages/ReturnsPlanner.jsx` está modificado
- [ ] Commit feito com mensagem descritiva
- [ ] Push realizado para o GitHub

---

**Resumo:** Apenas 1 arquivo precisa ser atualizado: `src/pages/ReturnsPlanner.jsx`








