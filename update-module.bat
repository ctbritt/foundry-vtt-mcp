@echo off
echo Updating Foundry MCP Bridge module files...

REM You need to update this path to match your Foundry VTT modules directory
REM Common paths:
REM set FOUNDRY_MODULES=%USERPROFILE%\AppData\Local\FoundryVTT\Data\modules\foundry-mcp-bridge
REM set FOUNDRY_MODULES=C:\Users\[YourUsername]\AppData\Local\FoundryVTT\Data\modules\foundry-mcp-bridge

echo.
echo Please edit this file and set your FOUNDRY_MODULES path, then run again.
echo Common path: %USERPROFILE%\AppData\Local\FoundryVTT\Data\modules\foundry-mcp-bridge
echo.
pause
exit /b

REM Uncomment and modify this section once you set the correct path:
REM if not exist "%FOUNDRY_MODULES%" (
REM     echo Module directory not found: %FOUNDRY_MODULES%
REM     echo Please check your Foundry VTT installation path
REM     pause
REM     exit /b 1
REM )

REM echo Copying updated files...
REM copy /Y "packages\foundry-module\dist\*.js" "%FOUNDRY_MODULES%\scripts\"
REM copy /Y "packages\foundry-module\module.json" "%FOUNDRY_MODULES%\"
REM copy /Y "packages\foundry-module\lang\*.json" "%FOUNDRY_MODULES%\lang\"
REM copy /Y "packages\foundry-module\styles\*.css" "%FOUNDRY_MODULES%\styles\"

REM echo Module files updated successfully!
REM echo Please reload/restart Foundry VTT to apply changes.
REM pause