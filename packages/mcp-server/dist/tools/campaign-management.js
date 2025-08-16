// Campaign Management Tools - Multipart Campaign System
// Provides journal-based campaign creation, dashboard generation, and progress tracking
import { z } from 'zod';
import { ErrorHandler } from '../utils/error-handler.js';
import { CampaignPartStatusSchema, CampaignPartTypeSchema } from '@foundry-mcp/shared';
export class CampaignManagementTools {
    foundryClient;
    errorHandler;
    logger;
    constructor(foundryClient, logger) {
        this.foundryClient = foundryClient;
        this.logger = logger;
        this.errorHandler = new ErrorHandler(this.logger);
    }
    getToolDefinitions() {
        return [
            {
                name: 'create-campaign-dashboard',
                description: 'Create a comprehensive campaign dashboard journal with navigation, progress tracking, and part management',
                inputSchema: {
                    type: 'object',
                    properties: {
                        campaignTitle: {
                            type: 'string',
                            description: 'Title of the campaign (e.g., "The Whisperstone Conspiracy")'
                        },
                        campaignDescription: {
                            type: 'string',
                            description: 'Brief description of the campaign theme and scope'
                        },
                        template: {
                            type: 'string',
                            enum: ['five-part-adventure', 'dungeon-crawl', 'investigation', 'sandbox', 'custom'],
                            description: 'Campaign structure template to use'
                        },
                        customParts: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    description: { type: 'string' },
                                    type: {
                                        type: 'string',
                                        enum: ['main_part', 'sub_part', 'chapter', 'session', 'optional']
                                    },
                                    levelStart: { type: 'number', minimum: 1, maximum: 20 },
                                    levelEnd: { type: 'number', minimum: 1, maximum: 20 },
                                    subParts: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                title: { type: 'string' },
                                                description: { type: 'string' }
                                            },
                                            required: ['title', 'description']
                                        }
                                    }
                                },
                                required: ['title', 'description', 'type', 'levelStart', 'levelEnd']
                            },
                            description: 'Custom campaign parts when template is "custom"'
                        },
                        defaultQuestGiver: {
                            type: 'string',
                            description: 'Default NPC name for quest giving (optional)'
                        },
                        defaultLocation: {
                            type: 'string',
                            description: 'Default campaign location/setting (optional)'
                        }
                    },
                    required: ['campaignTitle', 'campaignDescription', 'template']
                }
            },
            {
                name: 'update-campaign-progress',
                description: 'Update progress status of campaign parts and regenerate dashboard',
                inputSchema: {
                    type: 'object',
                    properties: {
                        campaignId: {
                            type: 'string',
                            description: 'ID of the campaign to update'
                        },
                        partId: {
                            type: 'string',
                            description: 'ID of the specific part to update'
                        },
                        newStatus: {
                            type: 'string',
                            enum: ['not_started', 'in_progress', 'completed', 'skipped'],
                            description: 'New status for the campaign part'
                        },
                        subPartId: {
                            type: 'string',
                            description: 'ID of sub-part to update (if updating a sub-part)'
                        },
                        sessionNotes: {
                            type: 'string',
                            description: 'Optional notes about progress made in this session'
                        }
                    },
                    required: ['campaignId', 'partId', 'newStatus']
                }
            }
        ];
    }
    /**
     * Handle create campaign dashboard request
     */
    async handleCreateCampaignDashboard(args) {
        try {
            const requestSchema = z.object({
                campaignTitle: z.string().min(1, 'Campaign title is required'),
                campaignDescription: z.string().min(1, 'Campaign description is required'),
                template: z.enum(['five-part-adventure', 'dungeon-crawl', 'investigation', 'sandbox', 'custom']),
                customParts: z.array(z.object({
                    title: z.string().min(1),
                    description: z.string().min(1),
                    type: CampaignPartTypeSchema,
                    levelStart: z.number().min(1).max(20),
                    levelEnd: z.number().min(1).max(20),
                    subParts: z.array(z.object({
                        title: z.string().min(1),
                        description: z.string().min(1)
                    })).optional()
                })).optional(),
                defaultQuestGiver: z.string().optional(),
                defaultLocation: z.string().optional()
            });
            const request = requestSchema.parse(args);
            // Generate campaign structure based on template
            const campaignStructure = this.generateCampaignStructure(request);
            // Create dashboard journal entry
            const dashboardContent = this.generateDashboardHTML(campaignStructure);
            // Create the journal entry in Foundry
            const journalResult = await this.foundryClient.query('foundry-mcp-bridge.createJournalEntry', {
                name: `${request.campaignTitle} - Campaign Dashboard`,
                content: dashboardContent
            });
            if (!journalResult || journalResult.error) {
                throw new Error(journalResult?.error || 'Failed to create campaign dashboard journal');
            }
            // Update campaign structure with dashboard journal ID
            campaignStructure.dashboardJournalId = journalResult.id;
            // Store campaign structure (would typically go to a world flag or journal)
            await this.storeCampaignStructure(campaignStructure);
            return {
                success: true,
                campaignId: campaignStructure.id,
                dashboardJournalId: journalResult.id,
                dashboardName: journalResult.name,
                campaignStructure: campaignStructure,
                message: `Campaign dashboard "${request.campaignTitle}" created successfully with ${campaignStructure.parts.length} parts`
            };
        }
        catch (error) {
            return this.errorHandler.handleToolError(error, 'create-campaign-dashboard', 'campaign dashboard creation');
        }
    }
    /**
     * Handle update campaign progress request
     */
    async handleUpdateCampaignProgress(args) {
        try {
            const requestSchema = z.object({
                campaignId: z.string().min(1, 'Campaign ID is required'),
                partId: z.string().min(1, 'Part ID is required'),
                newStatus: CampaignPartStatusSchema,
                subPartId: z.string().optional(),
                sessionNotes: z.string().optional()
            });
            const request = requestSchema.parse(args);
            // Load campaign structure
            const campaign = await this.loadCampaignStructure(request.campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            // Update part status
            const updated = this.updatePartStatus(campaign, request.partId, request.newStatus, request.subPartId);
            if (!updated) {
                throw new Error('Campaign part not found');
            }
            // Handle completion timestamps
            if (request.newStatus === 'completed') {
                const part = this.findPart(campaign, request.partId);
                if (part) {
                    if (request.subPartId) {
                        const subPart = part.subParts?.find(sp => sp.id === request.subPartId);
                        if (subPart)
                            subPart.completedAt = Date.now();
                    }
                    else {
                        part.completedAt = Date.now();
                    }
                }
            }
            // Update campaign timestamp
            campaign.updatedAt = Date.now();
            // Regenerate dashboard
            const dashboardContent = this.generateDashboardHTML(campaign);
            if (campaign.dashboardJournalId) {
                await this.foundryClient.query('foundry-mcp-bridge.updateJournalContent', {
                    journalId: campaign.dashboardJournalId,
                    content: dashboardContent
                });
            }
            // Store updated campaign
            await this.storeCampaignStructure(campaign);
            return {
                success: true,
                campaignId: request.campaignId,
                updatedPart: request.partId,
                newStatus: request.newStatus,
                campaignProgress: this.calculateProgress(campaign),
                message: `Campaign progress updated: ${request.partId} is now ${request.newStatus}`
            };
        }
        catch (error) {
            return this.errorHandler.handleToolError(error, 'update-campaign-progress', 'campaign progress update');
        }
    }
    /**
     * Generate campaign structure from template
     */
    generateCampaignStructure(request) {
        const campaignId = `campaign-${Date.now()}`;
        const timestamp = Date.now();
        let parts = [];
        if (request.template === 'custom' && request.customParts) {
            parts = request.customParts.map((part, index) => ({
                id: `${campaignId}-part-${index + 1}`,
                title: part.title,
                description: part.description,
                type: part.type,
                status: 'not_started',
                dependencies: index > 0 ? [`${campaignId}-part-${index}`] : [],
                subParts: part.subParts?.map((subPart, subIndex) => ({
                    id: `${campaignId}-part-${index + 1}-sub-${subIndex + 1}`,
                    title: subPart.title,
                    description: subPart.description,
                    type: 'sub_part',
                    status: 'not_started',
                    createdAt: timestamp
                })),
                ...(request.defaultQuestGiver && {
                    questGiver: {
                        id: `npc-${request.defaultQuestGiver.toLowerCase().replace(/\s+/g, '-')}`,
                        name: request.defaultQuestGiver
                    }
                }),
                levelRecommendation: {
                    start: part.levelStart,
                    end: part.levelEnd
                },
                gmNotes: '',
                playerContent: '',
                scaling: {
                    adjustForPartySize: true,
                    adjustForLevel: true,
                    difficultyModifier: 0
                },
                createdAt: timestamp
            }));
        }
        else {
            parts = this.getTemplateParts(request.template, campaignId, timestamp, request.defaultQuestGiver);
        }
        return {
            id: campaignId,
            title: request.campaignTitle,
            description: request.campaignDescription,
            parts,
            metadata: {
                ...(request.defaultQuestGiver && {
                    defaultQuestGiver: {
                        id: `npc-${request.defaultQuestGiver.toLowerCase().replace(/\s+/g, '-')}`,
                        name: request.defaultQuestGiver
                    }
                }),
                ...(request.defaultLocation && { defaultLocation: request.defaultLocation }),
                ...(request.template && { theme: request.template }),
                tags: [request.template]
            },
            createdAt: timestamp,
            updatedAt: timestamp
        };
    }
    /**
     * Get template-based campaign parts
     */
    getTemplateParts(template, campaignId, timestamp, defaultQuestGiver) {
        const templates = {
            'five-part-adventure': [
                { title: 'Hook & Introduction', description: 'Draw the party into the adventure with compelling hooks and initial encounters', levels: [1, 2] },
                { title: 'Investigation & Clues', description: 'Gather information, explore leads, and uncover the scope of the threat', levels: [2, 4] },
                { title: 'Midpoint Revelation', description: 'Major discovery or plot twist that changes the stakes and direction', levels: [4, 6] },
                { title: 'Climactic Confrontation', description: 'Face the primary antagonist or overcome the central challenge', levels: [6, 8] },
                { title: 'Resolution & Rewards', description: 'Wrap up loose ends, distribute rewards, and set up future adventures', levels: [8, 9] }
            ],
            'dungeon-crawl': [
                { title: 'Approach & Entry', description: 'Navigate to the dungeon and overcome entrance challenges', levels: [1, 2] },
                { title: 'Upper Levels', description: 'Explore the first floors, encounter guardians and traps', levels: [2, 4],
                    subParts: [{ title: 'Rooms 1-3', description: 'Initial chambers and encounters' }, { title: 'Rooms 4-6', description: 'Mid-level challenges and treasures' }] },
                { title: 'Lower Levels', description: 'Delve deeper into more dangerous areas', levels: [4, 6],
                    subParts: [{ title: 'Rooms 7-9', description: 'Advanced traps and stronger enemies' }, { title: 'Rooms 10-12', description: 'Elite encounters and hidden secrets' }] },
                { title: 'Final Boss & Treasure', description: 'Confront the dungeon\'s master and claim the ultimate prize', levels: [6, 8] }
            ],
            'investigation': [
                { title: 'Crime Scene', description: 'Initial investigation of the incident and evidence gathering', levels: [1, 2] },
                { title: 'Witness Interviews', description: 'Question involved parties and gather testimonies', levels: [2, 3],
                    subParts: [{ title: 'Primary Witnesses', description: 'Key individuals with direct knowledge' }, { title: 'Secondary Sources', description: 'Additional contacts and informants' }] },
                { title: 'Following Leads', description: 'Pursue clues to multiple locations and uncover connections', levels: [3, 5],
                    subParts: [{ title: 'Location A', description: 'First lead destination' }, { title: 'Location B', description: 'Second investigation site' }, { title: 'Location C', description: 'Final clue location' }] },
                { title: 'Confrontation', description: 'Face the culprit with evidence and resolve the case', levels: [5, 6] },
                { title: 'Resolution', description: 'Tie up loose ends and deliver justice or closure', levels: [6, 7] }
            ],
            'sandbox': [
                { title: 'World Introduction', description: 'Establish the setting, key NPCs, and available opportunities', levels: [1, 3] },
                { title: 'Exploration Phase', description: 'Players choose their path and explore available content', levels: [3, 8] },
                { title: 'Consequences & Reactions', description: 'World responds to player actions with new challenges', levels: [8, 12] },
                { title: 'Player-Driven Climax', description: 'Major storyline chosen and pursued by players', levels: [12, 15] }
            ]
        };
        const templateParts = templates[template] || templates['five-part-adventure'];
        return templateParts.map((part, index) => ({
            id: `${campaignId}-part-${index + 1}`,
            title: part.title,
            description: part.description,
            type: 'main_part',
            status: 'not_started',
            dependencies: index > 0 ? [`${campaignId}-part-${index}`] : [],
            subParts: part.subParts?.map((subPart, subIndex) => ({
                id: `${campaignId}-part-${index + 1}-sub-${subIndex + 1}`,
                title: subPart.title,
                description: subPart.description,
                type: 'sub_part',
                status: 'not_started',
                createdAt: timestamp
            })),
            ...(defaultQuestGiver && {
                questGiver: {
                    id: `npc-${defaultQuestGiver.toLowerCase().replace(/\s+/g, '-')}`,
                    name: defaultQuestGiver
                }
            }),
            levelRecommendation: {
                start: part.levels[0],
                end: part.levels[1]
            },
            gmNotes: '',
            playerContent: '',
            scaling: {
                adjustForPartySize: true,
                adjustForLevel: true,
                difficultyModifier: 0
            },
            createdAt: timestamp
        }));
    }
    /**
     * Generate HTML content for campaign dashboard journal
     */
    generateDashboardHTML(campaign) {
        const progress = this.calculateProgress(campaign);
        const currentPart = campaign.parts.find(part => part.status === 'in_progress');
        return `<div class="campaign-dashboard spaced">
  <h1>${campaign.title}</h1>
  
  <div class="campaign-overview readaloud">
    <p><strong>Campaign Progress:</strong> ${progress.completed} of ${progress.total} parts completed (${progress.percentage}%)</p>
    <p><strong>Current Focus:</strong> ${currentPart ? currentPart.title : 'Ready to begin'}</p>
    ${campaign.metadata.defaultLocation ? `<p><strong>Primary Setting:</strong> ${campaign.metadata.defaultLocation}</p>` : ''}
    ${campaign.metadata.defaultQuestGiver ? `<p><strong>Primary Quest Giver:</strong> ${campaign.metadata.defaultQuestGiver.name}</p>` : ''}
  </div>
  
  <h2>Campaign Parts</h2>
  
  ${campaign.parts.map((part, index) => this.generatePartHTML(part, index + 1, campaign)).join('\n  ')}
  
  <div class="campaign-notes gmnote">
    <h3>GM Notes</h3>
    <p><em>Campaign created: ${new Date(campaign.createdAt).toLocaleDateString()}</em></p>
    <p><em>Last updated: ${new Date(campaign.updatedAt).toLocaleDateString()}</em></p>
    ${campaign.description ? `<p><strong>Description:</strong> ${campaign.description}</p>` : ''}
  </div>
</div>`;
    }
    /**
     * Generate HTML for individual campaign part
     */
    generatePartHTML(part, partNumber, campaign) {
        const statusIcon = this.getStatusIcon(part.status);
        const isLocked = this.isPartLocked(part, campaign);
        const lockIcon = isLocked ? '🔒 ' : '';
        let html = `<div class="campaign-part ${part.status} spaced">
    <h3>${lockIcon}${statusIcon} Part ${partNumber}: ${part.title}</h3>
    <p><em>Status:</em> ${this.formatStatus(part.status)} | <em>Levels:</em> ${part.levelRecommendation.start}-${part.levelRecommendation.end}</p>`;
        if (part.journalId) {
            html += `\n    <p><strong>@JournalEntry[${part.journalId}]{📖 View Details}</strong></p>`;
        }
        html += `\n    <p>${part.description}</p>`;
        // Add dependencies info if locked
        if (isLocked && part.dependencies.length > 0) {
            const depNames = part.dependencies.map(depId => {
                const depPart = campaign.parts.find(p => p.id === depId);
                return depPart ? depPart.title : depId;
            }).join(', ');
            html += `\n    <p class="dependencies"><small><em>Requires completion of:</em> ${depNames}</small></p>`;
        }
        // Add sub-parts if they exist
        if (part.subParts && part.subParts.length > 0) {
            html += `\n    <div class="sub-parts">`;
            part.subParts.forEach((subPart, subIndex) => {
                const subStatusIcon = this.getStatusIcon(subPart.status);
                html += `\n      <p>${subStatusIcon} <strong>${partNumber}.${subIndex + 1}: ${subPart.title}</strong>`;
                if (subPart.journalId) {
                    html += ` - <strong>@JournalEntry[${subPart.journalId}]{View Details}</strong>`;
                }
                html += `</p>`;
            });
            html += `\n    </div>`;
        }
        html += `\n  </div>`;
        return html;
    }
    /**
     * Get status icon for visual indication
     */
    getStatusIcon(status) {
        const icons = {
            'not_started': '⚪',
            'in_progress': '🔄',
            'completed': '✅',
            'skipped': '⏭️'
        };
        return icons[status] || '❓';
    }
    /**
     * Format status for display
     */
    formatStatus(status) {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    /**
     * Check if part is locked by dependencies
     */
    isPartLocked(part, campaign) {
        if (part.dependencies.length === 0)
            return false;
        return part.dependencies.some(depId => {
            const depPart = campaign.parts.find(p => p.id === depId);
            return !depPart || depPart.status !== 'completed';
        });
    }
    /**
     * Calculate overall campaign progress
     */
    calculateProgress(campaign) {
        let total = 0;
        let completed = 0;
        campaign.parts.forEach(part => {
            if (part.subParts && part.subParts.length > 0) {
                total += part.subParts.length;
                completed += part.subParts.filter(sp => sp.status === 'completed').length;
            }
            else {
                total += 1;
                if (part.status === 'completed')
                    completed += 1;
            }
        });
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { total, completed, percentage };
    }
    /**
     * Update part status in campaign structure
     */
    updatePartStatus(campaign, partId, newStatus, subPartId) {
        const part = campaign.parts.find(p => p.id === partId);
        if (!part)
            return false;
        if (subPartId) {
            const subPart = part.subParts?.find(sp => sp.id === subPartId);
            if (!subPart)
                return false;
            subPart.status = newStatus;
        }
        else {
            part.status = newStatus;
        }
        return true;
    }
    /**
     * Find part by ID
     */
    findPart(campaign, partId) {
        return campaign.parts.find(p => p.id === partId) || null;
    }
    /**
     * Store campaign structure (placeholder - would use world flags in real implementation)
     */
    async storeCampaignStructure(campaign) {
        // In a real implementation, this would store to Foundry world flags
        // For now, we'll just log it
        console.error(`[CAMPAIGN-STORAGE] Storing campaign: ${campaign.id}`);
    }
    /**
     * Load campaign structure (placeholder)
     */
    async loadCampaignStructure(campaignId) {
        // In a real implementation, this would load from Foundry world flags
        console.error(`[CAMPAIGN-STORAGE] Loading campaign: ${campaignId}`);
        return null;
    }
}
//# sourceMappingURL=campaign-management.js.map