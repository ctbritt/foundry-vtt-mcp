import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export declare class CampaignManagementTools {
    private foundryClient;
    private errorHandler;
    private logger;
    constructor(foundryClient: FoundryClient, logger: Logger);
    getToolDefinitions(): ({
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                campaignTitle: {
                    type: string;
                    description: string;
                };
                campaignDescription: {
                    type: string;
                    description: string;
                };
                template: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                customParts: {
                    type: string;
                    items: {
                        type: string;
                        properties: {
                            title: {
                                type: string;
                            };
                            description: {
                                type: string;
                            };
                            type: {
                                type: string;
                                enum: string[];
                            };
                            levelStart: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            levelEnd: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            subParts: {
                                type: string;
                                items: {
                                    type: string;
                                    properties: {
                                        title: {
                                            type: string;
                                        };
                                        description: {
                                            type: string;
                                        };
                                    };
                                    required: string[];
                                };
                            };
                        };
                        required: string[];
                    };
                    description: string;
                };
                defaultQuestGiver: {
                    type: string;
                    description: string;
                };
                defaultLocation: {
                    type: string;
                    description: string;
                };
                campaignId?: never;
                partId?: never;
                newStatus?: never;
                subPartId?: never;
                sessionNotes?: never;
            };
            required: string[];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            type: string;
            properties: {
                campaignId: {
                    type: string;
                    description: string;
                };
                partId: {
                    type: string;
                    description: string;
                };
                newStatus: {
                    type: string;
                    enum: string[];
                    description: string;
                };
                subPartId: {
                    type: string;
                    description: string;
                };
                sessionNotes: {
                    type: string;
                    description: string;
                };
                campaignTitle?: never;
                campaignDescription?: never;
                template?: never;
                customParts?: never;
                defaultQuestGiver?: never;
                defaultLocation?: never;
            };
            required: string[];
        };
    })[];
    /**
     * Handle create campaign dashboard request
     */
    handleCreateCampaignDashboard(args: any): Promise<any>;
    /**
     * Handle update campaign progress request
     */
    handleUpdateCampaignProgress(args: any): Promise<any>;
    /**
     * Generate campaign structure from template
     */
    private generateCampaignStructure;
    /**
     * Get template-based campaign parts
     */
    private getTemplateParts;
    /**
     * Generate HTML content for campaign dashboard journal
     */
    private generateDashboardHTML;
    /**
     * Generate HTML for individual campaign part
     */
    private generatePartHTML;
    /**
     * Get status icon for visual indication
     */
    private getStatusIcon;
    /**
     * Format status for display
     */
    private formatStatus;
    /**
     * Check if part is locked by dependencies
     */
    private isPartLocked;
    /**
     * Calculate overall campaign progress
     */
    private calculateProgress;
    /**
     * Update part status in campaign structure
     */
    private updatePartStatus;
    /**
     * Find part by ID
     */
    private findPart;
    /**
     * Store campaign structure (placeholder - would use world flags in real implementation)
     */
    private storeCampaignStructure;
    /**
     * Load campaign structure (placeholder)
     */
    private loadCampaignStructure;
}
