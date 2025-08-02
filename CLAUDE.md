Project Context for Claude Code - Foundry VTT MCP Integration
Current Sprint: Discovery & Setup Sprint
Sprint Goals: Complete foundational research and establish technical architecture
Sprint Deadline: August 3, 2025 (1 week sprint)
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
Last Updated: August 2, 2025 - Phase 3 Quest Creation - COMPLETE ✅
Project Status: Version 0.2.1 - Journal Creation Bug Fix

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

✅ AI-POWERED QUEST CREATION IMPLEMENTED:
- Built clean, simple quest creation system from scratch
- Applied lessons learned from previous overengineering failure
- Claude generates creative content, tools handle Foundry integration
- Successfully tested complete workflow

✅ NEW MCP TOOLS ADDED (3 tools):
- create-quest-journal: Creates formatted journal entries in Foundry
- link-quest-to-npc: Connects quests to existing/new NPCs  
- analyze-campaign-context: Extracts NPCs, locations, plot elements from documents

✅ FOUNDRY MODULE ENHANCEMENTS:
- Added journal creation capability to data-access.ts
- Integrated with existing permission system
- Added createJournalEntry query handler

✅ ARCHITECTURE IMPROVEMENTS:
- Simple, maintainable codebase focused on core functionality
- No templated content - Claude provides all creative generation
- Clean integration with existing actor creation system
- Comprehensive error handling and validation

📊 CURRENT TOOL COUNT: 13 total MCP tools (Phase 1: 7, Phase 2: 3, Phase 3: 3)

Ready for Phase 4 Development:

🎯 Interactive Dice Roll System (Priority 2)
🎯 Manual Connection Control System (Priority 3)  
🎯 Advanced campaign management features
🎯 Community distribution and documentation

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

Phase 1-3 Complete (13 tools):

get-character, list-characters
search-compendium, get-compendium-item, list-compendium-packs
get-current-scene, get-world-info  
create-actor-from-compendium, get-compendium-entry-full, validate-actor-creation
create-quest-journal, link-quest-to-npc, analyze-campaign-context

Phase 4 Target (20+ tools total):

request-player-rolls, get-roll-responses, create-roll-reminder
add-connection-controls, get-connection-status, manage-connection-health

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
MVP Success Criteria:

User can ask Claude "Show me my character's stats" → accurate response
User can ask "Find spells with fire damage" → relevant compendium results
Server connects reliably to Claude Desktop via MCP protocol
All operations are read-only and safe

Development Process Metrics:

Regular git commits with clear messages
Asana tasks updated with progress
claude.md maintained throughout development
Session continuity preserved across breaks

Long-term Goals:

Active user community providing feedback
Foundation for advanced features (Phase 2+)
Recognition as innovator in AI-gaming integration space