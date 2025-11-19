# Script PowerShell para atualizar GitHub com todas as correções finais
# Execute este script na raiz do projeto

Write-Host "🚀 Iniciando commit e push dos arquivos atualizados..." -ForegroundColor Cyan

# Verificar se está no diretório correto
if (-not (Test-Path "src")) {
    Write-Host "❌ Erro: Diretório src não encontrado!" -ForegroundColor Red
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

# Adicionar arquivos modificados
Write-Host "`n➕ Adicionando arquivos modificados..." -ForegroundColor Cyan

# 1. Devoluções - Checkbox "Não possui NF" + Correção SEM_NF
git add src/pages/ReturnsManagement.jsx
Write-Host "   ✓ ReturnsManagement.jsx (Checkbox 'Não possui NF' + correção SEM_NF)" -ForegroundColor Green

# 2. Supabase Service - Correção createReturn
git add src/lib/supabaseService.js
Write-Host "   ✓ supabaseService.js (Correção createReturn com SEM_NF)" -ForegroundColor Green

# 3. Header - Botão hamburger corrigido
git add src/components/Header.jsx
Write-Host "   ✓ Header.jsx (Botão hamburger corrigido)" -ForegroundColor Green

# 4. Sidebar - Agenda de treinamento para supervisores
git add src/components/Sidebar.jsx
Write-Host "   ✓ Sidebar.jsx (Agenda de treinamento para supervisores)" -ForegroundColor Green

# 5. MainLayout - Toggle da sidebar
git add src/components/MainLayout.jsx
Write-Host "   ✓ MainLayout.jsx (Toggle da sidebar corrigido)" -ForegroundColor Green

# 6. MenuVisibilitySettings - Menu de visibilidade funcional
git add src/pages/MenuVisibilitySettings.jsx
Write-Host "   ✓ MenuVisibilitySettings.jsx (Menu de visibilidade corrigido)" -ForegroundColor Green

# 7. DataContext - updateMenuVisibility melhorado
git add src/contexts/DataContext.jsx
Write-Host "   ✓ DataContext.jsx (updateMenuVisibility melhorado)" -ForegroundColor Green

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
$commitMessage = "fix: Corrigir menu de visibilidade, botão hamburger, checkbox 'Não possui NF' e erro de constraint

- Corrigido menu de visibilidade com sincronização de estado
- Adicionado checkbox 'Não possui NF' nas devoluções pendentes
- Corrigido erro de constraint NOT NULL usando 'SEM_NF' em vez de null
- Corrigido botão hamburger para abrir/fechar sidebar corretamente
- Adicionado Agenda de Treinamentos para supervisores
- Melhorado toggle da sidebar em desktop e mobile
- Melhorado updateMenuVisibility com atualização imediata de estado"

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

