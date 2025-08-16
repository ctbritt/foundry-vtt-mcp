import { FoundryDataAccess } from './data-access.js';
export declare class QueryHandlers {
    dataAccess: FoundryDataAccess;
    constructor();
    /**
     * SECURITY: Validate GM access - returns silent failure for non-GM users
     */
    private validateGMAccess;
    /**
     * Register all query handlers in CONFIG.queries
     */
    registerHandlers(): void;
    /**
     * Unregister all query handlers
     */
    unregisterHandlers(): void;
    /**
     * Handle character information request
     */
    private handleGetCharacterInfo;
    /**
     * Handle list actors request
     */
    private handleListActors;
    /**
     * Handle compendium search request
     */
    private handleSearchCompendium;
    /**
     * Handle list creatures by criteria request
     */
    private handleListCreaturesByCriteria;
    /**
     * Handle get available packs request
     */
    private handleGetAvailablePacks;
    /**
     * Handle get active scene request
     */
    private handleGetActiveScene;
    /**
     * Handle get world info request
     */
    private handleGetWorldInfo;
    /**
     * Handle ping request
     */
    private handlePing;
    /**
     * Get list of all registered query methods
     */
    getRegisteredMethods(): string[];
    /**
     * Test if a specific query handler is registered
     */
    isMethodRegistered(method: string): boolean;
    /**
     * Handle actor creation from compendium request
     */
    private handleCreateActorFromCompendium;
    /**
     * Handle get compendium document full request
     */
    private handleGetCompendiumDocumentFull;
    /**
     * Handle add actors to scene request
     */
    private handleAddActorsToScene;
    /**
     * Handle validate write permissions request
     */
    private handleValidateWritePermissions;
    /**
     * Handle journal entry creation
     */
    handleCreateJournalEntry(data: any): Promise<any>;
    /**
     * Handle list journals request
     */
    handleListJournals(): Promise<any>;
    /**
     * Handle get journal content request
     */
    handleGetJournalContent(data: {
        journalId: string;
    }): Promise<any>;
    /**
     * Handle update journal content request
     */
    handleUpdateJournalContent(data: {
        journalId: string;
        content: string;
    }): Promise<any>;
    /**
     * Handle request player rolls - creates interactive roll buttons in chat
     */
    handleRequestPlayerRolls(data: {
        rollType: string;
        rollTarget: string;
        targetPlayer: string;
        isPublic: boolean;
        rollModifier: string;
        flavor: string;
    }): Promise<any>;
    /**
     * Handle get enhanced creature index request
     */
    handleGetEnhancedCreatureIndex(): Promise<any>;
    /**
     * Handle set actor ownership request
     */
    handleSetActorOwnership(data: any): Promise<any>;
    /**
     * Handle get actor ownership request
     */
    handleGetActorOwnership(data: any): Promise<any>;
    /**
     * Handle get friendly NPCs request
     */
    handleGetFriendlyNPCs(): Promise<any>;
    /**
     * Handle get party characters request
     */
    handleGetPartyCharacters(): Promise<any>;
    /**
     * Handle get connected players request
     */
    handleGetConnectedPlayers(): Promise<any>;
    /**
     * Handle find players request
     */
    handleFindPlayers(data: any): Promise<any>;
    /**
     * Handle find actor request
     */
    handleFindActor(data: any): Promise<any>;
}
//# sourceMappingURL=queries.d.ts.map