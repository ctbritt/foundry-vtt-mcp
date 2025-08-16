@echo off
setlocal

:: Start Foundry MCP Server manually
:: Useful for testing and troubleshooting

echo.
echo ================================================================
echo   Starting Foundry MCP Server Manually
echo ================================================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\FoundryMCPServer"
set "NODE_EXE=%INSTALL_DIR%\node\node.exe"
set "SERVER_JS=%INSTALL_DIR%\packages\mcp-server\src\index.js"

:: Check if installation exists
if not exist "%INSTALL_DIR%" (
    echo ❌ ERROR: Installation not found at: %INSTALL_DIR%
    echo.
    echo Please run install.bat first to install the MCP server.
    echo.
    pause
    exit /b 1
)

if not exist "%NODE_EXE%" (
    echo ❌ ERROR: Node.js not found at: %NODE_EXE%
    echo.
    echo Installation may be corrupted. Please reinstall.
    echo.
    pause
    exit /b 1
)

if not exist "%SERVER_JS%" (
    echo ❌ ERROR: MCP server not found at: %SERVER_JS%
    echo.
    echo Installation may be corrupted. Please reinstall.
    echo.
    pause
    exit /b 1
)

echo 🔧 Installation found: %INSTALL_DIR%
echo 📦 Node.js version:
"%NODE_EXE%" --version
echo.

echo 🚀 Starting MCP server...
echo.
echo ℹ️  Press Ctrl+C to stop the server
echo ℹ️  Close this window to stop the server
echo.
echo ================================================================
echo.

:: Set NODE_PATH and start the server
set "NODE_PATH=%INSTALL_DIR%\node"
"%NODE_EXE%" "%SERVER_JS%"

echo.
echo ================================================================
echo   MCP Server Stopped
echo ================================================================
echo.
pause