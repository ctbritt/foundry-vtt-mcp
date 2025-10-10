import { z } from 'zod';
export class CharacterTools {
    foundryClient;
    logger;
    constructor({ foundryClient, logger }) {
        this.foundryClient = foundryClient;
        this.logger = logger.child({ component: 'CharacterTools' });
    }
    /**
     * Tool: get-character
     * Retrieve detailed information about a specific character
     */
    getToolDefinitions() {
        return [
            {
                name: 'get-character',
                description: 'Retrieve detailed information about a specific character by name or ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        identifier: {
                            type: 'string',
                            description: 'Character name or ID to look up',
                        },
                    },
                    required: ['identifier'],
                },
            },
            {
                name: 'list-characters',
                description: 'List all available characters with basic information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Optional filter by character type (e.g., "character", "npc")',
                        },
                    },
                },
            },
        ];
    }
    async handleGetCharacter(args) {
        const schema = z.object({
            identifier: z.string().min(1, 'Character identifier cannot be empty'),
        });
        const { identifier } = schema.parse(args);
        this.logger.info('Getting character information', { identifier });
        try {
            const characterData = await this.foundryClient.query('foundry-mcp-bridge.getCharacterInfo', {
                characterName: identifier,
            });
            this.logger.debug('Successfully retrieved character data', {
                characterId: characterData.id,
                characterName: characterData.name
            });
            // Format the response for Claude
            return this.formatCharacterResponse(characterData);
        }
        catch (error) {
            this.logger.error('Failed to get character information', error);
            throw new Error(`Failed to retrieve character "${identifier}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleListCharacters(args) {
        const schema = z.object({
            type: z.string().optional(),
        });
        const { type } = schema.parse(args);
        this.logger.info('Listing characters', { type });
        try {
            const actors = await this.foundryClient.query('foundry-mcp-bridge.listActors', { type });
            this.logger.debug('Successfully retrieved character list', { count: actors.length });
            // Format the response for Claude
            return {
                characters: actors.map((actor) => ({
                    id: actor.id,
                    name: actor.name,
                    type: actor.type,
                    hasImage: !!actor.img,
                })),
                total: actors.length,
                filtered: type ? `Filtered by type: ${type}` : 'All characters',
            };
        }
        catch (error) {
            this.logger.error('Failed to list characters', error);
            throw new Error(`Failed to list characters: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    formatCharacterResponse(characterData) {
        const response = {
            id: characterData.id,
            name: characterData.name,
            type: characterData.type,
            basicInfo: this.extractBasicInfo(characterData),
            stats: this.extractStats(characterData),
            items: this.formatItems(characterData.items || []),
            effects: this.formatEffects(characterData.effects || []),
            hasImage: !!characterData.img,
        };
        return response;
    }
    extractBasicInfo(characterData) {
        const system = characterData.system || {};
        // Extract common fields that exist across different game systems
        const basicInfo = {};
        // D&D 5e / PF2e common fields
        if (system.attributes) {
            if (system.attributes.hp) {
                basicInfo.hitPoints = {
                    current: system.attributes.hp.value,
                    max: system.attributes.hp.max,
                    temp: system.attributes.hp.temp || 0,
                };
            }
            if (system.attributes.ac) {
                basicInfo.armorClass = system.attributes.ac.value;
            }
        }
        // Level information
        if (system.details?.level?.value) {
            basicInfo.level = system.details.level.value;
        }
        else if (system.level) {
            basicInfo.level = system.level;
        }
        // Class information
        if (system.details?.class) {
            basicInfo.class = system.details.class;
        }
        // Race/ancestry information
        if (system.details?.race) {
            basicInfo.race = system.details.race;
        }
        else if (system.details?.ancestry) {
            basicInfo.ancestry = system.details.ancestry;
        }
        return basicInfo;
    }
    extractStats(characterData) {
        const system = characterData.system || {};
        const stats = {};
        // Ability scores (D&D 5e style)
        if (system.abilities) {
            stats.abilities = {};
            for (const [key, ability] of Object.entries(system.abilities)) {
                if (typeof ability === 'object' && ability !== null) {
                    stats.abilities[key] = {
                        score: ability.value || 10,
                        modifier: ability.mod || 0,
                    };
                }
            }
        }
        // Skills
        if (system.skills) {
            stats.skills = {};
            for (const [key, skill] of Object.entries(system.skills)) {
                if (typeof skill === 'object' && skill !== null) {
                    stats.skills[key] = {
                        value: skill.value || 0,
                        proficient: skill.proficient || false,
                        ability: skill.ability || '',
                    };
                }
            }
        }
        // Saves
        if (system.saves) {
            stats.saves = {};
            for (const [key, save] of Object.entries(system.saves)) {
                if (typeof save === 'object' && save !== null) {
                    stats.saves[key] = {
                        value: save.value || 0,
                        proficient: save.proficient || false,
                    };
                }
            }
        }
        return stats;
    }
    formatItems(items) {
        return items.slice(0, 20).map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.system?.quantity || 1,
            description: this.truncateText(item.system?.description?.value || '', 200),
            hasImage: !!item.img,
        }));
    }
    formatEffects(effects) {
        return effects.map(effect => ({
            id: effect.id,
            name: effect.name,
            disabled: effect.disabled,
            duration: effect.duration ? {
                type: effect.duration.type,
                remaining: effect.duration.remaining,
            } : null,
            hasIcon: !!effect.icon,
        }));
    }
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
}
//# sourceMappingURL=character.js.map