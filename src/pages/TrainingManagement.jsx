# Script completo para atualizar todos os arquivos no GitHub
# Inclui: Filtros corrigidos + Funcionalidade completa de Treinamentos

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ATUALIZACAO COMPLETA PARA GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Git esta disponivel
$gitPath = Get-Command git -ErrorAction SilentlyContinue

if (-not $gitPath) {
    Write-Host "ERRO: Git nao encontrado no PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "ARQUIVOS QUE PRECISAM SER ATUALIZADOS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "=== FILTROS CORRIGIDOS ===" -ForegroundColor Cyan
    Write-Host "  - src/components/MultiSelectFilter.jsx" -ForegroundColor White
    Write-Host "  - src/components/StoreMultiSelect.jsx" -ForegroundColor White
    Write-Host ""
    Write-Host "=== FUNCIONALIDADE DE TREINAMENTOS ===" -ForegroundColor Cyan
    Write-Host "  - src/pages/TrainingManagement.jsx" -ForegroundColor White
    Write-Host "  - src/pages/Training.jsx" -ForegroundColor White
    Write-Host "  - src/contexts/DataContext.jsx" -ForegroundColor White
    Write-Host "  - src/lib/supabaseService.js" -ForegroundColor White
    Write-Host "  - src/App.jsx" -ForegroundColor White
    Write-Host "  - src/components/Sidebar.jsx" -ForegroundColor White
    Write-Host "  - src/pages/Collaborators.jsx" -ForegroundColor White
    Write-Host ""
    Write-Host "Use GitHub Desktop ou GitHub Web para fazer upload." -ForegroundColor Yellow
    exit 1
}

# Verificar status
Write-Host "Verificando status do repositorio..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Adicionando todos os arquivos modificados..." -ForegroundColor Cyan

# Arquivos de filtros corrigidos
git add src/components/MultiSelectFilter.jsx
git add src/components/StoreMultiSelect.jsx

# Arquivos de treinamentos
git add src/pages/TrainingManagement.jsx
git add src/pages/Training.jsx
git add src/contexts/DataContext.jsx
git add src/lib/supabaseService.js
git add src/App.jsx
git add src/components/Sidebar.jsx
git add src/pages/Collaborators.jsx

# Verificar se ha mudancas para commitar
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Nenhuma mudanca para commitar." -ForegroundColor Green
    exit 0
}

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Cyan
$commitMessage = "feat: Corrigir filtros e adicionar funcionalidade completa de treinamentos`n`nFiltros:`n- Reescrever MultiSelectFilter com checkboxes reais`n- Reescrever StoreMultiSelect com checkboxes reais`n- Corrigir selecao com mouse e teclado`n- Melhorar experiencia de uso dos filtros`n`nTreinamentos:`n- Adicionar pagina TrainingManagement para admin`n- Adicionar pagina Training para lojas`n- Adicionar campos CPF e email em colaboradores`n- Adicionar funcionalidade de inscricao em treinamentos`n- Adicionar dashboard de treinamentos`n- Adicionar exportacao Excel de inscritos`n- Adicionar controle de presenca`n- Integrar com DataContext e Supabase"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit realizado com sucesso!" -ForegroundColor Green
    
    # Fazer push
    Write-Host ""
    Write-Host "Enviando para o GitHub..." -ForegroundColor Cyan
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "ATUALIZACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Arquivos atualizados:" -ForegroundColor Cyan
        Write-Host "  - Filtros corrigidos (MultiSelectFilter, StoreMultiSelect)" -ForegroundColor White
        Write-Host "  - Funcionalidade completa de treinamentos" -ForegroundColor White
        Write-Host ""
        Write-Host "O Vercel vai fazer deploy automaticamente em alguns minutos." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERRO: Erro ao fazer push. Verifique sua conexao e credenciais." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "ERRO: Erro ao fazer commit." -ForegroundColor Red
}

