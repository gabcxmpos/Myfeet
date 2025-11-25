# 📤 SCRIPTS PARA ENVIAR CORREÇÃO DE APROVAÇÃO

## ✅ ARQUIVOS MODIFICADOS

1. **`src/contexts/DataContext.jsx`**
2. **`src/pages/StoresManagement.jsx`**

---

## 🚀 OPÇÃO 1: GITHUB DESKTOP (MAIS FÁCIL)

### Passos:

1. **Abra o GitHub Desktop**
2. **Selecione o repositório:** `gabcxmpos/Myfeet`
3. **Você verá 2 arquivos modificados:**
   - `src/contexts/DataContext.jsx`
   - `src/pages/StoresManagement.jsx`
4. **Marque ambos os arquivos** (deve estar marcado automaticamente)
5. **Na parte inferior, escreva:**
   ```
   Corrigir erro de aprovação de avaliações - adicionar função approveEvaluation
   ```
6. **Clique em:** "Commit to main"
7. **Clique em:** "Push origin"
8. ✅ **Pronto!** Vercel fará deploy automático

---

## 🖥️ OPÇÃO 2: TERMINAL (POWERSHELL)

### Script Completo:

```powershell
# Navegar para a pasta do projeto
cd "C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6"

# Adicionar arquivos modificados
git add src/contexts/DataContext.jsx
git add src/pages/StoresManagement.jsx

# Fazer commit
git commit -m "Corrigir erro de aprovação de avaliações - adicionar função approveEvaluation"

# Enviar para GitHub
git push
```

### Script em Uma Linha:

```powershell
cd "C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6" && git add src/contexts/DataContext.jsx src/pages/StoresManagement.jsx && git commit -m "Corrigir erro de aprovação de avaliações - adicionar função approveEvaluation" && git push
```

---

## 🌐 OPÇÃO 3: SITE DO GITHUB (MANUAL)

### Para cada arquivo:

#### Arquivo 1: `src/contexts/DataContext.jsx`

1. Acesse: https://github.com/gabcxmpos/Myfeet
2. Navegue até: `src/contexts/DataContext.jsx`
3. Clique no ícone de **lápis** (Editar)
4. **Localize a linha 401** (aproximadamente)
5. **Substitua:**
   ```javascript
   const updateEvaluationStatus = (id, status) => handleApiCall(() => api.updateEvaluation(id, { status }), 'Status da avaliação atualizado.');
   ```
   
   **Por:**
   ```javascript
   const updateEvaluationStatus = (id, status) => handleApiCall(() => api.updateEvaluation(id, { status }), 'Status da avaliação atualizado.');
   const approveEvaluation = (id) => handleApiCall(() => api.updateEvaluation(id, { status: 'approved' }), 'Avaliação aprovada! A avaliação agora conta para a pontuação.');
   ```

6. **Role até o final da página**
7. **Na seção "value" (linha ~643), adicione:**
   ```javascript
   approveEvaluation,
   ```
   **Entre `updateEvaluationStatus` e `deleteEvaluation`**

8. **Mensagem do commit:**
   ```
   Corrigir erro de aprovação - adicionar approveEvaluation no DataContext
   ```
9. **Clique em:** "Commit changes"

#### Arquivo 2: `src/pages/StoresManagement.jsx`

1. Acesse: https://github.com/gabcxmpos/Myfeet
2. Navegue até: `src/pages/StoresManagement.jsx`
3. Clique no ícone de **lápis** (Editar)
4. **Localize a linha 334** (aproximadamente)
5. **Verifique se tem:**
   ```javascript
   const { stores, addStore, updateStore, deleteStore, deleteEvaluation, approveEvaluation, fetchData } = useData();
   ```
   (deve ter `approveEvaluation` na lista)

6. **Localize a linha 389** (aproximadamente)
7. **Substitua:**
   ```javascript
   const handleApproveEvaluation = (evalId) => {
     approveEvaluation(evalId);
     toast({ title: "Avaliação Aprovada!", description: `A avaliação agora conta para a pontuação.` });
   }
   ```
   
   **Por:**
   ```javascript
   const handleApproveEvaluation = async (evalId) => {
     try {
       await approveEvaluation(evalId);
       // Toast já é exibido pela função approveEvaluation
     } catch (error) {
       // Error já é tratado pela função approveEvaluation
     }
   }
   ```

8. **Mensagem do commit:**
   ```
   Corrigir handler de aprovação - tornar assíncrono
   ```
9. **Clique em:** "Commit changes"

---

## 📋 RESUMO DAS MUDANÇAS

### DataContext.jsx:
- ✅ Adicionada função `approveEvaluation` (linha ~401)
- ✅ Exportada no value do contexto (linha ~643)

### StoresManagement.jsx:
- ✅ `handleApproveEvaluation` agora é `async` (linha ~389)
- ✅ Adicionado `await` e tratamento de erro

---

## ⏱️ TEMPO ESTIMADO

- **GitHub Desktop:** 2-3 minutos
- **Terminal:** 1-2 minutos
- **Site GitHub:** 5-10 minutos (mais trabalhoso)

---

## ✅ VERIFICAR SE FUNCIONOU

1. **Aguarde 1-2 minutos** após o push
2. **Acesse:** https://vercel.com
3. **Abra o projeto:** `myfeet`
4. **Verifique:** Deve aparecer um novo deploy com status "Ready"
5. **Teste no site:** Aprove uma avaliação pendente

---

## 🎯 RECOMENDAÇÃO

**Use GitHub Desktop** - É o mais fácil e rápido! 😊







