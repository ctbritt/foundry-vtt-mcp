@echo off
setlocal enabledelayedexpansion

:: Configure Claude Desktop for Foundry MCP Server
:: Called by install.bat with installation directory as parameter

set "INSTALL_DIR=%~1"
if "%INSTALL_DIR%"=="" (
    echo ERROR: Installation directory not provided
    exit /b 1
)

set "CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json"
set "CLAUDE_DIR=%APPDATA%\Claude"
set "BACKUP_CONFIG=%CLAUDE_CONFIG%.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP_CONFIG=%BACKUP_CONFIG: =0%"

echo   🔧 Configuring Claude Desktop integration...

:: Create Claude directory if it doesn't exist
if not exist "%CLAUDE_DIR%" (
    echo   📁 Creating Claude configuration directory...
    mkdir "%CLAUDE_DIR%" 2>nul
    if not exist "%CLAUDE_DIR%" (
        echo   ERROR: Failed to create Claude directory: %CLAUDE_DIR%
        echo   Please ensure Claude Desktop is installed and has been run at least once.
        exit /b 1
    )
)

:: Backup existing configuration
if exist "%CLAUDE_CONFIG%" (
    echo   💾 Backing up existing Claude configuration...
    copy "%CLAUDE_CONFIG%" "%BACKUP_CONFIG%" >nul 2>&1
    if exist "%BACKUP_CONFIG%" (
        echo   ✓ Backup saved: %BACKUP_CONFIG%
    )
)

:: Convert Windows paths to JSON-safe format (double backslashes)
set "JSON_INSTALL_DIR=%INSTALL_DIR:\=\\%"
set "JSON_NODE_PATH=%INSTALL_DIR%\node"
set "JSON_NODE_PATH=%JSON_NODE_PATH:\=\\%"
set "JSON_SERVER_PATH=%INSTALL_DIR%\packages\mcp-server\src\index.js"
set "JSON_SERVER_PATH=%JSON_SERVER_PATH:\=\\%"

echo   📝 Creating Claude Desktop configuration...

:: Create or update configuration using PowerShell for proper JSON handling
powershell -Command ^
"try { ^
    $configPath = '%CLAUDE_CONFIG%'; ^
    $config = @{}; ^
    if (Test-Path $configPath) { ^
        try { ^
            $existingContent = Get-Content $configPath -Raw; ^
            if ($existingContent.Trim()) { ^
                $config = $existingContent | ConvertFrom-Json; ^
            } ^
        } catch { ^
            Write-Host '   ⚠️  Warning: Existing config invalid, creating new one...'; ^
            $config = @{}; ^
        } ^
    } ^
    if (-not $config.mcpServers) { ^
        $config | Add-Member -Type NoteProperty -Name mcpServers -Value @{} -Force; ^
    } ^
    $mcpServer = @{ ^
        command = 'node'; ^
        args = @('%JSON_SERVER_PATH%'); ^
        env = @{ ^
            NODE_PATH = '%JSON_NODE_PATH%' ^
        } ^
    }; ^
    $config.mcpServers.'foundry-mcp-bridge' = $mcpServer; ^
    $jsonOutput = $config | ConvertTo-Json -Depth 10; ^
    [System.IO.File]::WriteAllText($configPath, $jsonOutput, [System.Text.Encoding]::UTF8); ^
    Write-Host '   ✓ Claude Desktop configuration updated successfully'; ^
    exit 0; ^
} catch { ^
    Write-Host '   ERROR: Failed to update configuration:' $_.Exception.Message; ^
    exit 1; ^
}"

if errorlevel 1 (
    echo.
    echo   ❌ Automatic configuration failed!
    echo.
    echo   📋 Manual configuration required:
    echo   1. Open Claude Desktop
    echo   2. Go to Settings → Developer → Edit Config
    echo   3. Add this configuration:
    echo.
    echo   {
    echo     "mcpServers": {
    echo       "foundry-mcp-bridge": {
    echo         "command": "node",
    echo         "args": ["%JSON_SERVER_PATH%"],
    echo         "env": {
    echo           "NODE_PATH": "%JSON_NODE_PATH%"
    echo         }
    echo       }
    echo     }
    echo   }
    echo.
    echo   4. Save and restart Claude Desktop
    echo.
    exit /b 1
)

echo   ✓ Claude Desktop configured for Foundry MCP Bridge
echo.
echo   📋 Configuration details:
echo     • Server: foundry-mcp-bridge
echo     • Command: node
echo     • Script: %INSTALL_DIR%\packages\mcp-server\src\index.js
echo     • Node.js: %INSTALL_DIR%\node

exit /b 0