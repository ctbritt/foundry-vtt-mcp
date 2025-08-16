@echo off
setlocal enabledelayedexpansion

:: Foundry MCP Server Uninstaller
:: Removes installation and restores Claude Desktop configuration

echo.
echo ================================================================
echo   Foundry MCP Server Uninstaller
echo ================================================================
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\FoundryMCPServer"
set "CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json"

echo ⚠️  This will completely remove Foundry MCP Server and restore your
echo     Claude Desktop configuration to its previous state.
echo.
echo Installation directory: %INSTALL_DIR%
echo.

set /p "confirm=Are you sure you want to uninstall? (y/n): "
if /i "!confirm!" neq "y" (
    echo Uninstall cancelled.
    pause
    exit /b 0
)

echo.
echo [1/4] Stopping any running MCP server processes...

:: Kill any running node processes that might be our server
tasklist /fi "imagename eq node.exe" | findstr /i "node.exe" >nul 2>&1
if not errorlevel 1 (
    echo   🔄 Stopping Node.js processes...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
)
echo   ✓ Processes stopped

echo.
echo [2/4] Removing installation files...

if exist "%INSTALL_DIR%" (
    echo   🗑️  Removing: %INSTALL_DIR%
    rmdir /s /q "%INSTALL_DIR%" 2>nul
    if exist "%INSTALL_DIR%" (
        echo   ⚠️  WARNING: Some files could not be removed
        echo      You may need to remove them manually: %INSTALL_DIR%
    ) else (
        echo   ✓ Installation files removed
    )
) else (
    echo   ℹ️  Installation directory not found (already removed?)
)

echo.
echo [3/4] Restoring Claude Desktop configuration...

if not exist "%CLAUDE_CONFIG%" (
    echo   ℹ️  Claude Desktop config not found, nothing to restore
) else (
    :: Look for backup files
    set "BACKUP_FOUND="
    for %%f in ("%CLAUDE_CONFIG%.backup-*") do (
        set "BACKUP_FOUND=%%f"
        goto :backup_found
    )
    
    :backup_found
    if defined BACKUP_FOUND (
        echo   📁 Found backup configuration: !BACKUP_FOUND!
        set /p "restore=Restore from backup? (y/n): "
        if /i "!restore!" equ "y" (
            copy "!BACKUP_FOUND!" "%CLAUDE_CONFIG%" >nul 2>&1
            if errorlevel 1 (
                echo   ❌ Failed to restore backup
            ) else (
                echo   ✓ Claude Desktop configuration restored from backup
            )
        ) else (
            echo   ℹ️  Backup not restored, removing Foundry MCP Bridge manually...
            call :remove_mcp_config
        )
    ) else (
        echo   ⚠️  No backup found, removing Foundry MCP Bridge manually...
        call :remove_mcp_config
    )
)

echo.
echo [4/4] Removing shortcuts and registry entries...

:: Remove desktop shortcut
if exist "%USERPROFILE%\Desktop\Start Foundry MCP Server.lnk" (
    del "%USERPROFILE%\Desktop\Start Foundry MCP Server.lnk" >nul 2>&1
    echo   ✓ Desktop shortcut removed
)

:: Remove Start Menu shortcut
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Foundry MCP Server.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Foundry MCP Server.lnk" >nul 2>&1
    echo   ✓ Start Menu shortcut removed
)

echo.
echo ================================================================
echo   🎉 Uninstall Complete!
echo ================================================================
echo.
echo The Foundry MCP Server has been completely removed from your system.
echo.
echo 📋 To complete the removal:
echo   1. Restart Claude Desktop if it's currently running
echo   2. The "foundry-mcp-bridge" tools should no longer appear in Claude
echo.
echo 💾 Backup files (if any) were preserved in case you want to reinstall later.
echo.
echo Thank you for using Foundry MCP Server!
echo.
pause
exit /b 0

:: Function to remove MCP config manually using PowerShell
:remove_mcp_config
powershell -Command ^
"try { ^
    $configPath = '%CLAUDE_CONFIG%'; ^
    if (Test-Path $configPath) { ^
        $config = Get-Content $configPath -Raw | ConvertFrom-Json; ^
        if ($config.mcpServers -and $config.mcpServers.'foundry-mcp-bridge') { ^
            $config.mcpServers.PSObject.Properties.Remove('foundry-mcp-bridge'); ^
            if ($config.mcpServers.PSObject.Properties.Count -eq 0) { ^
                $config.PSObject.Properties.Remove('mcpServers'); ^
            } ^
            $jsonOutput = $config | ConvertTo-Json -Depth 10; ^
            [System.IO.File]::WriteAllText($configPath, $jsonOutput, [System.Text.Encoding]::UTF8); ^
            Write-Host '   ✓ Foundry MCP Bridge removed from Claude config'; ^
        } else { ^
            Write-Host '   ℹ️  Foundry MCP Bridge not found in config'; ^
        } ^
    } ^
} catch { ^
    Write-Host '   ⚠️  Could not modify Claude config automatically'; ^
    Write-Host '      You may need to remove foundry-mcp-bridge manually'; ^
}"
exit /b 0