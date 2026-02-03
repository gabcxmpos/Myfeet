# 📋 Arquivos para Atualizar no GitHub

## ⚠️ CRÍTICO - Build está falhando

O build no Vercel está falhando porque as dependências `jspdf` e `html2canvas` não estão no `package.json` do GitHub.

---

## 📦 Arquivos OBRIGATÓRIOS para atualizar:

### 1. **`package.json`** ⚠️ CRÍTICO
   - **Motivo:** Faltam as dependências `jspdf` e `html2canvas` que foram instaladas localmente
   - **O que fazer:** Atualizar o arquivo `package.json` com as novas dependências:
     ```json
     "html2canvas": "^1.4.1",
     "jspdf": "^3.0.4",
     ```
   - **Localização:** Linhas 35-36 nas dependências

### 2. **`src/pages/ReturnsPlanner.jsx`** ⚠️ IMPORTANTE
   - **Motivo:** Todas as melhorias visuais e funcionalidade de exportação PDF
   - **Mudanças principais:**
     - Modernização visual dos dashboards
     - Cores dos gráficos atualizadas (tons mais claros)
     - Textos dos gráficos em branco (eixos, legendas, tooltips)
     - Botão de exportar PDF
     - Função `handleExportPDF` completa
     - Estilos CSS inline para forçar cores brancas nos gráficos
     - Imports: `jsPDF`, `html2canvas`, `Download` icon

---

## 📝 Comandos Git para atualizar:

```bash
# 1. Adicionar arquivos modificados
git add package.json
git add src/pages/ReturnsPlanner.jsx

# 2. Commit
git commit -m "feat: Adiciona exportação PDF e melhora visualização dos gráficos no Planner de Devoluções

- Adiciona dependências jspdf e html2canvas
- Moderniza layout dos dashboards
- Corrige cores dos gráficos (textos brancos)
- Adiciona botão de exportar PDF com filtros aplicados"

# 3. Push
git push origin main
```

---

## ✅ Verificações pós-deploy:

Após o deploy, verificar:
1. ✅ Build passa sem erros
2. ✅ Gráficos "Devoluções por Tipo" e "Devoluções por Status" têm textos brancos
3. ✅ Tooltips dos gráficos têm texto branco
4. ✅ Botão "Exportar PDF" funciona corretamente
5. ✅ PDF gerado contém os filtros aplicados

---

## 📌 Resumo das mudanças:

### Dependências novas:
- `jspdf`: ^3.0.4
- `html2canvas`: ^1.4.1

### Funcionalidades novas:
- Exportação de PDF do dashboard com filtros aplicados
- Melhorias visuais nos gráficos (cores mais claras, textos brancos)

### Correções:
- Tooltips com texto branco
- Eixos e legendas dos gráficos em branco
- Labels do gráfico de pizza em branco

---

**Status:** ⚠️ **URGENTE** - Build está falhando sem essas atualizações
