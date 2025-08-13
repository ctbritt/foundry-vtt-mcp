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

      this.logger.info('Selected creature for creation', {
        name: creatureMatch.name,
        pack: creatureMatch.packLabel,
        confidence: creatureMatch.confidence,
        creatureType: parsedRequest.creatureType,
        customNames: parsedRequest.customNames
      });

      // Step 3: Create the actors via Foundry module
      // Pass the specific creature name instead of the descriptive type to avoid search issues
      const result = await this.foundryClient.query('foundry-mcp-bridge.createActorFromCompendium', {
        creatureType: creatureMatch.name, // Use the actual creature name, not the descriptive search term
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
      // First try enhanced search with descriptive term parsing
      const enhancedMatch = await this.tryEnhancedCreatureSearch(creatureType, statBlockHint);
      if (enhancedMatch) {
        return enhancedMatch;
      }

      // Fallback to basic search for simple terms
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
   * Try enhanced search for descriptive creature terms
   */
  private async tryEnhancedCreatureSearch(creatureType: string, statBlockHint?: string): Promise<CreatureMatch | null> {
    const cleanType = creatureType.toLowerCase();
    
    // Parse descriptive terms that need enhanced search
    const filters: any = {};
    let searchQuery = cleanType;

    // Parse creature type descriptions
    if (cleanType.includes('humanoid')) {
      filters.creatureType = 'humanoid';
      searchQuery = cleanType.replace(/\bhumanoid\b/gi, '').trim();
    } else if (cleanType.includes('dragon')) {
      filters.creatureType = 'dragon';
    } else if (cleanType.includes('fiend')) {
      filters.creatureType = 'fiend';
    } else if (cleanType.includes('undead')) {
      filters.creatureType = 'undead';
    } else if (cleanType.includes('beast')) {
      filters.creatureType = 'beast';
    } else if (cleanType.includes('elemental')) {
      filters.creatureType = 'elemental';
    }

    // Parse spellcasting hints
    if (cleanType.includes('spellcaster') || cleanType.includes('mage') || cleanType.includes('wizard') || 
        cleanType.includes('sorcerer') || cleanType.includes('warlock') || cleanType.includes('cleric')) {
      filters.spellcaster = true;
      searchQuery = searchQuery.replace(/\b(spellcaster|mage|wizard|sorcerer|warlock|cleric)\b/gi, '').trim();
    }

    // Parse legendary actions
    if (cleanType.includes('legendary') || cleanType.includes('boss')) {
      filters.hasLegendaryActions = true;
      searchQuery = searchQuery.replace(/\b(legendary|boss)\b/gi, '').trim();
    }

    // Parse CR hints from statBlockHint
    if (statBlockHint) {
      const crMatch = statBlockHint.match(/\bCR?\s*(\d+)\b/i);
      if (crMatch) {
        filters.challengeRating = parseInt(crMatch[1]);
      }
    }

    // Only use enhanced search if we have meaningful filters
    if (Object.keys(filters).length === 0) {
      return null;
    }

    try {
      this.logger.debug('Trying enhanced creature search', { 
        originalType: creatureType, 
        searchQuery: searchQuery, 
        filters 
      });

      // With enhanced creature index, the query is just for logging - filters do all the work
      const searchResults = await this.foundryClient.query('foundry-mcp-bridge.searchCompendium', {
        query: creatureType, // Pass original for logging/debugging
        packType: 'Actor',
        filters: filters,
      });

      this.logger.debug('Enhanced search raw results', {
        resultsType: typeof searchResults,
        resultsLength: Array.isArray(searchResults) ? searchResults.length : 'not array',
        firstResult: Array.isArray(searchResults) && searchResults.length > 0 ? searchResults[0] : null,
        fullResults: searchResults
      });

      if (!searchResults || searchResults.length === 0) {
        this.logger.debug('Enhanced search returned no results, falling back to basic search');
        return null;
      }

      // Score enhanced results with preference for simpler, more common creatures
      const scoredMatches = searchResults.map((result: any) => {
        let confidence = 0.5; // Base confidence for enhanced search matches
        
        // Boost confidence for simpler, more common creature names
        const nameLower = result.name.toLowerCase();
        const simpleCreatureNames = ['mage', 'wizard', 'cleric', 'druid', 'sorcerer', 'warlock', 
                                   'priest', 'acolyte', 'guard', 'knight', 'soldier', 'archer'];
        
        // High boost for exact simple matches
        if (simpleCreatureNames.some(simple => nameLower === simple)) {
          confidence += 0.4;
        }
        // Medium boost for names containing simple terms
        else if (simpleCreatureNames.some(simple => nameLower.includes(simple))) {
          confidence += 0.2;
        }
        
        // Prefer creatures with reasonable CR (avoid overpowered options)
        const cr = result.challengeRating || 0;
        
        // If we have a statBlockHint with CR, prefer creatures near that CR
        if (statBlockHint) {
          const hintCRMatch = statBlockHint.match(/\bCR?\s*(\d+)(?:-(\d+))?\b/i);
          if (hintCRMatch) {
            const targetCR = parseInt(hintCRMatch[1]);
            const maxCR = hintCRMatch[2] ? parseInt(hintCRMatch[2]) : targetCR;
            
            if (cr >= targetCR && cr <= maxCR) {
              confidence += 0.3; // Perfect CR match
            } else if (Math.abs(cr - targetCR) <= 1) {
              confidence += 0.1; // Close CR match
            }
          }
        } else {
          // Default CR preferences when no hint provided - mild preference for reasonable CR
          if (cr <= 6) confidence += 0.1; // Slight boost for reasonable CR
          // No penalty for high CR - let users get what they ask for
        }
        
        // Boost confidence based on search term matches
        if (searchQuery && searchQuery.length > 0) {
          confidence += this.calculateNameSimilarity(searchQuery, result.name) * 0.3;
        }
        
        // Only avoid clearly problematic creatures, not just complex ones
        if (nameLower.includes('template') || nameLower.includes('test') || nameLower.includes('broken')) {
          confidence -= 0.5;
        }

        return {
          name: result.name,
          type: result.type,
          pack: result.pack,
          packLabel: result.packLabel,
          confidence: Math.min(Math.max(confidence, 0.1), 1.0), // Clamp between 0.1-1.0
        };
      });

      scoredMatches.sort((a: CreatureMatch, b: CreatureMatch) => b.confidence - a.confidence);
      const bestMatch = scoredMatches[0];

      this.logger.debug('Enhanced search result', { 
        found: !!bestMatch, 
        name: bestMatch?.name, 
        confidence: bestMatch?.confidence,
        totalCandidates: scoredMatches.length,
        top3: scoredMatches.slice(0, 3).map((m: CreatureMatch) => ({ name: m.name, confidence: m.confidence }))
      });
      
      return bestMatch?.confidence > 0.5 ? bestMatch : null;

    } catch (error) {
      this.logger.debug('Enhanced search failed, will fallback to basic search', error);
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