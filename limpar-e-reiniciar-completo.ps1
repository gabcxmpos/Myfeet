# Script para limpar cache e reiniciar servidor Vite
Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow

# Parar processos Node relacionados ao Vite
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Limpar cache do Vite
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Cache do Vite removido" -ForegroundColor Green
}

# Limpar dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Pasta dist removida" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "Aguarde alguns segundos para o servidor iniciar..." -ForegroundColor Yellow
Write-Host ""

# Iniciar servidor
npm run dev










