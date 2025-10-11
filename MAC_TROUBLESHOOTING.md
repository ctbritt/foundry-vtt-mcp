# Claude Desktop Connection Troubleshooting - Mac Edition

## Quick Diagnosis Steps

Run these commands **ON YOUR MAC** (not on the server):

### Step 1: Download and Run Test Script

```bash
# Download the test script from server
scp foundry@minskin-chinstrap.ts.net:/home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/test-mcp-connection.sh ~/test-mcp.sh

# Make it executable
chmod +x ~/test-mcp.sh

# Run it
~/test-mcp.sh
```

### Step 2: Manual Connection Tests

If the script fails, test each step manually:

**Test A: Tailscale Connection**
```bash
# Test 1: Can you ping the server?
ping -c 3 minskin-chinstrap.ts.net

# Test 2: Get Tailscale IP
tailscale status | grep minskin-chinstrap
```

**Test B: SSH Connection**
```bash
# Test SSH without password (this is required for MCP)
ssh foundry@minskin-chinstrap.ts.net "echo 'SSH works'"

# If it asks for a password, you need to set up SSH keys:
ssh-copy-id foundry@minskin-chinstrap.ts.net
```

**Test C: Backend Status**
```bash
# Check if backend is running
ssh foundry@minskin-chinstrap.ts.net "ss -tlnp | grep 31414"
```

**Test D: Full MCP Command**
```bash
# This is what Claude Desktop runs - it should wait for input
ssh foundry@minskin-chinstrap.ts.net "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
# Press Ctrl+C to exit
```

### Step 3: Check Claude Desktop Config

**Verify config file exists:**
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Should contain:**
```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry@minskin-chinstrap.ts.net",
                "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
            ],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
```

### Step 4: Check Claude Desktop Logs

```bash
# View Claude Desktop logs
ls -lt ~/Library/Logs/Claude/ | head -10

# Check the most recent log
tail -50 ~/Library/Logs/Claude/mcp*.log
```

## Common Issues and Solutions

### Issue 1: SSH Asks for Password

**Problem:** Claude Desktop can't handle password prompts.

**Solution:** Set up SSH key authentication:
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-mac@example.com"

# Copy key to server
ssh-copy-id foundry@minskin-chinstrap.ts.net

# Test passwordless login
ssh foundry@minskin-chinstrap.ts.net "echo 'Works without password'"
```

### Issue 2: Wrong Tailscale Hostname

**Problem:** The hostname might be different.

**Solution:** Check your actual Tailscale hostname:
```bash
# On your Mac, list all Tailscale devices
tailscale status

# Look for the Foundry server and note its exact hostname
```

If the hostname is different, update the Claude config with the correct one.

### Issue 3: Backend Not Running

**Problem:** Backend process died.

**Solution:** Start it from your Mac:
```bash
ssh foundry@minskin-chinstrap.ts.net "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && nohup node backend.js > /tmp/backend.log 2>&1 & echo 'Backend started'"
```

### Issue 4: Claude Desktop Not Restarting Properly

**Problem:** Config changes not taking effect.

**Solution:**
```bash
# Kill all Claude processes
pkill -9 Claude

# Wait 5 seconds
sleep 5

# Open Claude Desktop
open -a Claude
```

### Issue 5: SSH Config Issues

**Problem:** SSH might need additional configuration.

**Solution:** Add to `~/.ssh/config`:
```
Host minskin-chinstrap.ts.net
    User foundry
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

## Alternative: Test with Local MCP Wrapper

If SSH is problematic, you can test with a local wrapper that proxies to the remote backend:

```bash
# Create a local test wrapper
cat > ~/test-mcp-local.sh << 'EOF'
#!/bin/bash
ssh foundry@minskin-chinstrap.ts.net "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
EOF

chmod +x ~/test-mcp-local.sh

# Test it
~/test-mcp-local.sh
# Press Ctrl+C to exit if it waits for input
```

Then use in Claude config:
```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "/Users/YOUR_USERNAME/test-mcp-local.sh",
            "args": [],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
```

## Debug Output

When something fails, collect this info:

```bash
# 1. Tailscale status
tailscale status > ~/mcp-debug.txt

# 2. SSH test
echo "\n=== SSH Test ===" >> ~/mcp-debug.txt
ssh -v foundry@minskin-chinstrap.ts.net "echo works" 2>&1 >> ~/mcp-debug.txt

# 3. Backend status
echo "\n=== Backend Status ===" >> ~/mcp-debug.txt
ssh foundry@minskin-chinstrap.ts.net "ss -tlnp | grep -E '31414|31415|31416'" >> ~/mcp-debug.txt

# 4. Claude config
echo "\n=== Claude Config ===" >> ~/mcp-debug.txt
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json >> ~/mcp-debug.txt

# 5. View debug file
cat ~/mcp-debug.txt
```

## Success Indicators

When working, you should see:

✅ **In Terminal:**
- `ssh foundry@minskin-chinstrap.ts.net "echo works"` → prints "works" without asking password
- Backend ports (31414, 31415, 31416) are listening

✅ **In Claude Desktop:**
- 🔨 Hammer icon appears in the UI
- When you type a message, Claude shows it's using MCP tools

✅ **Test Message:**
Ask Claude: "What actors are in my Foundry world?"
Claude should list your Foundry characters.

