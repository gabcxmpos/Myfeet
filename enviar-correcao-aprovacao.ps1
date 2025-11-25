# Script para enviar correção de aprovação de avaliações para o GitHub
# Execute este script no PowerShell

Write-Host "🚀 Enviando correção de aprovação para o GitHub..." -ForegroundColor Green
Write-Host ""

# Navegar para a pasta do projeto
$projectPath = "C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6"
Set-Location $projectPath

Write-Host "📁 Pasta do projeto: $projectPath" -ForegroundColor Cyan
Write-Host ""

# Verificar se está em um repositório Git
try {
    $gitStatus = git status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro: Não é um repositório Git ou Git não está instalado" -ForegroundColor Red
        Write-Host "💡 Use o GitHub Desktop ou instale o Git" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Erro: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "💡 Use o GitHub Desktop ou instale o Git" -ForegroundColor Yellow
    exit 1
}

# Adicionar arquivos modificados
Write-Host "📝 Adicionando arquivos modificados..." -ForegroundColor Cyan
git add src/contexts/DataContext.jsx
git add src/pages/StoresManagement.jsx

# Verificar se há mudanças para commitar
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  Nenhuma mudança detectada. Os arquivos já foram commitados?" -ForegroundColor Yellow
    exit 0
}

# Mostrar status
Write-Host ""
Write-Host "📋 Arquivos que serão enviados:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Fazer commit
Write-Host "💾 Fazendo commit..." -ForegroundColor Cyan
$commitMessage = "Corrigir erro de aprovação de avaliações - adicionar função approveEvaluation"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer commit" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
Write-Host ""

# Enviar para GitHub
Write-Host "📤 Enviando para o GitHub..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao enviar para o GitHub" -ForegroundColor Red
    Write-Host "💡 Verifique sua conexão e autenticação" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ SUCESSO! Mudanças enviadas para o GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "⏱️  O Vercel fará deploy automático em 30-60 segundos" -ForegroundColor Cyan
Write-Host "🔗 Verifique em: https://vercel.com" -ForegroundColor Cyan
Write-Host ""







