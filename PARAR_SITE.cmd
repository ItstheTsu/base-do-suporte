@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
call "%~dp0scripts\node-path.cmd"
if errorlevel 1 exit /b 1
node "%~dp0scripts\windows.mjs" stop
if errorlevel 1 (
  if not "%BASE_NO_PAUSE%"=="1" pause
  exit /b 1
)
exit /b 0
