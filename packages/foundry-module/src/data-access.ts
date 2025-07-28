import { MODULE_ID, ERROR_MESSAGES, TOKEN_DISPOSITIONS } from './constants.js';
// Local type definitions to avoid shared package import issues
interface CharacterInfo {
  id: string;
  name: string;
  type: string;
  img?: string;
  system: Record<string, unknown>;
  items: CharacterItem[];
  effects: CharacterEffect[];
}

interface CharacterItem {
  id: string;
  name: string;
  type: string;
  img?: string;
  system: Record<string, unknown>;
}

interface CharacterEffect {
  id: string;
  name: string;
  icon?: string;
  disabled: boolean;
  duration?: {
    type: string;
    duration?: number;
    remaining?: number;
  };
}

interface CompendiumSearchResult {
  id: string;
  name: string;
  type: string;
  img?: string;
  pack: string;
  packLabel: string;
  system?: Record<string, unknown>;
}

interface SceneInfo {
  id: string;
  name: string;
  img?: string;
  background?: string;
  width: number;
  height: number;
  padding: number;
  active: boolean;
  navigation: boolean;
  tokens: SceneToken[];
  walls: number;
  lights: number;
  sounds: number;
  notes: SceneNote[];
}

interface SceneToken {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  actorId?: string;
  img: string;
  hidden: boolean;
  disposition: number;
}

interface SceneNote {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface WorldInfo {
  id: string;
  title: string;
  system: string;
  systemVersion: string;
  foundryVersion: string;
  users: WorldUser[];
}

interface WorldUser {
  id: string;
  name: string;
  active: boolean;
  isGM: boolean;
}

export class FoundryDataAccess {
  private moduleId: string = MODULE_ID;

  constructor() {}

  /**
   * Check if user has permission for a specific data access type
   */
  private checkPermission(permissionKey: string): boolean {
    const allowed = game.settings.get(this.moduleId, permissionKey);
    if (!allowed) {
      throw new Error(`${ERROR_MESSAGES.ACCESS_DENIED}: ${permissionKey} is disabled`);
    }
    return true;
  }

  /**
   * Get character/actor information by name or ID
   */
  async getCharacterInfo(identifier: string): Promise<CharacterInfo> {
    this.checkPermission('allowCharacterAccess');

    let actor: Actor | undefined;

    // Try to find by ID first, then by name
    if (identifier.length === 16) { // Foundry ID length
      actor = game.actors.get(identifier);
    }
    
    if (!actor) {
      actor = game.actors.find(a => 
        a.name?.toLowerCase() === identifier.toLowerCase()
      );
    }

    if (!actor) {
      throw new Error(`${ERROR_MESSAGES.CHARACTER_NOT_FOUND}: ${identifier}`);
    }

    // Build character data structure
    const characterData: CharacterInfo = {
      id: actor.id || '',
      name: actor.name || '',
      type: actor.type,
      ...(actor.img ? { img: actor.img } : {}),
      system: this.sanitizeData((actor as any).system),
      items: actor.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        ...(item.img ? { img: item.img } : {}),
        system: this.sanitizeData(item.system),
      })),
      effects: actor.effects.map(effect => ({
        id: effect.id,
        name: (effect as any).name || (effect as any).label || 'Unknown Effect',
        ...((effect as any).icon ? { icon: (effect as any).icon } : {}),
        disabled: (effect as any).disabled,
        ...(((effect as any).duration) ? {
          duration: {
            type: (effect as any).duration.type || 'none',
            duration: (effect as any).duration.duration,
            remaining: (effect as any).duration.remaining,
          }
        } : {}),
      })),
    };

    return characterData;
  }

  /**
   * Search compendium packs for items matching query
   */
  async searchCompendium(query: string, packType?: string): Promise<CompendiumSearchResult[]> {
    this.checkPermission('allowCompendiumAccess');

    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const results: CompendiumSearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    // Filter packs by type if specified
    const packs = Array.from(game.packs.values()).filter(pack => {
      if (packType && pack.metadata.type !== packType) {
        return false;
      }
      return pack.metadata.type !== 'Scene'; // Exclude scene packs for safety
    });

    for (const pack of packs) {
      try {
        // Ensure pack index is loaded
        if (!pack.indexed) {
          await pack.getIndex();
        }

        // Search through pack entries
        for (const entry of pack.index.values()) {
          const nameMatch = searchTerms.every(term => 
            entry.name.toLowerCase().includes(term)
          );

          if (nameMatch) {
            results.push({
              id: entry._id,
              name: entry.name,
              type: entry.type,
              img: entry.img || undefined,
              pack: pack.metadata.id,
              packLabel: pack.metadata.label,
              system: entry.system ? this.sanitizeData(entry.system) : undefined,
            });
          }

          // Limit results per pack to prevent overwhelming responses
          if (results.length >= 100) break;
        }
      } catch (error) {
        console.warn(`[${this.moduleId}] Failed to search pack ${pack.metadata.id}:`, error);
      }

      // Global limit to prevent memory issues
      if (results.length >= 100) break;
    }

    // Sort results by relevance (exact matches first, then alphabetical)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, 50); // Final limit
  }

  /**
   * List all actors with basic information
   */
  async listActors(): Promise<Array<{ id: string; name: string; type: string; img?: string }>> {
    this.checkPermission('allowCharacterAccess');

    return game.actors.map(actor => ({
      id: actor.id || '',
      name: actor.name || '',
      type: actor.type,
      ...(actor.img ? { img: actor.img } : {}),
    }));
  }

  /**
   * Get active scene information
   */
  async getActiveScene(): Promise<SceneInfo> {
    this.checkPermission('allowSceneAccess');

    const scene = (game.scenes as any).current;
    if (!scene) {
      throw new Error(ERROR_MESSAGES.SCENE_NOT_FOUND);
    }

    const sceneData: SceneInfo = {
      id: scene.id,
      name: scene.name,
      img: scene.img || undefined,
      background: scene.background?.src || undefined,
      width: scene.width,
      height: scene.height,
      padding: scene.padding,
      active: scene.active,
      navigation: scene.navigation,
      tokens: scene.tokens.map((token: any) => ({
        id: token.id,
        name: token.name,
        x: token.x,
        y: token.y,
        width: token.width,
        height: token.height,
        actorId: token.actorId || undefined,
        img: token.texture?.src || '',
        hidden: token.hidden,
        disposition: this.getTokenDisposition(token.disposition),
      })),
      walls: scene.walls.size,
      lights: scene.lights.size,
      sounds: scene.sounds.size,
      notes: scene.notes.map((note: any) => ({
        id: note.id,
        text: note.text || '',
        x: note.x,
        y: note.y,
      })),
    };

    return sceneData;
  }

  /**
   * Get world information
   */
  async getWorldInfo(): Promise<WorldInfo> {
    // World info doesn't require special permissions as it's basic metadata
    
    return {
      id: game.world.id,
      title: game.world.title,
      system: game.system.id,
      systemVersion: game.system.version,
      foundryVersion: game.version,
      users: game.users.map(user => ({
        id: user.id || '',
        name: user.name || '',
        active: user.active,
        isGM: user.isGM,
      })),
    };
  }

  /**
   * Get available compendium packs
   */
  async getAvailablePacks() {
    this.checkPermission('allowCompendiumAccess');

    return Array.from(game.packs.values()).map(pack => ({
      id: pack.metadata.id,
      label: pack.metadata.label,
      type: pack.metadata.type,
      system: pack.metadata.system,
      private: pack.metadata.private,
    }));
  }

  /**
   * Sanitize data to remove sensitive information and make it JSON-safe
   */
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    try {
      // Create a deep copy and remove sensitive fields
      const sanitized = foundry.utils.deepClone(data);
      
      // Remove common sensitive fields
      this.removeSensitiveFields(sanitized);
      
      // Ensure JSON serializable
      return JSON.parse(JSON.stringify(sanitized));
    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to sanitize data:`, error);
      return {};
    }
  }

  /**
   * Remove sensitive fields from data object
   */
  private removeSensitiveFields(obj: any): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth',
      'credential', 'session', 'cookie', 'private'
    ];

    for (const key of sensitiveKeys) {
      if (key in obj) {
        delete obj[key];
      }
    }

    // Recursively clean nested objects
    for (const [, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        this.removeSensitiveFields(value);
      }
    }
  }

  /**
   * Get token disposition as number
   */
  private getTokenDisposition(disposition: any): number {
    if (typeof disposition === 'number') {
      return disposition;
    }
    
    // Default to neutral if unknown
    return TOKEN_DISPOSITIONS.NEUTRAL;
  }

  /**
   * Validate that Foundry is ready and world is active
   */
  validateFoundryState(): void {
    if (!game || !game.ready) {
      throw new Error('Foundry VTT is not ready');
    }

    if (!game.world) {
      throw new Error('No active world');
    }

    if (!game.user) {
      throw new Error('No active user');
    }
  }
}