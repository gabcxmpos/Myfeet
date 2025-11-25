# Script PowerShell para fazer commit e push dos arquivos de Devoluções
# Execute este script na raiz do projeto

Write-Host "🚀 Iniciando commit e push dos arquivos..." -ForegroundColor Cyan

# Verificar se está no diretório correto
if (-not (Test-Path "src/pages/ReturnsManagement.jsx")) {
    Write-Host "❌ Erro: Arquivo ReturnsManagement.jsx não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verificar se git está disponível
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: Git não está instalado ou não está no PATH!" -ForegroundColor Red
    exit 1
}

# Verificar status do git
Write-Host "`n📋 Verificando status do repositório..." -ForegroundColor Cyan
git status

# Adicionar arquivos
Write-Host "`n➕ Adicionando arquivos..." -ForegroundColor Cyan

# Arquivo novo (crítico)
git add src/pages/ReturnsManagement.jsx
Write-Host "   ✓ ReturnsManagement.jsx" -ForegroundColor Green

# Arquivos atualizados
git add src/App.jsx
Write-Host "   ✓ App.jsx" -ForegroundColor Green

git add src/components/Sidebar.jsx
Write-Host "   ✓ Sidebar.jsx" -ForegroundColor Green

git add src/lib/supabaseService.js
Write-Host "   ✓ supabaseService.js" -ForegroundColor Green

git add src/contexts/DataContext.jsx
Write-Host "   ✓ DataContext.jsx" -ForegroundColor Green

git add src/pages/TrainingManagement.jsx
Write-Host "   ✓ TrainingManagement.jsx" -ForegroundColor Green

git add src/pages/Training.jsx
Write-Host "   ✓ Training.jsx" -ForegroundColor Green

git add src/contexts/SupabaseAuthContext.jsx
Write-Host "   ✓ SupabaseAuthContext.jsx" -ForegroundColor Green

git add src/lib/customSupabaseClient.js
Write-Host "   ✓ customSupabaseClient.js" -ForegroundColor Green

git add src/components/Header.jsx
Write-Host "   ✓ Header.jsx" -ForegroundColor Green

# Verificar o que será commitado
Write-Host "`n📦 Arquivos preparados para commit:" -ForegroundColor Cyan
git status --short

# Confirmar antes de fazer commit
Write-Host "`n⚠️  Deseja fazer o commit? (S/N)" -ForegroundColor Yellow
$confirma = Read-Host

if ($confirma -ne "S" -and $confirma -ne "s") {
    Write-Host "❌ Operação cancelada pelo usuário." -ForegroundColor Red
    exit 0
}

# Fazer commit
Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
$commitMessage = "feat: Adicionar funcionalidade completa de Devoluções e Falta Física

- Nova página ReturnsManagement com dashboard e filtros
- Formulários para devoluções pendentes e falta física
- Sistema de status e histórico
- Exclusão para admin
- Bloqueio de inscrições em treinamentos
- Melhorias no tratamento de sessão expirada"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao fazer commit!" -ForegroundColor Red
    exit 1
}

# Confirmar antes de fazer push
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
    Write-Host "🎉 Todos os arquivos foram enviados para o GitHub!" -ForegroundColor Green
    Write-Host "`n⏳ Aguarde alguns minutos para o Vercel fazer o build automaticamente." -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host "   Verifique sua conexão e credenciais do Git." -ForegroundColor Yellow
    exit 1
}






