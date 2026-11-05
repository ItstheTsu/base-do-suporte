@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Base do Suporte - preparar e iniciar
cd /d "%~dp0"
call "%~dp0scripts\node-path.cmd"
if not errorlevel 1 goto :iniciar
echo O Node.js LTS com npm sera instalado pelo Gerenciador de Pacotes do Windows.
where winget.exe >nul 2>nul
if errorlevel 1 goto :sem_node
winget install --id OpenJS.NodeJS.LTS --exact --source winget
if errorlevel 1 goto :sem_node
set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
call "%~dp0scripts\node-path.cmd"
if errorlevel 1 goto :sem_node
:iniciar
node "%~dp0scripts\windows.mjs" start
if errorlevel 1 goto :falha
exit /b 0
:sem_node
echo.
echo Nao foi possivel preparar o Node.js pelo WinGet.
echo Instale Node.js 24 ou 26 LTS com npm pelo site oficial: https://nodejs.org/
:falha
echo.
echo O site nao iniciou. Confira o erro acima ou execute VER_LOGS.cmd.
if not "%BASE_NO_PAUSE%"=="1" pause
exit /b 1
