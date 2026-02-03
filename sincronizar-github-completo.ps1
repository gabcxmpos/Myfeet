# Script completo para sincronizar projeto local com GitHub
# Repositório: https://github.com/gabcxmpos/Myfeet

Write-Host "🔍 Verificando projeto no GitHub e sincronizando..." -ForegroundColor Cyan

$repoUrl = "https://github.com/gabcxmpos/Myfeet"
$zipUrl = "$repoUrl/archive/refs/heads/main.zip"
$tempZip = "$env:TEMP\myfeet-github-sync.zip"
$tempExtract = "$env:TEMP\myfeet-github-sync"
$backupDir = "backup-local-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Arquivos/pastas que devem ser preservados localmente
$preserveLocal = @(
    "node_modules",
    ".env",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local",
    "dist",
    "build",
    ".git"
)

function Get-FileHash {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $hash = Get-FileHash -Path $FilePath -Algorithm MD5
        return $hash.Hash
    }
    return $null
}

function Compare-Files {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )
    
    $localHash = Get-FileHash -FilePath $LocalFile
    $remoteHash = Get-FileHash -FilePath $RemoteFile
    
    if ($null -eq $localHash -and $null -eq $remoteHash) { return "both-missing" }
    if ($null -eq $localHash) { return "local-missing" }
    if ($null -eq $remoteHash) { return "remote-missing" }
    if ($localHash -eq $remoteHash) { return "same" }
    return "different"
}

try {
    # Criar backup completo
    Write-Host "`n📦 Criando backup completo do projeto local..." -ForegroundColor Yellow
    if (Test-Path "src" -or Test-Path "package.json") {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        $itemsToBackup = @("src", "public", "index.html", "package.json", "vite.config.js", "tailwind.config.js", "postcss.config.js", ".gitignore", "README.md")
        foreach ($item in $itemsToBackup) {
            if (Test-Path $item) {
                Copy-Item -Path $item -Destination "$backupDir\$item" -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "✅ Backup criado em: $backupDir" -ForegroundColor Green
    }
    
    # Baixar código do GitHub
    Write-Host "`n⬇️  Baixando código completo do GitHub..." -ForegroundColor Yellow
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $zipUrl -OutFile $tempZip -UseBasicParsing
    
    if (-not (Test-Path $tempZip)) {
        throw "Falha ao baixar arquivo do GitHub"
    }
    
    Write-Host "✅ Download concluído" -ForegroundColor Green
    
    # Extrair ZIP
    Write-Host "`n📂 Extraindo arquivos do GitHub..." -ForegroundColor Yellow
    if (Test-Path $tempExtract) {
        Remove-Item -Path $tempExtract -Recurse -Force
    }
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    
    # Encontrar pasta extraída (geralmente Myfeet-main)
    $extractedFolder = Get-ChildItem -Path $tempExtract -Directory | Select-Object -First 1
    
    if (-not $extractedFolder) {
        throw "Não foi possível encontrar pasta extraída"
    }
    
    Write-Host "✅ Arquivos extraídos de: $($extractedFolder.Name)" -ForegroundColor Green
    
    # Listar estrutura do GitHub
    Write-Host "`n📋 Estrutura do projeto no GitHub:" -ForegroundColor Cyan
    Get-ChildItem -Path $extractedFolder.FullName -Recurse -File | 
        Select-Object -First 50 | 
        ForEach-Object { 
            $relativePath = $_.FullName.Replace($extractedFolder.FullName, "").TrimStart('\')
            Write-Host "  📄 $relativePath" -ForegroundColor Gray
        }
    
    # Processar arquivos e pastas
    Write-Host "`n🔄 Sincronizando arquivos..." -ForegroundColor Yellow
    
    $itemsToSync = Get-ChildItem -Path $extractedFolder.FullName -Recurse | 
        Where-Object { 
            $relativePath = $_.FullName.Replace($extractedFolder.FullName, "").TrimStart('\')
            $shouldPreserve = $false
            foreach ($preserve in $preserveLocal) {
                if ($relativePath -like "$preserve*" -or $relativePath -like "*\$preserve\*" -or $relativePath -like "*\$preserve") {
                    $shouldPreserve = $true
                    break
                }
            }
            return -not $shouldPreserve
        }
    
    $updated = 0
    $created = 0
    $skipped = 0
    
    foreach ($item in $itemsToSync) {
        $relativePath = $item.FullName.Replace($extractedFolder.FullName, "").TrimStart('\')
        $localPath = Join-Path (Get-Location) $relativePath
        
        # Pular se está na lista de preservar
        $shouldSkip = $false
        foreach ($preserve in $preserveLocal) {
            if ($relativePath -like "$preserve*" -or $relativePath -like "*\$preserve\*") {
                $shouldSkip = $true
                break
            }
        }
        
        if ($shouldSkip) {
            $skipped++
            continue
        }
        
        try {
            if ($item.PSIsContainer) {
                # É uma pasta
                if (-not (Test-Path $localPath)) {
                    New-Item -ItemType Directory -Path $localPath -Force | Out-Null
                    Write-Host "  ✅ Criada pasta: $relativePath" -ForegroundColor Green
                    $created++
                }
            } else {
                # É um arquivo
                $parentDir = Split-Path -Path $localPath -Parent
                if (-not (Test-Path $parentDir)) {
                    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
                }
                
                $comparison = Compare-Files -LocalFile $localPath -RemoteFile $item.FullName
                
                if ($comparison -eq "local-missing" -or $comparison -eq "different") {
                    Copy-Item -Path $item.FullName -Destination $localPath -Force
                    if ($comparison -eq "local-missing") {
                        Write-Host "  ➕ Criado: $relativePath" -ForegroundColor Green
                        $created++
                    } else {
                        Write-Host "  🔄 Atualizado: $relativePath" -ForegroundColor Yellow
                        $updated++
                    }
                } elseif ($comparison -eq "same") {
                    # Arquivo já está atualizado
                    $skipped++
                }
            }
        } catch {
            Write-Host "  ⚠️  Erro ao processar $relativePath : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n📊 Resumo da sincronização:" -ForegroundColor Cyan
    Write-Host "  ➕ Arquivos criados: $created" -ForegroundColor Green
    Write-Host "  🔄 Arquivos atualizados: $updated" -ForegroundColor Yellow
    Write-Host "  ⏭️  Arquivos ignorados (iguais/preservados): $skipped" -ForegroundColor Gray
    Write-Host "  📦 Backup salvo em: $backupDir" -ForegroundColor Cyan
    
    Write-Host "`n✅ Sincronização concluída!" -ForegroundColor Green
    Write-Host "`n⚠️  PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "  1. Execute 'npm install' para atualizar dependências" -ForegroundColor White
    Write-Host "  2. Verifique se há conflitos nos arquivos" -ForegroundColor White
    Write-Host "  3. Teste a aplicação com 'npm run dev'" -ForegroundColor White
    Write-Host "  4. Se algo der errado, restaure do backup em: $backupDir" -ForegroundColor White
    
    # Limpar arquivos temporários
    Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "`n❌ Erro durante sincronização: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Alternativa manual:" -ForegroundColor Yellow
    Write-Host "  1. Instale Git: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "  2. Execute os comandos:" -ForegroundColor White
    Write-Host "     git init" -ForegroundColor Gray
    Write-Host "     git remote add origin https://github.com/gabcxmpos/Myfeet.git" -ForegroundColor Gray
    Write-Host "     git fetch origin" -ForegroundColor Gray
    Write-Host "     git reset --hard origin/main" -ForegroundColor Gray
    exit 1
}

Write-Host "`n✨ Processo finalizado!" -ForegroundColor Green

