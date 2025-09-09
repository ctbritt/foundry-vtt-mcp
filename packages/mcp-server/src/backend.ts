import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as net from 'net';
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

const CONTROL_HOST = '127.0.0.1';
const CONTROL_PORT = 31414;

const LOCK_FILE = path.join(os.tmpdir(), 'foundry-mcp-backend.lock');
let lockFd: number | null = null;

function acquireLock(): boolean {
  try {
    try {
      lockFd = fs.openSync(LOCK_FILE, 'wx');
    } catch (err: any) {
      if (err && err.code === 'EEXIST') {
        try {
          const lockData = fs.readFileSync(LOCK_FILE, 'utf8');
          const lockPid = parseInt(lockData.trim(), 10);
          try {
            process.kill(lockPid, 0);
            console.error(`Backend already running with PID ${lockPid}`);
            return false;
          } catch {
            console.error(`Removing stale backend lock for PID ${lockPid}`);
            try { fs.unlinkSync(LOCK_FILE); } catch {}
            lockFd = fs.openSync(LOCK_FILE, 'wx');
          }
        } catch (readErr) {
          console.error('Corrupt backend lock file, removing:', readErr);
          try { fs.unlinkSync(LOCK_FILE); } catch {}
          lockFd = fs.openSync(LOCK_FILE, 'wx');
        }
      } else {
        console.error('Failed to open backend lock file:', err);
        return false;
      }
    }
    if (lockFd === null) return false;
    fs.writeFileSync(lockFd, String(process.pid));
    try { fs.fsyncSync(lockFd); } catch {}
    console.error(`Acquired backend lock with PID ${process.pid}`);
    return true;
  } catch (error) {
    console.error('Failed to acquire backend lock:', error);
    return false;
  }
}

function releaseLock(): void {
  try {
    if (lockFd !== null) { try { fs.closeSync(lockFd); } catch {} lockFd = null; }
    if (fs.existsSync(LOCK_FILE)) { try { fs.unlinkSync(LOCK_FILE); } catch {} }
  } catch (error) {
    console.error('Failed to release backend lock:', error);
  }
}

async function startBackend(): Promise<void> {
  // Logger: file output allowed; avoid stdout noise
  const logger = new Logger({
    level: config.logLevel,
    format: config.logFormat,
    enableConsole: false,
    enableFile: true,
    filePath: path.join(os.tmpdir(), 'foundry-mcp-server', 'mcp-server.log'),
  });

  logger.info('Starting Foundry MCP Backend', {
    version: config.server.version,
    foundryHost: config.foundry.host,
    foundryPort: config.foundry.port,
  });

  // Initialize Foundry client and tools
  const foundryClient = new FoundryClient(config.foundry, logger);
  const characterTools = new CharacterTools({ foundryClient, logger });
  const compendiumTools = new CompendiumTools({ foundryClient, logger });
  const sceneTools = new SceneTools({ foundryClient, logger });
  const actorCreationTools = new ActorCreationTools({ foundryClient, logger });
  const questCreationTools = new QuestCreationTools({ foundryClient, logger });
  const diceRollTools = new DiceRollTools({ foundryClient, logger });
  const campaignManagementTools = new CampaignManagementTools(foundryClient, logger);
  const ownershipTools = new OwnershipTools({ foundryClient, logger });

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

  // Start Foundry connector (owns app port 31415)
  foundryClient.connect().catch((e) => {
    logger.error('Foundry connector failed to start', e);
  });

  // Control channel (TCP JSON-lines)
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let buffer = '';
    socket.on('data', async (chunk: string) => {
      buffer += chunk;
      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;

        try {
          const msg = JSON.parse(line) as { id: string; method: string; params?: any };
          if (msg.method === 'ping') {
            socket.write(JSON.stringify({ id: msg.id, result: { ok: true } }) + '\n');
            continue;
          }
          if (msg.method === 'list_tools') {
            socket.write(JSON.stringify({ id: msg.id, result: { tools: allTools } }) + '\n');
            continue;
          }
          if (msg.method === 'call_tool') {
            const { name, args } = (msg.params || {}) as { name: string; args?: any };
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

                // Actor creation tools
                case 'create-actor-from-compendium':
                  result = await actorCreationTools.handleCreateActorFromCompendium(args);
                  break;
                case 'get-compendium-entry-full':
                  result = await actorCreationTools.handleGetCompendiumEntryFull(args);
                  break;

                // Quest creation tools
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

                default:
                  throw new Error(`Unknown tool: ${name}`);
              }

              const payload = {
                content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }],
              };
              socket.write(JSON.stringify({ id: msg.id, result: payload }) + '\n');
            } catch (e: any) {
              const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
              socket.write(
                JSON.stringify({ id: msg.id, result: { content: [{ type: 'text', text: `Error: ${errorMessage}` }], isError: true } }) + '\n'
              );
            }
            continue;
          }

          // Unknown method
          socket.write(JSON.stringify({ id: msg.id, error: { message: 'Unknown method' } }) + '\n');
        } catch (e: any) {
          try { socket.write(JSON.stringify({ error: { message: e?.message || 'Bad request' } }) + '\n'); } catch {}
        }
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(CONTROL_PORT, CONTROL_HOST, () => {
      logger.info(`Backend control channel listening on ${CONTROL_HOST}:${CONTROL_PORT}`);
      resolve();
    });
    server.on('error', reject);
  });

  // Shutdown hooks
  process.on('SIGINT', () => { foundryClient.disconnect(); releaseLock(); process.exit(0); });
  process.on('SIGTERM', () => { foundryClient.disconnect(); releaseLock(); process.exit(0); });
}

(async function main() {
  if (!acquireLock()) process.exit(0);
  process.on('exit', releaseLock);
  try {
    await startBackend();
  } catch (e: any) {
    console.error('Failed to start backend:', e?.message || e);
    releaseLock();
    process.exit(1);
  }
})();

