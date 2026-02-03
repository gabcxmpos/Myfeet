$repoUrl = "https://github.com/gabcxmpos/Myfeet/archive/main.zip"
$zipFile = "github-repo.zip"
$extractPath = "Myfeet-main"

Write-Host "Baixando repositorio do GitHub..."
try {
    Invoke-WebRequest -Uri $repoUrl -OutFile $zipFile -ErrorAction Stop
    Write-Host "Download concluido."
} catch {
    Write-Host "Erro ao baixar: $($_.Exception.Message)"
    exit 1
}

Write-Host "Extraindo arquivos..."
try {
    Expand-Archive -Path $zipFile -DestinationPath . -Force
    Write-Host "Extracao concluida."
} catch {
    Write-Host "Erro ao extrair: $($_.Exception.Message)"
    exit 1
}

Write-Host "Repositorio baixado em: $extractPath"
Write-Host "Agora vamos comparar os arquivos..."

