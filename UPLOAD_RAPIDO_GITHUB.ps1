# Script PowerShell para criar ZIP rapidamente
# Execute: powershell -ExecutionPolicy Bypass -File UPLOAD_RAPIDO_GITHUB.ps1

$sourcePath = "C:\PROJETOS OP\MYFEET\horizons-export-2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$zipPath = "backup-myfeet-$timestamp.zip"

Write-Host "📦 Criando ZIP do projeto..." -ForegroundColor Cyan
Write-Host "Origem: $sourcePath" -ForegroundColor Gray
Write-Host "Destino: $zipPath" -ForegroundColor Gray
Write-Host ""

# Excluir node_modules e dist para diminuir tamanho
$excludeFolders = @('node_modules', 'dist', '.git')

Get-ChildItem -Path $sourcePath -Recurse -File | 
    Where-Object { 
        $folder = Split-Path $_.FullName -Parent
        $excludeFolders | ForEach-Object {
            if ($folder -like "*\$_*") { return $false }
        }
        return $true
    } | 
    Compress-Archive -DestinationPath $zipPath -CompressionLevel Optimal -Force

Write-Host "✅ ZIP criado com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo: $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "📤 Próximo passo:" -ForegroundColor Cyan
Write-Host "   1. Acesse: https://github.com/gabcxmpos/Myfeet" -ForegroundColor White
Write-Host "   2. Clique em 'uploading an existing file'" -ForegroundColor White
Write-Host "   3. Arraste o arquivo: $zipPath" -ForegroundColor White
Write-Host "   4. Commit changes" -ForegroundColor White
Write-Host ""

# Abrir pasta com ZIP
if (Test-Path $zipPath) {
    $zipFullPath = Resolve-Path $zipPath
    Start-Process "explorer.exe" -ArgumentList "/select,$zipFullPath"
    Write-Host "📂 Pasta aberta! O arquivo ZIP está selecionado." -ForegroundColor Green
}

