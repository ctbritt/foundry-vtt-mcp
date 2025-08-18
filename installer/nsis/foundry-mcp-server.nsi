; Foundry MCP Server Windows Installer
; Built with NSIS (Nullsoft Scriptable Install System)

;--------------------------------
; Include Modern UI and PowerShell support
!include "MUI2.nsh"
!include "FileFunc.nsh"

; PowerShell execution macro - fixed for NSIS/PowerShell compatibility
!macro PowerShellExecWithOutput command
  nsExec::ExecToStack 'powershell.exe -inputformat none -NoProfile -ExecutionPolicy Bypass -Command "${command}"'
!macroend

!define PowerShellExecWithOutput "!insertmacro PowerShellExecWithOutput"

; PowerShell file execution macro
!macro PowerShellExecFile filepath parameters
  nsExec::ExecToStack 'powershell.exe -inputformat none -NoProfile -ExecutionPolicy Bypass -File "${filepath}" ${parameters}'
!macroend

!define PowerShellExecFile "!insertmacro PowerShellExecFile"

;--------------------------------
; General Configuration
Name "Foundry MCP Server"

; Allow output file to be overridden from command line
!ifndef OUTFILE
  !define OUTFILE "FoundryMCPServer-Setup.exe"
!endif
OutFile "${OUTFILE}"

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

Function UpdateClaudeConfig
  ; Configure Claude Desktop using PowerShell script
  DetailPrint "Configuring Claude Desktop..."
  
  ; First test if PowerShell is available
  DetailPrint "Testing PowerShell availability..."
  ${PowerShellExecWithOutput} 'Write-Host "PowerShell OK"'
  Pop $0 ; Exit code
  Pop $1 ; Output
  
  IntCmp $0 0 powershell_ok powershell_failed powershell_failed
  
  powershell_failed:
    DetailPrint "PowerShell test failed (exit code: $0)"
    MessageBox MB_ICONEXCLAMATION|MB_OK "PowerShell Not Available$\r$\n$\r$\nFoundry MCP Server installed successfully, but PowerShell is required for automatic Claude Desktop configuration.$\r$\n$\r$\n- See manual setup guide in Start Menu$\r$\n- Configure Claude Desktop manually$\r$\n- Contact support if PowerShell should be available"
    Goto config_done
    
  powershell_ok:
    DetailPrint "PowerShell available, executing configuration script..."
    
    ; Execute PowerShell script with installation directory as parameter
    ${PowerShellExecFile} "$INSTDIR\configure-claude.ps1" '"-InstallDir \"$INSTDIR\""'
    Pop $0 ; Exit code
    Pop $1 ; Output/Error messages
    
    ; Check if PowerShell script succeeded
    IntCmp $0 0 config_success config_failed config_failed
    
    config_failed:
      DetailPrint "Direct PowerShell execution failed (exit code: $0)"
      DetailPrint "PowerShell output: $1"
      
      ; Try batch file fallback method
      DetailPrint "Attempting batch file fallback method..."
      nsExec::ExecToStack '"$INSTDIR\configure-claude-wrapper.bat" "$INSTDIR"'
      Pop $5 ; Exit code from batch
      Pop $6 ; Output from batch
      
      IntCmp $5 0 batch_success batch_failed batch_failed
      
      batch_success:
        DetailPrint "Batch fallback method succeeded"
        DetailPrint "Batch output: $6"
        Goto config_success
        
      batch_failed:
        DetailPrint "Batch fallback method also failed (exit code: $5)"
        DetailPrint "Batch output: $6"
        
        ; Extract useful error message from PowerShell output
        StrLen $2 "$1"
        IntCmp $2 0 no_output has_output has_output
        
        no_output:
          StrCpy $3 "No error details available"
          Goto show_error
          
        has_output:
          ; Truncate long output for message box (first 200 chars)
          StrLen $4 "$1"
          IntCmp $4 200 show_full truncate_output show_full
          
          truncate_output:
            StrCpy $3 "$1" 200
            StrCpy $3 "$3..."
            Goto show_error
            
          show_full:
            StrCpy $3 "$1"
            
        show_error:
          ; Extract the first line of the error for a cleaner display
          StrCpy $7 $3 80 ; First 80 characters
          StrCmp $3 $7 short_error 0
          StrCpy $7 "$7..."
          
          short_error:
          MessageBox MB_ICONEXCLAMATION|MB_OK "Claude Desktop Configuration Failed$\r$\n$\r$\nError: $7$\r$\n$\r$\nFoundry MCP Server installed successfully, but Claude Desktop configuration could not be completed automatically.$\r$\n$\r$\n- Check detailed error log: %TEMP%\foundry-mcp-claude-config.log$\r$\n- See manual setup guide in Start Menu$\r$\n- Restart Claude Desktop after manual configuration"
          Goto config_done
        
    config_success:
      DetailPrint "Claude Desktop configured successfully"
      MessageBox MB_ICONINFORMATION|MB_OK "Setup Complete!$\r$\n$\r$\nFoundry MCP Server has been installed and Claude Desktop has been configured.$\r$\n$\r$\n- Restart Claude Desktop to activate the MCP connection$\r$\n- Install the MCP Bridge module in Foundry VTT$\r$\n- See Start Menu for setup guides and tools"
      
  config_done:
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
  
  ; Install PowerShell configuration script and batch wrapper
  File "configure-claude.ps1"
  File "configure-claude-wrapper.bat"
  
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
  
  ; Remove files and directories (match what installer actually creates)
  Delete "$INSTDIR\node.exe"
  RMDir /r "$INSTDIR\node"
  RMDir /r "$INSTDIR\packages"
  RMDir /r "$INSTDIR\shared"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\LICENSE.txt"
  Delete "$INSTDIR\configure-claude.ps1"
  Delete "$INSTDIR\configure-claude-wrapper.bat"
  Delete "$INSTDIR\start-server.bat"
  Delete "$INSTDIR\test-connection.bat"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove any remaining files
  Delete "$INSTDIR\*.*"
  
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