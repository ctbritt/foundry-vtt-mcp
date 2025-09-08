#!/usr/bin/env node

// SINGLETON CHECK - Graceful MCP-compatible duplicate process handling  
// This prevents Claude Desktop "Server disconnected" errors by handling duplicates properly
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const LOCK_FILE = path.join(os.tmpdir(), 'foundry-mcp-server.lock');
let isDuplicateProcess = false;

// Create cross-platform log directory
const LOG_DIR = process.env.FOUNDRY_LOG_DIR || path.join(os.tmpdir(), 'foundry-mcp-server');
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
  // Continue without logging if directory creation fails
  console.error(`[WARNING] Cannot create log directory: ${LOG_DIR}`);
}

const ERROR_LOG_PATH = path.join(LOG_DIR, 'mcp-server-error.log');
const MAIN_LOG_PATH = path.join(LOG_DIR, 'mcp-server.log');

// Check if we're a duplicate process
try {
  fs.writeFileSync(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
  // Success - we got the lock, continue with normal execution
  process.on('exit', () => {
    try { fs.unlinkSync(LOCK_FILE); } catch (e) { /* ignore */ }
  });
} catch (error: any) {
  if (error.code === 'EEXIST') {
    // Lock exists - check if process is still alive
    try {
      const existingPid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
      try {
        process.kill(existingPid, 0); // Check if process exists
        // Process exists - we're duplicate, but handle gracefully for Claude Desktop
        isDuplicateProcess = true;
      } catch (killError) {
        // Process dead - remove stale lock and try again
        fs.unlinkSync(LOCK_FILE);
        fs.writeFileSync(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
        process.on('exit', () => {
          try { fs.unlinkSync(LOCK_FILE); } catch (e) { /* ignore */ }
        });
      }
    } catch (readError) {
      // Can't read lock file - mark as duplicate to be safe
      isDuplicateProcess = true;
    }
  } else {
    // Other error - mark as duplicate to be safe
    isDuplicateProcess = true;
  }
}

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
import { CampaignManagementTools } from './tools/campaign-management.js';
import { OwnershipTools } from './tools/ownership.js';

// Utility to log errors and exit gracefully without corrupting stdio
async function logAndExit(logger: Logger, message: string, error: any): Promise<never> {
  try {
    logger.error(message, error);
  } catch (logErr) {
    // Last resort: write directly to file if logger fails
    const fs = await import('fs');
    const errorLog = `${new Date().toISOString()} ${message}: ${error?.stack || error}\n`;
    try {
      fs.appendFileSync(ERROR_LOG_PATH, errorLog);
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
  level: 'info', // Production level
  format: config.logFormat,
  enableConsole: false, // Disabled for MCP stdio communication
  enableFile: process.env.FOUNDRY_DISABLE_LOGGING !== 'true', // Allow disabling file logging
  filePath: MAIN_LOG_PATH,
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
const campaignManagementTools = new CampaignManagementTools(foundryClient, logger);
const ownershipTools = new OwnershipTools({ foundryClient, logger });

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
  ...campaignManagementTools.getToolDefinitions(),
  ...ownershipTools.getToolDefinitions(),
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
      case 'list-creatures-by-criteria':
        result = await compendiumTools.handleListCreaturesByCriteria(args);
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

      // Phase 3: Quest creation tools
      case 'create-quest-journal':
        result = await questCreationTools.handleCreateQuestJournal(args);
        break;
      case 'link-quest-to-npc':
        result = await questCreationTools.handleLinkQuestToNPC(args);
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

      // Phase 5: Campaign management tools
      case 'create-campaign-dashboard':
        result = await campaignManagementTools.handleCreateCampaignDashboard(args);
        break;

      // Phase 6: Actor ownership management tools
      case 'assign-actor-ownership':
        result = await ownershipTools.handleToolCall('assign-actor-ownership', args);
        break;
      case 'remove-actor-ownership':
        result = await ownershipTools.handleToolCall('remove-actor-ownership', args);
        break;
      case 'list-actor-ownership':
        result = await ownershipTools.handleToolCall('list-actor-ownership', args);
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

// Handle duplicate processes gracefully for Claude Desktop compatibility
if (isDuplicateProcess) {
  console.error(`[SINGLETON] Duplicate process ${process.pid} - will provide minimal MCP response and exit gracefully`);
  
  // Start a minimal MCP server that responds to basic protocol but does nothing
  const duplicateServer = new Server(
    { name: 'foundry-mcp-duplicate', version: '0.0.1' },
    { capabilities: { tools: {} } }
  );
  
  // Handle basic protocol requirements
  duplicateServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [] }; // Empty tools list
  });
  
  // Start minimal server and exit gracefully after a short delay
  const transport = new StdioServerTransport();
  duplicateServer.connect(transport).then(() => {
    console.error(`[SINGLETON] Duplicate process ${process.pid} connected, will exit after 1 second`);
    setTimeout(() => {
      console.error(`[SINGLETON] Duplicate process ${process.pid} exiting gracefully`);
      process.exit(0);
    }, 1000);
  }).catch(() => {
    // If connection fails, just exit
    process.exit(0);
  });
} else {
  // Normal process - continue with full initialization
  console.error(`[SINGLETON] Process ${process.pid} continuing - singleton verified`);
  logger.info(`MCP Server process started - PID: ${process.pid}, Args: ${JSON.stringify(process.argv)}`);

  // Start the main server initialization
  main().catch(async (error) => {
    await logAndExit(logger, 'Unhandled error in main', error);
  });
}