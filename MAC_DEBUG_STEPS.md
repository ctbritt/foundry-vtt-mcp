# Mac-Side Debugging - Claude Desktop Connection

## Status: Server Side Working ✅

The Foundry MCP Bridge module is successfully connecting to the MCP server, which means:
- ✅ Backend running on server (port 31414)
- ✅ Foundry connector working (port 31415)
- ✅ Server-side setup complete

**Problem:** Claude Desktop on Mac can't reach the server via SSH.

---

## Step-by-Step Mac Debugging

### Step 1: Test SSH Connection (ON YOUR MAC)

Try both hostname options:

```bash
# Option A: Short hostname
ssh foundry@foundry "echo 'SSH Option A works'"

# Option B: Full Tailscale hostname
ssh foundry@foundry.minskin-chinstrap.ts.net "echo 'SSH Option B works'"

# Option C: Direct IP
ssh foundry@100.115.132.122 "echo 'SSH Option C works'"
```

**IMPORTANT:** 
- If it asks for a password, that's the problem! Claude Desktop can't handle password prompts.
- Note which option works without asking for a password.

### Step 2: Set Up Passwordless SSH (if needed)

If SSH asks for a password:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "mac-to-foundry"

# Press Enter for all prompts (accept defaults)

# Copy your public key to the server
# Use whichever hostname worked above (foundry, foundry.minskin-chinstrap.ts.net, or the IP)
ssh-copy-id foundry@foundry

# Test again - should NOT ask for password now
ssh foundry@foundry "echo 'Now it works without password'"
```

### Step 3: Test the Full MCP Command

```bash
# This is the exact command Claude Desktop will run
# Use the hostname that worked in Step 1
ssh foundry@foundry "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"

# If it starts and waits (no output), that's GOOD! Press Ctrl+C to exit.
# If it shows errors, copy them - that's useful debug info.
```

### Step 4: Check/Update Claude Config

```bash
# Check if config exists
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# View current config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Create or update the config** with the hostname that worked in Step 1:

```bash
# Create the directory if needed
mkdir -p ~/Library/Application\ Support/Claude

# Create the config file (replace 'foundry' with whatever hostname worked for you)
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry@foundry",
                "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
            ],
            "env": {
                "FOUNDRY_HOST": "localhost",
                "FOUNDRY_PORT": "31415"
            }
        }
    }
}
EOF

# Verify it was created
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 5: Completely Restart Claude Desktop

```bash
# Kill all Claude processes
pkill -9 Claude

# Wait a moment
sleep 3

# Start Claude Desktop
open -a Claude
```

### Step 6: Check Claude Desktop Logs

```bash
# List recent logs
ls -lt ~/Library/Logs/Claude/ | head -10

# Check for MCP-related errors (look for the most recent file)
tail -100 ~/Library/Logs/Claude/mcp-server-foundry-mcp.log

# Or check all recent logs
grep -r "foundry-mcp" ~/Library/Logs/Claude/ 2>/dev/null | tail -20
```

---

## Common Issues & Solutions

### Issue: "Connection refused" in logs

**Cause:** SSH isn't connecting to the server.

**Solution:** 
- Verify Tailscale is running on your Mac: `tailscale status`
- Test SSH connection: `ssh foundry@foundry "echo works"`
- Try the full hostname: `ssh foundry@foundry.minskin-chinstrap.ts.net "echo works"`

### Issue: SSH asks for password

**Cause:** Claude Desktop can't handle interactive prompts.

**Solution:** Set up SSH keys (see Step 2 above).

### Issue: "Permission denied (publickey)"

**Cause:** SSH key not copied to server or wrong permissions.

**Solution:**
```bash
# Check your SSH key exists
ls -la ~/.ssh/id_*

# Copy it to server again
ssh-copy-id foundry@foundry

# Or manually
cat ~/.ssh/id_ed25519.pub | ssh foundry@foundry "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Issue: Config not taking effect

**Cause:** Claude Desktop not fully restarted or config in wrong location.

**Solution:**
```bash
# Completely quit Claude (not just close window)
pkill -9 Claude

# Verify config location is correct
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Reopen
open -a Claude
```

---

## Expected Success Indicators

When everything works:

✅ **SSH Test (Step 1):**
```bash
$ ssh foundry@foundry "echo works"
works
```
(No password prompt!)

✅ **MCP Command Test (Step 3):**
```bash
$ ssh foundry@foundry "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js"
[sits and waits - press Ctrl+C to exit]
```

✅ **Claude Desktop:**
- Shows 🔨 hammer icon in the interface
- When you ask "What actors are in my Foundry world?" Claude responds with your character list

---

## Alternative: SSH Config Method

If you want cleaner config, add this to `~/.ssh/config`:

```bash
cat >> ~/.ssh/config << 'EOF'

Host foundry-mcp
    HostName foundry
    User foundry
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF
```

Then use simpler Claude config:
```json
{
    "mcpServers": {
        "foundry-mcp": {
            "command": "ssh",
            "args": [
                "foundry-mcp",
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

---

## Send Me This Debug Info

If it still doesn't work, run this and share the output:

```bash
# Create debug file
cat > ~/mcp-debug.txt << 'EOF'
=== Tailscale Status ===
EOF
tailscale status >> ~/mcp-debug.txt 2>&1

cat >> ~/mcp-debug.txt << 'EOF'

=== SSH Test (foundry) ===
EOF
ssh -v foundry@foundry "echo test" >> ~/mcp-debug.txt 2>&1

cat >> ~/mcp-debug.txt << 'EOF'

=== Claude Config ===
EOF
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json >> ~/mcp-debug.txt 2>&1

cat >> ~/mcp-debug.txt << 'EOF'

=== Recent Claude Logs ===
EOF
ls -lt ~/Library/Logs/Claude/ | head -5 >> ~/mcp-debug.txt 2>&1
tail -50 ~/Library/Logs/Claude/mcp*.log >> ~/mcp-debug.txt 2>&1

# View the debug file
cat ~/mcp-debug.txt
```

