# Script para corrigir o arquivo ReturnsManagement.jsx no GitHub
# O arquivo foi commitado com conteúdo errado (Markdown em vez de JS)

Write-Host "🔧 Corrigindo arquivo ReturnsManagement.jsx..." -ForegroundColor Cyan

# Verificar se o arquivo local está correto
Write-Host "`n📋 Verificando arquivo local..." -ForegroundColor Cyan
$firstLine = Get-Content src/pages/ReturnsManagement.jsx -Head 1

if ($firstLine -match "^import React") {
    Write-Host "✅ Arquivo local está correto (começa com 'import React')" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Arquivo local não começa com 'import React'!" -ForegroundColor Red
    Write-Host "   Primeira linha: $firstLine" -ForegroundColor Yellow
    exit 1
}

# Forçar adicionar o arquivo
Write-Host "`n➕ Adicionando arquivo correto..." -ForegroundColor Cyan
git add -f src/pages/ReturnsManagement.jsx

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Arquivo adicionado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao adicionar arquivo!" -ForegroundColor Red
    exit 1
}

# Verificar status
Write-Host "`n📦 Status do repositório:" -ForegroundColor Cyan
git status --short

# Confirmar commit
Write-Host "`n⚠️  Deseja fazer o commit? (S/N)" -ForegroundColor Yellow
$confirma = Read-Host

if ($confirma -ne "S" -and $confirma -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

# Fazer commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
git commit -m "fix: Corrigir conteúdo do arquivo ReturnsManagement.jsx (substituir Markdown por código JS)"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer commit!" -ForegroundColor Red
    exit 1
}

# Confirmar push
Write-Host "`n⚠️  Deseja fazer push para o repositório remoto? (S/N)" -ForegroundColor Yellow
$confirmaPush = Read-Host

if ($confirmaPush -ne "S" -and $confirmaPush -ne "s") {
    Write-Host "ℹ️  Commit realizado, mas push não foi executado." -ForegroundColor Yellow
    Write-Host "   Execute 'git push origin main' manualmente quando estiver pronto." -ForegroundColor Yellow
    exit 0
}

# Fazer push
Write-Host "`n🚀 Fazendo push para origin/main..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Push realizado com sucesso!" -ForegroundColor Green
    Write-Host "🎉 Arquivo corrigido no GitHub!" -ForegroundColor Green
    Write-Host "`n⏳ Aguarde alguns minutos para o Vercel fazer o build automaticamente." -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host "   Verifique sua conexão e credenciais do Git." -ForegroundColor Yellow
    exit 1
}






