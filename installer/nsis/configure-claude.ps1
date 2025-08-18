param(
    [Parameter(Mandatory=$true)]
    [string]$InstallDir
)

# Configure Claude Desktop for Foundry MCP Server
# This script safely merges MCP server configuration into existing Claude Desktop config

$ErrorActionPreference = "Stop"

# Enhanced logging with file output
$LogFile = Join-Path $env:TEMP "foundry-mcp-claude-config.log"

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry -ErrorAction SilentlyContinue
}

function Test-JsonValid {
    param([string]$JsonString)
    try {
        $JsonString | ConvertFrom-Json | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

try {
    Write-LogMessage "=============================================="
    Write-LogMessage "Starting Claude Desktop configuration..."
    Write-LogMessage "=============================================="
    Write-LogMessage "Log file location: $LogFile"
    Write-LogMessage "PowerShell version: $($PSVersionTable.PSVersion)"
    Write-LogMessage "Current user: $($env:USERNAME)"
    Write-LogMessage "Install directory: $InstallDir"
    Write-LogMessage "APPDATA: $($env:APPDATA)"
    Write-LogMessage "Script parameters: $($PSBoundParameters | ConvertTo-Json)"
    
    # Validate installation directory exists
    if (-not (Test-Path $InstallDir)) {
        throw "Installation directory does not exist: $InstallDir"
    }
    
    # Validate required files exist
    $nodeExe = Join-Path $InstallDir "node.exe"
    $mcpServer = Join-Path $InstallDir "packages\mcp-server\dist\index.js"
    
    if (-not (Test-Path $nodeExe)) {
        throw "Node.js executable not found: $nodeExe"
    }
    
    if (-not (Test-Path $mcpServer)) {
        throw "MCP server not found: $mcpServer"
    }
    
    Write-LogMessage "Installation files validated"
    
    # Determine Claude Desktop config path
    $claudeConfigDir = Join-Path $env:APPDATA "Claude"
    $configPath = Join-Path $claudeConfigDir "claude_desktop_config.json"
    
    Write-LogMessage "Claude config path: $configPath"
    
    # Ensure Claude directory exists
    if (-not (Test-Path $claudeConfigDir)) {
        Write-LogMessage "Creating Claude Desktop directory..."
        New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    }
    
    # Read existing configuration or create new
    $config = $null
    $backupPath = $null
    
    if (Test-Path $configPath) {
        Write-LogMessage "Reading existing Claude Desktop configuration..."
        
        # Create backup
        $backupPath = "$configPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $configPath $backupPath
        Write-LogMessage "Created backup: $backupPath"
        
        try {
            $configContent = Get-Content $configPath -Raw
            
            # Validate existing JSON
            if (-not (Test-JsonValid $configContent)) {
                throw "Existing Claude Desktop configuration contains invalid JSON"
            }
            
            $config = $configContent | ConvertFrom-Json
            Write-LogMessage "Existing configuration loaded and validated"
        }
        catch {
            throw "Failed to parse existing Claude Desktop configuration: $($_.Exception.Message)"
        }
    }
    else {
        Write-LogMessage "No existing configuration found, creating new..."
        $config = [PSCustomObject]@{
            mcpServers = [PSCustomObject]@{}
        }
    }
    
    # Ensure mcpServers section exists
    if (-not $config.PSObject.Properties.Name -contains "mcpServers") {
        Write-LogMessage "Adding mcpServers section to configuration..."
        $config | Add-Member -Type NoteProperty -Name "mcpServers" -Value ([PSCustomObject]@{})
    }
    
    # Configure Foundry MCP Server
    Write-LogMessage "Configuring Foundry MCP Server..."
    
    $foundryMcpConfig = [PSCustomObject]@{
        command = $nodeExe
        args = @($mcpServer)
        env = [PSCustomObject]@{}
    }
    
    # Add or update foundry-mcp server configuration
    if ($config.mcpServers.PSObject.Properties.Name -contains "foundry-mcp") {
        Write-LogMessage "Updating existing foundry-mcp configuration..."
        $config.mcpServers."foundry-mcp" = $foundryMcpConfig
    }
    else {
        Write-LogMessage "Adding new foundry-mcp configuration..."
        $config.mcpServers | Add-Member -Type NoteProperty -Name "foundry-mcp" -Value $foundryMcpConfig
    }
    
    # Convert to JSON with proper formatting
    Write-LogMessage "Generating new configuration JSON..."
    $newConfigJson = $config | ConvertTo-Json -Depth 10
    
    # Validate generated JSON
    if (-not (Test-JsonValid $newConfigJson)) {
        throw "Generated configuration JSON is invalid"
    }
    
    Write-LogMessage "Generated configuration validated"
    
    # Write new configuration
    try {
        $newConfigJson | Set-Content $configPath -Encoding UTF8
        Write-LogMessage "Claude Desktop configuration updated successfully"
    }
    catch {
        # Restore backup if write failed
        if ($backupPath -and (Test-Path $backupPath)) {
            Write-LogMessage "Write failed, restoring backup..."
            Copy-Item $backupPath $configPath -Force
        }
        throw "Failed to write Claude Desktop configuration: $($_.Exception.Message)"
    }
    
    # Verify written file is valid
    try {
        $verification = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-LogMessage "Written configuration verified"
    }
    catch {
        # Restore backup if verification failed
        if ($backupPath -and (Test-Path $backupPath)) {
            Write-LogMessage "Verification failed, restoring backup..."
            Copy-Item $backupPath $configPath -Force
        }
        throw "Written configuration file is invalid: $($_.Exception.Message)"
    }
    
    Write-LogMessage "Claude Desktop configuration completed successfully"
    Write-LogMessage "Please restart Claude Desktop to load the new configuration"
    
    exit 0
}
catch {
    Write-LogMessage "Configuration failed: $($_.Exception.Message)" "ERROR"
    Write-LogMessage "Full exception details: $($_.Exception | ConvertTo-Json -Depth 3)" "ERROR"
    Write-LogMessage "Stack trace: $($_.ScriptStackTrace)" "ERROR"
    Write-LogMessage "The Claude Desktop configuration was not modified" "ERROR"
    Write-LogMessage "=============================================="
    Write-LogMessage "For detailed error information, check: $LogFile" "ERROR"
    Write-LogMessage "=============================================="
    
    # Also output to stderr for NSIS to capture
    Write-Error "Configuration failed: $($_.Exception.Message). Check log: $LogFile"
    exit 1
}