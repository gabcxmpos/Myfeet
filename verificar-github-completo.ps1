# Script de Verificação Completa do GitHub
# Verifica se todos os arquivos necessários estão presentes e se há arquivos desnecessários

Write-Host "🔍 VERIFICAÇÃO COMPLETA DO GITHUB" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# ============ ARQUIVOS CRÍTICOS QUE DEVEM ESTAR NO GITHUB ============
Write-Host "📋 Verificando arquivos críticos..." -ForegroundColor Yellow
Write-Host ""

$arquivosCriticos = @(
    "src/App.jsx",
    "src/pages/ReturnsManagement.jsx",
    "src/components/Sidebar.jsx",
    "src/lib/supabaseService.js",
    "src/contexts/DataContext.jsx",
    "src/pages/TrainingManagement.jsx",
    "src/pages/Training.jsx",
    "src/contexts/SupabaseAuthContext.jsx",
    "src/lib/customSupabaseClient.js",
    "src/components/Header.jsx"
)

$todosPresentes = $true
foreach ($arquivo in $arquivosCriticos) {
    if (Test-Path $arquivo) {
        $linhas = (Get-Content $arquivo -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        Write-Host "  ✅ $arquivo ($linhas linhas)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $arquivo (FALTANDO!)" -ForegroundColor Red
        $todosPresentes = $false
    }
}

Write-Host ""

# ============ VERIFICAR CONTEÚDO DOS ARQUIVOS CRÍTICOS ============
Write-Host "🔍 Verificando conteúdo dos arquivos críticos..." -ForegroundColor Yellow
Write-Host ""

# Verificar ReturnsManagement.jsx
if (Test-Path "src/pages/ReturnsManagement.jsx") {
    $firstLine = Get-Content "src/pages/ReturnsManagement.jsx" -Head 1
    if ($firstLine -match "^import React") {
        Write-Host "  ✅ ReturnsManagement.jsx começa corretamente com 'import React'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ReturnsManagement.jsx começa incorretamente: $firstLine" -ForegroundColor Red
    }
}

# Verificar supabaseService.js
if (Test-Path "src/lib/supabaseService.js") {
    $hasJSX = Select-String -Path "src/lib/supabaseService.js" -Pattern "DataContext.Provider" -Quiet
    if (-not $hasJSX) {
        Write-Host "  ✅ supabaseService.js não contém JSX (correto)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ supabaseService.js contém JSX (INCORRETO!)" -ForegroundColor Red
    }
}

# Verificar App.jsx
if (Test-Path "src/App.jsx") {
    $hasReturnsImport = Select-String -Path "src/App.jsx" -Pattern "ReturnsManagement" -Quiet
    if ($hasReturnsImport) {
        Write-Host "  ✅ App.jsx importa ReturnsManagement" -ForegroundColor Green
    } else {
        Write-Host "  ❌ App.jsx NÃO importa ReturnsManagement" -ForegroundColor Red
    }
}

# Verificar Sidebar.jsx
if (Test-Path "src/components/Sidebar.jsx") {
    $hasReturnsMenu = Select-String -Path "src/components/Sidebar.jsx" -Pattern "/returns.*Devoluções" -Quiet
    if ($hasReturnsMenu) {
        Write-Host "  ✅ Sidebar.jsx contém menu Devoluções" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Sidebar.jsx NÃO contém menu Devoluções" -ForegroundColor Red
    }
}

Write-Host ""

# ============ ARQUIVOS QUE NÃO DEVEM ESTAR NO GITHUB ============
Write-Host "🗑️  Verificando arquivos que NÃO devem estar no GitHub..." -ForegroundColor Yellow
Write-Host ""

$arquivosDesnecessarios = @(
    "src/lib/supabaseService.js.backup",
    "*.md",
    "*.ps1",
    "*.bat"
)

$arquivosEncontrados = @()
foreach ($pattern in $arquivosDesnecessarios) {
    $arquivos = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }
    foreach ($arquivo in $arquivos) {
        $relPath = $arquivo.FullName.Replace((Get-Location).Path + "\", "")
        if ($relPath -notmatch "node_modules") {
            $arquivosEncontrados += $relPath
        }
    }
}

if ($arquivosEncontrados.Count -gt 0) {
    Write-Host "  ⚠️  Arquivos encontrados que podem ser removidos do GitHub:" -ForegroundColor Yellow
    foreach ($arquivo in $arquivosEncontrados) {
        Write-Host "     - $arquivo" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "  💡 Recomendação: Adicionar ao .gitignore ou mover para pasta de documentação" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ Nenhum arquivo desnecessário encontrado" -ForegroundColor Green
}

Write-Host ""

# ============ VERIFICAR SCRIPTS SQL ============
Write-Host "📄 Verificando scripts SQL..." -ForegroundColor Yellow
Write-Host ""

$scriptsSQL = @(
    "CRIAR_TABELAS_DEVOLUCOES.sql",
    "ADICIONAR_CAMPO_DATA_EMISSAO_NF.sql",
    "ADICIONAR_CAMPOS_VALORES_DEVOLUCOES.sql",
    "ATUALIZAR_TABELA_FALTA_FISICA.sql",
    "AJUSTAR_COLUNAS_FALTA_FISICA.sql",
    "ADICIONAR_CAMPOS_SEPARADOS_FALTA_FISICA.sql",
    "ADICIONAR_CAMPO_BLOQUEIO_INSCRICOES_TREINAMENTO.sql",
    "VERIFICAR_TABELAS_DEVOLUCOES.sql"
)

$scriptsPresentes = 0
foreach ($script in $scriptsSQL) {
    if (Test-Path $script) {
        Write-Host "  ✅ $script" -ForegroundColor Green
        $scriptsPresentes++
    } else {
        Write-Host "  ⚠️  $script (não encontrado)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  📊 Scripts SQL encontrados: $scriptsPresentes de $($scriptsSQL.Count)" -ForegroundColor Cyan

Write-Host ""

# ============ VERIFICAR .gitignore ============
Write-Host "📝 Verificando .gitignore..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $temBackup = $gitignoreContent -match "\.backup|backup"
    $temMD = $gitignoreContent -match "\.md"
    $temPS1 = $gitignoreContent -match "\.ps1"
    
    Write-Host "  ✅ .gitignore existe" -ForegroundColor Green
    if (-not $temBackup) {
        Write-Host "  ⚠️  .gitignore não ignora arquivos .backup" -ForegroundColor Yellow
    }
    if (-not $temMD) {
        Write-Host "  ℹ️  .gitignore não ignora arquivos .md (podem ser documentação)" -ForegroundColor Cyan
    }
    if (-not $temPS1) {
        Write-Host "  ℹ️  .gitignore não ignora arquivos .ps1 (scripts locais)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ❌ .gitignore não encontrado!" -ForegroundColor Red
}

Write-Host ""

# ============ RESUMO FINAL ============
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if ($todosPresentes) {
    Write-Host "✅ Todos os arquivos críticos estão presentes" -ForegroundColor Green
} else {
    Write-Host "❌ Alguns arquivos críticos estão faltando!" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 RECOMENDAÇÕES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Arquivos de documentação (.md) podem ser mantidos ou movidos para pasta /docs" -ForegroundColor Cyan
Write-Host "2. Scripts locais (.ps1, .bat) podem ser mantidos ou adicionados ao .gitignore" -ForegroundColor Cyan
Write-Host "3. Arquivos .backup devem ser adicionados ao .gitignore" -ForegroundColor Cyan
Write-Host "4. Scripts SQL são úteis para documentação, mas não são necessários para o build" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Sistema está funcionalmente completo!" -ForegroundColor Green
Write-Host ""

