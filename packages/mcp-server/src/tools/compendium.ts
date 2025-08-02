import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';

export interface CompendiumToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

export class CompendiumTools {
  private foundryClient: FoundryClient;
  private logger: Logger;

  constructor({ foundryClient, logger }: CompendiumToolsOptions) {
    this.foundryClient = foundryClient;
    this.logger = logger.child({ component: 'CompendiumTools' });
  }

  /**
   * Tool definitions for compendium operations
   */
  getToolDefinitions() {
    return [
      {
        name: 'search-compendium',
        description: 'Search through compendium packs for items, spells, monsters, and other content',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find items in compendiums',
            },
            packType: {
              type: 'string',
              description: 'Optional filter by pack type (e.g., "Item", "Actor", "JournalEntry")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 20, max: 50)',
              minimum: 1,
              maximum: 50,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get-compendium-item',
        description: 'Retrieve detailed information about a specific compendium item',
        inputSchema: {
          type: 'object',
          properties: {
            packId: {
              type: 'string',
              description: 'ID of the compendium pack containing the item',
            },
            itemId: {
              type: 'string',
              description: 'ID of the specific item to retrieve',
            },
          },
          required: ['packId', 'itemId'],
        },
      },
      {
        name: 'list-compendium-packs',
        description: 'List all available compendium packs',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Optional filter by pack type',
            },
          },
        },
      },
    ];
  }

  async handleSearchCompendium(args: any): Promise<any> {
    const schema = z.object({
      query: z.string().min(2, 'Search query must be at least 2 characters'),
      packType: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    });

    // Add defensive parsing for MCP argument structure inconsistencies
    let parsedArgs;
    try {
      parsedArgs = schema.parse(args);
    } catch (zodError) {
      // Try alternative argument structures that MCP might send
      if (typeof args === 'string') {
        parsedArgs = schema.parse({ query: args });
      } else if (args && typeof args.query === 'undefined' && typeof args === 'object') {
        // Handle case where arguments might be nested differently
        const firstKey = Object.keys(args)[0];
        if (firstKey && typeof args[firstKey] === 'string') {
          parsedArgs = schema.parse({ query: args[firstKey] });
        } else {
          throw zodError;
        }
      } else {
        // Log the problematic args for debugging
        this.logger.debug('Failed to parse search args, using fallback', { 
          args: typeof args === 'object' ? JSON.stringify(args) : args,
          error: zodError instanceof Error ? zodError.message : 'Unknown parsing error'
        });
        throw zodError;
      }
    }

    const { query, packType, limit } = parsedArgs;

    try {
      const results = await this.foundryClient.query('foundry-mcp-bridge.searchCompendium', {
        query,
        packType,
      });

      // Limit results
      const limitedResults = results.slice(0, limit);

      this.logger.debug('Compendium search completed', {
        query,
        totalFound: results.length,
        returned: limitedResults.length,
      });

      return {
        query,
        results: limitedResults.map((item: any) => this.formatCompendiumItem(item)),
        totalFound: results.length,
        showing: limitedResults.length,
        hasMore: results.length > limit,
      };

    } catch (error) {
      this.logger.error('Failed to search compendium', error);
      throw new Error(`Failed to search compendium: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleGetCompendiumItem(args: any): Promise<any> {
    const schema = z.object({
      packId: z.string().min(1, 'Pack ID cannot be empty'),
      itemId: z.string().min(1, 'Item ID cannot be empty'),
    });

    const { packId, itemId } = schema.parse(args);

    try {
      // Use the proper document retrieval method that already exists in actor creation
      const item = await this.foundryClient.query('foundry-mcp-bridge.getCompendiumDocumentFull', {
        packId: packId,
        documentId: itemId,
      });

      if (!item) {
        throw new Error(`Item ${itemId} not found in pack ${packId}`);
      }

      // Format the response using the detailed item data
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        pack: {
          id: item.pack,
          label: item.packLabel,
        },
        description: this.extractDescription(item),
        fullDescription: this.extractFullDescription(item),
        system: this.sanitizeSystemData(item.system || {}),
        properties: this.extractItemProperties(item),
        items: item.items || [],
        effects: item.effects || [],
        hasImage: !!item.img,
        imageUrl: item.img,
        fullData: item.fullData,
      };

    } catch (error) {
      this.logger.error('Failed to get compendium item', error);
      throw new Error(`Failed to retrieve item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleListCompendiumPacks(args: any): Promise<any> {
    const schema = z.object({
      type: z.string().optional(),
    });

    const { type } = schema.parse(args);

    this.logger.info('Listing compendium packs', { type });

    try {
      const packs = await this.foundryClient.query('foundry-mcp-bridge.getAvailablePacks');

      // Filter by type if specified
      const filteredPacks = type 
        ? packs.filter((pack: any) => pack.type === type)
        : packs;

      this.logger.debug('Successfully retrieved compendium packs', { 
        total: packs.length,
        filtered: filteredPacks.length,
        type 
      });

      return {
        packs: filteredPacks.map((pack: any) => ({
          id: pack.id,
          label: pack.label,
          type: pack.type,
          system: pack.system,
          private: pack.private,
        })),
        total: filteredPacks.length,
        availableTypes: [...new Set(packs.map((pack: any) => pack.type))],
      };

    } catch (error) {
      this.logger.error('Failed to list compendium packs', error);
      throw new Error(`Failed to list compendium packs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private formatCompendiumItem(item: any): any {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      pack: {
        id: item.pack,
        label: item.packLabel,
      },
      description: this.extractDescription(item),
      hasImage: !!item.img,
      summary: this.createItemSummary(item),
    };
  }

  private formatDetailedCompendiumItem(item: any): any {
    const formatted = this.formatCompendiumItem(item);
    
    // Add more detailed information
    formatted.system = this.sanitizeSystemData(item.system || {});
    formatted.fullDescription = this.extractFullDescription(item);
    formatted.properties = this.extractItemProperties(item);
    
    return formatted;
  }

  private extractDescription(item: any): string {
    const system = item.system || {};
    
    // Try different common description fields
    const description = 
      system.description?.value ||
      system.description?.content ||
      system.description ||
      system.details?.description ||
      '';

    return this.truncateText(this.stripHtml(description), 200);
  }

  private extractFullDescription(item: any): string {
    const system = item.system || {};
    
    const description = 
      system.description?.value ||
      system.description?.content ||
      system.description ||
      system.details?.description ||
      '';

    return this.stripHtml(description);
  }

  private createItemSummary(item: any): string {
    const parts = [];
    
    parts.push(`${item.type} from ${item.packLabel}`);
    
    const system = item.system || {};
    
    // Add relevant summary information based on item type
    switch (item.type.toLowerCase()) {
      case 'spell':
        if (system.level) parts.push(`Level ${system.level}`);
        if (system.school) parts.push(system.school);
        break;
      case 'weapon':
        if (system.damage?.parts?.length) {
          const damage = system.damage.parts[0];
          parts.push(`${damage[0]} ${damage[1]} damage`);
        }
        break;
      case 'armor':
        if (system.armor?.value) parts.push(`AC ${system.armor.value}`);
        break;
      case 'equipment':
      case 'item':
        if (system.rarity) parts.push(system.rarity);
        if (system.price?.value) parts.push(`${system.price.value} ${system.price.denomination || 'gp'}`);
        break;
    }
    
    return parts.join(' • ');
  }

  private extractItemProperties(item: any): any {
    const system = item.system || {};
    const properties: any = {};

    // Common properties across different item types
    if (system.rarity) properties.rarity = system.rarity;
    if (system.price) properties.price = system.price;
    if (system.weight) properties.weight = system.weight;
    if (system.quantity) properties.quantity = system.quantity;

    // Spell-specific properties
    if (item.type.toLowerCase() === 'spell') {
      if (system.level !== undefined) properties.spellLevel = system.level;
      if (system.school) properties.school = system.school;
      if (system.components) properties.components = system.components;
      if (system.duration) properties.duration = system.duration;
      if (system.range) properties.range = system.range;
    }

    // Weapon-specific properties
    if (item.type.toLowerCase() === 'weapon') {
      if (system.damage) properties.damage = system.damage;
      if (system.weaponType) properties.weaponType = system.weaponType;
      if (system.properties) properties.weaponProperties = system.properties;
    }

    // Armor-specific properties
    if (item.type.toLowerCase() === 'armor') {
      if (system.armor) properties.armorClass = system.armor;
      if (system.stealth) properties.stealthDisadvantage = system.stealth;
    }

    return properties;
  }

  private sanitizeSystemData(systemData: any): any {
    // Remove potentially large or unnecessary fields
    const sanitized = { ...systemData };
    
    // Remove large description fields (already handled separately)
    delete sanitized.description;
    delete sanitized.details;
    
    // Remove internal/technical fields
    delete sanitized._id;
    delete sanitized.folder;
    delete sanitized.sort;
    delete sanitized.ownership;
    
    return sanitized;
  }

  private stripHtml(text: string): string {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').trim();
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}