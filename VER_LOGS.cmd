@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
if exist "%~dp0logs\preparacao.log" start "" notepad.exe "%~dp0logs\preparacao.log"
if exist "%~dp0logs\site.log" start "" notepad.exe "%~dp0logs\site.log"
if exist "%~dp0logs\erros.log" start "" notepad.exe "%~dp0logs\erros.log"
if exist "%~dp0logs\gerenciador.log" start "" notepad.exe "%~dp0logs\gerenciador.log"
exit /b 0
