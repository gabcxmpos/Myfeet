@echo off
REM Script Batch para fazer commit e push dos arquivos de Devoluções
REM Execute este script na raiz do projeto

echo.
echo ========================================
echo  COMMIT E PUSH - DEVOLUCOES
echo ========================================
echo.

REM Verificar se está no diretório correto
if not exist "src\pages\ReturnsManagement.jsx" (
    echo [ERRO] Arquivo ReturnsManagement.jsx nao encontrado!
    echo Certifique-se de estar na raiz do projeto.
    pause
    exit /b 1
)

echo [INFO] Verificando status do repositorio...
git status
echo.

echo [INFO] Adicionando arquivos...
git add src/pages/ReturnsManagement.jsx
echo   [OK] ReturnsManagement.jsx

git add src/App.jsx
echo   [OK] App.jsx

git add src/components/Sidebar.jsx
echo   [OK] Sidebar.jsx

git add src/lib/supabaseService.js
echo   [OK] supabaseService.js

git add src/contexts/DataContext.jsx
echo   [OK] DataContext.jsx

git add src/pages/TrainingManagement.jsx
echo   [OK] TrainingManagement.jsx

git add src/pages/Training.jsx
echo   [OK] Training.jsx

git add src/contexts/SupabaseAuthContext.jsx
echo   [OK] SupabaseAuthContext.jsx

git add src/lib/customSupabaseClient.js
echo   [OK] customSupabaseClient.js

git add src/components/Header.jsx
echo   [OK] Header.jsx

echo.
echo [INFO] Arquivos preparados para commit:
git status --short
echo.

set /p confirma="Deseja fazer o commit? (S/N): "
if /i not "%confirma%"=="S" (
    echo [INFO] Operacao cancelada pelo usuario.
    pause
    exit /b 0
)

echo.
echo [INFO] Fazendo commit...
git commit -m "feat: Adicionar funcionalidade completa de Devoluções e Falta Física" -m "- Nova página ReturnsManagement com dashboard e filtros" -m "- Formulários para devoluções pendentes e falta física" -m "- Sistema de status e histórico" -m "- Exclusão para admin" -m "- Bloqueio de inscrições em treinamentos" -m "- Melhorias no tratamento de sessão expirada"

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Erro ao fazer commit!
    pause
    exit /b 1
)

echo [OK] Commit realizado com sucesso!
echo.

set /p confirmaPush="Deseja fazer push para o repositorio remoto? (S/N): "
if /i not "%confirmaPush%"=="S" (
    echo [INFO] Commit realizado, mas push nao foi executado.
    echo Execute 'git push origin main' manualmente quando estiver pronto.
    pause
    exit /b 0
)

echo.
echo [INFO] Fazendo push para origin/main...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Erro ao fazer push!
    echo Verifique sua conexao e credenciais do Git.
    pause
    exit /b 1
)

echo.
echo [OK] Push realizado com sucesso!
echo [OK] Todos os arquivos foram enviados para o GitHub!
echo.
echo [INFO] Aguarde alguns minutos para o Vercel fazer o build automaticamente.
echo.
pause






