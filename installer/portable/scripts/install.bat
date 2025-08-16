@echo off
setlocal enabledelayedexpansion

:: Foundry MCP Server Portable Installer v0.4.8
:: Installs MCP server and configures Claude Desktop automatically

echo.
echo ================================================================
echo   Foundry MCP Server Portable Installer v0.4.8
echo   Installing AI-powered campaign management for Foundry VTT
echo ================================================================
echo.

:: Set installation directory
set "INSTALL_DIR=%LOCALAPPDATA%\FoundryMCPServer"
set "SCRIPT_DIR=%~dp0"
set "PACKAGE_DIR=%SCRIPT_DIR%.."

echo [1/6] Checking prerequisites...

:: Check if we're running from the correct location
if not exist "%PACKAGE_DIR%\portable-node\" (
    echo ERROR: portable-node directory not found!
    echo Please ensure this script is run from the extracted package directory.
    echo Expected structure:
    echo   FoundryMCPServerPortable\
    echo     portable-node\
    echo     foundry-mcp-server\
    echo     scripts\install.bat  ^<-- You are here
    pause
    exit /b 1
)

if not exist "%PACKAGE_DIR%\foundry-mcp-server\" (
    echo ERROR: foundry-mcp-server directory not found!
    echo Please ensure the package was extracted completely.
    pause
    exit /b 1
)

echo   ✓ Package structure verified

:: Check if Claude Desktop is installed
echo [2/6] Checking Claude Desktop installation...
if not exist "%APPDATA%\Claude" (
    echo.
    echo ⚠️  WARNING: Claude Desktop not detected!
    echo.
    echo Claude Desktop is required for this MCP server to work.
    echo Please install Claude Desktop first:
    echo.
    echo   1. Go to: https://claude.ai/desktop
    echo   2. Download and install Claude Desktop
    echo   3. Run Claude Desktop once to create configuration directory
    echo   4. Then run this installer again
    echo.
    set /p "continue=Continue installation anyway? (y/n): "
    if /i "!continue!" neq "y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
    echo   ⚠️  Continuing without Claude Desktop...
) else (
    echo   ✓ Claude Desktop installation detected
)

:: Create installation directory
echo [3/6] Creating installation directory...
if exist "%INSTALL_DIR%" (
    echo   ⚠️  Existing installation found at: %INSTALL_DIR%
    set /p "overwrite=Overwrite existing installation? (y/n): "
    if /i "!overwrite!" neq "y" (
        echo Installation cancelled.
        pause
        exit /b 0
    )
    echo   🔄 Removing existing installation...
    rmdir /s /q "%INSTALL_DIR%" 2>nul
)

mkdir "%INSTALL_DIR%" 2>nul
if not exist "%INSTALL_DIR%" (
    echo ERROR: Failed to create installation directory: %INSTALL_DIR%
    echo Please check permissions and try running as administrator.
    pause
    exit /b 1
)
echo   ✓ Installation directory created: %INSTALL_DIR%

:: Copy portable Node.js
echo [4/6] Installing portable Node.js runtime...
echo   📦 Copying Node.js files (~70MB)...
xcopy "%PACKAGE_DIR%\portable-node\*" "%INSTALL_DIR%\node\" /E /I /Y /Q
if errorlevel 1 (
    echo ERROR: Failed to copy Node.js runtime
    pause
    exit /b 1
)
echo   ✓ Node.js runtime installed

:: Copy MCP server files
echo [5/6] Installing Foundry MCP Server...
echo   📦 Copying MCP server files (~15MB)...
xcopy "%PACKAGE_DIR%\foundry-mcp-server\*" "%INSTALL_DIR%\" /E /I /Y /Q
if errorlevel 1 (
    echo ERROR: Failed to copy MCP server files
    pause
    exit /b 1
)
echo   ✓ MCP server files installed

:: Configure Claude Desktop
echo [6/6] Configuring Claude Desktop...
call "%SCRIPT_DIR%configure-claude.bat" "%INSTALL_DIR%"
if errorlevel 1 (
    echo ERROR: Failed to configure Claude Desktop
    echo You can configure it manually later using the instructions in README.txt
)

:: Create shortcuts and utilities
echo.
echo 📋 Creating utility shortcuts...

:: Create desktop shortcut for manual server start
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Start Foundry MCP Server.lnk"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%SCRIPT_DIR%start-server.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Start Foundry MCP Server manually'; $Shortcut.Save()" 2>nul

:: Create Start Menu shortcut
set "STARTMENU_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Foundry MCP Server.lnk"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTMENU_PATH%'); $Shortcut.TargetPath = '%SCRIPT_DIR%start-server.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Start Foundry MCP Server'; $Shortcut.Save()" 2>nul

echo   ✓ Desktop and Start Menu shortcuts created

echo.
echo ================================================================
echo   🎉 Installation Complete!
echo ================================================================
echo.
echo Installation location: %INSTALL_DIR%
echo.
echo 📋 Next steps:
echo   1. RESTART Claude Desktop completely (File → Quit, then reopen)
echo   2. In Claude Desktop, you should see "foundry-mcp-bridge" tools available
echo   3. Make sure Foundry VTT is running with the MCP Bridge module enabled
echo.
echo 🛠️  Utility scripts available:
echo   • start-server.bat     - Start MCP server manually  
echo   • test-connection.bat  - Test MCP server connection
echo   • uninstall.bat        - Remove installation completely
echo.
echo 📚 For troubleshooting, see README.txt
echo.
echo If you encounter any issues, please visit:
echo https://github.com/adambdooley/foundry-vtt-mcp/issues
echo.
pause