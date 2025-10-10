import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
export declare class CampaignManagementTools {
    private foundryClient;
    private errorHandler;
    private logger;
    constructor(foundryClient: FoundryClient, logger: Logger);
    getToolDefinitions(): {
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
            };
            required: string[];
        };
    }[];
    /**
     * Handle create campaign dashboard request
     */
    handleCreateCampaignDashboard(args: any): Promise<any>;
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
     * Generate interactive status toggle element for Foundry hook system
     */
    private generateStatusTracker;
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
     * Store campaign structure (simplified for create-only workflow)
     */
    private storeCampaignStructure;
}
