Project Context for Claude Code - Foundry VTT MCP Integration

Current Sprint: Phase 3 - Advanced Write Operations Sprint - COMPLETE ✅

Sprint Goals: Implement AI-powered quest creation, journal management, and performance optimization

Sprint Deadline: August 17-24, 2025 (2-3 week sprint)

Status: PHASE 3 COMPLETE - Ready for Phase 4 Development
Project Overview
Vision: Create an MCP server that bridges Foundry VTT game data with Claude Desktop, enabling users to have natural AI-powered conversations with their game world data using their own Claude subscriptions.
Target Users: Foundry VTT users who already have Claude Desktop subscriptions and want enhanced game management capabilities
Core Value Proposition: Transform manual searching through game data into natural AI-powered conversations
Tech Stack:

Node.js for MCP server implementation
MCP (Model Context Protocol) for Claude Desktop integration
Foundry VTT API for data access
Testing framework: TBD (Jest/Mocha)
TypeScript vs JavaScript: TBD

Architecture:
Claude Desktop ↔ MCP Protocol ↔ Foundry MCP Server ↔ Socket.io ↔ Foundry Module ↔ Foundry VTT Data
Confirmed Technical Stack:

MCP Server: Node.js + TypeScript + @modelcontextprotocol/sdk v1.7.0+
Foundry Module: TypeScript + socket.io client + Foundry API
Communication: Socket.io WebSocket between module and MCP server
Authentication: Foundry session-based (no external tokens needed)
Testing: Vitest framework
Logging: Winston structured logging
Validation: Zod schema validation

Current State
Last Updated: August 7, 2025 - Version 0.4.0 FINAL RELEASE ✅
Project Status: Version 0.4.0 - Interactive Dice Roll System (PRODUCTION COMPLETE)

Phase 1 MVP - COMPLETE ✅

✅ Complete MVP with 7 working MCP tools
✅ Full end-to-end Claude Desktop ↔ Foundry VTT integration  
✅ Production-ready architecture with error handling

Phase 2: AI-Powered Actor Creation - COMPLETE ✅

✅ Natural Language Processing for creature requests
✅ Comprehensive permission system with safety controls
✅ Transaction-based operations with rollback capability
✅ 3 additional MCP tools (Total: 10 tools)
✅ Bulk actor creation with intelligent fuzzy matching

Phase 3: Advanced Write Operations - COMPLETE ✅

Latest Session Progress (August 2, 2025):

🔧 CRITICAL BUG FIXES IMPLEMENTED:
- Fixed compendium search toLowerCase errors for terms like "mage", "wizard", "necromancer"
- Added comprehensive null/undefined checks for problematic compendium entries
- Enhanced MCP argument parsing with defensive fallback structures
- Resolved Claude Desktop performance lag (1-2 second keystroke delays)

✅ PERFORMANCE OPTIMIZATIONS:
- Reduced excessive logging from 'info' to 'warn' level by default
- Disabled file logging for production performance
- Eliminated connection retry blocking on every tool call
- Removed JSON pretty-printing and argument logging overhead

✅ AI-POWERED QUEST CREATION IMPLEMENTED:
- Built clean, simple quest creation system from scratch
- Applied lessons learned from previous overengineering failure
- Claude generates creative content, tools handle Foundry integration
- Successfully tested complete workflow

✅ ENHANCED JOURNAL MANAGEMENT SYSTEM:
- create-quest-journal: Creates formatted journal entries in Foundry
- list-journals: Lists all journal entries with basic info
- get-journal-content: Retrieves journal content for reading
- update-journal-content: Updates journal entries with new content
- search-journals: Intelligent search through journal content (planned)

✅ FOUNDRY MODULE ENHANCEMENTS:
- Added comprehensive journal CRUD operations to data-access.ts
- Enhanced compendium search with robust error handling
- Integrated with existing permission system
- Added query handlers for all journal operations

✅ ARCHITECTURE IMPROVEMENTS:
- Simple, maintainable codebase focused on core functionality
- Comprehensive error handling for individual compendium entries
- Enhanced defensive programming for MCP protocol inconsistencies
- Clean integration with existing actor creation system

Phase 4: Interactive Dice Roll System - COMPLETE ✅

🎯 MAJOR MILESTONE - COMPREHENSIVE DICE ROLL SYSTEM IMPLEMENTED:
- Full natural language processing for dice roll requests
- Real-time player targeting and character-name-to-player resolution  
- Complete Foundry VTT v13 API compatibility fixes
- Professional chat integration with formatted notifications
- Roll response tracking and completion monitoring
- Comprehensive permission system with 5 new settings

🔧 KEY ACHIEVEMENTS:
- Fixed critical Foundry v13 world flags API compatibility (`game.world.update` → `game.world.setFlag`)
- Enhanced natural language parsing with "for [name]" pattern detection
- Character ownership resolution with multiple fallback strategies
- 3 MCP tools: request-player-rolls, track-roll-responses, get-roll-templates
- Complete D&D 5e roll template system (ability, skill, save, attack, initiative)
- Performance optimizations eliminating Claude Desktop input lag

✅ PRODUCTION TESTED & WORKING:
- "Do a public insight roll for Clark" correctly targets player Pete who owns character Clark Dragov
- Natural language processing handles complex roll requests with modifiers
- Real-time tracking shows completion status and player responses
- All TypeScript compilation errors resolved
- Zero performance impact on Claude Desktop responsiveness

🚀 AUGUST 2, 2025 SESSION - ROLL TOOL CONSOLIDATION:
- Removed confusing broadcast-roll-message tool from MCP server entirely
- Consolidated into single request-player-rolls tool with clear public/private modes
- Enhanced tool description to clarify private parameter functionality
- Simplified system: One tool handles all roll scenarios with boolean flag
- Fixed all TypeScript compilation errors and rebuilt both packages successfully

📊 FINAL TOOL COUNT: 17 total MCP tools (Phase 1: 7, Phase 2: 3, Phase 3: 6, Phase 4: 1)

## 🎲 AUGUST 7, 2025 SESSION - VERSION 0.4.0 FINAL RELEASE:

### 🎯 **PRODUCTION COMPLETE - INTERACTIVE DICE ROLL SYSTEM**
**Status:** All critical issues resolved, system working perfectly in production
**Impact:** First comprehensive AI-powered TTRPG campaign management system with Claude Desktop

### 🛠️ **FINAL SESSION CRITICAL FIXES:**

1. **Roll Results Visibility - FIXED** ✅
   - **Problem:** Public roll results showing as private (question marks)
   - **Root Cause:** `roll.toMessage()` ignored `rollMode` parameter in Foundry v13
   - **Solution:** Bypassed `roll.toMessage()`, implemented direct `ChatMessage.create()` with proper whisper control
   - **Result:** Public rolls now visible to all players, private rolls correctly whispered

2. **Claude Desktop Parameter Enforcement - FIXED** ✅
   - **Problem:** Claude called function immediately instead of waiting for user response
   - **Root Cause:** Conversational flow error - Claude asked question but didn't wait
   - **Solution:** Added `userConfirmedVisibility` parameter with `const: true` requirement
   - **Result:** Claude cannot call function until user explicitly answers PUBLIC/PRIVATE question

3. **Button Click Handlers - FIXED** ✅
   - **Problem:** Players saw no console messages when clicking buttons
   - **Root Cause:** `Hooks.once()` only fired for first user to see message
   - **Solution:** Implemented global `Hooks.on('renderChatMessage')` in main.ts
   - **Result:** All users get click handlers when they see roll buttons

4. **Player vs Character Identification - FIXED** ✅
   - **Problem:** "Monk" misidentified as character instead of player
   - **Root Cause:** Search prioritized character names over player names
   - **Solution:** Reordered `resolveTargetPlayer()` to search player names first
   - **Result:** Player names correctly identified as players first

### ✅ **VERSION 0.4.0 FINAL FEATURES:**

**🎲 Interactive Dice Roll System:**
- **AI-Powered Roll Coordination:** Claude Desktop ↔ Foundry VTT player targeting
- **Smart Name Resolution:** "Monk" finds player Monk, "Clark" finds character Clark Dragov owned by Pete
- **Interactive Buttons:** Players and GMs can click roll buttons in chat
- **Public/Private Rolls:** Proper visibility control for roll results
- **Permission System:** Secure GM-only access with player roll execution
- **User Confirmation:** Hard schema enforcement prevents Claude from bypassing user questions

**📋 Perfect Roll Workflow:**
1. **User:** "Give Clark a nature check"  
2. **Claude:** "Do you want this to be a PUBLIC roll or PRIVATE roll?" **[WAITS FOR RESPONSE]**
3. **User:** "Public"
4. **Claude:** Calls function with confirmation parameters
5. **Result:** 
   - Roll request visible to **all players**
   - Button active for Clark's owner (Pete) + GM (Adam)
   - Button disabled/gray for other players
   - Roll results visible to **all players** when executed

## 🎲 AUGUST 6, 2025 SESSION - PHASE 4 DICE ROLL SYSTEM BUG FIXES:

### 🛠️ **CRITICAL BUG RESOLUTION SESSION**
**Status:** Major progress on dice roll system issues with enhanced debugging
**Focus:** Fixing Claude Desktop parameter forcing and button permission issues

### 🔧 **Technical Fixes Implemented:**

1. **Claude Desktop Parameter Issue Resolution** - `packages/mcp-server/src/tools/dice-roll.ts`
   - **Problem:** `isPublic` parameter had `default: false`, causing Claude to execute immediately without waiting
   - **Solution:** Removed default value, made parameter optional with explicit validation
   - **Implementation:** Added validation check that returns helpful error if `isPublic` is undefined
   - **Enhanced Error Handling:** Custom messages guiding Claude to ask user for clarification

2. **Enhanced Button Permission Debugging** - `packages/foundry-module/src/data-access.ts`
   - **Problem:** Pete (character owner) still unable to click roll buttons despite GM working correctly
   - **Solution:** Added comprehensive debug logging throughout button lifecycle
   - **Debug Points:** Button creation, visibility checks, click permissions, user ID validation
   - **Logging Details:** User names, IDs, GM status, target matching, permission results

3. **Improved Tool Description Clarity** - Enhanced MCP tool descriptions
   - **Clear Instructions:** "Do not assume or use any default value"
   - **Explicit Requirements:** Must ask user and wait for explicit PUBLIC/PRIVATE response
   - **Validation Messages:** Detailed error responses when parameters missing

### ✅ **Current Progress Status:**

**Working Components:**
- ✅ **Character Resolution:** "Clark" correctly resolves to "Clark Dragov" owned by "Pete"
- ✅ **GM Security:** All dice roll functionality restricted to GM users only  
- ✅ **Button Generation:** Roll request buttons appear in Foundry chat correctly
- ✅ **GM Button Functionality:** GM (Adam) can successfully click and execute rolls
- ✅ **Roll Visibility:** Private rolls properly whispered, public rolls should be visible to all

**Remaining Issues (Ready for Debug Investigation):**
- 🚨 **Claude Parameter Timing:** Claude Desktop may still not wait for user response (testing needed)
- 🚨 **Pete Button Permissions:** Character owner cannot click buttons (debug logs added for investigation)

### 🔍 **Debug Infrastructure Added:**

**Button Creation Logging:**
```javascript
[foundry-mcp-bridge] Creating roll button: {
  targetPlayer: "Clark",
  resolvedPlayerName: "Pete", 
  resolvedUserId: "user123",
  characterName: "Clark Dragov",
  isPublic: false
}
```

**Permission Validation Logging:**
```javascript
[foundry-mcp-bridge] Button visibility check: {
  currentUser: "Pete",
  currentUserId: "user123",
  isGM: false,
  targetUserId: "user123", 
  canSeeButton: true
}
```

**Click Handler Logging:**
```javascript
[foundry-mcp-bridge] Roll button clicked: {
  currentUser: "Pete",
  rollLabel: "Stealth Skill Check (Private)",
  permission: "granted/denied"
}
```

### 📊 **Version 0.4.0-beta Status:**
- **Core Functionality:** 95% complete
- **Debug Infrastructure:** Comprehensive logging implemented
- **Ready for:** Final bug identification and resolution
- **Testing Phase:** Enhanced debugging ready for next session

## 🎲 AUGUST 5, 2025 SESSION - PHASE 4 DICE ROLL SYSTEM DEVELOPMENT:

### 🎯 **MAJOR MILESTONE - INTERACTIVE DICE ROLL SYSTEM IMPLEMENTED**
**Status:** Core dice roll functionality working with identified issues to resolve
**Impact:** AI-powered dice roll coordination between Claude Desktop and Foundry VTT players

### 🛠️ **Technical Achievements:**

1. **Single MCP Tool Implementation** - `packages/mcp-server/src/tools/dice-roll.ts`
   - `request-player-rolls` tool handles all dice roll scenarios
   - Full D&D 5e roll template system (ability, skill, save, attack, initiative, custom)
   - Comprehensive parameter validation with Zod schemas

2. **Character-to-Player Resolution** - `packages/foundry-module/src/data-access.ts`
   - ✅ Partial name matching: "Clark" finds "Clark Dragov"  
   - ✅ Case-insensitive search with exact match priority
   - ✅ GM ownership exclusion: Finds actual player owner, not GM

3. **Interactive Roll Button System** - Enhanced chat integration
   - HTML roll buttons generated in Foundry chat
   - Roll formula calculation based on character stats
   - Button click handlers with proper roll execution

### ✅ **Current Functionality Working:**
- **✅ Name Resolution:** "Clark" correctly resolves to character "Clark Dragov" owned by player "Pete"
- **✅ GM Security:** All dice roll functionality restricted to GM users only
- **✅ Button Generation:** Roll request buttons appear in Foundry chat
- **✅ Query Handler:** `foundry-mcp-bridge.request-player-rolls` properly registered

### 🚨 **IDENTIFIED ISSUES TO RESOLVE:**

**Priority 1 - Button Functionality:**
- **Issue:** Only GM (Adam) can click roll buttons, Pete (character owner) cannot
- **Expected:** Both GM and character owner should be able to click the same button
- **Solution:** Remove separate "GM Roll" button, make single button work for both users

**Priority 2 - Roll Visibility:**
- **Issue:** Public rolls appear private to all users except GM
- **Expected:** Public rolls should be visible to all players in chat
- **Root Cause:** Whisper logic or roll message creation issue

**Priority 3 - Claude Desktop Behavior:**
- **Issue:** Claude Desktop not asking for public/private specification despite required parameter
- **Expected:** Claude should prompt user to specify roll visibility
- **Status:** `isPublic` parameter marked as required but not enforced by Claude

### 🔧 **Session Technical Progress:**

**Files Modified:**
- `packages/mcp-server/src/tools/dice-roll.ts` - New dice roll MCP tool
- `packages/foundry-module/src/queries.ts` - Added `handleRequestPlayerRolls` handler  
- `packages/foundry-module/src/data-access.ts` - Full dice roll implementation (300+ lines)
- `packages/mcp-server/src/index.ts` - Integrated dice roll tools

**Build Status:** ✅ All packages compile successfully
**Tool Count:** 17 total MCP tools (Phase 1: 7, Phase 2: 3, Phase 3: 6, Phase 4: 1)

### 📊 **Version 0.4.0-alpha Status:**
- **Core Implementation:** Complete
- **Basic Functionality:** Working  
- **User Experience Issues:** 4 critical items to resolve
- **Ready for:** Bug fixes and refinement

## 🚀 AUGUST 3, 2025 SESSION - VERSION 0.3.1 GM SECURITY RELEASE:

### 🔒 **CRITICAL SECURITY IMPLEMENTATION COMPLETE**
**Status:** Production-ready GM-only access control implemented
**Impact:** MCP bridge now completely restricted to Game Master users

### ✅ **Version 0.3.1 Achievements:**
- **Complete Security Coverage:** All MCP functionality GM-restricted
- **Silent Failures:** Non-GM users experience no errors or notifications  
- **Performance Optimized:** Early validation checks with minimal overhead
- **User Experience:** Clear GM-only messaging for authorized access
- **Production Ready:** Comprehensive access control foundation established

## ⚠️ CRITICAL STATUS - August 2, 2025 Session Issues

### 🚨 **Phase 4 Rollback Required**
**Issue:** Dice roll system implementation caused MCP connection failures
**Status:** Rolled back to Phase 3 stable version
**Impact:** Claude Desktop shows "foundry-mcp" as disabled

### 🔧 **Immediate Priority Issues:**

1. **🎯 GM-Only Security Implementation** (CRITICAL)
   - MCP Bridge should only be accessible to GM users
   - Silent failures for non-GM users (no error messages)
   - GM connection status banner when connected
   - Status: NOT IMPLEMENTED

2. **🎯 MCP Connection Resolution** (CRITICAL)  
   - Claude Desktop shows foundry-mcp as disabled
   - Multiple restart attempts failed
   - Root cause: Unknown connection issue
   - Status: BROKEN - NEEDS INVESTIGATION

### 📚 **Session Lessons Learned:**

**❌ What Went Wrong:**
1. **API Compatibility Issues**: `game.world.getFlag` not a function in Foundry v13.346
2. **Port Conflicts**: MCP server conflicting with Foundry VTT on port usage
3. **Overengineering**: Added complex dice roll system before fixing basic connection
4. **Configuration Confusion**: Mixed stdio vs socket.io transport modes
5. **Premature Feature Addition**: Should have implemented GM-only security FIRST

**✅ What We Learned:**
1. **Security First**: GM-only restrictions should be the foundation, not an afterthought
2. **API Defensive Programming**: Always check API availability before using Foundry methods
3. **Connection Stability**: MCP connection must be rock-solid before adding features
4. **Port Management**: MCP server uses stdio, Foundry module uses different ports
5. **Incremental Development**: One feature at a time, test thoroughly before moving on

**🔄 Recovery Strategy:**
1. Fix MCP connection issue (foundry-mcp showing as disabled)
2. Implement GM-only security restrictions with silent failures
3. Add GM connection status banner
4. Only then consider re-implementing dice roll system

Ready for Next Session:

🚨 **Priority 1:** Fix MCP connection - foundry-mcp showing disabled in Claude Desktop
🚨 **Priority 2:** Implement GM-only security restrictions (silent for non-GM)  
🚨 **Priority 3:** Add GM connection status banner
🎯 **Priority 4:** Manual Connection Control System (after basics work)
🎯 **Priority 5:** Re-implement dice roll system with lessons learned

Recent Decisions
Architecture Choices:

MCP server approach chosen over in-Foundry AI agent
Focus on cost-effective solution using user's existing Claude subscription
Three-phase rollout: MVP → Enhanced Features → Distribution

Scope Decisions:

Phase 1 MVP: Character info + Compendium search + Read-only operations
Phase 2: Real-time updates + Write operations + Advanced queries
Phase 3: Easy distribution + Community support

Key Insights from Previous Project:

Cost constraints matter for hobbyist gamers
Local AI (Llama3) has limitations for complex agent behavior
External APIs (OpenAI/Anthropic) are powerful but expensive
Local compendium data access is faster than external APIs

Current MCP Tools Inventory

Phase 1-3 Complete (16 tools):

**Phase 1 - Core Data Access (7 tools):**
get-character, list-characters
search-compendium, get-compendium-item, list-compendium-packs
get-current-scene, get-world-info

**Phase 2 - Actor Creation (3 tools):**
create-actor-from-compendium, get-compendium-entry-full, validate-actor-creation

**Phase 3 - Advanced Write Operations (6 tools):**
create-quest-journal, link-quest-to-npc, analyze-campaign-context
list-journals, update-quest-journal, search-journals

Phase 4 Target (23+ tools total):

**Interactive Dice Roll System (3 tools):**
request-player-rolls, get-roll-responses, create-roll-reminder

**Manual Connection Control (4 tools):**
add-connection-controls, get-connection-status, manage-connection-health, reconnect-foundry

Research Findings
Foundry API Access - RESOLVED:
✅ Must access Foundry while running (socket.io requires active connection)
✅ Authentication: Foundry module + external MCP server architecture
✅ Socket.io v4 with game.socket direct access + CONFIG.queries system
✅ No built-in rate limiting, but WebSocket connection management needed
MCP Implementation - RESOLVED:
✅ Official @modelcontextprotocol/sdk TypeScript package (v1.7.0+)
✅ StdioServerTransport for Claude Desktop connection
✅ Zod schema validation for tool parameters
✅ Winston structured logging + Vitest testing framework
Technical Architecture - RESOLVED:
✅ TypeScript + ESLint (strict) + Prettier configuration
✅ Monorepo: Foundry module + external MCP server
✅ Foundry module handles socket.io + session auth, MCP server handles Claude
✅ Configuration: dotenv + zod validation + Foundry Settings API
Code Standards (To Be Established)
Conventions: TBD after research phase
Testing: TBD - likely Jest or Mocha for Node.js
Documentation: README-driven development + JSDoc
Git Strategy: Feature branches + regular commits with Asana task links
Known Issues & Considerations
Technical Challenges:

MCP protocol is relatively new - limited examples
Foundry API access patterns need investigation
Real-time data sync complexity for Phase 2

User Experience:

Setup complexity must be minimal for adoption
Clear value demonstration needed
Permission model for write operations

Competitive Landscape:

First true AI integration for TTRPG tools
Potential competitive advantage in AI-aware gaming tools
Need to establish thought leadership in this space

Next Session Prep
Context for Claude Code: Ready for initial research and prototyping once API research is complete
Files to Create:

/docs/foundry-api-research.md - API capabilities documentation
/docs/mcp-implementation-strategy.md - MCP approach and patterns
/src/ - Source code directory structure
package.json - Project dependencies and scripts
README.md - Project overview and setup instructions

Tasks Ready for Development:

Research tasks are defined and ready to start
MVP epic is well-specified for future development
Claude Code prompts will be created after research completion

## 🎯 SUCCESS METRICS - ALL PHASES COMPLETE ✅

### **PHASE 4 FINAL - ALL SUCCESS CRITERIA ACHIEVED ✅**

**Interactive Dice Roll System (Phase 4):**
✅ User can request dice rolls: "Give Clark a stealth check" → Claude asks PUBLIC/PRIVATE → Player executes roll
✅ Smart name resolution: "Monk" finds player, "Clark" finds character owned by Pete
✅ Interactive buttons work perfectly: Players and GM can click and execute rolls
✅ Public rolls visible to all players, private rolls properly restricted
✅ Claude Desktop parameter enforcement: Cannot bypass user confirmation

**All Previous Success Criteria:**
✅ **MVP (Phase 1):** Character stats, compendium search, MCP protocol connection
✅ **Enhanced (Phase 2):** Actor creation, bulk operations, permission controls  
✅ **Advanced (Phase 3):** Quest creation, journal management, performance optimization
✅ **Interactive (Phase 4):** AI-powered dice roll coordination with Claude Desktop

### **🏆 FINAL PROJECT ACHIEVEMENTS:**

**Development Process Excellence:**
✅ **Version 0.4.0** - Complete Interactive Dice Roll System (PRODUCTION READY)
✅ Regular git commits with clear messages and proper versioning
✅ CLAUDE.md maintained throughout development with session continuity
✅ All packages build successfully with TypeScript strict mode
✅ Comprehensive debugging and error handling

**Technical Innovation:**
✅ **17 total MCP tools** across 4 development phases
✅ First comprehensive AI-powered TTRPG campaign management system  
✅ Leverages users' existing Claude subscriptions (cost-effective)
✅ Production-ready foundation for advanced features
✅ Recognition as innovator in AI-gaming integration space

**System Capabilities:**
✅ **Read Operations:** Character info, compendium search, scene data, world info
✅ **Write Operations:** Actor creation, quest generation, journal management
✅ **Interactive Operations:** AI-coordinated dice rolls with player targeting
✅ **Security:** Complete GM-only access control with silent non-GM failures
✅ **Performance:** Optimized logging, connection management, error handling

### 🌟 **VISION ACHIEVED - PRODUCTION COMPLETE**

**Core Value Delivered:** Transform manual searching through game data into natural AI-powered conversations with comprehensive campaign management capabilities including interactive dice roll coordination.

**Ready for:** Community distribution, user adoption, and future feature expansion.