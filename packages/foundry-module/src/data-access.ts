import { MODULE_ID, ERROR_MESSAGES, TOKEN_DISPOSITIONS } from './constants.js';
import { permissionManager } from './permissions.js';
import { transactionManager } from './transaction-manager.js';
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
  summary?: string;
  hasImage?: boolean;
  description?: string;
}

interface EnhancedCreatureIndex {
  id: string;
  name: string;
  type: string;
  pack: string;
  packLabel: string;
  challengeRating: number;
  creatureType: string;
  size: string;
  hitPoints: number;
  armorClass: number;
  hasSpells: boolean;
  hasLegendaryActions: boolean;
  alignment: string;
  description?: string;
  img?: string;
}

interface PersistentIndexMetadata {
  version: string;
  timestamp: number;
  packFingerprints: Map<string, PackFingerprint>;
  totalCreatures: number;
}

interface PackFingerprint {
  packId: string;
  packLabel: string;
  lastModified: number;
  documentCount: number;
  checksum: string;
}

interface PersistentEnhancedIndex {
  metadata: PersistentIndexMetadata;
  creatures: EnhancedCreatureIndex[];
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

// Phase 2: Write Operation Interfaces
interface ActorCreationRequest {
  creatureType: string;
  customNames?: string[] | undefined;
  packPreference?: string | undefined;
  quantity?: number | undefined;
  addToScene?: boolean | undefined;
}

interface ActorCreationResult {
  success: boolean;
  actors: CreatedActorInfo[];
  errors?: string[] | undefined;
  tokensPlaced?: number;
  totalRequested: number;
  totalCreated: number;
}

interface CreatedActorInfo {
  id: string;
  name: string;
  originalName: string;
  type: string;
  sourcePackId: string;
  sourcePackLabel: string;
  img?: string;
}

interface CompendiumEntryFull {
  id: string;
  name: string;
  type: string;
  img?: string;
  pack: string;
  packLabel: string;
  system: Record<string, unknown>;
  items?: CompendiumItem[];
  effects?: CompendiumEffect[];
  fullData: Record<string, unknown>;
}

interface CompendiumItem {
  id: string;
  name: string;
  type: string;
  img?: string;
  system: Record<string, unknown>;
}

interface CompendiumEffect {
  id: string;
  name: string;
  icon?: string;
  disabled: boolean;
  duration?: Record<string, unknown>;
}

interface SceneTokenPlacement {
  actorIds: string[];
  placement: 'random' | 'grid' | 'center';
  hidden: boolean;
}

interface TokenPlacementResult {
  success: boolean;
  tokensCreated: number;
  tokenIds: string[];
  errors?: string[] | undefined;
}

/**
 * Persistent Enhanced Creature Index System
 * Stores pre-computed creature data in JSON file within Foundry world directory for instant filtering
 * Uses file-based storage following Foundry best practices for large data sets
 */
class PersistentCreatureIndex {
  private moduleId: string = MODULE_ID;
  private readonly INDEX_VERSION = '1.0.0';
  private readonly INDEX_FILENAME = 'enhanced-creature-index.json';
  private buildInProgress = false;
  private hooksRegistered = false;

  constructor() {
    this.registerFoundryHooks();
  }

  /**
   * Get the file path for the enhanced creature index
   */
  private getIndexFilePath(): string {
    // Store in world data directory using world ID
    return `worlds/${game.world.id}/${this.INDEX_FILENAME}`;
  }

  /**
   * Get or build the enhanced creature index
   */
  async getEnhancedIndex(): Promise<EnhancedCreatureIndex[]> {
    // Check if we have a valid persistent index
    const existingIndex = await this.loadPersistedIndex();
    
    if (existingIndex && this.isIndexValid(existingIndex)) {
      console.log(`[${this.moduleId}] Using valid persisted enhanced creature index (${existingIndex.creatures.length} creatures)`);
      return existingIndex.creatures;
    }
    
    // Build new index if needed
    console.log(`[${this.moduleId}] Enhanced creature index needs rebuild`);
    return await this.buildEnhancedIndex();
  }

  /**
   * Force rebuild of the enhanced index
   */
  async rebuildIndex(): Promise<EnhancedCreatureIndex[]> {
    console.log(`[${this.moduleId}] Forcing rebuild of enhanced creature index`);
    return await this.buildEnhancedIndex(true);
  }

  /**
   * Load persisted index from JSON file
   */
  private async loadPersistedIndex(): Promise<PersistentEnhancedIndex | null> {
    try {
      const filePath = this.getIndexFilePath();
      
      // Check if file exists using Foundry's FilePicker
      let fileExists = false;
      try {
        const browseResult = await FilePicker.browse('data', `worlds/${game.world.id}`);
        fileExists = browseResult.files.some(f => f.endsWith(this.INDEX_FILENAME));
      } catch (error) {
        // Directory doesn't exist or other error, return null
        return null;
      }

      if (!fileExists) {
        return null;
      }

      // Load file content
      console.log(`[${this.moduleId}] DEBUG - Loading index file from path: ${filePath}`);
      const response = await fetch(filePath);
      if (!response.ok) {
        console.warn(`[${this.moduleId}] Failed to load index file: ${response.status}`);
        return null;
      }

      const rawData = await response.json();
      
      // DEBUG: Log basic file info
      console.log(`[${this.moduleId}] DEBUG - Raw index data loaded:`, {
        creaturesCount: rawData.creatures?.length || 0,
        hasMetadata: !!rawData.metadata,
        firstCreature: rawData.creatures?.[0] ? {
          name: rawData.creatures[0].name,
          challengeRating: rawData.creatures[0].challengeRating,
          creatureType: rawData.creatures[0].creatureType
        } : null
      });

      // Convert Map data back from JSON
      const metadata = rawData.metadata;
      if (metadata && metadata.packFingerprints) {
        metadata.packFingerprints = new Map(metadata.packFingerprints);
      }

      console.log(`[${this.moduleId}] Enhanced creature index loaded from file (${rawData.creatures?.length || 0} creatures)`);
      return rawData;
    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to load persisted index from file:`, error);
      return null;
    }
  }

  /**
   * Save enhanced index to JSON file
   */
  private async savePersistedIndex(index: PersistentEnhancedIndex): Promise<void> {
    try {
      // Convert Map to Array for JSON serialization
      const saveData = {
        ...index,
        metadata: {
          ...index.metadata,
          packFingerprints: Array.from(index.metadata.packFingerprints.entries())
        }
      };

      const jsonContent = JSON.stringify(saveData, null, 2);

      // Create a File object and upload it using Foundry's file system
      const file = new File([jsonContent], this.INDEX_FILENAME, { type: 'application/json' });
      
      // Upload the file to the world directory
      const uploadResponse = await FilePicker.upload('data', `worlds/${game.world.id}`, file);

      if (uploadResponse) {
        console.log(`[${this.moduleId}] Enhanced creature index saved to file (${index.creatures.length} creatures)`);
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error(`[${this.moduleId}] Failed to save enhanced index to file:`, error);
      throw error;
    }
  }

  /**
   * Check if existing index is valid (all packs unchanged)
   */
  private isIndexValid(existingIndex: PersistentEnhancedIndex): boolean {
    if (existingIndex.metadata.version !== this.INDEX_VERSION) {
      console.log(`[${this.moduleId}] Index version mismatch: ${existingIndex.metadata.version} !== ${this.INDEX_VERSION}`);
      return false;
    }

    // Check each pack fingerprint
    const actorPacks = Array.from(game.packs.values()).filter(pack => pack.metadata.type === 'Actor');
    
    for (const pack of actorPacks) {
      const currentFingerprint = this.generatePackFingerprint(pack);
      const savedFingerprint = existingIndex.metadata.packFingerprints.get(pack.metadata.id);
      
      if (!savedFingerprint) {
        console.log(`[${this.moduleId}] New pack detected: ${pack.metadata.label}`);
        return false;
      }
      
      if (!this.fingerprintsMatch(currentFingerprint, savedFingerprint)) {
        console.log(`[${this.moduleId}] Pack changed: ${pack.metadata.label}`);
        return false;
      }
    }

    // Check if any saved packs no longer exist
    for (const [packId] of existingIndex.metadata.packFingerprints) {
      if (!game.packs.get(packId)) {
        console.log(`[${this.moduleId}] Pack removed: ${packId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Register Foundry hooks for real-time pack change detection
   */
  private registerFoundryHooks(): void {
    if (this.hooksRegistered) return;

    // Listen for compendium document changes
    Hooks.on('createDocument', (document: any) => {
      if (document.pack && (document.type === 'npc' || document.type === 'character')) {
        console.log(`[${this.moduleId}] Actor document created in pack ${document.pack}, invalidating index`);
        this.invalidateIndex();
      }
    });

    Hooks.on('updateDocument', (document: any) => {
      if (document.pack && (document.type === 'npc' || document.type === 'character')) {
        console.log(`[${this.moduleId}] Actor document updated in pack ${document.pack}, invalidating index`);
        this.invalidateIndex();
      }
    });

    Hooks.on('deleteDocument', (document: any) => {
      if (document.pack && (document.type === 'npc' || document.type === 'character')) {
        console.log(`[${this.moduleId}] Actor document deleted from pack ${document.pack}, invalidating index`);
        this.invalidateIndex();
      }
    });

    // Listen for pack creation/deletion
    Hooks.on('createCompendium', (pack: any) => {
      if (pack.metadata.type === 'Actor') {
        console.log(`[${this.moduleId}] New Actor compendium created: ${pack.metadata.label}, invalidating index`);
        this.invalidateIndex();
      }
    });

    Hooks.on('deleteCompendium', (pack: any) => {
      if (pack.metadata.type === 'Actor') {
        console.log(`[${this.moduleId}] Actor compendium deleted: ${pack.metadata.label}, invalidating index`);
        this.invalidateIndex();
      }
    });

    this.hooksRegistered = true;
    console.log(`[${this.moduleId}] Foundry hooks registered for persistent index change detection`);
  }

  /**
   * Invalidate the current index (mark for rebuild on next access)
   */
  private async invalidateIndex(): Promise<void> {
    try {
      // Check if auto-rebuild is enabled
      const autoRebuild = game.settings.get(this.moduleId, 'autoRebuildIndex');
      
      if (!autoRebuild) {
        console.log(`[${this.moduleId}] Pack change detected but auto-rebuild disabled - index will be marked stale`);
        return;
      }

      // Delete the index file to force rebuild
      const filePath = this.getIndexFilePath();
      
      try {
        // Check if file exists first by trying to browse to the world directory
        const browseResult = await FilePicker.browse('data', `worlds/${game.world.id}`);
        const fileExists = browseResult.files.some(f => f.endsWith(this.INDEX_FILENAME));
        
        if (fileExists) {
          // File exists, delete it using fetch with DELETE method
          const response = await fetch(filePath, { method: 'DELETE' });
          if (response.ok) {
            console.log(`[${this.moduleId}] Enhanced creature index file deleted, will rebuild on next access`);
          } else {
            console.log(`[${this.moduleId}] Could not delete index file, will rebuild over it on next access`);
          }
        } else {
          console.log(`[${this.moduleId}] Enhanced creature index file does not exist`);
        }
      } catch (error) {
        // File doesn't exist or deletion failed - that's okay
        console.log(`[${this.moduleId}] Enhanced creature index invalidated (file operations failed, will rebuild on next access)`);
      }
    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to invalidate index:`, error);
    }
  }

  /**
   * Generate fingerprint for pack change detection with improved accuracy
   */
  private generatePackFingerprint(pack: any): PackFingerprint {
    // Get actual modification time if available
    let lastModified = Date.now();
    if (pack.metadata.lastModified) {
      lastModified = new Date(pack.metadata.lastModified).getTime();
    }

    return {
      packId: pack.metadata.id,
      packLabel: pack.metadata.label,
      lastModified: lastModified,
      documentCount: pack.index?.size || 0,
      checksum: this.generatePackChecksum(pack)
    };
  }

  /**
   * Generate checksum for pack contents
   */
  private generatePackChecksum(pack: any): string {
    // Simple checksum based on pack metadata and size
    const data = `${pack.metadata.id}-${pack.metadata.label}-${pack.index?.size || 0}`;
    return btoa(data).slice(0, 16); // Simple hash for demonstration
  }

  /**
   * Compare two pack fingerprints
   */
  private fingerprintsMatch(current: PackFingerprint, saved: PackFingerprint): boolean {
    return current.documentCount === saved.documentCount && 
           current.checksum === saved.checksum;
  }

  /**
   * Build enhanced creature index from all Actor packs with detailed progress tracking
   */
  private async buildEnhancedIndex(force = false): Promise<EnhancedCreatureIndex[]> {
    if (this.buildInProgress && !force) {
      throw new Error('Index build already in progress');
    }

    this.buildInProgress = true;
    
    const startTime = Date.now();
    let progressNotification: any = null;
    let totalErrors = 0; // Track extraction errors

    try {
      console.log(`[${this.moduleId}] Building enhanced creature index...`);
      
      const actorPacks = Array.from(game.packs.values()).filter(pack => pack.metadata.type === 'Actor');
      const enhancedCreatures: EnhancedCreatureIndex[] = [];
      const packFingerprints = new Map<string, PackFingerprint>();

      // Show initial progress notification
      ui.notifications?.info(`Starting enhanced creature index build from ${actorPacks.length} packs...`);

      for (let i = 0; i < actorPacks.length; i++) {
        const pack = actorPacks[i];
        const progressPercent = Math.round((i / actorPacks.length) * 100);
        
        // Update progress notification every few packs or for important packs
        if (i % 3 === 0 || pack.metadata.label.toLowerCase().includes('monster')) {
          if (progressNotification) {
            progressNotification.remove();
          }
          progressNotification = ui.notifications?.info(
            `Building creature index... ${progressPercent}% (${i + 1}/${actorPacks.length}) Processing: ${pack.metadata.label}`
          );
        }

        console.log(`[${this.moduleId}] Processing pack ${i + 1}/${actorPacks.length} (${progressPercent}%): ${pack.metadata.label}`);

        try {
          // Ensure pack index is loaded
          if (!pack.indexed) {
            console.log(`[${this.moduleId}] Loading index for ${pack.metadata.label}...`);
            await pack.getIndex({});
          }

          // Generate pack fingerprint for change detection
          packFingerprints.set(pack.metadata.id, this.generatePackFingerprint(pack));

          // Show pack processing details for large packs
          const packSize = pack.index?.size || 0;
          if (packSize > 50) {
            if (progressNotification) {
              progressNotification.remove();
            }
            progressNotification = ui.notifications?.info(
              `Processing large pack: ${pack.metadata.label} (${packSize} documents)...`
            );
          }

          // Process creatures in this pack
          const packResult = await this.extractEnhancedDataFromPack(pack);
          enhancedCreatures.push(...packResult.creatures);
          totalErrors += packResult.errors;

          const errorText = packResult.errors > 0 ? ` (${packResult.errors} errors)` : '';
          const packLog = `[${this.moduleId}] ✓ Pack ${i + 1}/${actorPacks.length}: ${pack.metadata.label} - ${packResult.creatures.length} creatures extracted${errorText} (${packSize} total documents)`;
          console.log(packLog);

          // Show milestone notifications for significant progress
          if (i === 0 || (i + 1) % 5 === 0 || i === actorPacks.length - 1) {
            const totalCreaturesSoFar = enhancedCreatures.length;
            if (progressNotification) {
              progressNotification.remove();
            }
            progressNotification = ui.notifications?.info(
              `Index Progress: ${i + 1}/${actorPacks.length} packs complete, ${totalCreaturesSoFar} creatures indexed`
            );
          }

        } catch (error) {
          console.warn(`[${this.moduleId}] ⚠️ Failed to process pack ${pack.metadata.label}:`, error);
          // Show error notification for pack failures
          ui.notifications?.warn(`Warning: Failed to index pack "${pack.metadata.label}" - continuing with other packs`);
        }
      }

      // Clear progress notification and show final processing step
      if (progressNotification) {
        progressNotification.remove();
      }
      ui.notifications?.info(`Saving enhanced index to world database... (${enhancedCreatures.length} creatures)`);

      // Create persistent index structure
      const persistentIndex: PersistentEnhancedIndex = {
        metadata: {
          version: this.INDEX_VERSION,
          timestamp: Date.now(),
          packFingerprints,
          totalCreatures: enhancedCreatures.length
        },
        creatures: enhancedCreatures
      };

      // Save to world flags
      await this.savePersistedIndex(persistentIndex);

      const buildTimeSeconds = Math.round((Date.now() - startTime) / 1000);
      const errorText = totalErrors > 0 ? ` (${totalErrors} extraction errors)` : '';
      const successMessage = `Enhanced creature index complete! ${enhancedCreatures.length} creatures indexed from ${actorPacks.length} packs in ${buildTimeSeconds}s${errorText}`;
      
      console.log(`[${this.moduleId}] ${successMessage}`);
      ui.notifications?.info(successMessage);

      return enhancedCreatures;

    } catch (error) {
      // Clear any progress notifications on error
      if (progressNotification) {
        progressNotification.remove();
      }
      
      const errorMessage = `Failed to build enhanced creature index: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[${this.moduleId}] ${errorMessage}`);
      ui.notifications?.error(errorMessage);
      
      throw error;
      
    } finally {
      this.buildInProgress = false;
      
      // Ensure progress notification is cleared
      if (progressNotification) {
        progressNotification.remove();
      }
    }
  }

  /**
   * Extract enhanced data from all documents in a pack
   */
  private async extractEnhancedDataFromPack(pack: any): Promise<{ creatures: EnhancedCreatureIndex[], errors: number }> {
    const creatures: EnhancedCreatureIndex[] = [];
    let errors = 0;

    try {
      // Load all documents from pack
      const documents = await pack.getDocuments();
      
      for (const doc of documents) {
        try {
          // Only process NPCs and characters
          if (doc.type !== 'npc' && doc.type !== 'character') {
            continue;
          }

          const result = this.extractEnhancedCreatureData(doc, pack);
          if (result) {
            creatures.push(result.creature);
            errors += result.errors;
          }

        } catch (error) {
          console.warn(`[${this.moduleId}] Failed to extract data from ${doc.name} in ${pack.metadata.label}:`, error);
          errors++;
        }
      }

    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to load documents from ${pack.metadata.label}:`, error);
      errors++;
    }

    return { creatures, errors };
  }

  /**
   * Extract enhanced creature data from a single document
   */
  private extractEnhancedCreatureData(doc: any, pack: any): { creature: EnhancedCreatureIndex, errors: number } | null {
    try {
      const system = doc.system || {};
      
      
      // Extract challenge rating with comprehensive fallbacks
      // Based on debug logs: system.details.cr contains the actual value
      let challengeRating = system.details?.cr ?? 
                           system.details?.cr?.value ?? 
                           system.cr?.value ?? system.cr ?? 
                           system.attributes?.cr?.value ?? system.attributes?.cr ??
                           system.challenge?.rating ?? system.challenge?.cr ?? 0;
      
      // Handle null values (spell effects, etc.)
      if (challengeRating === null || challengeRating === undefined) {
        challengeRating = 0;
      }
      
      if (typeof challengeRating === 'string') {
        if (challengeRating === '1/8') challengeRating = 0.125;
        else if (challengeRating === '1/4') challengeRating = 0.25;
        else if (challengeRating === '1/2') challengeRating = 0.5;
        else challengeRating = parseFloat(challengeRating) || 0;
      }
      
      // Ensure it's a number
      challengeRating = Number(challengeRating) || 0;

      // Extract creature type with proper type checking
      // Based on debug logs: system.details.type.value contains the actual value
      let creatureType = system.details?.type?.value ?? 
                         system.details?.type ?? 
                         system.type?.value ?? system.type ?? 
                         system.race?.value ?? system.race ??
                         system.details?.race ?? 'unknown';
      
      // Handle null/undefined values properly
      if (creatureType === null || creatureType === undefined || creatureType === '') {
        creatureType = 'unknown';
      }
      
      // Ensure creatureType is a string before calling toLowerCase()
      if (typeof creatureType !== 'string') {
        creatureType = String(creatureType || 'unknown');
      }

      // Extract size with proper type checking
      let size = system.traits?.size?.value || system.traits?.size || 
                 system.size?.value || system.size || 
                 system.details?.size || 'medium';
      
      // Ensure size is a string
      if (typeof size !== 'string') {
        size = String(size || 'medium');
      }

      // Extract hit points with more fallbacks
      const hitPoints = system.attributes?.hp?.max || system.hp?.max || 
                       system.attributes?.hp?.value || system.hp?.value || 
                       system.health?.max || system.health?.value || 0;

      // Extract armor class with more fallbacks
      const armorClass = system.attributes?.ac?.value || system.ac?.value || 
                        system.attributes?.ac || system.ac || 
                        system.armor?.value || system.armor || 10;

      // Extract alignment with proper type checking
      let alignment = system.details?.alignment?.value || system.details?.alignment || 
                      system.alignment?.value || system.alignment || 'unaligned';
      
      // Ensure alignment is a string
      if (typeof alignment !== 'string') {
        alignment = String(alignment || 'unaligned');
      }

      // Check for spells with more comprehensive detection
      const hasSpells = !!(system.spells || 
                          system.attributes?.spellcasting || 
                          (system.details?.spellLevel && system.details.spellLevel > 0) ||
                          (system.resources?.spell && system.resources.spell.max > 0) ||
                          system.spellcasting ||
                          (system.traits?.spellcasting) ||
                          (system.details?.spellcaster));

      // Check for legendary actions with more comprehensive detection
      const hasLegendaryActions = !!(system.resources?.legact || 
                                    system.legendary || 
                                    (system.resources?.legres && system.resources.legres.value > 0) ||
                                    system.details?.legendary ||
                                    system.traits?.legendary ||
                                    (system.resources?.legendary && system.resources.legendary.max > 0));

      // DEBUG: Log what we extracted for comparison

      // Successful extraction
      return {
        creature: {
          id: doc._id,
          name: doc.name,
          type: doc.type,
          pack: pack.metadata.id,
          packLabel: pack.metadata.label,
          challengeRating: challengeRating,
          creatureType: creatureType.toLowerCase(),
          size: size.toLowerCase(),
          hitPoints: hitPoints,
          armorClass: armorClass,
          hasSpells: hasSpells,
          hasLegendaryActions: hasLegendaryActions,
          alignment: alignment.toLowerCase(),
          description: doc.system?.details?.biography || doc.system?.description || '',
          img: doc.img
        },
        errors: 0
      };

    } catch (error) {
      console.warn(`[${this.moduleId}] Failed to extract enhanced data from ${doc.name}:`, error);
      
      // Return a basic fallback record with error count instead of null to avoid losing creatures
      return {
        creature: {
          id: doc._id,
          name: doc.name,
          type: doc.type,
          pack: pack.metadata.id,
          packLabel: pack.metadata.label,
          challengeRating: 0,
          creatureType: 'unknown',
          size: 'medium',
          hitPoints: 1,
          armorClass: 10,
          hasSpells: false,
          hasLegendaryActions: false,
          alignment: 'unaligned',
          description: 'Data extraction failed',
          img: doc.img || ''
        },
        errors: 1
      };
    }
  }
}

export class FoundryDataAccess {
  private moduleId: string = MODULE_ID;
  private persistentIndex: PersistentCreatureIndex = new PersistentCreatureIndex();

  constructor() {}

  /**
   * Force rebuild of enhanced creature index
   */
  async rebuildEnhancedCreatureIndex(): Promise<{ success: boolean; totalCreatures: number; message: string }> {
    try {
      const creatures = await this.persistentIndex.rebuildIndex();
      return {
        success: true,
        totalCreatures: creatures.length,
        message: `Enhanced creature index rebuilt: ${creatures.length} creatures indexed from all packs`
      };
    } catch (error) {
      console.error(`[${this.moduleId}] Failed to rebuild enhanced creature index:`, error);
      return {
        success: false,
        totalCreatures: 0,
        message: `Failed to rebuild index: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

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
   * Search compendium packs for items matching query with optional filters
   */
  async searchCompendium(query: string, packType?: string, filters?: {
    challengeRating?: number | { min?: number; max?: number };
    creatureType?: string;
    size?: string;
    alignment?: string;
    hasLegendaryActions?: boolean;
    spellcaster?: boolean;
  }): Promise<CompendiumSearchResult[]> {
    this.checkPermission('allowCompendiumAccess');

    // Add defensive checks for query parameter
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw new Error('Search query must be a string with at least 2 characters');
    }

    // ENHANCED SEARCH: If we have creature-specific filters and Actor packType, use enhanced index
    if (filters && packType === 'Actor' && 
        (filters.challengeRating || filters.creatureType || filters.hasLegendaryActions)) {
      
      console.log(`[${this.moduleId}] searchCompendium redirecting to enhanced index search for query "${query}" with filters:`, filters);
      
      // Check if enhanced creature index is enabled
      const enhancedIndexEnabled = game.settings.get(this.moduleId, 'enableEnhancedCreatureIndex');
      
      if (enhancedIndexEnabled) {
        try {
          // Convert search criteria and use enhanced search
          const criteria: any = { limit: 100 }; // Default limit for search
          
          if (filters.challengeRating) criteria.challengeRating = filters.challengeRating;
          if (filters.creatureType) criteria.creatureType = filters.creatureType;
          if (filters.size) criteria.size = filters.size;
          if (filters.hasLegendaryActions) criteria.hasLegendaryActions = filters.hasLegendaryActions;
          
          const enhancedResult = await this.listCreaturesByCriteria(criteria);
          
          // Filter results by name query
          const filteredResults = enhancedResult.creatures.filter(creature => 
            creature.name.toLowerCase().includes(query.toLowerCase())
          );
          
          console.log(`[${this.moduleId}] Enhanced search found ${filteredResults.length} results for "${query}"`);
          
          // Convert to CompendiumSearchResult format
          return filteredResults.map(creature => ({
            id: creature.id || creature.name,
            name: creature.name,
            type: creature.type || 'npc',
            pack: creature.pack,
            packLabel: creature.packLabel || creature.pack,
            description: creature.description || '',
            hasImage: creature.hasImage || !!creature.img,
            summary: `CR ${creature.challengeRating} ${creature.creatureType} from ${creature.packLabel}`,
            // Enhanced data (not part of interface but will be included)
            challengeRating: creature.challengeRating,
            creatureType: creature.creatureType,
            size: creature.size,
            hasLegendaryActions: creature.hasLegendaryActions
          } as CompendiumSearchResult & {
            challengeRating: number;
            creatureType: string;
            size: string;
            hasLegendaryActions: boolean;
          }));
          
        } catch (error) {
          console.warn(`[${this.moduleId}] Enhanced search failed, falling back to basic search:`, error);
          // Continue to basic search below
        }
      }
    }

    const results: CompendiumSearchResult[] = [];
    const cleanQuery = query.toLowerCase().trim();
    const searchTerms = cleanQuery.split(' ').filter(term => term && typeof term === 'string' && term.length > 0);

    if (searchTerms.length === 0) {
      throw new Error('Search query must contain valid search terms');
    }

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
          await pack.getIndex({});
        }

        // Use basic compendium index for all searches
        const entriesToSearch = Array.from(pack.index.values());
        
        for (const entry of entriesToSearch) {
          try {
            // Type assertion and comprehensive safety checks for entry properties
            const typedEntry = entry as any;
            if (!typedEntry || !typedEntry.name || typeof typedEntry.name !== 'string' || typedEntry.name.trim().length === 0) {
              continue;
            }

            // Ensure searchTerms are valid before using them
            if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
              continue;
            }

            // Use already created typedEntry
            
            const entryNameLower = typedEntry.name.toLowerCase();
            const nameMatch = searchTerms.every(term => {
              if (!term || typeof term !== 'string') {
                return false;
              }
              return entryNameLower.includes(term);
            });

            if (nameMatch) {
              // For Actor packs with filters, use simple name/description matching
              if (filters && this.shouldApplyFilters(entry, filters) && pack.metadata.type === 'Actor') {
                // Convert filters to search criteria for compatibility
                const searchCriteria: any = {};
                
                if (filters.challengeRating) {
                  const searchTerms = [];
                  if (typeof filters.challengeRating === 'number') {
                    if (filters.challengeRating >= 15) {
                      searchTerms.push('ancient', 'legendary', 'elder', 'greater');
                    } else if (filters.challengeRating >= 10) {
                      searchTerms.push('adult', 'warlord', 'champion', 'master');
                    } else if (filters.challengeRating >= 5) {
                      searchTerms.push('captain', 'knight', 'priest', 'mage');
                    } else {
                      searchTerms.push('guard', 'soldier', 'warrior', 'scout');
                    }
                  }
                  searchCriteria.searchTerms = searchTerms;
                }
                
                if (filters.creatureType) {
                  const typeTerms = [filters.creatureType];
                  if (filters.creatureType.toLowerCase() === 'humanoid') {
                    typeTerms.push('human', 'elf', 'dwarf', 'orc', 'goblin');
                  }
                  searchCriteria.searchTerms = [...(searchCriteria.searchTerms || []), ...typeTerms];
                }
                
                if (!this.matchesSearchCriteria(typedEntry, searchCriteria)) {
                  continue;
                }
              }

              // Standard index entry result
              results.push({
                id: typedEntry._id || '',
                name: typedEntry.name,
                type: typedEntry.type || 'unknown',
                img: typedEntry.img || undefined,
                pack: pack.metadata.id,
                packLabel: pack.metadata.label,
                description: typedEntry.description || '',
                hasImage: !!typedEntry.img,
                summary: `${typedEntry.type} from ${pack.metadata.label}`,
              });
            }
          } catch (entryError) {
            // Log individual entry errors but continue processing
            console.warn(`[${this.moduleId}] Error processing entry in pack ${pack.metadata.id}:`, entryError);
            continue;
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

    // Sort results by relevance with enhanced ranking for filtered searches
    results.sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // If filters are used, prioritize by filter match quality
      if (filters) {
        const aScore = this.calculateRelevanceScore(a, filters, query);
        const bScore = this.calculateRelevanceScore(b, filters, query);
        if (aScore !== bScore) return bScore - aScore; // Higher score first
      }
      
      // Fallback to alphabetical
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, 50); // Final limit
  }

  /**
   * Check if filters should be applied to this entry
   */
  private shouldApplyFilters(entry: any, filters: any): boolean {
    // Only apply filters to Actor entries (which includes NPCs/monsters)
    if (entry.type !== 'npc' && entry.type !== 'character') {
      return false;
    }
    
    // Check if any filters are actually specified
    return Object.keys(filters).some(key => filters[key] !== undefined);
  }

  /**
   * Check if entry passes all specified filters
   * @unused - Replaced with simple index-only approach
   */
  // @ts-ignore - Unused method kept for compatibility
  private passesFilters(entry: any, filters: {
    challengeRating?: number | { min?: number; max?: number };
    creatureType?: string;
    size?: string;
    alignment?: string;
    hasLegendaryActions?: boolean;
    spellcaster?: boolean;
  }): boolean {
    const system = entry.system || {};
    
    console.log(`[${this.moduleId}] Filtering ${entry.name}:`, {
      entryType: entry.type,
      system: system,
      filters: filters
    });


    // Challenge Rating filter
    if (filters.challengeRating !== undefined) {
      // Try multiple possible CR locations in D&D 5e data structure
      let entryCR = system.details?.cr?.value || system.details?.cr || system.cr?.value || system.cr || 0;
      
      // Handle fractional CRs (common in D&D 5e)
      if (typeof entryCR === 'string') {
        if (entryCR === '1/8') entryCR = 0.125;
        else if (entryCR === '1/4') entryCR = 0.25;
        else if (entryCR === '1/2') entryCR = 0.5;
        else entryCR = parseFloat(entryCR) || 0;
      }
      
      if (typeof filters.challengeRating === 'number') {
        // Exact CR match
        if (entryCR !== filters.challengeRating) {
          console.log(`[${this.moduleId}] ${entry.name} failed CR filter: ${entryCR} !== ${filters.challengeRating}`);
          return false;
        }
      } else if (typeof filters.challengeRating === 'object') {
        // CR range
        const { min, max } = filters.challengeRating;
        if (min !== undefined && entryCR < min) {
          console.log(`[${this.moduleId}] ${entry.name} failed CR min filter: ${entryCR} < ${min}`);
          return false;
        }
        if (max !== undefined && entryCR > max) {
          console.log(`[${this.moduleId}] ${entry.name} failed CR max filter: ${entryCR} > ${max}`);
          return false;
        }
      }
    }

    // Creature Type filter
    if (filters.creatureType) {
      const entryType = system.details?.type?.value || system.type?.value || '';
      if (entryType.toLowerCase() !== filters.creatureType.toLowerCase()) {
        console.log(`[${this.moduleId}] ${entry.name} failed creature type filter: "${entryType}" !== "${filters.creatureType}"`);
        return false;
      }
    }

    // Size filter
    if (filters.size) {
      const entrySize = system.traits?.size || system.size || '';
      if (entrySize.toLowerCase() !== filters.size.toLowerCase()) {
        console.log(`[${this.moduleId}] ${entry.name} failed size filter: "${entrySize}" !== "${filters.size}"`);
        return false;
      }
    }

    // Alignment filter
    if (filters.alignment) {
      const entryAlignment = system.details?.alignment || system.alignment || '';
      if (!entryAlignment.toLowerCase().includes(filters.alignment.toLowerCase())) {
        console.log(`[${this.moduleId}] ${entry.name} failed alignment filter: "${entryAlignment}" does not contain "${filters.alignment}"`);
        return false;
      }
    }

    // Legendary Actions filter
    if (filters.hasLegendaryActions !== undefined) {
      const hasLegendary = !!(system.resources?.legact || system.legendary || 
                             (system.resources?.legres && system.resources.legres.value > 0));
      if (hasLegendary !== filters.hasLegendaryActions) {
        console.log(`[${this.moduleId}] ${entry.name} failed legendary actions filter: ${hasLegendary} !== ${filters.hasLegendaryActions}`);
        return false;
      }
    }

    // Spellcaster filter
    if (filters.spellcaster !== undefined) {
      const isSpellcaster = !!(system.spells || system.attributes?.spellcasting || 
                               (system.details?.spellLevel && system.details.spellLevel > 0));
      if (isSpellcaster !== filters.spellcaster) {
        console.log(`[${this.moduleId}] ${entry.name} failed spellcaster filter: ${isSpellcaster} !== ${filters.spellcaster}`);
        return false;
      }
    }

    console.log(`[${this.moduleId}] ${entry.name} passed all filters`);
    return true;
  }

  /**
   * Calculate relevance score for search result ranking
   */
  private calculateRelevanceScore(entry: any, filters: any, query: string): number {
    let score = 0;
    const system = entry.system || {};
    
    // Bonus for creature type match (high importance for encounter building)
    if (filters.creatureType) {
      const entryType = system.details?.type?.value || system.type?.value || '';
      if (entryType.toLowerCase() === filters.creatureType.toLowerCase()) {
        score += 20;
      }
    }
    
    // Bonus for CR match (exact match gets higher score than range)
    if (filters.challengeRating !== undefined) {
      const entryCR = system.details?.cr || system.cr || 0;
      if (typeof filters.challengeRating === 'number') {
        if (entryCR === filters.challengeRating) score += 15;
      } else if (typeof filters.challengeRating === 'object') {
        const { min, max } = filters.challengeRating;
        if (min !== undefined && max !== undefined) {
          // Bonus for being in range, extra for being in middle of range
          if (entryCR >= min && entryCR <= max) {
            score += 10;
            const rangeMid = (min + max) / 2;
            const distFromMid = Math.abs(entryCR - rangeMid);
            score += Math.max(0, 5 - distFromMid); // Up to 5 bonus for being near middle
          }
        }
      }
    }
    
    // Bonus for common creature names (better for encounters)
    const commonNames = ['knight', 'warrior', 'guard', 'soldier', 'mage', 'priest', 'bandit', 'orc', 'goblin', 'dragon'];
    const lowerName = entry.name.toLowerCase();
    if (commonNames.some(name => lowerName.includes(name))) {
      score += 5;
    }
    
    // Bonus for query term matches in name
    const queryTerms = query.toLowerCase().split(' ');
    for (const term of queryTerms) {
      if (term.length > 2 && lowerName.includes(term)) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * List creatures by criteria using enhanced persistent index - optimized for instant filtering
   */
  async listCreaturesByCriteria(criteria: {
    challengeRating?: number | { min?: number; max?: number };
    creatureType?: string;
    size?: string;
    hasSpells?: boolean;
    hasLegendaryActions?: boolean;
    limit?: number;
  }): Promise<{creatures: any[], searchSummary: any}> {
    this.checkPermission('allowCompendiumAccess');

    const limit = criteria.limit || 500;

    // Check if enhanced creature index is enabled
    const enhancedIndexEnabled = game.settings.get(this.moduleId, 'enableEnhancedCreatureIndex');

    if (!enhancedIndexEnabled) {
      console.log(`[${this.moduleId}] Enhanced creature index disabled, falling back to basic search`);
      return this.fallbackBasicCreatureSearch(criteria, limit);
    }

    try {
      console.log(`[${this.moduleId}] Using enhanced persistent index for creature search with criteria:`, criteria);
      
      // Get enhanced creature index (builds if needed)
      const enhancedCreatures = await this.persistentIndex.getEnhancedIndex();
      console.log(`[${this.moduleId}] Enhanced index loaded: ${enhancedCreatures.length} creatures available`);
      
      // DEBUG: Log sample creature data to verify what we're getting
      if (enhancedCreatures.length > 0) {
        const sampleCreature = enhancedCreatures[0];
        console.log(`[${this.moduleId}] DEBUG - Sample creature from enhanced index:`, {
          name: sampleCreature.name,
          challengeRating: sampleCreature.challengeRating,
          creatureType: sampleCreature.creatureType,
          size: sampleCreature.size
        });
      }

      // Apply filters to enhanced data
      let filteredCreatures = enhancedCreatures.filter(creature => this.passesEnhancedCriteria(creature, criteria));

      console.log(`[${this.moduleId}] After filtering: ${filteredCreatures.length} creatures match criteria`);

      // Sort by CR then name for consistent ordering
      filteredCreatures.sort((a, b) => {
        if (a.challengeRating !== b.challengeRating) {
          return a.challengeRating - b.challengeRating; // Lower CR first
        }
        return a.name.localeCompare(b.name);
      });

      // Apply limit
      if (filteredCreatures.length > limit) {
        filteredCreatures = filteredCreatures.slice(0, limit);
        console.log(`[${this.moduleId}] Applied limit: showing first ${limit} of ${filteredCreatures.length} matches`);
      }

      // Convert enhanced creatures to result format
      const results = filteredCreatures.map(creature => ({
        id: creature.id,
        name: creature.name,
        type: creature.type,
        pack: creature.pack,
        packLabel: creature.packLabel,
        description: creature.description || '',
        hasImage: !!creature.img,
        summary: `CR ${creature.challengeRating} ${creature.creatureType} from ${creature.packLabel}`,
        // Include enhanced data for better sorting and display
        challengeRating: creature.challengeRating,
        creatureType: creature.creatureType,
        size: creature.size,
        hitPoints: creature.hitPoints,
        armorClass: creature.armorClass,
        hasSpells: creature.hasSpells,
        hasLegendaryActions: creature.hasLegendaryActions,
        alignment: creature.alignment
      }));

      // Calculate pack distribution for summary
      const packResults = new Map();
      results.forEach(creature => {
        const count = packResults.get(creature.packLabel) || 0;
        packResults.set(creature.packLabel, count + 1);
      });

      // Get unique pack information
      const uniquePacks = Array.from(new Set(enhancedCreatures.map(c => c.pack)));
      const topPacks = uniquePacks.slice(0, 5).map(packId => {
        const sampleCreature = enhancedCreatures.find(c => c.pack === packId);
        return {
          id: packId,
          label: sampleCreature?.packLabel || 'Unknown Pack',
          priority: 100 // All packs are prioritized equally in enhanced index
        };
      });

      console.log(`[${this.moduleId}] Enhanced search complete: ${results.length} creatures found`);
      if (packResults.size > 0) {
        console.log(`[${this.moduleId}] Results by pack:`, Object.fromEntries(packResults));
      }

      // DEBUG: Log what we're actually returning
      console.log(`[${this.moduleId}] DEBUG - Final results being returned:`, {
        sampleResult: results[0] ? {
          name: results[0].name,
          challengeRating: results[0].challengeRating,
          creatureType: results[0].creatureType,
          pack: results[0].pack,
          packLabel: results[0].packLabel
        } : null,
        totalResults: results.length
      });

      return {
        creatures: results,
        searchSummary: {
          packsSearched: uniquePacks.length,
          topPacks,
          totalCreaturesFound: results.length,
          resultsByPack: Object.fromEntries(packResults),
          criteria: criteria,
          indexMetadata: {
            totalIndexedCreatures: enhancedCreatures.length,
            searchMethod: 'enhanced_persistent_index'
          }
        }
      };

    } catch (error) {
      console.error(`[${this.moduleId}] Enhanced creature search failed:`, error);
      // Fallback to basic search if enhanced index fails
      return this.fallbackBasicCreatureSearch(criteria, limit);
    }
  }

  /**
   * Check if enhanced creature passes all specified criteria
   */
  private passesEnhancedCriteria(creature: EnhancedCreatureIndex, criteria: {
    challengeRating?: number | { min?: number; max?: number };
    creatureType?: string;
    size?: string;
    hasSpells?: boolean;
    hasLegendaryActions?: boolean;
  }): boolean {
    
    // Challenge Rating filter
    if (criteria.challengeRating !== undefined) {
      if (typeof criteria.challengeRating === 'number') {
        if (creature.challengeRating !== criteria.challengeRating) {
          return false;
        }
      } else if (typeof criteria.challengeRating === 'object') {
        const { min, max } = criteria.challengeRating;
        if (min !== undefined && creature.challengeRating < min) {
          return false;
        }
        if (max !== undefined && creature.challengeRating > max) {
          return false;
        }
      }
    }

    // Creature Type filter
    if (criteria.creatureType) {
      if (creature.creatureType.toLowerCase() !== criteria.creatureType.toLowerCase()) {
        return false;
      }
    }

    // Size filter
    if (criteria.size) {
      if (creature.size.toLowerCase() !== criteria.size.toLowerCase()) {
        return false;
      }
    }

    // Spellcaster filter
    if (criteria.hasSpells !== undefined) {
      if (creature.hasSpells !== criteria.hasSpells) {
        return false;
      }
    }

    // Legendary Actions filter
    if (criteria.hasLegendaryActions !== undefined) {
      if (creature.hasLegendaryActions !== criteria.hasLegendaryActions) {
        return false;
      }
    }

    return true;
  }

  /**
   * Fallback to basic creature search if enhanced index fails
   */
  private async fallbackBasicCreatureSearch(criteria: any, limit: number): Promise<{creatures: any[], searchSummary: any}> {
    console.warn(`[${this.moduleId}] Falling back to basic search due to enhanced index failure`);
    
    // Use a simple text-based search as fallback
    const searchTerms: string[] = [];
    
    if (criteria.creatureType) {
      searchTerms.push(criteria.creatureType);
    }
    
    if (criteria.challengeRating) {
      if (typeof criteria.challengeRating === 'number') {
        // Add CR-based name patterns as fallback
        if (criteria.challengeRating >= 15) searchTerms.push('ancient', 'legendary');
        else if (criteria.challengeRating >= 10) searchTerms.push('adult', 'champion');
        else if (criteria.challengeRating >= 5) searchTerms.push('captain', 'knight');
      }
    }
    
    const searchQuery = searchTerms.join(' ') || 'monster';
    const basicResults = await this.searchCompendium(searchQuery, 'Actor');
    
    return {
      creatures: basicResults.slice(0, limit),
      searchSummary: {
        packsSearched: 0,
        topPacks: [],
        totalCreaturesFound: basicResults.length,
        resultsByPack: {},
        criteria: criteria,
        fallback: true,
        searchMethod: 'basic_fallback'
      }
    };
  }

  /**
   * Prioritize compendium packs by likelihood of containing relevant creatures
   * @unused - Replaced by enhanced persistent index system
   */
  // @ts-ignore - Unused method kept for compatibility
  private prioritizePacksForCreatures(packs: any[]): any[] {
    const priorityOrder = [
      // Tier 1: Core D&D 5e content (highest priority)
      { pattern: /^dnd5e\.monsters/, priority: 100 },           // Core D&D 5e monsters 
      { pattern: /^dnd5e\.actors/, priority: 95 },             // Core D&D 5e actors
      { pattern: /ddb.*monsters/i, priority: 90 },             // D&D Beyond monsters
      
      // Tier 2: Official modules and supplements
      { pattern: /^world\..*ddb.*monsters/i, priority: 85 },   // World-specific DDB monsters
      { pattern: /monsters/i, priority: 80 },                  // Any pack with "monsters"
      
      // Tier 3: Campaign and adventure content
      { pattern: /^world\.(?!.*summon|.*hero)/i, priority: 70 }, // World packs (not summons/heroes)
      
      // Tier 4: Specialized content
      { pattern: /summon|familiar/i, priority: 40 },           // Summons and familiars
      
      // Tier 5: Unlikely to contain monsters (lowest priority) 
      { pattern: /hero|player|pc/i, priority: 10 },            // Player characters
    ];

    return packs.sort((a, b) => {
      const aScore = this.getPackPriority(a.metadata.id, a.metadata.label, priorityOrder);
      const bScore = this.getPackPriority(b.metadata.id, b.metadata.label, priorityOrder);
      
      if (aScore !== bScore) {
        return bScore - aScore; // Higher score first
      }
      
      // Secondary sort by pack label alphabetically
      return a.metadata.label.localeCompare(b.metadata.label);
    });
  }

  /**
   * Get priority score for a pack based on ID and label
   */
  private getPackPriority(packId: string, packLabel: string, priorityOrder: { pattern: RegExp; priority: number }[]): number {
    for (const rule of priorityOrder) {
      if (rule.pattern.test(packId) || rule.pattern.test(packLabel)) {
        return rule.priority;
      }
    }
    // Default priority for unmatched packs
    return 50;
  }

  /**
   * Check if creature entry passes the given criteria
   * @unused - Legacy method replaced by passesEnhancedCriteria
   */
  // @ts-ignore - Legacy method kept for compatibility
  private passesCriteria(entry: any, criteria: {
    challengeRating?: number | { min?: number; max?: number };
    creatureType?: string;
    size?: string;
    hasSpells?: boolean;
    hasLegendaryActions?: boolean;
  }): boolean {
    const system = entry.system || {};

    // DEBUG: Log entry structure for first few entries
    if (Math.random() < 0.01) { // 1% sampling to avoid spam
      console.log(`[${this.moduleId}] DEBUG Entry:`, {
        name: entry.name,
        type: entry.type,
        systemKeys: Object.keys(system),
        crExtractionAttempts: {
          'system.details?.cr?.value': system.details?.cr?.value,
          'system.details?.cr': system.details?.cr,
          'system.cr?.value': system.cr?.value,
          'system.cr': system.cr,
          'system.attributes?.cr': system.attributes?.cr,
          'system.challenge': system.challenge
        }
      });
    }

    // Challenge Rating filter - enhanced extraction
    if (criteria.challengeRating !== undefined) {
      // Try multiple possible CR locations in D&D 5e data structure
      let entryCR = system.details?.cr?.value || system.details?.cr || system.cr?.value || system.cr || 0;
      
      // Handle fractional CRs (common in D&D 5e)
      if (typeof entryCR === 'string') {
        if (entryCR === '1/8') entryCR = 0.125;
        else if (entryCR === '1/4') entryCR = 0.25;
        else if (entryCR === '1/2') entryCR = 0.5;
        else entryCR = parseFloat(entryCR) || 0;
      }
      
      if (typeof criteria.challengeRating === 'number') {
        if (entryCR !== criteria.challengeRating) {
          console.log(`[${this.moduleId}] CR mismatch: ${entry.name} has CR ${entryCR}, looking for ${criteria.challengeRating}`);
          return false;
        }
      } else if (typeof criteria.challengeRating === 'object') {
        const { min = 0, max = 30 } = criteria.challengeRating;
        if (entryCR < min || entryCR > max) {
          console.log(`[${this.moduleId}] CR range mismatch: ${entry.name} has CR ${entryCR}, range ${min}-${max}`);
          return false;
        }
      }
    }

    // Creature Type filter - enhanced extraction
    if (criteria.creatureType) {
      // Try multiple possible type locations in D&D 5e data structure
      const entryType = system.details?.type?.value || system.details?.type || system.type?.value || system.type || '';
      if (entryType.toLowerCase() !== criteria.creatureType.toLowerCase()) {
        console.log(`[${this.moduleId}] Type mismatch: ${entry.name} has type "${entryType}", looking for "${criteria.creatureType}"`);
        return false;
      }
    }

    // Size filter
    if (criteria.size) {
      const entrySize = system.traits?.size || system.size || '';
      if (entrySize.toLowerCase() !== criteria.size.toLowerCase()) return false;
    }

    // Spellcaster filter
    if (criteria.hasSpells !== undefined) {
      const isSpellcaster = !!(system.spells || system.attributes?.spellcasting || 
                               (system.details?.spellLevel && system.details.spellLevel > 0));
      if (isSpellcaster !== criteria.hasSpells) return false;
    }

    // Legendary Actions filter
    if (criteria.hasLegendaryActions !== undefined) {
      const hasLegendary = !!(system.resources?.legact || system.legendary || 
                             (system.resources?.legres && system.resources.legres.value > 0));
      if (hasLegendary !== criteria.hasLegendaryActions) return false;
    }

    return true;
  }

  /**
   * Simple name/description-based matching for creatures using index data only
   */
  private matchesSearchCriteria(entry: any, criteria: {
    searchTerms?: string[];
    excludeTerms?: string[];
    size?: string;
    hasSpells?: boolean;
    hasLegendaryActions?: boolean;
  }): boolean {
    const name = (entry.name || '').toLowerCase();
    const description = (entry.description || '').toLowerCase();
    const searchText = `${name} ${description}`;

    // Include terms - at least one must match
    if (criteria.searchTerms && criteria.searchTerms.length > 0) {
      const hasMatch = criteria.searchTerms.some(term => 
        searchText.includes(term.toLowerCase())
      );
      if (!hasMatch) {
        return false;
      }
    }

    // Exclude terms - none should match
    if (criteria.excludeTerms && criteria.excludeTerms.length > 0) {
      const hasExcluded = criteria.excludeTerms.some(term => 
        searchText.includes(term.toLowerCase())
      );
      if (hasExcluded) {
        return false;
      }
    }

    return true;
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

  /**
   * Audit log for write operations
   */
  private auditLog(operation: string, data: any, result: 'success' | 'failure', error?: string): void {
    const auditEnabled = game.settings.get(this.moduleId, 'enableWriteAuditLog');
    if (!auditEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      user: game.user?.name || 'Unknown',
      userId: game.user?.id || 'unknown',
      world: game.world?.id || 'unknown',
      data: this.sanitizeData(data),
      result,
      error,
    };

    console.log(`[${this.moduleId}] AUDIT:`, logEntry);
    
    // Store in flags for persistence (optional)
    if (game.world && (game.world as any).setFlag) {
      const auditLogs = (game.world as any).getFlag(this.moduleId, 'auditLogs') || [];
      auditLogs.push(logEntry);
      
      // Keep only last 100 entries to prevent bloat
      if (auditLogs.length > 100) {
        auditLogs.splice(0, auditLogs.length - 100);
      }
      
      (game.world as any).setFlag(this.moduleId, 'auditLogs', auditLogs);
    }
  }

  // ===== PHASE 2 & 3: WRITE OPERATIONS =====

  /**
   * Create journal entry for quests
   */
  async createJournalEntry(request: { name: string; content: string }): Promise<{ id: string; name: string }> {
    this.validateFoundryState();

    // Use permission system for journal creation
    const permissionCheck = permissionManager.checkWritePermission('createActor', {
      quantity: 1, // Treat journal creation similar to actor creation for permissions
    });

    if (!permissionCheck.allowed) {
      throw new Error(`Journal creation denied: ${permissionCheck.reason}`);
    }

    try {
      // Create journal entry with proper Foundry v13 structure
      const journalData = {
        name: request.name,
        pages: [{
          type: 'text',
          name: request.name,
          text: {
            content: request.content
          }
        }],
        ownership: { default: 0 } // GM only by default
      };

      const journal = await JournalEntry.create(journalData);
      
      if (!journal) {
        throw new Error('Failed to create journal entry');
      }

      const result = {
        id: journal.id,
        name: journal.name || request.name,
      };

      this.auditLog('createJournalEntry', request, 'success');
      return result;

    } catch (error) {
      this.auditLog('createJournalEntry', request, 'failure', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * List all journal entries
   */
  async listJournals(): Promise<Array<{ id: string; name: string; type: string }>> {
    this.validateFoundryState();

    return game.journal.map((journal: any) => ({
      id: journal.id || '',
      name: journal.name || '',
      type: 'JournalEntry',
    }));
  }

  /**
   * Get journal entry content
   */
  async getJournalContent(journalId: string): Promise<{ content: string } | null> {
    this.validateFoundryState();

    const journal = game.journal.get(journalId);
    if (!journal) {
      return null;
    }

    // Get first text page content
    const firstPage = journal.pages.find((page: any) => page.type === 'text');
    if (!firstPage) {
      return { content: '' };
    }

    return {
      content: firstPage.text?.content || '',
    };
  }

  /**
   * Update journal entry content
   */
  async updateJournalContent(request: { journalId: string; content: string }): Promise<{ success: boolean }> {
    this.validateFoundryState();

    // Use permission system for journal updates
    const permissionCheck = permissionManager.checkWritePermission('createActor', {
      quantity: 1, // Treat journal updates similar to actor creation for permissions
    });

    if (!permissionCheck.allowed) {
      throw new Error(`Journal update denied: ${permissionCheck.reason}`);
    }

    try {
      const journal = game.journal.get(request.journalId);
      if (!journal) {
        throw new Error('Journal entry not found');
      }

      // Update first text page or create one if none exists
      const firstPage = journal.pages.find((page: any) => page.type === 'text');
      
      if (firstPage) {
        // Update existing page
        await firstPage.update({
          'text.content': request.content,
        });
      } else {
        // Create new text page
        await journal.createEmbeddedDocuments('JournalEntryPage', [{
          type: 'text',
          name: journal.name,
          text: {
            content: request.content,
          },
        }]);
      }

      this.auditLog('updateJournalContent', request, 'success');
      return { success: true };

    } catch (error) {
      this.auditLog('updateJournalContent', request, 'failure', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Create actors from compendium entries with custom names
   */
  async createActorFromCompendium(request: ActorCreationRequest): Promise<ActorCreationResult> {
    this.validateFoundryState();

    // Use new permission system
    const permissionCheck = permissionManager.checkWritePermission('createActor', {
      quantity: request.quantity || 1,
    });
    
    if (!permissionCheck.allowed) {
      throw new Error(`${ERROR_MESSAGES.ACCESS_DENIED}: ${permissionCheck.reason}`);
    }

    // Audit the permission check
    permissionManager.auditPermissionCheck('createActor', permissionCheck, request);

    const maxActors = game.settings.get(this.moduleId, 'maxActorsPerRequest') as number;
    const quantity = Math.min(request.quantity || 1, maxActors);
    
    // Start transaction for rollback capability
    const transactionId = transactionManager.startTransaction(
      `Create ${quantity} actor(s) from compendium: ${request.creatureType}`
    );

    try {
      // Find matching compendium entry
      const compendiumEntry = await this.findBestCompendiumMatch(request.creatureType, request.packPreference);
      if (!compendiumEntry) {
        throw new Error(`No compendium entry found for "${request.creatureType}"`);
      }

      // Get full compendium document
      const sourceDoc = await this.getCompendiumDocumentFull(
        compendiumEntry.pack, 
        compendiumEntry.id
      );

      const createdActors: CreatedActorInfo[] = [];
      const errors: string[] = [];

      // Create actors with custom names
      for (let i = 0; i < quantity; i++) {
        try {
          const customName = request.customNames?.[i] || 
                           (quantity > 1 ? `${sourceDoc.name} ${i + 1}` : sourceDoc.name);
          
          const newActor = await this.createActorFromSource(sourceDoc, customName);
          
          // Track actor creation for rollback
          transactionManager.addAction(transactionId, 
            transactionManager.createActorCreationAction(newActor.id)
          );
          
          createdActors.push({
            id: newActor.id,
            name: newActor.name,
            originalName: sourceDoc.name,
            type: newActor.type,
            sourcePackId: compendiumEntry.pack,
            sourcePackLabel: compendiumEntry.packLabel,
            img: newActor.img,
          });
        } catch (error) {
          errors.push(`Failed to create actor ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      let tokensPlaced = 0;
      
      // Add to scene if requested and permission allows
      if (request.addToScene && createdActors.length > 0) {
        try {
          const scenePermissionCheck = permissionManager.checkWritePermission('modifyScene', {
            targetIds: createdActors.map(a => a.id),
          });
          
          if (!scenePermissionCheck.allowed) {
            errors.push(`Cannot add to scene: ${scenePermissionCheck.reason}`);
          } else {
            const tokenResult = await this.addActorsToScene({
              actorIds: createdActors.map(a => a.id),
              placement: 'random',
              hidden: false,
            }, transactionId);
            tokensPlaced = tokenResult.tokensCreated;
          }
        } catch (error) {
          errors.push(`Failed to add actors to scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // If we had partial failure, decide whether to rollback
      if (errors.length > 0 && createdActors.length < quantity) {
        // Rollback if we failed to create more than half the requested actors
        if (createdActors.length < quantity / 2) {
          console.warn(`[${this.moduleId}] Rolling back due to significant failures (${createdActors.length}/${quantity} created)`);
          await transactionManager.rollbackTransaction(transactionId);
          throw new Error(`Actor creation failed: ${errors.join(', ')}`);
        }
      }

      // Commit transaction
      transactionManager.commitTransaction(transactionId);

      const result: ActorCreationResult = {
        success: createdActors.length > 0,
        actors: createdActors,
        ...(errors.length > 0 ? { errors } : {}),
        tokensPlaced,
        totalRequested: quantity,
        totalCreated: createdActors.length,
      };

      this.auditLog('createActorFromCompendium', request, 'success');
      return result;

    } catch (error) {
      // Rollback on complete failure
      try {
        await transactionManager.rollbackTransaction(transactionId);
      } catch (rollbackError) {
        console.error(`[${this.moduleId}] Failed to rollback transaction:`, rollbackError);
      }
      
      this.auditLog('createActorFromCompendium', request, 'failure', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get full compendium document with all embedded data
   */
  async getCompendiumDocumentFull(packId: string, documentId: string): Promise<CompendiumEntryFull> {
    this.checkPermission('allowCompendiumAccess');

    const pack = game.packs.get(packId);
    if (!pack) {
      throw new Error(`Compendium pack ${packId} not found`);
    }

    const document = await pack.getDocument(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found in pack ${packId}`);
    }

    // Build comprehensive data structure
    const fullEntry: CompendiumEntryFull = {
      id: document.id || '',
      name: document.name || '',
      type: (document as any).type || 'unknown',
      img: (document as any).img || undefined,
      pack: packId,
      packLabel: pack.metadata.label,
      system: this.sanitizeData((document as any).system || {}),
      fullData: this.sanitizeData(document.toObject()),
    };

    // Add items if the actor has them
    if ((document as any).items) {
      fullEntry.items = (document as any).items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        img: item.img || undefined,
        system: this.sanitizeData(item.system || {}),
      }));
    }

    // Add effects if the actor has them
    if ((document as any).effects) {
      fullEntry.effects = (document as any).effects.map((effect: any) => ({
        id: effect.id,
        name: effect.name || effect.label || 'Unknown Effect',
        icon: effect.icon || undefined,
        disabled: effect.disabled || false,
        duration: this.sanitizeData(effect.duration || {}),
      }));
    }

    return fullEntry;
  }

  /**
   * Add actors to the current scene as tokens
   */
  async addActorsToScene(placement: SceneTokenPlacement, transactionId?: string): Promise<TokenPlacementResult> {
    this.validateFoundryState();

    // Use new permission system
    const permissionCheck = permissionManager.checkWritePermission('modifyScene', {
      targetIds: placement.actorIds,
    });
    
    if (!permissionCheck.allowed) {
      throw new Error(`${ERROR_MESSAGES.ACCESS_DENIED}: ${permissionCheck.reason}`);
    }

    // Audit the permission check
    permissionManager.auditPermissionCheck('modifyScene', permissionCheck, placement);

    const scene = (game.scenes as any).current;
    if (!scene) {
      throw new Error('No active scene found');
    }

    this.auditLog('addActorsToScene', placement, 'success');

    try {
      const tokenData: any[] = [];
      const errors: string[] = [];

      for (const actorId of placement.actorIds) {
        try {
          const actor = game.actors.get(actorId);
          if (!actor) {
            errors.push(`Actor ${actorId} not found`);
            continue;
          }

          const tokenDoc = (actor as any).prototypeToken.toObject();
          const position = this.calculateTokenPosition(placement.placement, scene, tokenData.length);
          
          tokenData.push({
            ...tokenDoc,
            x: position.x,
            y: position.y,
            actorId: actorId,
            hidden: placement.hidden,
          });
        } catch (error) {
          errors.push(`Failed to prepare token for actor ${actorId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const createdTokens = await scene.createEmbeddedDocuments('Token', tokenData);

      // Track token creation for rollback if transaction is active
      if (transactionId && createdTokens.length > 0) {
        for (const token of createdTokens) {
          transactionManager.addAction(transactionId, 
            transactionManager.createTokenCreationAction(token.id)
          );
        }
      }

      const result: TokenPlacementResult = {
        success: createdTokens.length > 0,
        tokensCreated: createdTokens.length,
        tokenIds: createdTokens.map((token: any) => token.id),
        ...(errors.length > 0 ? { errors } : {}),
      };

      this.auditLog('addActorsToScene', placement, 'success');
      return result;

    } catch (error) {
      this.auditLog('addActorsToScene', placement, 'failure', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Find best matching compendium entry for creature type
   */
  private async findBestCompendiumMatch(creatureType: string, packPreference?: string): Promise<CompendiumSearchResult | null> {
    // First try exact search
    const exactResults = await this.searchCompendium(creatureType, 'Actor');
    
    // Look for exact name match first
    const exactMatch = exactResults.find(result => 
      result.name.toLowerCase() === creatureType.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Look for partial matches, preferring specified pack
    if (packPreference) {
      const packMatch = exactResults.find(result => 
        result.pack === packPreference
      );
      if (packMatch) return packMatch;
    }

    // Return best fuzzy match
    return exactResults.length > 0 ? exactResults[0] : null;
  }

  /**
   * Create actor from source document with custom name
   */
  private async createActorFromSource(sourceDoc: CompendiumEntryFull, customName: string): Promise<any> {
    // Clone the source data
    const actorData = foundry.utils.deepClone(sourceDoc.fullData) as any;
    
    // Apply customizations
    actorData.name = customName;
    
    // Remove source-specific identifiers
    delete actorData._id;
    delete actorData.folder;
    delete actorData.sort;
    
    // Ensure required fields are present
    if (!actorData.name) actorData.name = customName;
    if (!actorData.type) actorData.type = sourceDoc.type || 'npc';
    
    // Create the new actor
    const createdDocs = await Actor.createDocuments([actorData]);
    if (!createdDocs || createdDocs.length === 0) {
      throw new Error('Failed to create actor document');
    }

    return createdDocs[0];
  }

  /**
   * Calculate token position based on placement strategy
   */
  private calculateTokenPosition(placement: 'random' | 'grid' | 'center', scene: any, index: number): { x: number; y: number } {
    const gridSize = scene.grid?.size || 100;
    
    switch (placement) {
      case 'center':
        return {
          x: (scene.width / 2) + (index * gridSize),
          y: scene.height / 2,
        };
      
      case 'grid':
        const cols = Math.ceil(Math.sqrt(index + 1));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
          x: gridSize + (col * gridSize * 2),
          y: gridSize + (row * gridSize * 2),
        };
      
      case 'random':
      default:
        return {
          x: Math.random() * (scene.width - gridSize),
          y: Math.random() * (scene.height - gridSize),
        };
    }
  }

  /**
   * Validate write operation permissions
   */
  async validateWritePermissions(operation: 'createActor' | 'modifyScene'): Promise<{ allowed: boolean; reason?: string; requiresConfirmation?: boolean; warnings?: string[] }> {
    this.validateFoundryState();

    const permissionCheck = permissionManager.checkWritePermission(operation);
    
    // Audit the permission check
    permissionManager.auditPermissionCheck(operation, permissionCheck);

    return {
      allowed: permissionCheck.allowed,
      ...(permissionCheck.reason ? { reason: permissionCheck.reason } : {}),
      ...(permissionCheck.requiresConfirmation ? { requiresConfirmation: permissionCheck.requiresConfirmation } : {}),
      ...(permissionCheck.warnings ? { warnings: permissionCheck.warnings } : {}),
    };
  }

  /**
   * Request player rolls - creates interactive roll buttons in chat
   */
  async requestPlayerRolls(data: {
    rollType: string;
    rollTarget: string;
    targetPlayer: string;
    isPublic: boolean;
    rollModifier: string;
    flavor: string;
  }): Promise<{ success: boolean; message: string; error?: string }> {
    this.validateFoundryState();

    try {
      // Resolve target player from character name or player name
      const playerInfo = this.resolveTargetPlayer(data.targetPlayer);
      if (!playerInfo.found) {
        return {
          success: false,
          message: '',
          error: `Could not find player or character: ${data.targetPlayer}`
        };
      }

      // Build roll formula based on type and target
      const rollFormula = this.buildRollFormula(data.rollType, data.rollTarget, data.rollModifier, playerInfo.character);
      
      // Generate roll button HTML
      const buttonId = foundry.utils.randomID();
      const buttonLabel = this.buildRollButtonLabel(data.rollType, data.rollTarget, data.isPublic);
      
      // Debug logging for button creation
      console.log(`[${MODULE_ID}] Creating roll button:`, {
        buttonId,
        buttonLabel,
        targetPlayer: data.targetPlayer,
        resolvedPlayerName: playerInfo.targetName,
        resolvedUserId: playerInfo.user?.id,
        characterName: playerInfo.character?.name,
        characterId: playerInfo.character?.id,
        isPublic: data.isPublic
      });
      
      const rollButtonHtml = `
        <div class="mcp-roll-request" style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9;">
          <p><strong>Roll Request:</strong> ${buttonLabel}</p>
          <p><strong>Target:</strong> ${playerInfo.targetName} ${playerInfo.character ? `(${playerInfo.character.name})` : ''}</p>
          ${data.flavor ? `<p><strong>Context:</strong> ${data.flavor}</p>` : ''}
          
          <!-- Single Roll Button (clickable by both character owner and GM) -->
          <button class="mcp-roll-button" 
                  data-button-id="${buttonId}"
                  data-roll-formula="${rollFormula}"
                  data-roll-label="${buttonLabel}"
                  data-is-public="${data.isPublic}"
                  data-character-id="${playerInfo.character?.id || ''}"
                  data-target-user-id="${playerInfo.user?.id || ''}"
                  style="background: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
            🎲 ${buttonLabel}
          </button>
        </div>
      `;

      // Create chat message with roll button
      // For PUBLIC rolls: both roll request and results visible to all players
      // For PRIVATE rolls: both roll request and results visible to target player + GM only
      const whisperTargets: string[] = [];
      
      if (!data.isPublic) {
        // Private roll request: whisper to target player + GM only
        console.log(`[${MODULE_ID}] Creating PRIVATE roll request - visible to target + GM only`);
        
        // Always whisper to the character owner if they exist
        if (playerInfo.user?.id) {
          whisperTargets.push(playerInfo.user.id);
        }
        
        // Also send to GM (GMs can see all whispered messages anyway, but this ensures they see it)
        const gmUsers = game.users?.filter((u: User) => u.isGM && u.active);
        if (gmUsers) {
          for (const gm of gmUsers) {
            if (gm.id && !whisperTargets.includes(gm.id)) {
              whisperTargets.push(gm.id);
            }
          }
        }
      } else {
        // Public roll request: visible to all players (empty whisperTargets array)
        console.log(`[${MODULE_ID}] Creating PUBLIC roll request - visible to all players`);
      }
      
      const messageData = {
        content: rollButtonHtml,
        speaker: ChatMessage.getSpeaker({ actor: game.user }),
        style: (CONST as any).CHAT_MESSAGE_STYLES?.OTHER || 0, // Use style instead of deprecated type
        whisper: whisperTargets,
      };

      await ChatMessage.create(messageData);

      // Note: Click handlers are attached globally via renderChatMessageHTML hook in main.ts
      // This ensures all users get the handlers when they see the message

      return {
        success: true,
        message: `Roll request sent to ${playerInfo.targetName}. ${data.isPublic ? 'Public roll' : 'Private roll'} button created in chat.`
      };

    } catch (error) {
      console.error(`[${MODULE_ID}] Error creating roll request:`, error);
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error creating roll request'
      };
    }
  }

  /**
   * Resolve target player from character name or player name
   * Supports partial matching and case-insensitive search
   */
  private resolveTargetPlayer(targetPlayer: string): {
    found: boolean;
    user?: User;
    character?: Actor;
    targetName: string;
  } {
    const searchTerm = targetPlayer.toLowerCase().trim();
    
    console.log(`[${MODULE_ID}] Resolving target player: "${targetPlayer}" (normalized: "${searchTerm}")`);
    
    // FIRST try to find by player name (prioritize player names over character names for better UX)
    let user = game.users?.find((u: User) => 
      u.name?.toLowerCase() === searchTerm
    );
    
    if (user) {
      console.log(`[${MODULE_ID}] Found exact player name match: ${user.name}`);
      return {
        found: true,
        user,
        targetName: user.name || 'Unknown Player'
      };
    }
    
    // If no exact player match, try partial player match
    if (!user) {
      user = game.users?.find((u: User) => {
        return Boolean(u.name && u.name.toLowerCase().includes(searchTerm));
      });
      
      if (user) {
        console.log(`[${MODULE_ID}] Found partial player name match: ${user.name}`);
        return {
          found: true,
          user,
          targetName: user.name || 'Unknown Player'
        };
      }
    }

    // THEN try to find by character name (exact match, then partial match)
    let character = game.actors?.find((actor: Actor) => 
      actor.name?.toLowerCase() === searchTerm && actor.hasPlayerOwner
    );
    
    if (character) {
      console.log(`[${MODULE_ID}] Found exact character match: ${character.name}`);
    }
    
    // If no exact match, try partial match
    if (!character) {
      character = game.actors?.find((actor: Actor) => {
        return Boolean(actor.name && actor.name.toLowerCase().includes(searchTerm) && actor.hasPlayerOwner);
      });
      
      if (character) {
        console.log(`[${MODULE_ID}] Found partial character match: ${character.name}`);
      }
    }

    if (character) {
      // Find the actual player owner (not GM) of this character
      const user = game.users?.find((u: User) => 
        character.testUserPermission(u, 'OWNER') && !u.isGM
      );
      
      console.log(`[${MODULE_ID}] Character ownership resolution for ${character.name}:`, {
        characterId: character.id,
        hasPlayerOwner: character.hasPlayerOwner,
        foundUser: user ? `${user.name} (ID: ${user.id})` : 'None',
        allOwners: game.users?.filter(u => character.testUserPermission(u, 'OWNER')).map(u => `${u.name} (GM: ${u.isGM})`) || []
      });
      
      if (user) {
        return {
          found: true,
          user,
          character,
          targetName: user.name || 'Unknown Player'
        };
      } else {
        // No player owner found - character is GM-only controlled
        // Still return found=true but without user, GM can still roll for it
        return {
          found: true,
          character,
          targetName: character.name || 'Unknown Character'
          // user is omitted (undefined) for GM-only characters
        };
      }
    }

    // No player or character found
    return {
      found: false,
      targetName: targetPlayer
    };
  }

  /**
   * Build roll formula based on roll type and target using Foundry's roll data system
   */
  private buildRollFormula(rollType: string, rollTarget: string, rollModifier: string, character?: Actor): string {
    let baseFormula = '1d20';

    if (character) {
      // Use Foundry's getRollData() to get calculated modifiers including active effects
      const rollData = character.getRollData() as any; // Type assertion for Foundry's dynamic roll data
      
      console.log(`[${MODULE_ID}] Building roll formula for ${rollType}:${rollTarget} with rollData:`, {
        rollType,
        rollTarget,
        abilities: rollData.abilities,
        skills: rollData.skills,
        attributes: rollData.attributes
      });
      
      // DEBUG: Log the complete skills structure to understand the data format
      if (rollData.skills) {
        console.log(`[${MODULE_ID}] Complete skills structure:`, rollData.skills);
        console.log(`[${MODULE_ID}] Skills keys:`, Object.keys(rollData.skills));
      }
      
      switch (rollType) {
        case 'ability':
          // Use calculated ability modifier from roll data
          const abilityMod = rollData.abilities?.[rollTarget]?.mod ?? 0;
          baseFormula = `1d20+${abilityMod}`;
          console.log(`[${MODULE_ID}] Ability ${rollTarget}: mod = ${abilityMod}`);
          break;
        
        case 'skill':
          // Map skill name to skill code (D&D 5e uses 3-letter codes)
          const skillCode = this.getSkillCode(rollTarget);
          // Use calculated skill total from roll data (includes ability mod + proficiency + bonuses)
          const skillMod = rollData.skills?.[skillCode]?.total ?? 0;
          baseFormula = `1d20+${skillMod}`;
          console.log(`[${MODULE_ID}] Skill ${rollTarget} (code: ${skillCode}): total = ${skillMod}`, rollData.skills?.[skillCode]);
          break;
        
        case 'save':
          // Use saving throw modifier from roll data
          const saveMod = rollData.abilities?.[rollTarget]?.save ?? rollData.abilities?.[rollTarget]?.mod ?? 0;
          baseFormula = `1d20+${saveMod}`;
          console.log(`[${MODULE_ID}] Save ${rollTarget}: save = ${saveMod}`);
          break;
        
        case 'initiative':
          // Use initiative modifier from attributes or dex mod
          const initMod = rollData.attributes?.init?.mod ?? rollData.abilities?.dex?.mod ?? 0;
          baseFormula = `1d20+${initMod}`;
          console.log(`[${MODULE_ID}] Initiative: mod = ${initMod}`);
          break;
        
        case 'custom':
          baseFormula = rollTarget; // Use rollTarget as the formula directly
          console.log(`[${MODULE_ID}] Custom roll formula: ${baseFormula}`);
          break;
        
        default:
          baseFormula = '1d20';
          console.log(`[${MODULE_ID}] Default roll formula: ${baseFormula}`);
      }
    } else {
      console.warn(`[${MODULE_ID}] No character provided for roll formula, using base 1d20`);
    }

    // Add modifier if provided
    if (rollModifier && rollModifier.trim()) {
      const modifier = rollModifier.startsWith('+') || rollModifier.startsWith('-') ? rollModifier : `+${rollModifier}`;
      baseFormula += modifier;
      console.log(`[${MODULE_ID}] Added custom modifier ${modifier}, final formula: ${baseFormula}`);
    }

    console.log(`[${MODULE_ID}] Final roll formula: ${baseFormula}`);
    return baseFormula;
  }

  /**
   * Map skill names to D&D 5e skill codes
   */
  private getSkillCode(skillName: string): string {
    const skillMap: { [key: string]: string } = {
      'acrobatics': 'acr',
      'animal handling': 'ani', 
      'animalhandling': 'ani',
      'arcana': 'arc',
      'athletics': 'ath',
      'deception': 'dec',
      'history': 'his',
      'insight': 'ins',
      'intimidation': 'itm',
      'investigation': 'inv',
      'medicine': 'med',
      'nature': 'nat',
      'perception': 'prc',
      'performance': 'prf',
      'persuasion': 'per',
      'religion': 'rel',
      'sleight of hand': 'slt',
      'sleightofhand': 'slt',
      'stealth': 'ste',
      'survival': 'sur'
    };
    
    const normalizedName = skillName.toLowerCase().replace(/\s+/g, '');
    const skillCode = skillMap[normalizedName] || skillMap[skillName.toLowerCase()] || skillName.toLowerCase();
    
    console.log(`[${MODULE_ID}] Mapping skill name "${skillName}" to code "${skillCode}"`);
    return skillCode;
  }

  /**
   * Build roll button label
   */
  private buildRollButtonLabel(rollType: string, rollTarget: string, isPublic: boolean): string {
    const visibility = isPublic ? 'Public' : 'Private';
    
    switch (rollType) {
      case 'ability':
        return `${rollTarget.toUpperCase()} Ability Check (${visibility})`;
      case 'skill':
        return `${rollTarget.charAt(0).toUpperCase() + rollTarget.slice(1)} Skill Check (${visibility})`;
      case 'save':
        return `${rollTarget.toUpperCase()} Saving Throw (${visibility})`;
      case 'attack':
        return `${rollTarget} Attack (${visibility})`;
      case 'initiative':
        return `Initiative Roll (${visibility})`;
      case 'custom':
        return `Custom Roll (${visibility})`;
      default:
        return `Roll (${visibility})`;
    }
  }

  /**
   * Attach click handlers to roll buttons and handle visibility
   * Called by global renderChatMessageHTML hook in main.ts
   */
  public attachRollButtonHandlers(html: JQuery): void {
    const currentUserId = game.user?.id;
    const isGM = game.user?.isGM;
    
    // Handle button visibility and styling based on permissions and public/private status
    html.find('.mcp-roll-button').each((_index, element) => {
      const button = $(element);
      const targetUserId = button.data('target-user-id');
      const isPublicRollRaw = button.data('is-public');
      const isPublicRoll = isPublicRollRaw === true || isPublicRollRaw === 'true';
      
      // Determine if user can interact with this button
      const canClickButton = isGM || (targetUserId && targetUserId === currentUserId);
      
      console.log(`[${MODULE_ID}] Button visibility check:`, {
        currentUser: game.user?.name,
        currentUserId,
        isGM,
        targetUserId,
        isPublicRoll,
        canClickButton
      });
      
      if (isPublicRoll) {
        // Public roll: show to all players, but style differently for non-clickable users
        if (canClickButton) {
          // Can click: normal active button
          button.css({
            'background': '#4CAF50',
            'cursor': 'pointer',
            'opacity': '1'
          });
          console.log(`[${MODULE_ID}] Showing active button for user ${game.user?.name}`);
        } else {
          // Cannot click: disabled/informational style
          button.css({
            'background': '#9E9E9E',
            'cursor': 'not-allowed', 
            'opacity': '0.7'
          });
          button.prop('disabled', true);
          console.log(`[${MODULE_ID}] Showing disabled button for user ${game.user?.name}`);
        }
      } else {
        // Private roll: only show to target user and GM
        if (canClickButton) {
          button.show();
          console.log(`[${MODULE_ID}] Showing private button for user ${game.user?.name}`);
        } else {
          button.hide();
          console.log(`[${MODULE_ID}] Hiding private button for user ${game.user?.name}`);
        }
      }
    });
    
    // Attach click handlers to roll buttons
    html.find('.mcp-roll-button').on('click', async (event) => {
      const button = $(event.currentTarget);
      
      // Ignore clicks on disabled buttons
      if (button.prop('disabled')) {
        console.log(`[${MODULE_ID}] Ignoring click on disabled button`);
        return;
      }
      
      const rollFormula = button.data('roll-formula');
      const rollLabel = button.data('roll-label');
      const isPublicRaw = button.data('is-public');
      const isPublic = isPublicRaw === true || isPublicRaw === 'true'; // Convert to proper boolean
      const characterId = button.data('character-id');
      const targetUserId = button.data('target-user-id');
      const isGmRoll = game.user?.isGM || false; // Determine if this is a GM executing the roll

      // Debug logging
      console.log(`[${MODULE_ID}] Roll button clicked:`, {
        currentUser: game.user?.name,
        currentUserId: game.user?.id,
        isGM: game.user?.isGM,
        targetUserId: targetUserId,
        rollLabel: rollLabel,
        isPublicRaw: isPublicRaw,
        isPublic: isPublic,
        isPublicType: typeof isPublic
      });

      // Check if user has permission to execute this roll
      // Allow GM to roll for any character, or allow character owner to roll for their character
      const canExecuteRoll = game.user?.isGM || (targetUserId && targetUserId === game.user?.id);
      
      if (!canExecuteRoll) {
        console.warn(`[${MODULE_ID}] Permission denied for roll execution`);
        ui.notifications?.warn('You do not have permission to execute this roll');
        return;
      }
      
      console.log(`[${MODULE_ID}] Permission granted, executing roll`);

      try {
        // Create and evaluate the roll
        const roll = new Roll(rollFormula);
        await roll.evaluate();

        console.log(`[${MODULE_ID}] Roll visibility determination:`, {
          isPublic: isPublic,
          isPublicType: typeof isPublic,
          isPublicValue: isPublic,
          targetUserId: targetUserId,
          rollLabel: rollLabel,
          willUseRollMode: isPublic ? 'PUBLIC' : 'PRIVATE'
        });

        // Get the character for speaker info
        const character = characterId ? game.actors?.get(characterId) : null;
        
        // Use the modern Foundry v13 approach with roll.toMessage()
        const rollMode = isPublic ? 'publicroll' : 'whisper';
        const whisperTargets: string[] = [];
        
        if (!isPublic) {
          // For private rolls: whisper to target + GM
          if (targetUserId) {
            whisperTargets.push(targetUserId);
          }
          // Add all active GMs
          const gmUsers = game.users?.filter((u: User) => u.isGM && u.active);
          if (gmUsers) {
            for (const gm of gmUsers) {
              if (gm.id && !whisperTargets.includes(gm.id)) {
                whisperTargets.push(gm.id);
              }
            }
          }
        }
        
        const messageData: any = {
          speaker: ChatMessage.getSpeaker({ actor: character }),
          flavor: `${rollLabel} ${isGmRoll ? '(GM Override)' : ''}`,
          ...(whisperTargets.length > 0 ? { whisper: whisperTargets } : {})
        };
        
        console.log(`[${MODULE_ID}] Creating roll message with toMessage():`, {
          isPublic: isPublic,
          rollMode: rollMode,
          hasWhisper: whisperTargets.length > 0,
          whisperTargets: whisperTargets.length > 0 ? whisperTargets : 'none (public)'
        });
        
        // Use roll.toMessage() with proper rollMode
        await roll.toMessage(messageData, { 
          create: true,
          rollMode: rollMode
        });

        // Disable the button after rolling
        button.prop('disabled', true).text('✓ Rolled');
        
      } catch (error) {
        console.error(`[${MODULE_ID}] Error executing roll:`, error);
        ui.notifications?.error('Failed to execute roll');
      }
    });
  }
}