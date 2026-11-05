@echo off
where node.exe >nul 2>nul
if not errorlevel 1 (
  node -e "if(![24,26].includes(Number(process.versions.node.split('.')[0])))process.exit(1)" >nul 2>nul
  if not errorlevel 1 exit /b 0
)
if not defined BASE_RUNTIME_DIR set "BASE_RUNTIME_DIR=%LOCALAPPDATA%\BaseDoSuporte\runtime"
if exist "%BASE_RUNTIME_DIR%\node24-win-x64\node.exe" (
  "%BASE_RUNTIME_DIR%\node24-win-x64\node.exe" -e "if(![24,26].includes(Number(process.versions.node.split('.')[0])))process.exit(1)" >nul 2>nul
  if not errorlevel 1 (
    set "PATH=%BASE_RUNTIME_DIR%\node24-win-x64;%PATH%"
    exit /b 0
  )
)
if exist "%BASE_RUNTIME_DIR%\node24-win-arm64\node.exe" (
  "%BASE_RUNTIME_DIR%\node24-win-arm64\node.exe" -e "if(![24,26].includes(Number(process.versions.node.split('.')[0])))process.exit(1)" >nul 2>nul
  if not errorlevel 1 (
    set "PATH=%BASE_RUNTIME_DIR%\node24-win-arm64;%PATH%"
    exit /b 0
  )
)
exit /b 1
