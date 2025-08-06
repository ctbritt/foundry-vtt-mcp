import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

interface DiceRollToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class DiceRollTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor(options: DiceRollToolsOptions) {
    this.foundryClient = options.foundryClient;
    this.logger = options.logger;
  }

  getToolDefinitions() {
    return [
      {
        name: 'request-player-rolls',
        description: 'Request dice rolls from players with interactive buttons. Creates roll buttons in Foundry chat that players can click. CRITICAL WORKFLOW: 1) First ask user \"Do you want this to be a PUBLIC roll (visible to all players) or PRIVATE roll (visible to player and GM only)?\" 2) WAIT for their answer 3) Only then call this function with their choice. You CANNOT call this function until the user explicitly answers the public/private question. Supports character-to-player resolution and GM fallback.',
        inputSchema: {
          type: 'object',
          properties: {
            rollType: {
              type: 'string',
              description: 'Type of roll to request (ability, skill, save, attack, initiative, custom)',
              enum: ['ability', 'skill', 'save', 'attack', 'initiative', 'custom']
            },
            rollTarget: {
              type: 'string', 
              description: 'Target for the roll - can be ability name (str, dex, con, int, wis, cha), skill name (perception, insight, stealth, etc.), or custom roll formula'
            },
            targetPlayer: {
              type: 'string',
              description: 'Player name or character name to request the roll from'
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether the roll should be public (true = visible to all players) or private (false = visible only to target player and GM).'
            },
            userConfirmedVisibility: {
              type: 'boolean',
              const: true,
              description: 'REQUIRED: Must be set to true to confirm user has explicitly answered whether they want a public or private roll. You MUST first ask the user \"Do you want this to be a PUBLIC roll (visible to all players) or PRIVATE roll (visible to player and GM only)?\" and WAIT for their explicit answer. Only after they respond should you set this parameter to true and call this function. DO NOT call this function until the user has answered the public/private question.'
            },
            rollModifier: {
              type: 'string',
              description: 'Optional modifier to add to the roll (e.g., "+2", "-1", "+1d4")',
              default: ''
            },
            flavor: {
              type: 'string',
              description: 'Optional flavor text to describe the roll context',
              default: ''
            }
          },
          required: ['rollType', 'rollTarget', 'targetPlayer', 'isPublic', 'userConfirmedVisibility']
        }
      }
    ];
  }

  async handleRequestPlayerRolls(args: any) {
    const schema = z.object({
      rollType: z.enum(['ability', 'skill', 'save', 'attack', 'initiative', 'custom']),
      rollTarget: z.string(),
      targetPlayer: z.string(),
      isPublic: z.boolean(),
      userConfirmedVisibility: z.literal(true),
      rollModifier: z.string().default(''),
      flavor: z.string().default('')
    });

    try {
      const params = schema.parse(args);
      
      // Validation should be handled by schema, but add extra safety checks
      if (typeof params.isPublic !== 'boolean') {
        return 'Please specify whether you want this to be a PUBLIC roll (visible to all players) or PRIVATE roll (visible only to the target player and GM). You must provide either "true" for public or "false" for private.';
      }
      
      if (params.userConfirmedVisibility !== true) {
        return 'You must first ask the user whether they want a PUBLIC roll or PRIVATE roll and wait for their explicit answer before calling this function. Set userConfirmedVisibility to true only after the user has responded.';
      }
      
      const response = await this.foundryClient.query('foundry-mcp-bridge.request-player-rolls', params);
      
      if (response.success) {
        return `Roll request sent successfully! ${response.message}`;
      } else {
        throw new Error(response.error || 'Failed to request player rolls');
      }
    } catch (error) {
      this.logger.error('Error requesting player rolls', error);
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => {
          if (e.path.includes('isPublic')) {
            return 'You must specify whether the roll should be PUBLIC (visible to all players) or PRIVATE (visible only to target player and GM). Please ask the user to clarify this.';
          }
          return e.message;
        });
        return `Parameter error: ${messages.join(', ')}`;
      }
      throw error;
    }
  }
}