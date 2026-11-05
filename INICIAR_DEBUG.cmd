@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Base do Suporte - diagnostico
cd /d "%~dp0"
call "%~dp0scripts\node-path.cmd"
if errorlevel 1 (
  echo Execute INICIAR_SITE.cmd para preparar o Node.js com npm.
  exit /b 1
)
node "%~dp0scripts\launch.mjs" --no-open
if not "%BASE_NO_PAUSE%"=="1" pause
exit /b %errorlevel%
