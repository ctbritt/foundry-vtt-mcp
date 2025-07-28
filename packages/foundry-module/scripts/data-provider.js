/**
 * Foundry Data Provider - Handles data access and formatting for MCP
 */
export class FoundryDataProvider {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the data provider
   */
  async initialize() {
    this.isInitialized = true;
    console.log('FoundryDataProvider | Initialized');
  }

  /**
   * Get character/actor information
   * @param {string} characterName - Name of the character to look up
   * @returns {Object} Character information
   */
  async getCharacterInfo(characterName) {
    if (!this.isInitialized) {
      throw new Error('Data provider not initialized');
    }

    // Find actor by name (case-insensitive)
    const actor = game.actors.find(a => 
      a.name.toLowerCase() === characterName.toLowerCase()
    );

    if (!actor) {
      throw new Error(`Character '${characterName}' not found`);
    }

    // Extract relevant character data
    const characterData = {
      id: actor.id,
      name: actor.name,
      type: actor.type,
      img: actor.img,
      system: this.sanitizeSystemData(actor.system),
      items: actor.items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        img: item.img,
        system: this.sanitizeSystemData(item.system)
      })),
      effects: actor.effects.map(effect => ({
        id: effect.id,
        name: effect.name || effect.label,
        icon: effect.icon,
        disabled: effect.disabled,
        duration: effect.duration
      }))
    };

    return characterData;
  }

  /**
   * Search compendium packs
   * @param {string} query - Search query
   * @param {string} packType - Optional pack type filter
   * @returns {Array} Search results
   */
  async searchCompendium(query, packType = null) {
    if (!this.isInitialized) {
      throw new Error('Data provider not initialized');
    }

    const results = [];
    const searchTerms = query.toLowerCase().split(' ');

    // Get all compendium packs
    const packs = game.packs.filter(pack => {
      if (packType) {
        return pack.metadata.type === packType;
      }
      return true;
    });

    for (const pack of packs) {
      try {
        // Load pack index if not already loaded
        if (!pack.indexed) {
          await pack.getIndex();
        }

        // Search through pack contents
        for (const entry of pack.index) {
          const nameMatch = searchTerms.every(term => 
            entry.name.toLowerCase().includes(term)
          );

          if (nameMatch) {
            results.push({
              id: entry._id,
              name: entry.name,
              type: entry.type,
              img: entry.img,
              pack: pack.metadata.id,
              packLabel: pack.metadata.label,
              system: entry.system ? this.sanitizeSystemData(entry.system) : null
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to search pack ${pack.metadata.id}:`, error);
      }
    }

    // Sort results by relevance (exact matches first, then partial)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, 50); // Limit results to prevent overwhelming responses
  }

  /**
   * Get scene information
   * @param {string} sceneId - Scene ID (optional, defaults to current scene)
   * @returns {Object} Scene information
   */
  async getSceneInfo(sceneId = null) {
    if (!this.isInitialized) {
      throw new Error('Data provider not initialized');
    }

    const scene = sceneId ? game.scenes.get(sceneId) : game.scenes.current;
    
    if (!scene) {
      throw new Error('Scene not found');
    }

    const sceneData = {
      id: scene.id,
      name: scene.name,
      img: scene.img,
      background: scene.background,
      width: scene.width,
      height: scene.height,
      padding: scene.padding,
      active: scene.active,
      navigation: scene.navigation,
      tokens: scene.tokens.map(token => ({
        id: token.id,
        name: token.name,
        x: token.x,
        y: token.y,
        width: token.width,
        height: token.height,
        actorId: token.actorId,
        img: token.texture.src,
        hidden: token.hidden,
        disposition: token.disposition
      })),
      walls: scene.walls.size,
      lights: scene.lights.size,
      sounds: scene.sounds.size,
      notes: scene.notes.map(note => ({
        id: note.id,
        text: note.text,
        x: note.x,
        y: note.y
      }))
    };

    return sceneData;
  }

  /**
   * Sanitize system data to remove sensitive or unnecessary information
   * @param {Object} systemData - Raw system data
   * @returns {Object} Sanitized system data
   */
  sanitizeSystemData(systemData) {
    if (!systemData || typeof systemData !== 'object') {
      return systemData;
    }

    // Create a deep copy and remove sensitive fields
    const sanitized = foundry.utils.deepClone(systemData);
    
    // Remove common sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    // Remove functions and non-serializable data
    return JSON.parse(JSON.stringify(sanitized));
  }

  /**
   * Get available compendium packs
   * @returns {Array} List of available packs
   */
  getAvailablePacks() {
    return game.packs.map(pack => ({
      id: pack.metadata.id,
      label: pack.metadata.label,
      type: pack.metadata.type,
      system: pack.metadata.system,
      private: pack.metadata.private
    }));
  }

  /**
   * Get basic world information
   * @returns {Object} World information
   */
  getWorldInfo() {
    return {
      id: game.world.id,
      title: game.world.title,
      system: game.system.id,
      systemVersion: game.system.version,
      foundryVersion: game.version,
      users: game.users.map(user => ({
        id: user.id,
        name: user.name,
        active: user.active,
        isGM: user.isGM
      }))
    };
  }
}