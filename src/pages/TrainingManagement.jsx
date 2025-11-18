# 📋 ARQUIVOS PARA ATUALIZAR NO GITHUB

## ✅ Resumo
Esta atualização inclui:
1. **Correção dos filtros** (seleção com mouse e teclado)
2. **Funcionalidade completa de treinamentos**

---

## 📁 ARQUIVOS QUE PRECISAM SER ATUALIZADOS

### 🔧 Filtros Corrigidos
- ✅ `src/components/MultiSelectFilter.jsx` - Reescrito com checkboxes reais
- ✅ `src/components/StoreMultiSelect.jsx` - Reescrito com checkboxes reais

### 🎓 Funcionalidade de Treinamentos
- ✅ `src/pages/TrainingManagement.jsx` - Página de gerenciamento de treinamentos (admin)
- ✅ `src/pages/Training.jsx` - Página de treinamentos para lojas
- ✅ `src/contexts/DataContext.jsx` - Adicionado suporte a treinamentos
- ✅ `src/lib/supabaseService.js` - Funções API para treinamentos
- ✅ `src/App.jsx` - Rotas de treinamentos adicionadas
- ✅ `src/components/Sidebar.jsx` - Links de treinamentos no menu
- ✅ `src/pages/Collaborators.jsx` - Campos CPF e email adicionados

---

## 🚀 COMO ATUALIZAR

### Opção 1: GitHub Desktop (Recomendado)
1. Abra o GitHub Desktop
2. Todos os arquivos acima aparecerão na lista de mudanças
3. Adicione mensagem de commit:
   ```
   feat: Corrigir filtros e adicionar funcionalidade completa de treinamentos
   ```
4. Clique em **"Commit to main"**
5. Clique em **"Push origin"**

### Opção 2: GitHub Web
1. Acesse seu repositório no GitHub
2. Vá em **"Add file"** > **"Upload files"**
3. Arraste todos os arquivos listados acima
4. Adicione a mensagem de commit acima
5. Clique em **"Commit changes"**

### Opção 3: Script PowerShell
Execute o script `update-github-completo.ps1` (se o Git estiver configurado):
```powershell
powershell -ExecutionPolicy Bypass -File update-github-completo.ps1
```

---

## 📝 MENSAGEM DE COMMIT SUGERIDA

```
feat: Corrigir filtros e adicionar funcionalidade completa de treinamentos

Filtros:
- Reescrever MultiSelectFilter com checkboxes reais
- Reescrever StoreMultiSelect com checkboxes reais
- Corrigir seleção com mouse e teclado
- Melhorar experiência de uso dos filtros

Treinamentos:
- Adicionar página TrainingManagement para admin
- Adicionar página Training para lojas
- Adicionar campos CPF e email em colaboradores
- Adicionar funcionalidade de inscrição em treinamentos
- Adicionar dashboard de treinamentos
- Adicionar exportação Excel de inscritos
- Adicionar controle de presença
- Integrar com DataContext e Supabase
```

---

## ⚠️ IMPORTANTE

### Após atualizar no GitHub:
1. ⏱️ Aguarde 2-3 minutos para o Vercel fazer deploy automático
2. 🧹 Limpe o cache do navegador (Ctrl + Shift + Delete ou Ctrl + F5)
3. ✅ Teste as funcionalidades:
   - Filtros devem funcionar com mouse e teclado
   - Treinamentos devem aparecer no menu
   - Admin pode criar treinamentos
   - Lojas podem se inscrever em treinamentos

### Scripts SQL necessários (já devem estar no Supabase):
- `CRIAR_TABELAS_TREINAMENTOS.sql`
- `ATUALIZAR_COLABORADORES_EMAIL.sql`
- `ATUALIZAR_TREINAMENTOS_CAMPOS.sql`
- `ATUALIZAR_TREINAMENTOS_LOJAS.sql`
- `CORRIGIR_RLS_TREINAMENTOS.sql`

---

## ✅ VERIFICAÇÃO

Após atualizar, verifique se:
- ✅ O commit foi criado no GitHub
- ✅ O build no Vercel passou sem erros
- ✅ Os arquivos foram realmente atualizados
- ✅ As funcionalidades estão funcionando online

