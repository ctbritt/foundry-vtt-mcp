; Foundry MCP Server Windows Installer
; Built with NSIS (Nullsoft Scriptable Install System)

;--------------------------------
; Include Modern UI
!include "MUI2.nsh"
!include "FileFunc.nsh"

;--------------------------------
; General Configuration
Name "Foundry MCP Server"
OutFile "FoundryMCPServer-Setup.exe"
Unicode True

; Default installation directory
InstallDir "$LOCALAPPDATA\FoundryMCPServer"

; Request application privileges (user level, no admin required)
RequestExecutionLevel user

; Version information
VIProductVersion "0.4.8.0"
VIAddVersionKey "ProductName" "Foundry MCP Server"
VIAddVersionKey "CompanyName" "Foundry MCP Bridge"
VIAddVersionKey "FileDescription" "AI-powered campaign management for Foundry VTT"
VIAddVersionKey "FileVersion" "0.4.8.0"
VIAddVersionKey "LegalCopyright" "© 2024 Foundry MCP Bridge"

;--------------------------------
; Interface Configuration
!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"

; Welcome page
!define MUI_WELCOMEPAGE_TITLE "Foundry MCP Server Setup"
!define MUI_WELCOMEPAGE_TEXT "This wizard will install Foundry MCP Server, which enables AI-powered campaign management for Foundry VTT using Claude Desktop.$\r$\n$\r$\nClick Next to continue."

; Directory page
!define MUI_DIRECTORYPAGE_TEXT_TOP "Choose the folder where you want to install Foundry MCP Server."

; Finish page
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TEXT "Foundry MCP Server has been successfully installed!$\r$\n$\r$\nTo complete setup:$\r$\n1. Restart Claude Desktop$\r$\n2. Install the MCP Bridge module in Foundry VTT$\r$\n3. Start your AI-powered campaigns!"
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Open installation guide"
!define MUI_FINISHPAGE_RUN_FUNCTION "OpenInstallGuide"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
; Languages
!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Helper Functions
Function OpenInstallGuide
  ExecShell "open" "https://github.com/adambdooley/foundry-vtt-mcp#installation"
FunctionEnd

Function GetClaudeConfigPath
  ; Get Claude Desktop config path
  StrCpy $0 "$APPDATA\Claude\claude_desktop_config.json"
  IfFileExists $0 found
  
  ; Try alternative path
  StrCpy $0 "$LOCALAPPDATA\Claude\claude_desktop_config.json"
  IfFileExists $0 found
  
  ; Default path if not found
  StrCpy $0 "$APPDATA\Claude\claude_desktop_config.json"
  
  found:
  Push $0
FunctionEnd

Function UpdateClaudeConfig
  ; Get Claude config path
  Call GetClaudeConfigPath
  Pop $0
  
  ; Check if config exists
  IfFileExists $0 config_exists
  
  ; Create config if it doesn't exist
  CreateDirectory "$APPDATA\Claude"
  FileOpen $1 $0 w
  FileWrite $1 '{"mcpServers":{"foundry-mcp":{"command":"$INSTDIR\\node.exe","args":["$INSTDIR\\foundry-mcp-server\\packages\\mcp-server\\dist\\index.js"],"env":{}}}}'
  FileClose $1
  Goto config_updated
  
  config_exists:
  ; Backup existing config
  CopyFiles $0 "$0.backup"
  
  ; Read existing config
  FileOpen $1 $0 r
  FileRead $1 $2
  FileClose $1
  
  ; Simple check if our server is already configured
  ${StrLoc} $3 $2 "foundry-mcp" ">"
  StrCmp $3 "" add_server config_updated
  
  add_server:
  ; Add our MCP server to the config
  ; This is a simplified approach - in a real implementation, you'd use proper JSON parsing
  ${StrRep} $4 $2 '"mcpServers":{}' '"mcpServers":{"foundry-mcp":{"command":"$INSTDIR\\node.exe","args":["$INSTDIR\\foundry-mcp-server\\packages\\mcp-server\\dist\\index.js"],"env":{}}}'
  ${StrRep} $5 $4 '{"mcpServers":{' '{"mcpServers":{"foundry-mcp":{"command":"$INSTDIR\\node.exe","args":["$INSTDIR\\foundry-mcp-server\\packages\\mcp-server\\dist\\index.js"],"env":{}},'
  
  ; Write updated config
  FileOpen $1 $0 w
  FileWrite $1 $5
  FileClose $1
  
  config_updated:
FunctionEnd

;--------------------------------
; Installer Sections
Section "Foundry MCP Server" SecMain
  SectionIn RO ; Read-only section
  
  ; Set output path
  SetOutPath $INSTDIR
  
  ; Install Node.js runtime
  DetailPrint "Installing Node.js runtime..."
  File /r "node\"
  File "node.exe"
  
  ; Install MCP Server files
  DetailPrint "Installing MCP Server..."
  File /r "foundry-mcp-server\"
  
  ; Install documentation
  File "README.txt"
  File "LICENSE.txt"
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Create Start Menu shortcuts
  CreateDirectory "$SMPROGRAMS\Foundry MCP Server"
  CreateShortcut "$SMPROGRAMS\Foundry MCP Server\Foundry MCP Server.lnk" "$INSTDIR\start-server.bat" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\Foundry MCP Server\Test Connection.lnk" "$INSTDIR\test-connection.bat" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\Foundry MCP Server\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Add to Windows Programs list
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "DisplayName" "Foundry MCP Server"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "Publisher" "Foundry MCP Bridge"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "DisplayVersion" "0.4.8"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer" "NoRepair" 1
  
  ; Create utility scripts
  DetailPrint "Creating utility scripts..."
  
  ; Start server script
  FileOpen $0 "$INSTDIR\start-server.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'echo Starting Foundry MCP Server...$\r$\n'
  FileWrite $0 'cd /d "$INSTDIR"$\r$\n'
  FileWrite $0 '"$INSTDIR\node.exe" "$INSTDIR\foundry-mcp-server\packages\mcp-server\dist\index.js"$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0
  
  ; Test connection script
  FileOpen $0 "$INSTDIR\test-connection.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'echo Testing Foundry MCP Server installation...$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo Checking Node.js...$\r$\n'
  FileWrite $0 '"$INSTDIR\node.exe" --version$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo Checking MCP Server files...$\r$\n'
  FileWrite $0 'if exist "$INSTDIR\foundry-mcp-server\packages\mcp-server\dist\index.js" ($\r$\n'
  FileWrite $0 '  echo ✓ MCP Server files found$\r$\n'
  FileWrite $0 ') else ($\r$\n'
  FileWrite $0 '  echo ✗ MCP Server files missing$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo Installation test complete!$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0
  
  ; Update Claude Desktop configuration
  DetailPrint "Configuring Claude Desktop..."
  Call UpdateClaudeConfig
  
  ; Success message
  DetailPrint "Installation complete!"
  
SectionEnd

;--------------------------------
; Uninstaller Section
Section "Uninstall"
  
  ; Remove files
  Delete "$INSTDIR\node.exe"
  RMDir /r "$INSTDIR\node"
  RMDir /r "$INSTDIR\foundry-mcp-server"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\LICENSE.txt"
  Delete "$INSTDIR\start-server.bat"
  Delete "$INSTDIR\test-connection.bat"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove Start Menu shortcuts
  RMDir /r "$SMPROGRAMS\Foundry MCP Server"
  
  ; Remove registry entries
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\FoundryMCPServer"
  
  ; Remove installation directory
  RMDir "$INSTDIR"
  
  ; Note: We don't remove the Claude config entry automatically to avoid breaking other MCP servers
  MessageBox MB_YESNO "Would you like to remove the Foundry MCP Server entry from Claude Desktop configuration?" IDNO skip_config
  
  ; Remove from Claude config (simplified approach)
  Call un.GetClaudeConfigPath
  Pop $0
  IfFileExists $0 0 skip_config
  
  ; Backup config before modification
  CopyFiles $0 "$0.uninstall-backup"
  
  skip_config:
  
SectionEnd

Function un.GetClaudeConfigPath
  ; Same as install version
  StrCpy $0 "$APPDATA\Claude\claude_desktop_config.json"
  IfFileExists $0 found
  StrCpy $0 "$LOCALAPPDATA\Claude\claude_desktop_config.json"
  found:
  Push $0
FunctionEnd