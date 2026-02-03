# 🚨 ATUALIZAR GITHUB - URGENTE

## ⚠️ Build está falhando no Vercel!

O erro mostra que `jspdf` não está sendo encontrado durante o build.

---

## 📦 Arquivos que PRECISAM ser atualizados:

### 1. **`package.json`** ⚠️ CRÍTICO
   - **Problema:** Faltam as dependências `jspdf` e `html2canvas`
   - **Solução:** O arquivo local já tem essas dependências (linhas 35-36)
   - **Ação:** Copiar o `package.json` completo para o GitHub

### 2. **`src/pages/ReturnsPlanner.jsx`** ⚠️ IMPORTANTE
   - **Mudanças:** Todas as melhorias visuais e exportação PDF
   - **Ação:** Copiar o arquivo completo para o GitHub

### 3. **`src/pages/Dashboard.jsx`** ⚠️ NOVO - CORREÇÃO DE GAPS
   - **Mudanças:** Implementação completa do cálculo de gaps
   - **O que foi adicionado:**
     - Função `calculateGaps()` que identifica perguntas com pontuação abaixo de 70
     - Integração com formulários para análise detalhada
     - Agrupamento por pilar (Pessoas, Performance, Ambientação, Digital)
     - Mensagens descritivas com frequência e média de pontuação
   - **Correção de Build:** Renomeado variável `eval` para `evaluation` (erro ECMAScript)
   - **Ação:** Copiar o arquivo completo para o GitHub

### 4. **`src/pages/Analytics.jsx`** ⚠️ NOVO - ANÁLISE DETALHADA DE GAPS
   - **Mudanças:** Correção da análise aprofundada de gaps
   - **O que foi corrigido:**
     - Função `calculateDetailedGaps()` agora trata corretamente `form_id` e `formId`
     - Suporte para dados JSON string (questions e answers)
     - Tratamento de `storeId` e `store_id`
     - Logs de debug para troubleshooting
     - Seção sempre exibida (mesmo quando não há gaps)
   - **Ação:** Copiar o arquivo completo para o GitHub

---

## 🔧 Comandos para atualizar:

```bash
# Adicionar arquivos
git add package.json
git add src/pages/ReturnsPlanner.jsx
git add src/pages/Dashboard.jsx
git add src/pages/Analytics.jsx

# Commit
git commit -m "fix: Adiciona dependências jspdf/html2canvas + correção completa de gaps (Dashboard e Analytics)"

# Push
git push origin main
```

---

## ✅ Após atualizar, o build deve:
1. ✅ Instalar `jspdf` e `html2canvas`
2. ✅ Compilar sem erros
3. ✅ Deploy funcionar corretamente
4. ✅ Gaps aparecerem corretamente no Dashboard

---

## 📋 Resumo das Mudanças no Dashboard.jsx:

- ✅ Função `calculateGaps()` implementada
- ✅ Análise de perguntas com pontuação < 70 pontos
- ✅ Suporte para diferentes tipos de perguntas (satisfaction, multiple-choice, checkbox)
- ✅ Tratamento de dados JSON string
- ✅ Limite de 5 gaps mais frequentes por pilar
- ✅ Logs de debug para troubleshooting

---

**Status:** 🔴 **CRÍTICO** - Build bloqueado sem essas atualizações

**Última atualização:** 
- ✅ Correção de gaps implementada no Dashboard
- ✅ Análise detalhada de gaps corrigida no Analytics
- ✅ Erro de build corrigido (variável `eval` renomeada para `evaluation`)
- ✅ Suporte para dados JSON string e tratamento de campos alternativos
