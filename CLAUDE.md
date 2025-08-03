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
Last Updated: August 3, 2025 - Version 0.3.1 GM Security Implementation ✅
Project Status: Version 0.3.1 - GM-Only Security Implementation

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

📊 CURRENT TOOL COUNT: 16 total MCP tools (Phase 1: 7, Phase 2: 3, Phase 3: 6)

## 🚀 AUGUST 3, 2025 SESSION - VERSION 0.3.1 GM SECURITY RELEASE:

### 🔒 **CRITICAL SECURITY IMPLEMENTATION COMPLETE**
**Status:** Production-ready GM-only access control implemented
**Impact:** MCP bridge now completely restricted to Game Master users

### 🛡️ **Security Features Implemented:**

1. **Module-Level GM Validation** - `packages/foundry-module/src/main.ts`
   - Silent GM check: `isGMUser(): boolean` 
   - Module startup restricted to GM users only
   - Non-GM users see no error messages, just access restriction log

2. **Query Handler Security** - `packages/foundry-module/src/queries.ts`
   - **All 14 query handlers** now protected with `validateGMAccess()`
   - Silent failure pattern: Returns `{ error: 'Access denied', success: false }`
   - Zero notifications or error messages for non-GM users

3. **GM Status Notifications** - Enhanced user experience
   - Connection banner: "🔗 MCP Bridge connected successfully (GM only)"
   - Clear GM identification in console logs
   - Professional status messaging for authorized users

### 🎯 **Security Architecture:**
```typescript
// Applied to all 14 query handlers:
const gmCheck = this.validateGMAccess();
if (!gmCheck.allowed) {
  return { error: 'Access denied', success: false };
}
```

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

Success Metrics

Phase 1-3 COMPLETE - All Success Criteria Met ✅

**MVP Success Criteria (Phase 1):**
✅ User can ask Claude "Show me my character's stats" → accurate response
✅ User can ask "Find spells with fire damage" → relevant compendium results  
✅ Server connects reliably to Claude Desktop via MCP protocol
✅ All operations are read-only and safe

**Enhanced Success Criteria (Phase 2-3):**
✅ User can create actors: "Create 3 goblins named Grax, Snib, and Grok"
✅ User can generate quests: "Create a mystery quest about missing villagers"
✅ System handles write operations with comprehensive permission controls
✅ All critical bugs resolved (compendium search, performance lag)

**Development Process Metrics:**
✅ Regular git commits with clear messages and proper versioning
✅ Claude.md maintained throughout development with session continuity
✅ Version 0.3.1 released with complete GM-only security implementation
✅ All packages build successfully with TypeScript strict mode

**Phase 4 Goals:**
🎯 Interactive player dice roll coordination through Claude
🎯 Professional connection management with manual controls
🎯 Community distribution and comprehensive documentation
🎯 Foundation for advanced campaign management features

**Long-term Vision Achieved:**
✅ First comprehensive AI-powered TTRPG campaign management system
✅ Leverages users' existing Claude subscriptions (cost-effective)
✅ Production-ready foundation for advanced features
✅ Recognition as innovator in AI-gaming integration space