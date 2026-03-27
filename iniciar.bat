@echo off
title Iniciar Projeto - Grafos Rede Social

echo ===================================================
echo   Iniciando Configuracao do Projeto...
echo ===================================================
echo.

:: Verifica se o Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! 
    echo Por favor, instale o Node.js para rodar este projeto.
    echo Baixe em: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] Node.js encontrado. 
echo.
echo ===================================================
echo   Instalando dependencias (isso pode demorar um pouco)...
echo ===================================================
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Ocorreu um problema ao instalar as dependencias.
    pause
    exit /b
)

echo.
echo [OK] Dependencias instaladas com sucesso!
echo.
echo ===================================================
echo   Verificando Banco de Dados...
echo ===================================================
if not exist database.sqlite (
    echo Criando banco de dados com usuarios de teste...
    call npm run seed
) else (
    echo [OK] Banco de dados ja existe.
)

echo.
echo ===================================================
echo   Iniciando o servidor e a aplicacao...
echo ===================================================
call npm run dev

pause
