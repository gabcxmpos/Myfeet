# Script para atualizar arquivos no GitHub
# Atualiza os componentes de filtro corrigidos

Write-Host "Atualizando arquivos no GitHub..." -ForegroundColor Cyan

# Verificar se o Git esta disponivel
$gitPath = Get-Command git -ErrorAction SilentlyContinue

if (-not $gitPath) {
    Write-Host "ERRO: Git nao encontrado no PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, use uma das opcoes:" -ForegroundColor Yellow
    Write-Host "1. GitHub Desktop: Abra o app e faca commit + push" -ForegroundColor Yellow
    Write-Host "2. GitHub Web: Faca upload manual dos arquivos" -ForegroundColor Yellow
    Write-Host "3. Instale o Git e adicione ao PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Arquivos que precisam ser atualizados:" -ForegroundColor Cyan
    Write-Host "  - src/components/MultiSelectFilter.jsx" -ForegroundColor White
    Write-Host "  - src/components/StoreMultiSelect.jsx" -ForegroundColor White
    exit 1
}

# Verificar status
Write-Host "Verificando status do repositorio..." -ForegroundColor Cyan
git status

# Adicionar arquivos modificados
Write-Host ""
Write-Host "Adicionando arquivos modificados..." -ForegroundColor Cyan
git add src/components/MultiSelectFilter.jsx
git add src/components/StoreMultiSelect.jsx

# Verificar se ha mudancas para commitar
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "Nenhuma mudanca para commitar." -ForegroundColor Green
    exit 0
}

# Fazer commit
Write-Host ""
Write-Host "Fazendo commit..." -ForegroundColor Cyan
$commitMessage = "fix: Corrigir selecao de filtros e lojas destinatarias usando checkboxes reais`n`n- Reescrever MultiSelectFilter com checkboxes reais`n- Reescrever StoreMultiSelect com checkboxes reais`n- Corrigir selecao com mouse e teclado`n- Melhorar experiencia de uso dos filtros"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit realizado com sucesso!" -ForegroundColor Green
    
    # Fazer push
    Write-Host ""
    Write-Host "Enviando para o GitHub..." -ForegroundColor Cyan
    git push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Atualizacao concluida com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERRO: Erro ao fazer push. Verifique sua conexao e credenciais." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "ERRO: Erro ao fazer commit." -ForegroundColor Red
}
