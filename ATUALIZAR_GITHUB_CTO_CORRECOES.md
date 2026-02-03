# 📋 Atualizar GitHub - Correções CTO

## ⚠️ Arquivos modificados que precisam ser atualizados:

### 1. **`src/pages/StoresCTO.jsx`** ⚠️ IMPORTANTE
   - **Mudanças:**
     - Removida tolerância de R$ 100 para diferenças (AMM, FPP, COND)
     - Agora mostra diferença para qualquer centavo
     - Alterado "Fundo de Participação" para "Fundo de Promoção (FPP)"
     - Removidas informações de "Lucro" e "Margem" do resumo do mês
     - Alterado "Complemento" para "Complementar" nos comentários

### 2. **`src/pages/StoresCTOAnalytics.jsx`** ⚠️ IMPORTANTE
   - **Mudanças:**
     - Removida tolerância de R$ 100 para diferenças (AMM, FPP, COND)
     - Agora mostra diferença para qualquer centavo
     - Alterado cabeçalho da coluna "Complemento" para "Complementar"
     - Alterado "Fundo de Participação" para "Fundo de Promoção" nos comentários

### 3. **`package.json`** ⚠️ CRÍTICO (se ainda não foi atualizado)
   - **Mudanças:**
     - Adicionadas dependências `jspdf` e `html2canvas` (linhas 35-36)
     - Necessário para o build funcionar no Vercel

---

## 📝 Comandos Git para atualizar:

```bash
# 1. Adicionar arquivos modificados
git add src/pages/StoresCTO.jsx
git add src/pages/StoresCTOAnalytics.jsx
git add package.json

# 2. Commit
git commit -m "fix: Remove tolerância R$ 100 e corrige nomenclaturas no CTO

- Remove tolerância de R$ 100 para diferenças (AMM, FPP, COND, Complementar)
- Mostra diferença para qualquer centavo
- Altera 'Fundo de Participação' para 'Fundo de Promoção (FPP)'
- Altera 'Complemento' para 'Complementar'
- Remove informações de Lucro e Margem do resumo do mês
- Adiciona dependências jspdf e html2canvas (se necessário)"

# 3. Push
git push origin main
```

---

## ✅ Resumo das mudanças:

### Correções de tolerância:
- ✅ Removida tolerância de R$ 100 em todas as comparações
- ✅ Diferenças agora são mostradas para qualquer valor (mesmo centavos)
- ✅ Aplicado em: AMM, FPP, COND e Complementar

### Nomenclaturas atualizadas:
- ✅ "Fundo de Participação" → "Fundo de Promoção (FPP)"
- ✅ "Complemento" → "Complementar"

### Remoções:
- ✅ Removidas informações de "Lucro" e "Margem" do resumo do mês

---

**Status:** ✅ Pronto para atualizar no GitHub

**Arquivos modificados:** 2 arquivos principais (`StoresCTO.jsx` e `StoresCTOAnalytics.jsx`) + `package.json` (se ainda não foi atualizado)








