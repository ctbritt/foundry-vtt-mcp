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
export declare class FoundryDataAccess {
    private moduleId;
    private persistentIndex;
    constructor();
    /**
     * Force rebuild of enhanced creature index
     */
    rebuildEnhancedCreatureIndex(): Promise<{
        success: boolean;
        totalCreatures: number;
        message: string;
    }>;
    /**
     * Get character/actor information by name or ID
     */
    getCharacterInfo(identifier: string): Promise<CharacterInfo>;
    /**
     * Search compendium packs for items matching query with optional filters
     */
    searchCompendium(query: string, packType?: string, filters?: {
        challengeRating?: number | {
            min?: number;
            max?: number;
        };
        creatureType?: string;
        size?: string;
        alignment?: string;
        hasLegendaryActions?: boolean;
        spellcaster?: boolean;
    }): Promise<CompendiumSearchResult[]>;
    /**
     * Check if filters should be applied to this entry
     */
    private shouldApplyFilters;
    /**
     * Check if entry passes all specified filters
     * @unused - Replaced with simple index-only approach
     */
    private passesFilters;
    /**
     * Calculate relevance score for search result ranking
     */
    private calculateRelevanceScore;
    /**
     * List creatures by criteria using enhanced persistent index - optimized for instant filtering
     */
    listCreaturesByCriteria(criteria: {
        challengeRating?: number | {
            min?: number;
            max?: number;
        };
        creatureType?: string;
        size?: string;
        hasSpells?: boolean;
        hasLegendaryActions?: boolean;
        limit?: number;
    }): Promise<{
        creatures: any[];
        searchSummary: any;
    }>;
    /**
     * Check if enhanced creature passes all specified criteria
     */
    private passesEnhancedCriteria;
    /**
     * Fallback to basic creature search if enhanced index fails
     */
    private fallbackBasicCreatureSearch;
    /**
     * Prioritize compendium packs by likelihood of containing relevant creatures
     * @unused - Replaced by enhanced persistent index system
     */
    private prioritizePacksForCreatures;
    /**
     * Get priority score for a pack based on ID and label
     */
    private getPackPriority;
    /**
     * Check if creature entry passes the given criteria
     * @unused - Legacy method replaced by passesEnhancedCriteria
     */
    private passesCriteria;
    /**
     * Simple name/description-based matching for creatures using index data only
     */
    private matchesSearchCriteria;
    /**
     * List all actors with basic information
     */
    listActors(): Promise<Array<{
        id: string;
        name: string;
        type: string;
        img?: string;
    }>>;
    /**
     * Get active scene information
     */
    getActiveScene(): Promise<SceneInfo>;
    /**
     * Get world information
     */
    getWorldInfo(): Promise<WorldInfo>;
    /**
     * Get available compendium packs
     */
    getAvailablePacks(): Promise<{
        id: any;
        label: any;
        type: any;
        system: any;
        private: any;
    }[]>;
    /**
     * Sanitize data to remove sensitive information and make it JSON-safe
     */
    private sanitizeData;
    /**
     * Remove sensitive fields from data object with circular reference protection
     * Returns a sanitized copy instead of modifying the original
     */
    private removeSensitiveFields;
    /**
     * Check if a field should be excluded from sanitized output
     */
    private isSensitiveOrProblematicField;
    /**
     * Custom JSON serializer that handles Foundry objects safely
     */
    private safeJSONStringify;
    /**
     * Get token disposition as number
     */
    private getTokenDisposition;
    /**
     * Validate that Foundry is ready and world is active
     */
    validateFoundryState(): void;
    /**
     * Audit log for write operations
     */
    private auditLog;
    /**
     * Create journal entry for quests
     */
    createJournalEntry(request: {
        name: string;
        content: string;
    }): Promise<{
        id: string;
        name: string;
    }>;
    /**
     * List all journal entries
     */
    listJournals(): Promise<Array<{
        id: string;
        name: string;
        type: string;
    }>>;
    /**
     * Get journal entry content
     */
    getJournalContent(journalId: string): Promise<{
        content: string;
    } | null>;
    /**
     * Update journal entry content
     */
    updateJournalContent(request: {
        journalId: string;
        content: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Create actors from compendium entries with custom names
     */
    createActorFromCompendium(request: ActorCreationRequest): Promise<ActorCreationResult>;
    /**
     * Get full compendium document with all embedded data
     */
    getCompendiumDocumentFull(packId: string, documentId: string): Promise<CompendiumEntryFull>;
    /**
     * Add actors to the current scene as tokens
     */
    addActorsToScene(placement: SceneTokenPlacement, transactionId?: string): Promise<TokenPlacementResult>;
    /**
     * Find best matching compendium entry for creature type
     */
    private findBestCompendiumMatch;
    /**
     * Create actor from source document with custom name
     */
    private createActorFromSource;
    /**
     * Calculate token position based on placement strategy
     */
    private calculateTokenPosition;
    /**
     * Validate write operation permissions
     */
    validateWritePermissions(operation: 'createActor' | 'modifyScene'): Promise<{
        allowed: boolean;
        reason?: string;
        requiresConfirmation?: boolean;
        warnings?: string[];
    }>;
    /**
     * Request player rolls - creates interactive roll buttons in chat
     */
    requestPlayerRolls(data: {
        rollType: string;
        rollTarget: string;
        targetPlayer: string;
        isPublic: boolean;
        rollModifier: string;
        flavor: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    /**
     * Enhanced player resolution with offline/non-existent player detection
     * Supports partial matching and provides structured error messages for MCP
     */
    private resolveTargetPlayer;
    /**
     * Build roll formula based on roll type and target using Foundry's roll data system
     */
    private buildRollFormula;
    /**
     * Map skill names to D&D 5e skill codes
     */
    private getSkillCode;
    /**
     * Build roll button label
     */
    private buildRollButtonLabel;
    /**
     * Restore roll button states from persistent storage
     * Called when chat messages are rendered to maintain state across sessions
     */
    /**
     * Attach click handlers to roll buttons and handle visibility
     * Called by global renderChatMessageHTML hook in main.ts
     */
    attachRollButtonHandlers(html: JQuery): void;
    /**
     * Get enhanced creature index for campaign analysis
     */
    getEnhancedCreatureIndex(): Promise<any[]>;
    /**
     * Save roll button state to persistent storage
     */
    saveRollState(buttonId: string, userId: string): Promise<void>;
    /**
     * Get roll button state from persistent storage
     */
    getRollState(buttonId: string): {
        rolled: boolean;
        rolledBy?: string;
        rolledByName?: string;
        timestamp?: number;
    } | null;
    /**
     * Save button ID to message ID mapping for ChatMessage updates
     */
    saveRollButtonMessageId(buttonId: string, messageId: string): void;
    /**
     * Get message ID for a roll button
     */
    getRollButtonMessageId(buttonId: string): string | null;
    /**
     * Get roll button state from ChatMessage flags
     */
    getRollStateFromMessage(chatMessage: any, buttonId: string): any;
    /**
     * Update the ChatMessage to replace button with rolled state
     */
    updateRollButtonMessage(buttonId: string, userId: string, rollLabel: string): Promise<void>;
    /**
     * Request GM to save roll state (for non-GM users who can't write to world settings)
     */
    requestRollStateSave(buttonId: string, userId: string): void;
    /**
     * Broadcast roll state change to all connected users for real-time sync
     */
    broadcastRollState(buttonId: string, _rollState: any): void;
    /**
     * Clean up old roll states (optional maintenance)
     * Removes roll states older than 30 days to prevent storage bloat
     */
    cleanOldRollStates(): Promise<number>;
    /**
     * Set actor ownership permission for a user
     */
    setActorOwnership(data: {
        actorId: string;
        userId: string;
        permission: number;
    }): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    /**
     * Get actor ownership information
     */
    getActorOwnership(data: {
        actorIdentifier?: string;
        playerIdentifier?: string;
    }): Promise<any>;
    /**
     * Find actor by name or ID
     */
    private findActorByIdentifier;
    /**
     * Get friendly NPCs from current scene
     */
    getFriendlyNPCs(): Promise<Array<{
        id: string;
        name: string;
    }>>;
    /**
     * Get party characters (player-owned actors)
     */
    getPartyCharacters(): Promise<Array<{
        id: string;
        name: string;
    }>>;
    /**
     * Get connected players (excluding GM)
     */
    getConnectedPlayers(): Promise<Array<{
        id: string;
        name: string;
    }>>;
    /**
     * Find players by identifier with partial matching
     */
    findPlayers(data: {
        identifier: string;
        allowPartialMatch?: boolean;
        includeCharacterOwners?: boolean;
    }): Promise<Array<{
        id: string;
        name: string;
    }>>;
    /**
     * Find single actor by identifier
     */
    findActor(data: {
        identifier: string;
    }): Promise<{
        id: string;
        name: string;
    } | null>;
}
export {};
//# sourceMappingURL=data-access.d.ts.map