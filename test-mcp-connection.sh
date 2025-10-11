#!/bin/bash
# Test MCP Connection Script
# Run this FROM YOUR MAC to test the connection

echo "=== MCP Connection Test ==="
echo

# Test 1: Tailscale connectivity
echo "1. Testing Tailscale connectivity..."
if ping -c 1 minskin-chinstrap.ts.net > /dev/null 2>&1; then
    echo "   ✅ Tailscale ping successful"
else
    echo "   ❌ Cannot ping minskin-chinstrap.ts.net"
    echo "   → Check Tailscale is running and connected"
    exit 1
fi

# Test 2: SSH connectivity
echo
echo "2. Testing SSH connection..."
if ssh -o ConnectTimeout=5 foundry@minskin-chinstrap.ts.net "echo 'SSH works'" 2>/dev/null; then
    echo "   ✅ SSH connection successful"
else
    echo "   ❌ SSH connection failed"
    echo "   → You may need to:"
    echo "      - Set up SSH keys: ssh-copy-id foundry@minskin-chinstrap.ts.net"
    echo "      - Or enter password when prompted"
    exit 1
fi

# Test 3: Check backend is running
echo
echo "3. Checking MCP backend on server..."
BACKEND_CHECK=$(ssh foundry@minskin-chinstrap.ts.net "ss -tlnp 2>/dev/null | grep 31414" 2>/dev/null)
if [ -n "$BACKEND_CHECK" ]; then
    echo "   ✅ Backend is running on port 31414"
else
    echo "   ❌ Backend not running"
    echo "   → Start it with: ssh foundry@minskin-chinstrap.ts.net 'cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && nohup node backend.js &'"
    exit 1
fi

# Test 4: Test the full MCP command
echo
echo "4. Testing MCP wrapper (will timeout after 5 seconds)..."
timeout 5 ssh foundry@minskin-chinstrap.ts.net "cd /home/foundry/foundryuserdata/Data/modules/foundry-mcp-bridge/dist/mcp-server && node index.js" > /dev/null 2>&1
if [ $? -eq 124 ]; then
    echo "   ✅ MCP wrapper started (timed out as expected)"
else
    echo "   ⚠️  MCP wrapper may have issues"
fi

# Test 5: Check Claude config
echo
echo "5. Checking Claude Desktop config..."
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo "   ✅ Config file exists"
    if grep -q "minskin-chinstrap" "$CLAUDE_CONFIG"; then
        echo "   ✅ Config contains Tailscale hostname"
    else
        echo "   ⚠️  Config doesn't contain minskin-chinstrap.ts.net"
        echo "   Current config:"
        cat "$CLAUDE_CONFIG"
    fi
else
    echo "   ❌ Config file not found at: $CLAUDE_CONFIG"
    exit 1
fi

echo
echo "=== All Tests Passed! ==="
echo
echo "If Claude Desktop still can't connect:"
echo "1. Make sure you've COMPLETELY quit Claude Desktop (Cmd+Q)"
echo "2. Reopen Claude Desktop"
echo "3. Check Claude Desktop logs at: ~/Library/Logs/Claude/"
echo "4. Look for errors related to MCP in the logs"

