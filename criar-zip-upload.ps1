# Script para criar ZIP do projeto para upload no GitHub

$sourcePath = Get-Location
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$zipPath = Join-Path (Split-Path $sourcePath -Parent) "myfeet-backup-$timestamp.zip"

Write-Host "📦 Criando ZIP do projeto..." -ForegroundColor Cyan
Write-Host "Origem: $sourcePath" -ForegroundColor Gray
Write-Host "Destino: $zipPath" -ForegroundColor Gray
Write-Host ""

# Excluir node_modules, dist e .git para diminuir tamanho
$excludeFolders = @('node_modules', 'dist', '.git')

# Obter todos os arquivos, excluindo pastas especificadas
Get-ChildItem -Path $sourcePath -Recurse -File | 
    Where-Object { 
        $filePath = $_.FullName
        $shouldExclude = $false
        foreach ($folder in $excludeFolders) {
            if ($filePath -like "*\$folder\*") {
                $shouldExclude = $true
                break
            }
        }
        -not $shouldExclude
    } | 
    Compress-Archive -DestinationPath $zipPath -CompressionLevel Optimal -Force

Write-Host "✅ ZIP criado com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo: $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "📤 Próximo passo:" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://github.com/gabcxmpos/Myfeet" -ForegroundColor White
Write-Host "   2. Clique em 'uploading an existing file' ou 'Add file' > 'Upload files'" -ForegroundColor White
Write-Host "   3. Arraste ou selecione o arquivo ZIP criado" -ForegroundColor White
Write-Host "   4. Aguarde o upload" -ForegroundColor White
Write-Host "   5. Scroll down e clique em 'Commit changes'" -ForegroundColor White
Write-Host ""

# Abrir pasta com ZIP
if (Test-Path $zipPath) {
    $zipFullPath = Resolve-Path $zipPath
    Start-Process "explorer.exe" -ArgumentList "/select,$zipFullPath"
    Write-Host "📂 Pasta aberta! O arquivo ZIP está selecionado." -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Dica: Você pode arrastar o arquivo ZIP direto para o GitHub!" -ForegroundColor Cyan
}










