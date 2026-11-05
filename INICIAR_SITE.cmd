@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Base do Suporte
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto :sem_node
node -e "if(Number(process.versions.node.split('.')[0])!==24)process.exit(1)" >nul 2>nul
if errorlevel 1 goto :sem_node
where npm >nul 2>nul
if errorlevel 1 goto :sem_node
node scripts\launch.mjs
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)
exit /b 0
:sem_node
echo Instale o Node.js 24 com npm e abra este arquivo novamente.
pause
exit /b 1
