#!/usr/bin/env node
/**
 * Foundry VTT MCP Server v2 - Simplified Architecture
 * 
 * Runs:
 * - HTTP server for health checks and status
 * - WebSocket server for Foundry module communication
 * - stdio transport for MCP protocol (Claude/mcporter)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import { Logger, LoggerConfig } from './logger.js';
import { FoundryMCPHttpServer } from './http-server.js';
import { FoundryWSServer } from './ws-server.js';
import { FoundryClientV2 } from './foundry-client-v2.js';

// Tool imports
import { CharacterTools } from './tools/character.js';
import { CompendiumTools } from './tools/compendium.js';
import { SceneTools } from './tools/scene.js';
import { ActorCreationTools } from './tools/actor-creation.js';
import { QuestCreationTools } from './tools/quest-creation.js';
import { DiceRollTools } from './tools/dice-roll.js';
import { CampaignManagementTools } from './tools/campaign-management.js';
import { OwnershipTools } from './tools/ownership.js';
import { TokenManipulationTools } from './tools/token-manipulation.js';
import { MapGenerationTools } from './tools/map-generation.js';

// Logger setup
const loggerConfig: LoggerConfig = {
  level: config.logLevel,
  format: config.logFormat,
  enableConsole: true,
  enableFile: config.enableFileLogging
};
if (config.logFilePath) {
  loggerConfig.filePath = config.logFilePath;
}
const logger = new Logger(loggerConfig);

// Environment configuration
const HTTP_PORT = parseInt(process.env.FOUNDRY_MCP_PORT || '31415');
const WS_PORT = parseInt(process.env.FOUNDRY_MCP_WS_PORT || '31417');

logger.info('Starting Foundry MCP Server v2', {
  httpPort: HTTP_PORT,
  wsPort: WS_PORT,
  note: 'Simple WebSocket architecture'
});

// Initialize WebSocket server and client
const wsServer = new FoundryWSServer(WS_PORT);
const foundryClient = new FoundryClientV2(wsServer, logger) as any;

// Initialize tools with the v2 client (cast to any for type compatibility)
const characterTools = new CharacterTools({ foundryClient, logger } as any);
const compendiumTools = new CompendiumTools({ foundryClient, logger } as any);
const sceneTools = new SceneTools({ foundryClient, logger } as any);
const actorCreationTools = new ActorCreationTools({ foundryClient, logger } as any);
const questCreationTools = new QuestCreationTools({ foundryClient, logger } as any);
const diceRollTools = new DiceRollTools({ foundryClient, logger } as any);
const campaignManagementTools = new CampaignManagementTools(foundryClient, logger);
const ownershipTools = new OwnershipTools({ foundryClient, logger } as any);
const tokenManipulationTools = new TokenManipulationTools({ foundryClient, logger } as any);
const mapGenerationTools = new MapGenerationTools({ foundryClient, logger } as any);

/**
 * Main tool router - handles all MCP tool calls
 */
async function handleToolCall(name: string, args: any): Promise<any> {
  logger.info('Tool call', { tool: name, connected: foundryClient.isConnected() });

  try {
    let result: any;

    switch (name) {
      // Character tools
      case 'get-character':
        result = await characterTools.handleGetCharacter(args);
        break;
      case 'list-characters':
        result = await characterTools.handleListCharacters(args);
        break;
      case 'get-character-entity':
        result = await characterTools.handleGetCharacterEntity(args);
        break;
      case 'use-item':
        result = await characterTools.handleUseItem(args);
        break;
      case 'search-character-items':
        result = await characterTools.handleSearchCharacterItems(args);
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
      case 'list-scenes':
        result = await mapGenerationTools.listScenes(args);
        break;
      case 'switch-scene':
        result = await mapGenerationTools.switchScene(args);
        break;

      // Actor creation tools
      case 'create-actor-from-compendium':
        result = await actorCreationTools.handleCreateActorFromCompendium(args);
        break;
      case 'get-compendium-entry-full':
        result = await actorCreationTools.handleGetCompendiumEntryFull(args);
        break;

      // Quest/Journal tools
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

      // Dice roll tools
      case 'request-player-rolls':
        result = await diceRollTools.handleRequestPlayerRolls(args);
        break;

      // Campaign management tools
      case 'create-campaign-dashboard':
        result = await campaignManagementTools.handleCreateCampaignDashboard(args);
        break;

      // Ownership tools
      case 'assign-actor-ownership':
        result = await ownershipTools.handleToolCall('assign-actor-ownership', args);
        break;
      case 'remove-actor-ownership':
        result = await ownershipTools.handleToolCall('remove-actor-ownership', args);
        break;
      case 'list-actor-ownership':
        result = await ownershipTools.handleToolCall('list-actor-ownership', args);
        break;

      // Token manipulation tools
      case 'move-token':
        result = await tokenManipulationTools.handleMoveToken(args);
        break;
      case 'update-token':
        result = await tokenManipulationTools.handleUpdateToken(args);
        break;
      case 'delete-tokens':
        result = await tokenManipulationTools.handleDeleteTokens(args);
        break;
      case 'get-token-details':
        result = await tokenManipulationTools.handleGetTokenDetails(args);
        break;
      case 'toggle-token-condition':
        result = await tokenManipulationTools.handleToggleTokenCondition(args);
        break;
      case 'get-available-conditions':
        result = await tokenManipulationTools.handleGetAvailableConditions(args);
        break;

      // Map generation tools
      case 'generate-map':
        result = await mapGenerationTools.generateMap(args);
        break;
      case 'check-map-status':
        result = await mapGenerationTools.checkMapStatus(args);
        break;
      case 'cancel-map-job':
        result = await mapGenerationTools.cancelMapJob(args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      isError: false
    };

  } catch (error: any) {
    logger.error('Tool call failed', { tool: name, error: error.message });
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
}

async function main() {
  // Start WebSocket server for Foundry connections
  await wsServer.start();
  logger.info('WebSocket server started', { port: WS_PORT });

  // Start HTTP server for health checks
  const httpServer = new FoundryMCPHttpServer(HTTP_PORT, async (tool, args) => {
    const result = await handleToolCall(tool, args);
    if (result.isError) {
      throw new Error(result.content[0].text);
    }
    return JSON.parse(result.content[0].text);
  });

  await httpServer.start();
  logger.info('HTTP server started', { port: HTTP_PORT });

  // Start MCP stdio server
  const mcpServer = new Server(
    {
      name: 'foundry-vtt-mcp',
      version: '2.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register list tools handler (returns empty for now - tools discovered via mcporter list)
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [] };
  });

  // Register call tool handler
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params as any;
    return await handleToolCall(name, args || {});
  });

  // Connect stdio transport
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info('MCP stdio server connected');

  // Log connection status periodically
  setInterval(() => {
    if (wsServer.isConnected()) {
      logger.info('Foundry connection active', { clients: wsServer.getClientCount() });
    }
  }, 60000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await wsServer.stop();
    await httpServer.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Server failed to start', { error: error.message });
  console.error(error);
  process.exit(1);
});
