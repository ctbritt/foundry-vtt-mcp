# RunPod Integration Quick Start

## ✅ Status: Code is deployed to GitHub master branch

Your RunPod integration is complete and ready. Follow these steps to activate it.

---

## 🔧 Setup Checklist

### 1. Fix RunPod Workers (Do This First!)
**Problem**: Workers are currently throttled  
**Fix**: 
- Go to https://www.runpod.io/console/serverless
- Find endpoint: `pnto5no6s7j0c9`
- Add credits ($2-3 recommended for testing)
- Ensure "Max Workers" > 0
- Status should show workers as "ready" not "throttled"

**Test it works**:
```bash
cd /home/foundry/foundry-vtt-mcp
node test-runpod-workflow.js
```
Should complete in ~90 seconds, not stay in queue.

---

### 2. Restart MCP Server

On `foundry.azthir-terra.com`:

```bash
# Stop existing MCP server
pkill -f "foundry-mcp"

# Start new version
cd /home/foundry/foundry-vtt-mcp
nohup node packages/mcp-server/dist/index.js > /tmp/mcp-server.log 2>&1 &

# Verify it started
tail -20 /tmp/mcp-server.log
```

**Look for this line**:
```
Map generation using RunPod serverless
S3 uploader initialized
```

---

### 3. Configure Claude Desktop

On your **M1 or M2 Mac**:

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "foundry-mcp": {
      "command": "ssh",
      "args": [
        "foundry@foundry.azthir-terra.com",
        "-p", "22",
        "node",
        "/home/foundry/foundry-vtt-mcp/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Then**:
1. Save file
2. Quit Claude Desktop (Cmd+Q)
3. Reopen Claude Desktop
4. Check for "foundry-mcp" in MCP menu (hammer icon)

---

### 4. Test Everything

In Claude Desktop, try these commands:

**Test 1 - Connection**:
```
List all scenes in Foundry
```
Should show your existing scenes.

**Test 2 - Battlemap Generation**:
```
Generate a 1536x1536 desert oasis battlemap with palm trees, 
clear pool, and scattered ruins
```

**Expected Results**:
- Job submits immediately
- Generation takes 60-90 seconds
- Image uploads to S3
- Scene created in Foundry
- You get the S3 URL

---

## 🐛 Troubleshooting

### "Map generation components not initialized"
- Check `.env` exists with `RUNPOD_ENABLED=true`
- Restart MCP server
- Check logs: `tail /tmp/mcp-server.log`

### Jobs stuck "IN_QUEUE"
- RunPod workers still throttled
- Add credits to RunPod account
- Check endpoint status in dashboard

### "MCP backend not connected"
- Restart Claude Desktop
- Verify SSH key auth works: `ssh foundry@foundry.azthir-terra.com`
- Check MCP server logs

### "S3 upload failed"
- Verify credentials in `.env`
- Test: `aws s3 ls s3://rime-of-the-frostmaiden`
- Check bucket permissions

---

## 📁 Important Files

**Server side** (`/home/foundry/foundry-vtt-mcp/`):
- `.env` - Your credentials (already created)
- `/tmp/mcp-server.log` - Runtime logs
- `SECURITY.md` - Security documentation

**Testing**:
- `./validate-remote-setup.sh` - Check configuration
- `./check-secrets.sh` - Verify no secrets in git
- `node test-runpod-workflow.js` - Test RunPod directly

---

## 💰 Cost Monitoring

- **RunPod Dashboard**: https://www.runpod.io/console/serverless
- **Average per image**: ~$0.028 (2.8 cents)
- **Generation time**: ~90 seconds
- **Monthly budget** ($3): ~100 images

---

## 🔒 Security

✅ All credentials server-side only  
✅ No SSH tunnels needed  
✅ Players never see MCP  
✅ S3 images properly secured  

---

## 🆘 Need Help?

**View server logs**:
```bash
tail -f /tmp/mcp-server.log
tail -f /tmp/foundry-mcp-server/mcp-server.log
```

**Check RunPod status**:
```bash
curl -s "https://api.runpod.ai/v2/pnto5no6s7j0c9/health" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" | jq
```

**Verify configuration**:
```bash
./validate-remote-setup.sh
```

---

**Status**: ✅ Code deployed, waiting for RunPod workers  
**Last Updated**: 2025-10-09  
**GitHub**: https://github.com/ctbritt/foundry-vtt-mcp
