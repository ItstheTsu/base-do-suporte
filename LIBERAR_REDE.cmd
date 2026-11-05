@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Base do Suporte - regra de rede local
echo Execute este arquivo como administrador para criar a regra de rede local.
netsh advfirewall firewall show rule name="Base do Suporte - TCP 1992 LAN" >nul 2>nul
if not errorlevel 1 goto :pronto
netsh advfirewall firewall add rule name="Base do Suporte - TCP 1992 LAN" dir=in action=allow protocol=TCP localport=1992 profile=private,domain remoteip=localsubnet
if errorlevel 1 (
  echo Nao foi possivel criar a regra. Solicite a configuracao ao responsavel pela rede.
  if not "%BASE_NO_PAUSE%"=="1" pause
  exit /b 1
)
:pronto
echo Regra da porta 1992 disponivel para a sub-rede local em redes privadas ou de dominio.
if not "%BASE_NO_PAUSE%"=="1" pause
exit /b 0
