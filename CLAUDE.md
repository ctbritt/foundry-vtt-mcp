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
Last Updated: July 30, 2025 - Phase 2 Complete, Ready for User Testing
Status: READY FOR TESTING - All development complete, documentation cleaned up

Completed Features:

✅ Complete MVP with 7 working MCP tools (Phase 1)
✅ Full end-to-end Claude Desktop ↔ Foundry VTT integration
✅ Production-ready architecture with error handling
✅ Phase 2: AI-Powered Actor Creation Complete
✅ Natural Language Processing for creature requests
✅ Comprehensive permission system with safety controls
✅ Transaction-based operations with rollback capability
✅ Advanced error handling with user-friendly messages
✅ Complete testing documentation and user guides

Phase 2: AI-Powered Actor Creation - COMPLETE ✅

System Status: Version 0.2.0 - Ready for End-to-End Testing

New MCP Tools Implemented (Total: 10 tools):
✅ create-actor-from-compendium - Main actor creation with NLP
✅ get-compendium-entry-full - Complete stat block retrieval
✅ validate-actor-creation - Pre-flight permission validation

Enhanced Foundry Module:
✅ Write operation capabilities (createActorFromCompendium, addActorsToScene)
✅ Permission system with 4 safety settings
✅ Bulk operation limits (1-10 actors per request)
✅ Complete audit logging system
✅ Permission system with safety toggles
✅ Transaction manager with automatic rollback
✅ Comprehensive audit logging
✅ Error handling and recovery mechanisms

Technical Achievements:
✅ Intelligent fuzzy matching for compendium searches
✅ Bulk operation limits and safety controls
✅ Natural language parsing for complex requests
✅ Complete data flow from Claude → MCP → Foundry VTT
✅ Version updated to 0.2.0 with cache-busting

Ready for Testing:

🎯 End-to-end testing of complete workflow
🎯 Settings toggle functionality verification
🎯 Natural language processing validation
🎯 Error handling and recovery testing

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

Phase 2: Enhanced Features - Actor Creation Breakthrough - COMPLETED ✅
The Breakthrough Feature - NOW WORKING:
Users can say: "Create a red dragon named Flameheart using the Adult Red Dragon stat block" and Claude automatically:

✅ Searches compendium for "Adult Red Dragon" with intelligent fuzzy matching
✅ Retrieves the complete stat block data with all embedded items/effects
✅ Creates a new actor with custom name "Flameheart" 
✅ Optionally adds to current scene (with permission controls)
✅ Confirms successful creation with detailed feedback

Settings-Based Safety Controls:

✅ Allow Actor Creation: Toggle Claude's ability to create actors (Default: ON)
✅ Allow Scene Modification: Toggle Claude's ability to place tokens (Default: OFF)
✅ Max Actors Per Request: Limit bulk operations 1-10 (Default: 5)
✅ Enable Write Audit Log: Track all Claude actions (Default: ON)

Success Metric - ACHIEVED ✅:
Users can say: "Create three goblin scouts named Sneak, Peek, and Seek" and Claude automatically finds goblin stat blocks, creates three distinct actors, and adds them to the current scene.

Technical Implementation - COMPLETE ✅:

✅ New MCP Tools: create-actor-from-compendium, get-compendium-entry-full, validate-actor-creation
✅ Enhanced Foundry Module: Complete write operation capabilities with safety system
✅ Natural Language Processing: Complex parsing for creature types, names, quantities
✅ Safety Mechanisms: Bulk limits, data validation, transaction rollback, comprehensive error handling

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