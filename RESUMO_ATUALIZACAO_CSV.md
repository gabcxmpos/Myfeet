# Resumo: O que Atualizar no GitHub para Corrigir CSV de Metas

## 🎯 Problema Atual Online
- Import CSV de metas não funciona
- Metas não são salvas corretamente
- Página em branco por erros de importação

## ✅ Solução: 4 Arquivos Precisam ser Atualizados

### 1. `src/pages/GoalsPanel.jsx` 
**Status:** Arquivo completo precisa ser substituído
- ✅ Adiciona funcionalidade de import CSV
- ✅ Salva metas com estrutura de mês (goals[YYYY-MM])
- ✅ Adiciona seletor de mês
- ✅ Preserva metas de outros meses

**Ação:** Copiar arquivo local completo para GitHub

---

### 2. `src/contexts/DataContext.jsx`
**Status:** Pequena alteração (1 linha)
- ✅ Adiciona `fetchData` no objeto `value`

**Linha ~216:** Adicionar `fetchData,` no objeto value

---

### 3. `src/lib/supabaseService.js`
**Status:** Adicionar funções de alertas (causa erro de importação)
- ✅ Adiciona 8 funções de alertas no final do arquivo

**Ação:** Copiar seção completa de alertas do arquivo local

---

### 4. `src/pages/PainelExcelencia.jsx`
**Status:** Arquivo vazio precisa ser criado
- ✅ Cria componente básico com export default

**Ação:** Copiar arquivo completo do local

---

## 📋 Passo a Passo Rápido

1. **Copiar arquivos locais para GitHub:**
   - `src/pages/GoalsPanel.jsx` → Substituir completo
   - `src/contexts/DataContext.jsx` → Adicionar `fetchData` no value
   - `src/lib/supabaseService.js` → Adicionar funções de alertas
   - `src/pages/PainelExcelencia.jsx` → Criar arquivo completo

2. **Fazer commit:**
   ```bash
   git add src/pages/GoalsPanel.jsx
   git add src/contexts/DataContext.jsx
   git add src/lib/supabaseService.js
   git add src/pages/PainelExcelencia.jsx
   git commit -m "fix: Corrigir import CSV de metas e erros de importação"
   git push
   ```

3. **Aguardar deploy automático na Vercel**

4. **Testar:**
   - Acessar página de Metas
   - Baixar template CSV
   - Importar CSV com metas
   - Verificar se metas foram salvas

---

## 🔍 Verificação Pós-Deploy

- [ ] Página carrega sem erros
- [ ] Botão "Template Metas" funciona
- [ ] Botão "Importar Metas" funciona
- [ ] CSV importa e salva corretamente
- [ ] Metas aparecem nas lojas após import

---

## ⚠️ Arquivos Locais Prontos

Todos os arquivos estão corrigidos localmente e prontos para serem copiados para o GitHub.










