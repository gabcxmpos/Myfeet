# Script para corrigir o arquivo supabaseService.js no GitHub
# O arquivo foi commitado com código JSX incorreto

Write-Host "🔧 Corrigindo arquivo supabaseService.js..." -ForegroundColor Cyan

# Verificar se o arquivo local está correto (não deve ter JSX)
Write-Host "`n📋 Verificando arquivo local..." -ForegroundColor Cyan
$hasJSX = Select-String -Path src/lib/supabaseService.js -Pattern "DataContext.Provider|return <" -Quiet

if ($hasJSX) {
    Write-Host "❌ ERRO: Arquivo local contém JSX!" -ForegroundColor Red
    Write-Host "   O arquivo supabaseService.js não deve conter JSX." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Arquivo local está correto (sem JSX)" -ForegroundColor Green
}

# Verificar primeira linha
$firstLine = Get-Content src/lib/supabaseService.js -Head 1
if ($firstLine -match "^import.*supabase") {
    Write-Host "✅ Primeira linha correta: $firstLine" -ForegroundColor Green
} else {
    Write-Host "⚠️  Primeira linha pode estar incorreta: $firstLine" -ForegroundColor Yellow
}

# Verificar última linha
$lastLine = Get-Content src/lib/supabaseService.js -Tail 1
Write-Host "📄 Última linha: $lastLine" -ForegroundColor Cyan

# Contar linhas
$lineCount = (Get-Content src/lib/supabaseService.js | Measure-Object -Line).Lines
Write-Host "📊 Total de linhas: $lineCount" -ForegroundColor Cyan

# Forçar adicionar o arquivo
Write-Host "`n➕ Adicionando arquivo correto..." -ForegroundColor Cyan
git add -f src/lib/supabaseService.js

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
git commit -m "fix: Corrigir supabaseService.js removendo código JSX incorreto"

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






