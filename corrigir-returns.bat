@echo off
REM Script para corrigir o arquivo ReturnsManagement.jsx no GitHub

echo.
echo ========================================
echo  CORRIGIR ReturnsManagement.jsx
echo ========================================
echo.

echo [INFO] Verificando arquivo local...
powershell -Command "Get-Content src/pages/ReturnsManagement.jsx -Head 1" > temp_first_line.txt
set /p firstLine=<temp_first_line.txt
del temp_first_line.txt

echo Primeira linha: %firstLine%
echo.

if "%firstLine:~0,11%"=="import React" (
    echo [OK] Arquivo local esta correto!
) else (
    echo [ERRO] Arquivo local nao comeca com 'import React'!
    pause
    exit /b 1
)

echo.
echo [INFO] Adicionando arquivo correto...
git add -f src/pages/ReturnsManagement.jsx

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Erro ao adicionar arquivo!
    pause
    exit /b 1
)

echo [OK] Arquivo adicionado com sucesso!
echo.

echo [INFO] Status do repositorio:
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
git commit -m "fix: Corrigir conteudo do arquivo ReturnsManagement.jsx (substituir Markdown por codigo JS)"

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
echo [OK] Arquivo corrigido no GitHub!
echo.
echo [INFO] Aguarde alguns minutos para o Vercel fazer o build automaticamente.
echo.
pause






