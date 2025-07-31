import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export interface ActorCreationToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

// Natural Language Processing helpers
interface ParsedCreatureRequest {
  creatureType: string;
  customNames: string[];
  quantity: number;
  statBlockHint?: string | undefined;
  addToScene: boolean;
}

interface CreatureMatch {
  name: string;
  type: string;
  pack: string;
  packLabel: string;
  confidence: number;
}

export class ActorCreationTools {
  private foundryClient: FoundryClient;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor({ foundryClient, logger }: ActorCreationToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'ActorCreationTools' });
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Tool definitions for actor creation operations
   */
  getToolDefinitions() {
    return [
      {
        name: 'create-actor-from-compendium',
        description: 'Create one or more actors from compendium monsters with custom names using natural language',
        inputSchema: {
          type: 'object',
          properties: {
            creatureType: {
              type: 'string',
              description: 'Type of creature to create (e.g., "goblin", "red dragon", "orc warrior")',
            },
            names: {
              type: 'array',
              items: { type: 'string' },
              description: 'Custom names for the created actors (e.g., ["Flameheart", "Sneak", "Peek"])',
              minItems: 1,
            },
            quantity: {
              type: 'number',
              description: 'Number of actors to create (default: based on names array length)',
              minimum: 1,
              maximum: 10,
            },
            statBlockHint: {
              type: 'string',
              description: 'Optional hint for specific stat block (e.g., "Adult", "CR 5", "Warrior variant")',
            },
            addToScene: {
              type: 'boolean',
              description: 'Whether to add created actors to the current scene as tokens',
              default: false,
            },
          },
          required: ['creatureType', 'names'],
        },
      },
      {
        name: 'get-compendium-entry-full',
        description: 'Retrieve complete stat block data including items, spells, and abilities for actor creation',
        inputSchema: {
          type: 'object',
          properties: {
            packId: {
              type: 'string',
              description: 'Compendium pack identifier',
            },
            entryId: {
              type: 'string',
              description: 'Entry identifier within the pack',
            },
          },
          required: ['packId', 'entryId'],
        },
      },
      {
        name: 'validate-actor-creation',
        description: 'Validate if an actor creation request is allowed and will succeed',
        inputSchema: {
          type: 'object',
          properties: {
            creatureType: {
              type: 'string',
              description: 'Type of creature to validate',
            },
            quantity: {
              type: 'number',
              description: 'Number of actors to create',
              minimum: 1,
              maximum: 10,
            },
            checkScene: {
              type: 'boolean',
              description: 'Whether to also check scene modification permissions',
              default: false,
            },
          },
          required: ['creatureType', 'quantity'],
        },
      },
    ];
  }

  /**
   * Handle actor creation from compendium with natural language processing
   */
  async handleCreateActorFromCompendium(args: any): Promise<any> {
    const schema = z.object({
      creatureType: z.string().min(1, 'Creature type cannot be empty'),
      names: z.array(z.string().min(1)).min(1, 'At least one name is required'),
      quantity: z.number().min(1).max(10).optional(),
      statBlockHint: z.string().optional(),
      addToScene: z.boolean().default(false),
    });

    const { creatureType, names, quantity, statBlockHint, addToScene } = schema.parse(args);
    const finalQuantity = quantity || names.length;

    this.logger.info('Creating actors from compendium', {
      creatureType,
      names,
      quantity: finalQuantity,
      statBlockHint,
      addToScene,
    });

    try {
      // Step 1: Parse and validate the request
      const parsedRequest = this.parseCreatureRequest({
        creatureType,
        names,
        quantity: finalQuantity,
        ...(statBlockHint ? { statBlockHint } : {}),
        addToScene,
      });

      // Step 2: Find best matching compendium entry
      const creatureMatch = await this.findBestCreatureMatch(
        parsedRequest.creatureType,
        parsedRequest.statBlockHint
      );

      if (!creatureMatch) {
        // Try to provide helpful suggestions
        const suggestions = await this.suggestAlternatives(parsedRequest.creatureType);
        throw new Error(
          `No compendium entry found for "${parsedRequest.creatureType}".${
            suggestions.length > 0
              ? ` Did you mean: ${suggestions.slice(0, 3).map(s => s.name).join(', ')}?`
              : ' Try searching compendiums first to see available creatures.'
          }`
        );
      }

      // Step 3: Create the actors via Foundry module
      const result = await this.foundryClient.query('foundry-mcp-bridge.createActorFromCompendium', {
        creatureType: parsedRequest.creatureType,
        customNames: parsedRequest.customNames,
        packPreference: creatureMatch.pack,
        quantity: parsedRequest.quantity,
        addToScene: parsedRequest.addToScene,
      });

      this.logger.info('Actor creation completed', {
        totalCreated: result.totalCreated,
        totalRequested: result.totalRequested,
        tokensPlaced: result.tokensPlaced || 0,
        hasErrors: !!result.errors,
      });

      // Step 4: Format response for Claude
      return this.formatActorCreationResponse(result, creatureMatch, parsedRequest);

    } catch (error) {
      this.errorHandler.handleToolError(error, 'create-actor-from-compendium', 'actor creation');
    }
  }

  /**
   * Handle getting full compendium entry data
   */
  async handleGetCompendiumEntryFull(args: any): Promise<any> {
    const schema = z.object({
      packId: z.string().min(1, 'Pack ID cannot be empty'),
      entryId: z.string().min(1, 'Entry ID cannot be empty'),
    });

    const { packId, entryId } = schema.parse(args);

    this.logger.info('Getting full compendium entry', { packId, entryId });

    try {
      const fullEntry = await this.foundryClient.query('foundry-mcp-bridge.getCompendiumDocumentFull', {
        packId,
        documentId: entryId,
      });

      this.logger.debug('Successfully retrieved full compendium entry', {
        packId,
        entryId,
        name: fullEntry.name,
        hasItems: !!fullEntry.items?.length,
        hasEffects: !!fullEntry.effects?.length,
      });

      return this.formatCompendiumEntryResponse(fullEntry);

    } catch (error) {
      this.errorHandler.handleToolError(error, 'get-compendium-entry-full', 'compendium retrieval');
    }
  }

  /**
   * Handle validation of actor creation requests
   */
  async handleValidateActorCreation(args: any): Promise<any> {
    const schema = z.object({
      creatureType: z.string().min(1, 'Creature type cannot be empty'),
      quantity: z.number().min(1).max(10),
      checkScene: z.boolean().default(false),
    });

    const { creatureType, quantity, checkScene } = schema.parse(args);

    this.logger.info('Validating actor creation request', { creatureType, quantity, checkScene });

    try {
      // Check basic permissions
      const actorPermission = await this.foundryClient.query('foundry-mcp-bridge.validateWritePermissions', {
        operation: 'createActor',
      });

      if (!actorPermission.allowed) {
        return {
          valid: false,
          reason: actorPermission.reason,
          canProceed: false,
        };
      }

      // Check scene permissions if requested
      let scenePermission = null;
      if (checkScene) {
        scenePermission = await this.foundryClient.query('foundry-mcp-bridge.validateWritePermissions', {
          operation: 'modifyScene',
        });
      }

      // Check if creature type exists
      const creatureMatch = await this.findBestCreatureMatch(creatureType);
      
      const validation = {
        valid: !!creatureMatch,
        reason: creatureMatch 
          ? undefined 
          : `No compendium entry found for "${creatureType}"`,
        canProceed: !!creatureMatch && actorPermission.allowed,
        permissions: {
          actorCreation: actorPermission,
          ...(scenePermission ? { sceneModification: scenePermission } : {}),
        },
        creature: creatureMatch ? {
          name: creatureMatch.name,
          pack: creatureMatch.packLabel,
          confidence: creatureMatch.confidence,
        } : null,
        warnings: [
          ...(actorPermission.warnings || []),
          ...(scenePermission?.warnings || []),
          ...(quantity > 5 ? [`Creating ${quantity} actors at once - this may take some time`] : []),
        ].filter(Boolean),
      };

      this.logger.debug('Validation completed', validation);
      return validation;

    } catch (error) {
      this.errorHandler.handleToolError(error, 'validate-actor-creation', 'validation');
    }
  }

  /**
   * Parse natural language creature request
   */
  private parseCreatureRequest(input: {
    creatureType: string;
    names: string[];
    quantity: number;
    statBlockHint?: string | undefined;
    addToScene: boolean;
  }): ParsedCreatureRequest {
    // Clean up creature type (remove articles, normalize case)
    const cleanCreatureType = input.creatureType
      .toLowerCase()
      .replace(/^(a|an|the)\s+/, '')
      .trim();

    // Ensure we have enough names for the quantity
    const customNames = [...input.names];
    while (customNames.length < input.quantity) {
      const baseName = input.names[0] || 'Unnamed';
      customNames.push(`${baseName} ${customNames.length + 1}`);
    }

    return {
      creatureType: cleanCreatureType,
      customNames: customNames.slice(0, input.quantity),
      quantity: input.quantity,
      statBlockHint: input.statBlockHint,
      addToScene: input.addToScene,
    };
  }

  /**
   * Find best matching creature in compendiums
   */
  private async findBestCreatureMatch(creatureType: string, statBlockHint?: string): Promise<CreatureMatch | null> {
    try {
      // Search for actors in compendiums
      const searchResults = await this.foundryClient.query('foundry-mcp-bridge.searchCompendium', {
        query: creatureType,
        packType: 'Actor',
      });

      if (!searchResults || searchResults.length === 0) {
        return null;
      }

      // Score matches based on name similarity and stat block hints
      const scoredMatches = searchResults.map((result: any) => {
        let confidence = this.calculateNameSimilarity(creatureType, result.name);
        
        // Boost confidence if stat block hint matches
        if (statBlockHint) {
          const hintLower = statBlockHint.toLowerCase();
          const nameLower = result.name.toLowerCase();
          
          if (nameLower.includes(hintLower) || 
              nameLower.includes('adult') && hintLower.includes('adult') ||
              nameLower.includes('young') && hintLower.includes('young') ||
              nameLower.includes('ancient') && hintLower.includes('ancient')) {
            confidence += 0.2;
          }
        }

        return {
          name: result.name,
          type: result.type,
          pack: result.pack,
          packLabel: result.packLabel,
          confidence: Math.min(confidence, 1.0),
        };
      });

      // Return best match if confidence is reasonable
      scoredMatches.sort((a: CreatureMatch, b: CreatureMatch) => b.confidence - a.confidence);
      const bestMatch = scoredMatches[0];
      
      return bestMatch.confidence > 0.3 ? bestMatch : null;

    } catch (error) {
      this.logger.error('Failed to find creature match', error);
      return null;
    }
  }

  /**
   * Suggest alternative creatures when search fails
   */
  private async suggestAlternatives(creatureType: string): Promise<CreatureMatch[]> {
    try {
      // Search with partial terms
      const words = creatureType.split(' ');
      const suggestions: CreatureMatch[] = [];

      for (const word of words) {
        if (word.length > 2) {
          const results = await this.foundryClient.query('foundry-mcp-bridge.searchCompendium', {
            query: word,
            packType: 'Actor',
          });

          if (results && results.length > 0) {
            suggestions.push(...results.slice(0, 2).map((result: any) => ({
              name: result.name,
              type: result.type,
              pack: result.pack,
              packLabel: result.packLabel,
              confidence: this.calculateNameSimilarity(word, result.name),
            })));
          }
        }
      }

      // Remove duplicates and sort by confidence
      const uniqueSuggestions = suggestions
        .filter((item, index, arr) => 
          arr.findIndex(other => other.name === item.name) === index
        )
        .sort((a, b) => b.confidence - a.confidence);

      return uniqueSuggestions.slice(0, 5);

    } catch (error) {
      this.logger.error('Failed to get suggestions', error);
      return [];
    }
  }

  /**
   * Calculate name similarity score (0-1)
   */
  private calculateNameSimilarity(search: string, target: string): number {
    const searchLower = search.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match
    if (searchLower === targetLower) return 1.0;
    
    // Contains check
    if (targetLower.includes(searchLower)) return 0.8;
    if (searchLower.includes(targetLower)) return 0.7;

    // Word overlap
    const searchWords = searchLower.split(' ');
    const targetWords = targetLower.split(' ');
    const overlap = searchWords.filter(word => 
      targetWords.some(targetWord => targetWord.includes(word) || word.includes(targetWord))
    ).length;
    
    const maxWords = Math.max(searchWords.length, targetWords.length);
    return overlap / maxWords * 0.6;
  }

  /**
   * Format actor creation response for Claude
   */
  private formatActorCreationResponse(result: any, creatureMatch: CreatureMatch, request: ParsedCreatureRequest): any {
    const summary = `✅ Created ${result.totalCreated} of ${result.totalRequested} requested actors`;
    
    const details = result.actors.map((actor: any) => 
      `• **${actor.name}** (based on ${actor.originalName} from ${actor.sourcePackLabel})`
    ).join('\n');

    const sceneInfo = result.tokensPlaced > 0 
      ? `\n🎯 Added ${result.tokensPlaced} tokens to the current scene`
      : request.addToScene 
        ? '\n⚠️ Scene placement was requested but not completed (check permissions)'
        : '';

    const errorInfo = result.errors?.length > 0
      ? `\n⚠️ Issues: ${result.errors.join(', ')}`
      : '';

    return {
      summary,
      success: result.success,
      details: {
        actors: result.actors,
        sourceCreature: {
          name: creatureMatch.name,
          pack: creatureMatch.packLabel,
          confidence: creatureMatch.confidence,
        },
        tokensPlaced: result.tokensPlaced || 0,
        errors: result.errors,
      },
      message: summary + '\n\n' + details + sceneInfo + errorInfo,
    };
  }

  /**
   * Format compendium entry response
   */
  private formatCompendiumEntryResponse(entry: any): any {
    const itemsInfo = entry.items?.length > 0 
      ? `\n📦 Items: ${entry.items.map((item: any) => item.name).join(', ')}`
      : '';
    
    const effectsInfo = entry.effects?.length > 0
      ? `\n✨ Effects: ${entry.effects.map((effect: any) => effect.name).join(', ')}`
      : '';

    return {
      name: entry.name,
      type: entry.type,
      pack: entry.packLabel,
      system: entry.system,
      fullData: entry.fullData,
      items: entry.items || [],
      effects: entry.effects || [],
      summary: `📊 **${entry.name}** (${entry.type} from ${entry.packLabel})${itemsInfo}${effectsInfo}`,
    };
  }
}