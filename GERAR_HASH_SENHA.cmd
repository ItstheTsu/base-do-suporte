@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
call "%~dp0scripts\node-path.cmd"
if errorlevel 1 (
  echo Prepare o Node.js com INICIAR_SITE.cmd antes de gerar o hash.
  exit /b 1
)
node "%~dp0scripts\hash-password.js"
if not "%BASE_NO_PAUSE%"=="1" pause
exit /b %errorlevel%
