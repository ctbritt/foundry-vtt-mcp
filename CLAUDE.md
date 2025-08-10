# Project Context for Claude Code - Foundry VTT MCP Integration

## Project Overview
**Vision:** Create an MCP server that bridges Foundry VTT game data with Claude Desktop, enabling natural AI-powered conversations with game world data using users' existing Claude subscriptions.

**Architecture:** Claude Desktop ↔ MCP Protocol ↔ Foundry MCP Server ↔ Socket.io ↔ Foundry Module ↔ Foundry VTT Data

**Tech Stack:**
- MCP Server: Node.js + TypeScript + @modelcontextprotocol/sdk v1.7.0+
- Foundry Module: TypeScript + socket.io client + Foundry API
- Communication: Socket.io WebSocket between module and MCP server
- Authentication: Foundry session-based (no external tokens needed)
- Testing: Vitest framework, Winston logging, Zod validation

## Current Status
**Version:** 0.4.5 - All MCP Tools Working Without Permission Errors
**Last Updated:** August 9, 2025 - Settings Permission System Fixed & Read Operations Unlocked

## Development Phases - ALL COMPLETE ✅

### Phase 1: MVP - Core Data Access (7 tools)
✅ get-character, list-characters
✅ search-compendium, get-compendium-item, list-compendium-packs
✅ get-current-scene, get-world-info

### Phase 2: AI-Powered Actor Creation (3 tools)
✅ create-actor-from-compendium, get-compendium-entry-full, validate-actor-creation
✅ Natural language processing for creature requests
✅ Comprehensive permission system with safety controls
✅ Bulk actor creation with intelligent fuzzy matching

### Phase 3: Advanced Write Operations (6 tools)
✅ create-quest-journal, link-quest-to-npc, analyze-campaign-context
✅ list-journals, update-quest-journal, search-journals
✅ Settings system overhaul with professional UI
✅ Native Foundry `registerMenu()` integration with tabbed interface

### Phase 4: Interactive Dice Roll System (1 tool)
✅ request-player-rolls - Complete AI-powered dice roll coordination
✅ Smart name resolution: "Monk" finds player, "Clark" finds character owned by Pete
✅ Interactive buttons for players and GM to execute rolls
✅ Public/private roll visibility with proper whisper control
✅ Claude Desktop parameter enforcement prevents bypassing user confirmation

**Final Tool Count:** 17 total MCP tools across all phases

## Major Technical Achievements

### Persistent Enhanced Index System (August 9, 2025)
**Problem:** Foundry's built-in compendium indexes lack creature metadata (CR, type, HP, AC, etc.), causing 2+ minute search timeouts
**Solution:** File-based persistent index pre-extracting all creature data
- **Storage:** `worlds/[world-id]/enhanced-creature-index.json` (1-5MB, separate from world data)
- **Performance:** Instant results for any filter combination vs 2+ minute timeouts
- **Change Detection:** Pack fingerprinting with real-time Foundry hooks for auto-invalidation
- **User Experience:** 30-60 second one-time build, then instant comprehensive creature surveys

### "Survey and Select" Creature Discovery (August 7, 2025)
**Revolutionary Paradigm:** Replaced inefficient "Hunt and Check" with comprehensive discovery
- **Intelligent Pack Prioritization:** 5-tier system prioritizing D&D 5e core content first
- **Parameter Validation:** Fixed critical Zod union type ordering for range objects
- **Result Limits:** Increased from 100 to 500 default (max 1000) for complete surveys
- **Impact:** Eliminates random pack selection, provides comprehensive creature discovery

### Interactive Dice Roll System (August 5-7, 2025)
**Core Features:**
- AI-powered roll coordination between Claude Desktop and Foundry VTT players
- Character-to-player resolution with partial name matching
- Interactive HTML buttons in Foundry chat with proper click handlers
- Public/private roll visibility control with proper whisper logic

**Critical Fixes:**
- Fixed Foundry v13 API compatibility (`game.world.update` → `game.world.setFlag`)
- Resolved Claude Desktop parameter enforcement with `userConfirmedVisibility` requirement
- Fixed button click handlers with global `Hooks.on('renderChatMessage')` registration
- Corrected player vs character identification priority

**Perfect Workflow:**
1. User: "Give Clark a nature check"
2. Claude: "Do you want this to be a PUBLIC roll or PRIVATE roll?" [WAITS FOR RESPONSE]
3. User: "Public"
4. Result: Roll request visible to all players, button active for character owner + GM

### Settings System Overhaul (August 6 & 9, 2025)
**UI Improvements:**
- Removed 5 technical settings that cluttered interface
- Consolidated multiple permission settings into single "allowWriteOperations" toggle
- Professional FormApplication with native Foundry styling
- DDB Importer-style dark theme with proper CSS variables

**Permission Architecture Simplification:**
- **Read Operations (No Restrictions):** Character access, compendium search, scene data, world info, dice roll requests
- **Write Operations (Gated by allowWriteOperations):** Actor creation, journal management, campaign analysis

## Critical Lessons Learned

### August 2, 2025 Session - Connection Failures
**Issues:** Dice roll system implementation caused MCP connection failures, Claude Desktop showed "foundry-mcp" as disabled
**Root Causes:** API compatibility issues (`game.world.getFlag` not function in Foundry v13.346), port conflicts, premature feature addition
**Recovery Strategy:** Security-first approach, incremental development, thorough testing before feature addition

### Performance Optimization Insights
- **Foundry API Defensive Programming:** Always check API availability before using methods
- **Connection Stability:** MCP connection must be rock-solid before adding features
- **One Feature at a Time:** Thorough testing before moving to next feature
- **Change Detection:** Pack fingerprinting prevents unnecessary rebuilds

## Success Metrics - ALL ACHIEVED ✅

### Phase 4 Final - Interactive Dice Roll System
✅ User can request dice rolls with natural language
✅ Smart name resolution works correctly
✅ Interactive buttons function for both players and GM
✅ Public/private roll visibility properly implemented
✅ Claude Desktop parameter enforcement prevents bypasses

### Overall Project Success
✅ **17 total MCP tools** across 4 development phases
✅ First comprehensive AI-powered TTRPG campaign management system
✅ Production-ready foundation leveraging users' existing Claude subscriptions
✅ Complete GM-only security with silent non-GM failures
✅ Optimized performance with structured logging and error handling

## Final Architecture

### Permission System
- **GM-Only Access:** All MCP functionality restricted to Game Master users
- **Silent Failures:** Non-GM users experience no errors or notifications
- **Read Operations:** Unrestricted access to character, compendium, scene, journal data
- **Write Operations:** Gated by single `allowWriteOperations` setting

### File-Based Storage
- Enhanced creature index stored in world directory following Foundry best practices
- JSON format with metadata versioning and change detection
- Separate from world database with zero impact on loading times
- Automatic rebuilding on pack changes with manual override option

### Performance Characteristics
- **Search Performance:** Instant results vs previous 2+ minute timeouts
- **Connection Stability:** Robust WebSocket management with auto-reconnect
- **Error Handling:** Comprehensive fallback mechanisms and user feedback
- **Resource Usage:** Minimal overhead with early validation checks

## Ready For
Community distribution, user adoption, and future feature expansion.

**Core Value Delivered:** Transform manual searching through game data into natural AI-powered conversations with comprehensive campaign management capabilities including interactive dice roll coordination.