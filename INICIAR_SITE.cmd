@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Base do Suporte
cd /d "%~dp0"
if not exist "%~dp0scripts\start-windows.ps1" (
  echo ERRO: extraia o projeto completo antes de executar este CMD.
  goto :falha
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1"
set "BASE_EXIT_CODE=%errorlevel%"
if not "%BASE_EXIT_CODE%"=="0" goto :falha
exit /b 0
:falha
echo.
echo O site nao iniciou. Confira o erro acima e execute este CMD novamente.
if not "%BASE_NO_PAUSE%"=="1" pause
exit /b 1
