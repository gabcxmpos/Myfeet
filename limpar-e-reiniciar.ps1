# Script para limpar cache e reiniciar servidor

Write-Host "🧹 Limpando cache do Vite..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Write-Host "✅ Cache limpo!" -ForegroundColor Green

Write-Host "`n🔄 Para reiniciar o servidor, execute:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`n📋 Verificações necessárias:" -ForegroundColor Yellow
Write-Host "   1. Limpar cache do navegador (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   2. Recarregar página com Ctrl+F5" -ForegroundColor White
Write-Host "   3. Verificar console (F12) para logs" -ForegroundColor White










