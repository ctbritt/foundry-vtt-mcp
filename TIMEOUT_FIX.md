# get-character Timeout Fix

## Status

✅ Claude Desktop connected to MCP server  
✅ Some tools work (list-characters, actor count)
❌ get-character times out

## Problem

The `get-character` tool sends a query to Foundry: `foundry-mcp-bridge.getCharacterInfo`

This query is timing out, which means either:
1. The query handler in Foundry is stuck/erroring
2. The character data is too complex and takes too long
3. There's an infinite loop in the data serialization

## What You Need to Do

### Step 1: Check Foundry Browser Console

1. Open Foundry in browser: https://foundry.azthir-terra.com
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Look for errors related to:
   - `getCharacterInfo`
   - `foundry-mcp-bridge`
   - Any red error messages

### Step 2: Test in Console

While in Foundry browser console, paste this:

```javascript
// Test if the query handler exists
CONFIG.queries['foundry-mcp-bridge.getCharacterInfo']

// Test calling it with a simple character
const testChar = game.actors.contents[0];
console.log('Test character:', testChar?.name);

// Try calling the handler
try {
  const result = await CONFIG.queries['foundry-mcp-bridge.getCharacterInfo']({ characterName: testChar?.name });
  console.log('Result:', result);
} catch(e) {
  console.error('Error:', e);
}
```

This will tell us if the query handler is working in Foundry itself.

### Step 3: Check Which Tools Work

Try these in Claude Desktop and tell me which work:
- "List all characters" (list-characters)
- "Get character information for [CharacterName]" (get-character) ← THIS TIMES OUT
- "What's in the current scene?" (get-scene-info)
- "Search for longsword in compendium" (search-compendium)

### Step 4: Try a Different Character

If you're testing with a specific character, try a different one. Some characters might have:
- Circular references in their data
- Extremely large item counts
- Complex effects that cause serialization issues

## Likely Causes

### 1. Character Data Too Large

The `getCharacterInfo` function serializes:
- Character system data
- All items with full system data
- All effects with durations

If a character has hundreds of items, this could timeout.

**Quick Fix:** Test with a simple NPC instead of a complex PC.

### 2. Circular References

Some Foundry objects have circular references that cause JSON serialization to hang.

The `sanitizeData` function should handle this, but check the console for errors.

### 3. Module Not Fully Loaded

The module might be partially loaded. Try:
1. Disable the module
2. Save
3. Re-enable the module
4. Reload the world

## Diagnostic Commands

```bash
# Check if Foundry module is actually connected to backend
pm2 logs foundry --lines 100 --nostream | grep -i "mcp"

# Monitor backend for incoming queries
tail -f /tmp/foundry-mcp-server/mcp-server.log | grep -v "ComfyUI"

# Check connection status
ss -tnp | grep 31415
```

## Next Steps

1. Run the console test in Foundry (Step 2)
2. Share any error messages from Foundry console
3. Try with a simple NPC character
4. Let me know which tools work and which don't

This will help narrow down if it's a connection issue or a data processing issue.

