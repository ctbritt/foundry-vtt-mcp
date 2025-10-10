import { z } from 'zod';
export class SceneTools {
    foundryClient;
    logger;
    constructor({ foundryClient, logger }) {
        this.foundryClient = foundryClient;
        this.logger = logger.child({ component: 'SceneTools' });
    }
    /**
     * Tool definitions for scene operations
     */
    getToolDefinitions() {
        return [
            {
                name: 'get-current-scene',
                description: 'Get information about the currently active scene, including tokens and layout',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeTokens: {
                            type: 'boolean',
                            description: 'Whether to include detailed token information (default: true)',
                            default: true,
                        },
                        includeHidden: {
                            type: 'boolean',
                            description: 'Whether to include hidden tokens and elements (default: false)',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'get-world-info',
                description: 'Get basic information about the Foundry world and system',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ];
    }
    async handleGetCurrentScene(args) {
        const schema = z.object({
            includeTokens: z.boolean().default(true),
            includeHidden: z.boolean().default(false),
        });
        const { includeTokens, includeHidden } = schema.parse(args);
        this.logger.info('Getting current scene information', { includeTokens, includeHidden });
        try {
            const sceneData = await this.foundryClient.query('foundry-mcp-bridge.getActiveScene');
            this.logger.debug('Successfully retrieved scene data', {
                sceneId: sceneData.id,
                sceneName: sceneData.name,
                tokenCount: sceneData.tokens?.length || 0,
            });
            return this.formatSceneResponse(sceneData, includeTokens, includeHidden);
        }
        catch (error) {
            this.logger.error('Failed to get current scene', error);
            throw new Error(`Failed to get current scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleGetWorldInfo(_args) {
        this.logger.info('Getting world information');
        try {
            const worldData = await this.foundryClient.query('foundry-mcp-bridge.getWorldInfo');
            this.logger.debug('Successfully retrieved world data', {
                worldId: worldData.id,
                system: worldData.system,
            });
            return this.formatWorldResponse(worldData);
        }
        catch (error) {
            this.logger.error('Failed to get world information', error);
            throw new Error(`Failed to get world information: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    formatSceneResponse(sceneData, includeTokens, includeHidden) {
        const response = {
            id: sceneData.id,
            name: sceneData.name,
            active: sceneData.active,
            dimensions: {
                width: sceneData.width,
                height: sceneData.height,
                padding: sceneData.padding,
            },
            hasBackground: !!sceneData.background,
            navigation: sceneData.navigation,
            elements: {
                walls: sceneData.walls || 0,
                lights: sceneData.lights || 0,
                sounds: sceneData.sounds || 0,
                notes: sceneData.notes?.length || 0,
            },
        };
        if (includeTokens && sceneData.tokens) {
            response.tokens = this.formatTokens(sceneData.tokens, includeHidden);
            response.tokenSummary = this.createTokenSummary(sceneData.tokens, includeHidden);
        }
        if (sceneData.notes && sceneData.notes.length > 0) {
            response.notes = sceneData.notes.map((note) => ({
                id: note.id,
                text: this.truncateText(note.text, 100),
                position: { x: note.x, y: note.y },
            }));
        }
        return response;
    }
    formatTokens(tokens, includeHidden) {
        return tokens
            .filter(token => includeHidden || !token.hidden)
            .map(token => ({
            id: token.id,
            name: token.name,
            position: {
                x: token.x,
                y: token.y,
            },
            size: {
                width: token.width,
                height: token.height,
            },
            actorId: token.actorId,
            disposition: this.getDispositionName(token.disposition),
            hidden: token.hidden,
            hasImage: !!token.img,
        }));
    }
    createTokenSummary(tokens, includeHidden) {
        const visibleTokens = includeHidden ? tokens : tokens.filter(t => !t.hidden);
        const summary = {
            total: visibleTokens.length,
            byDisposition: {
                friendly: 0,
                neutral: 0,
                hostile: 0,
                unknown: 0,
            },
            hasActors: 0,
            withoutActors: 0,
        };
        visibleTokens.forEach(token => {
            // Count by disposition
            const disposition = this.getDispositionName(token.disposition);
            if (disposition in summary.byDisposition) {
                summary.byDisposition[disposition]++;
            }
            else {
                summary.byDisposition.unknown++;
            }
            // Count actor association
            if (token.actorId) {
                summary.hasActors++;
            }
            else {
                summary.withoutActors++;
            }
        });
        return summary;
    }
    formatWorldResponse(worldData) {
        return {
            id: worldData.id,
            title: worldData.title,
            system: {
                id: worldData.system,
                version: worldData.systemVersion,
            },
            foundry: {
                version: worldData.foundryVersion,
            },
            users: {
                total: worldData.users?.length || 0,
                active: worldData.users?.filter((u) => u.active).length || 0,
                gms: worldData.users?.filter((u) => u.isGM).length || 0,
                players: worldData.users?.filter((u) => !u.isGM).length || 0,
            },
            activeUsers: worldData.users
                ?.filter((u) => u.active)
                .map((u) => ({
                id: u.id,
                name: u.name,
                isGM: u.isGM,
            })) || [],
        };
    }
    getDispositionName(disposition) {
        switch (disposition) {
            case -1:
                return 'hostile';
            case 0:
                return 'neutral';
            case 1:
                return 'friendly';
            default:
                return 'unknown';
        }
    }
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
}
//# sourceMappingURL=scene.js.map