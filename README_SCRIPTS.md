# 📜 Scripts de Commit e Push

## 🚀 Como Usar

### Opção 1: Script PowerShell (Recomendado)
```powershell
.\commit-e-push.ps1
```

### Opção 2: Script Batch (Windows)
```cmd
commit-e-push.bat
```

### Opção 3: Manual (Git Bash ou Terminal)
```bash
# Adicionar arquivos
git add src/pages/ReturnsManagement.jsx
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/lib/supabaseService.js
git add src/contexts/DataContext.jsx
git add src/pages/TrainingManagement.jsx
git add src/pages/Training.jsx
git add src/contexts/SupabaseAuthContext.jsx
git add src/lib/customSupabaseClient.js
git add src/components/Header.jsx

# Commit
git commit -m "feat: Adicionar funcionalidade completa de Devoluções e Falta Física"

# Push
git push origin main
```

## ⚠️ Importante

1. Execute o script na **raiz do projeto**
2. Certifique-se de que o Git está instalado e configurado
3. Tenha credenciais do GitHub configuradas
4. Após o push, aguarde alguns minutos para o Vercel fazer o build

## 📋 Arquivos que serão commitados

- ✅ `src/pages/ReturnsManagement.jsx` (NOVO)
- ✅ `src/App.jsx` (ATUALIZADO)
- ✅ `src/components/Sidebar.jsx` (ATUALIZADO)
- ✅ `src/lib/supabaseService.js` (ATUALIZADO)
- ✅ `src/contexts/DataContext.jsx` (ATUALIZADO)
- ✅ `src/pages/TrainingManagement.jsx` (ATUALIZADO)
- ✅ `src/pages/Training.jsx` (ATUALIZADO)
- ✅ `src/contexts/SupabaseAuthContext.jsx` (ATUALIZADO)
- ✅ `src/lib/customSupabaseClient.js` (ATUALIZADO)
- ✅ `src/components/Header.jsx` (ATUALIZADO)






