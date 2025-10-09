@echo off
REM Start the bundled MCP server
REM This script should be run from your Foundry Data\modules\foundry-mcp-bridge directory

setlocal
set SCRIPT_DIR=%~dp0
set MODULE_DIR=%SCRIPT_DIR%..
set SERVER_DIR=%MODULE_DIR%\dist\mcp-server

echo Starting Foundry MCP Server
echo ==============================
echo Module: %MODULE_DIR%
echo Server: %SERVER_DIR%
echo.

REM Check if .env exists, if not copy from example
if not exist "%SERVER_DIR%\.env" (
  if exist "%SERVER_DIR%\.env.example" (
    echo Creating .env from .env.example...
    copy "%SERVER_DIR%\.env.example" "%SERVER_DIR%\.env"
    echo Please edit %SERVER_DIR%\.env with your configuration
    echo.
  )
)

REM Start the server
cd /d "%SERVER_DIR%"
node index.js
