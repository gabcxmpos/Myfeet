@echo off
REM Script Batch para atualizar GitHub com as correções atuais
REM Execute este script na raiz do projeto

echo.
echo ========================================
echo  ATUALIZAR GITHUB - CORRECOES ATUAIS
echo ========================================
echo.

REM Verificar se está no diretório correto
if not exist "src" (
    echo [ERRO] Diretorio src nao encontrado!
    echo Certifique-se de estar na raiz do projeto.
    pause
    exit /b 1
)

echo [INFO] Verificando status do repositorio...
git status
echo.

echo [INFO] Adicionando arquivos modificados...
echo.

REM 1. Devoluções - Checkbox "Não possui NF"
git add src/pages/ReturnsManagement.jsx
echo   [OK] ReturnsManagement.jsx (Checkbox 'Nao possui NF')

REM 2. Header - Botão hamburger corrigido
git add src/components/Header.jsx
echo   [OK] Header.jsx (Botao hamburger corrigido)

REM 3. Sidebar - Agenda de treinamento para supervisores
git add src/components/Sidebar.jsx
echo   [OK] Sidebar.jsx (Agenda de treinamento para supervisores)

REM 4. MainLayout - Toggle da sidebar
git add src/components/MainLayout.jsx
echo   [OK] MainLayout.jsx (Toggle da sidebar corrigido)

REM 5. MenuVisibilitySettings - Menu de visibilidade funcional
git add src/pages/MenuVisibilitySettings.jsx
echo   [OK] MenuVisibilitySettings.jsx (Menu de visibilidade corrigido)

REM 6. DataContext - updateMenuVisibility melhorado
git add src/contexts/DataContext.jsx
echo   [OK] DataContext.jsx (updateMenuVisibility melhorado)

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
git commit -m "fix: Corrigir menu de visibilidade, botao hamburger e adicionar checkbox 'Nao possui NF'" -m "- Corrigido menu de visibilidade com sincronizacao de estado" -m "- Adicionado checkbox 'Nao possui NF' nas devolucoes pendentes" -m "- Corrigido botao hamburger para abrir/fechar sidebar corretamente" -m "- Adicionado Agenda de Treinamentos para supervisores" -m "- Melhorado toggle da sidebar em desktop e mobile" -m "- Melhorado updateMenuVisibility com atualizacao imediata de estado"

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





