import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export interface QuestCreationToolsOptions {
    foundryClient: FoundryClient;
    logger: Logger;
}
export declare class QuestCreationTools {
    private foundryClient;
    private logger;
    private errorHandler;
    constructor(options: QuestCreationToolsOptions);
    /**
     * Get all tool definitions for MCP registration
     */
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                questTitle: {
                    type: string;
                    description: string;
                };
                questDescription: {
                    type: string;
                    description: string;
                };
                questType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                difficulty: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                location: {
                    type: string;
                    description: string;
                };
                questGiver: {
                    type: string;
                    description: string;
                };
                npcName: {
                    type: string;
                    description: string;
                };
                rewards: {
                    type: string;
                    description: string;
                };
                journalId?: never;
                relationship?: never;
                newContent?: never;
                updateType?: never;
                filterQuests?: never;
                includeContent?: never;
                searchQuery?: never;
                searchType?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                journalId: {
                    type: string;
                    description: string;
                };
                npcName: {
                    type: string;
                    description: string;
                };
                relationship: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                questTitle?: never;
                questDescription?: never;
                questType?: never;
                difficulty?: never;
                location?: never;
                questGiver?: never;
                rewards?: never;
                newContent?: never;
                updateType?: never;
                filterQuests?: never;
                includeContent?: never;
                searchQuery?: never;
                searchType?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                journalId: {
                    type: string;
                    description: string;
                };
                newContent: {
                    type: string;
                    description: string;
                };
                updateType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                questTitle?: never;
                questDescription?: never;
                questType?: never;
                difficulty?: never;
                location?: never;
                questGiver?: never;
                npcName?: never;
                rewards?: never;
                relationship?: never;
                filterQuests?: never;
                includeContent?: never;
                searchQuery?: never;
                searchType?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                filterQuests: {
                    type: string;
                    description: string;
                };
                includeContent: {
                    type: string;
                    description: string;
                };
                questTitle?: never;
                questDescription?: never;
                questType?: never;
                difficulty?: never;
                location?: never;
                questGiver?: never;
                npcName?: never;
                rewards?: never;
                journalId?: never;
                relationship?: never;
                newContent?: never;
                updateType?: never;
                searchQuery?: never;
                searchType?: never;
            };
            required?: never;
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                searchQuery: {
                    type: string;
                    description: string;
                };
                searchType: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                questTitle?: never;
                questDescription?: never;
                questType?: never;
                difficulty?: never;
                location?: never;
                questGiver?: never;
                npcName?: never;
                rewards?: never;
                journalId?: never;
                relationship?: never;
                newContent?: never;
                updateType?: never;
                filterQuests?: never;
                includeContent?: never;
            };
            required: string[];
        };
    })[];
    /**
     * Handle create quest journal request
     */
    handleCreateQuestJournal(args: any): Promise<any>;
    /**
     * Handle link quest to NPC request
     */
    handleLinkQuestToNPC(args: any): Promise<any>;
    /**
     * Handle update quest journal request
     */
    handleUpdateQuestJournal(args: any): Promise<any>;
    /**
     * Handle list journals request
     */
    handleListJournals(args: any): Promise<any>;
    /**
     * Handle search journals request
     */
    handleSearchJournals(args: any): Promise<any>;
    /**
     * Generate formatted quest content from request (HTML for Foundry v13 ProseMirror)
     * Uses professional styling that mimics Lost Mine of Phandelver templates
     */
    private generateQuestContent;
    /**
     * Create a professional styled journal with CSS that mimics Lost Mine of Phandelver
     */
    private createStyledJournal;
    /**
     * Build professional quest content using template fragments
     */
    private buildStyledQuestContent;
    /**
     * Add NPC link information to journal content (HTML for Foundry v13 ProseMirror)
     * Maintains professional styling by adding to the grid layout
     */
    private addNPCLinkToJournal;
    /**
     * Format quest update based on type (HTML for Foundry v13 ProseMirror)
     * Maintains professional styling by adding updates with proper section headings
     */
    private formatQuestUpdate;
    /**
     * Format text content for Foundry VTT (convert to proper HTML)
     */
    private formatTextForFoundry;
    /**
     * Format update content for Foundry VTT (preserve HTML like create-quest-journal)
     * Allows custom section headings and themed content with proper CSS classes
     */
    private formatUpdateContentForFoundry;
    /**
     * Check if a journal appears to be quest-related
     */
    private isQuestRelated;
    /**
     * Extract content snippet around search term
     */
    private extractSnippet;
    /**
     * Determine if the named NPC is an antagonist based on quest description
     */
    private determineNPCRole;
    /**
     * Generate background text using separate quest giver and NPC parameters
     */
    private generateBackgroundText;
    /**
     * Generate adventure hook with proper quest giver logic and complete sentences
     */
    private generateAdventureHook;
    /**
     * Generate quest giver dialogue based on quest content
     */
    private generateQuestGiverDialogue;
    /**
     * Generate rumor-based hook content
     */
    private generateRumorHook;
    /**
     * Generate specific quest objectives based on type and parameters
     */
    private generateQuestObjectives;
    /**
     * Check if NPC is likely an antagonist based on description
     */
    private isLikelyAntagonist;
    /**
     * Extract actionable objectives from quest description
     */
    private extractActionObjectives;
    /**
     * Convert Markdown to plain text and warn (don't block the operation)
     * This ensures the tool works while gently educating about proper format
     */
    private convertMarkdownToPlainText;
}
