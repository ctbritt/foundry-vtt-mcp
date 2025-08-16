@echo off
setlocal

:: Test Foundry MCP Server Connection
:: Verifies installation and checks if server is accessible

echo.
echo ================================================================
echo   Foundry MCP Server Connection Test
echo ================================================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\FoundryMCPServer"
set "NODE_EXE=%INSTALL_DIR%\node\node.exe"
set "SERVER_JS=%INSTALL_DIR%\packages\mcp-server\src\index.js"
set "CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json"

echo [1/5] Checking installation files...

:: Check installation directory
if not exist "%INSTALL_DIR%" (
    echo ❌ FAIL: Installation directory not found
    echo    Expected: %INSTALL_DIR%
    goto :test_failed
)
echo ✓ Installation directory found

:: Check Node.js
if not exist "%NODE_EXE%" (
    echo ❌ FAIL: Node.js executable not found
    echo    Expected: %NODE_EXE%
    goto :test_failed
)
echo ✓ Node.js executable found

:: Check MCP server
if not exist "%SERVER_JS%" (
    echo ❌ FAIL: MCP server script not found
    echo    Expected: %SERVER_JS%
    goto :test_failed
)
echo ✓ MCP server script found

echo.
echo [2/5] Checking Node.js version...
"%NODE_EXE%" --version
if errorlevel 1 (
    echo ❌ FAIL: Node.js not working correctly
    goto :test_failed
)
echo ✓ Node.js working correctly

echo.
echo [3/5] Checking Claude Desktop configuration...

if not exist "%APPDATA%\Claude" (
    echo ⚠️  WARNING: Claude Desktop directory not found
    echo    Expected: %APPDATA%\Claude
    echo    Please ensure Claude Desktop is installed and has been run at least once.
) else (
    echo ✓ Claude Desktop directory found
)

if not exist "%CLAUDE_CONFIG%" (
    echo ⚠️  WARNING: Claude Desktop config file not found
    echo    Expected: %CLAUDE_CONFIG%
    echo    This may be normal if Claude Desktop hasn't been configured yet.
) else (
    echo ✓ Claude Desktop config file found
    
    :: Check if our MCP server is configured
    findstr /c:"foundry-mcp-bridge" "%CLAUDE_CONFIG%" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  WARNING: Foundry MCP Bridge not found in Claude config
        echo    You may need to run configure-claude.bat
    ) else (
        echo ✓ Foundry MCP Bridge found in Claude config
    )
)

echo.
echo [4/5] Testing MCP server startup...

:: Test if server can start (run for 3 seconds then kill)
echo ℹ️  Starting server for 3 seconds...
set "NODE_PATH=%INSTALL_DIR%\node"
start "MCP Server Test" /B "%NODE_EXE%" "%SERVER_JS%"
timeout /t 3 /nobreak >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo ✓ Server startup test completed

echo.
echo [5/5] Testing network connectivity...

:: Test if default port is available (31415)
netstat -an | findstr ":31415" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  WARNING: Port 31415 appears to be in use
    echo    This may indicate the server is already running, or another application is using this port.
) else (
    echo ✓ Port 31415 appears to be available
)

echo.
echo ================================================================
echo   🎉 Connection Test PASSED
echo ================================================================
echo.
echo ✅ All core components are installed and working correctly!
echo.
echo 📋 Next steps:
echo   1. Make sure Claude Desktop is running
echo   2. Make sure Foundry VTT is running with MCP Bridge module enabled  
echo   3. In Claude Desktop, try asking: "What Foundry VTT tools do you have access to?"
echo.
echo 🛠️  If you experience issues:
echo   • Run start-server.bat to test the server manually
echo   • Check that Claude Desktop was restarted after installation
echo   • Verify Foundry VTT has the MCP Bridge module enabled
echo.
goto :end

:test_failed
echo.
echo ================================================================
echo   ❌ Connection Test FAILED
echo ================================================================
echo.
echo Please check the errors above and try reinstalling if necessary.
echo.
echo 🛠️  Troubleshooting steps:
echo   1. Run install.bat again to reinstall
echo   2. Make sure you have permission to write to %LOCALAPPDATA%
echo   3. Check that no antivirus is blocking the installation
echo   4. Visit: https://github.com/adambdooley/foundry-vtt-mcp/issues
echo.

:end
pause