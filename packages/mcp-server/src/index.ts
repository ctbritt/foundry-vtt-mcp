#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import { Logger } from './logger.js';
import { FoundryClient } from './foundry-client.js';
import { CharacterTools } from './tools/character.js';
import { CompendiumTools } from './tools/compendium.js';
import { SceneTools } from './tools/scene.js';
import { ActorCreationTools } from './tools/actor-creation.js';
import { QuestCreationTools } from './tools/quest-creation.js';
import { DiceRollTools } from './tools/dice-roll.js';

// Utility to log errors and exit gracefully without corrupting stdio
async function logAndExit(logger: Logger, message: string, error: any): Promise<never> {
  try {
    logger.error(message, error);
  } catch (logErr) {
    // Last resort: write directly to file if logger fails
    const fs = await import('fs');
    const errorLog = `${new Date().toISOString()} ${message}: ${error?.stack || error}\n`;
    try {
      fs.appendFileSync('logs/mcp-server-error.log', errorLog);
    } catch (fsErr) {
      // If we can't even write to file, nothing we can do
    }
  }
  // Give logger time to flush before exiting
  setTimeout(() => process.exit(1), 100);
  
  // TypeScript requires this for never return type
  return new Promise(() => {}) as never;
}

// Initialize logger - disable console for MCP mode to avoid JSON parsing errors
const logger = new Logger({
  level: config.logLevel,
  format: config.logFormat,
  enableConsole: false, // Disabled for MCP stdio communication
  enableFile: false, // Disabled for performance - use only for debugging
  filePath: 'logs/mcp-server.log', // Fixed log file path
});

// Initialize Foundry client
const foundryClient = new FoundryClient(config.foundry, logger);

// Initialize tool handlers
const characterTools = new CharacterTools({ foundryClient, logger });
const compendiumTools = new CompendiumTools({ foundryClient, logger });
const sceneTools = new SceneTools({ foundryClient, logger });
const actorCreationTools = new ActorCreationTools({ foundryClient, logger });
const questCreationTools = new QuestCreationTools({ foundryClient, logger });
const diceRollTools = new DiceRollTools({ foundryClient, logger });

// Create MCP server
const server = new Server(
  {
    name: config.server.name,
    version: config.server.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Collect all tool definitions
const allTools = [
  ...characterTools.getToolDefinitions(),
  ...compendiumTools.getToolDefinitions(),
  ...sceneTools.getToolDefinitions(),
  ...actorCreationTools.getToolDefinitions(),
  ...questCreationTools.getToolDefinitions(),
  ...diceRollTools.getToolDefinitions(),
];

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing available tools');
  return { tools: allTools };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Reduced logging for performance - only log tool name

  try {
    // Check connection status without excessive reconnection attempts
    if (!foundryClient.isReady()) {
      logger.debug('Foundry not connected for tool execution');
      // Don't attempt reconnection on every tool call - this causes lag
      // Connection should be established during startup
    }

    let result: any;

    // Route to appropriate tool handler
    switch (name) {
      // Character tools
      case 'get-character':
        result = await characterTools.handleGetCharacter(args);
        break;
      case 'list-characters':
        result = await characterTools.handleListCharacters(args);
        break;

      // Compendium tools
      case 'search-compendium':
        result = await compendiumTools.handleSearchCompendium(args);
        break;
      case 'get-compendium-item':
        result = await compendiumTools.handleGetCompendiumItem(args);
        break;
      case 'list-compendium-packs':
        result = await compendiumTools.handleListCompendiumPacks(args);
        break;

      // Scene tools
      case 'get-current-scene':
        result = await sceneTools.handleGetCurrentScene(args);
        break;
      case 'get-world-info':
        result = await sceneTools.handleGetWorldInfo(args);
        break;

      // Phase 2: Actor creation tools
      case 'create-actor-from-compendium':
        result = await actorCreationTools.handleCreateActorFromCompendium(args);
        break;
      case 'get-compendium-entry-full':
        result = await actorCreationTools.handleGetCompendiumEntryFull(args);
        break;
      case 'validate-actor-creation':
        result = await actorCreationTools.handleValidateActorCreation(args);
        break;

      // Phase 3: Quest creation tools
      case 'create-quest-journal':
        result = await questCreationTools.handleCreateQuestJournal(args);
        break;
      case 'link-quest-to-npc':
        result = await questCreationTools.handleLinkQuestToNPC(args);
        break;
      case 'analyze-campaign-context':
        result = await questCreationTools.handleAnalyzeCampaignContext(args);
        break;
      case 'update-quest-journal':
        result = await questCreationTools.handleUpdateQuestJournal(args);
        break;
      case 'list-journals':
        result = await questCreationTools.handleListJournals(args);
        break;
      case 'search-journals':
        result = await questCreationTools.handleSearchJournals(args);
        break;

      // Phase 4: Dice roll tools
      case 'request-player-rolls':
        result = await diceRollTools.handleRequestPlayerRolls(args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Tool execution completed successfully - only log errors/warnings

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result),
        },
      ],
    };

  } catch (error) {
    logger.error('Tool execution failed', error);
    
    // Return error in a format Claude can understand
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  logger.info('Starting Foundry MCP Server', {
    version: config.server.version,
    foundryHost: config.foundry.host,
    foundryPort: config.foundry.port,
  });
  
  try {
    // Start MCP server first (don't require Foundry connection)
    logger.info('Starting MCP server...');
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    logger.info('MCP server started successfully', {
      toolsAvailable: allTools.length,
    });

    // Log available tools count only for debugging
    logger.debug(`Available tools: ${allTools.length} registered`);

    // Start WebSocket server for Foundry VTT (non-blocking)
    foundryClient.connect().catch(() => {
      // Silent failure - WebSocket server will be available when needed
    });

  } catch (error) {
    await logAndExit(logger, 'Failed to start server', error);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await shutdown();
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await shutdown();
});

async function shutdown(): Promise<void> {
  try {
    logger.info('Disconnecting from Foundry VTT...');
    foundryClient.disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    await logAndExit(logger, 'Error during shutdown', error);
  }
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  await logAndExit(logger, 'Uncaught exception', error);
});

process.on('unhandledRejection', async (reason, promise) => {
  await logAndExit(logger, 'Unhandled rejection', { reason, promise });
});

// Start the server if this file is run directly
// More robust entry point detection for ES modules
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                   import.meta.url.endsWith(process.argv[1]) ||
                   process.argv[1].endsWith('index.js');

if (isMainModule) {
  main().catch(async (error) => {
    await logAndExit(logger, 'Unhandled error in main', error);
  });
}