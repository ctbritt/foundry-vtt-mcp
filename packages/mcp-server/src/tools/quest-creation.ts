import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { Logger } from '../logger.js';
import { ErrorHandler } from '../utils/error-handler.js';

export interface QuestCreationToolsOptions {
  foundryClient: FoundryClient;
  logger: Logger;
}

// Quest creation types
interface QuestJournalRequest {
  questTitle: string;
  questDescription: string;
  questType?: 'main' | 'side' | 'personal' | 'mystery' | 'fetch' | 'escort' | 'kill' | 'collection' | undefined;
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly' | undefined;
  location?: string | undefined;
  npcName?: string | undefined;
  rewards?: string | undefined;
}

interface QuestJournalResult {
  journalId: string;
  journalName: string;
  content: string;
  success: boolean;
}

export class QuestCreationTools {
  private foundryClient: FoundryClient;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(options: QuestCreationToolsOptions) {
    this.foundryClient = options.foundryClient;
    this.logger = options.logger;
    this.errorHandler = new ErrorHandler(this.logger);
  }

  /**
   * Get all tool definitions for MCP registration
   */
  getToolDefinitions() {
    return [
      {
        name: 'create-quest-journal',
        description: 'Create a new quest journal entry with AI-generated content based on natural language description',
        inputSchema: {
          type: 'object',
          properties: {
            questTitle: {
              type: 'string',
              description: 'The title of the quest'
            },
            questDescription: {
              type: 'string',
              description: 'Detailed description of what the quest should accomplish'
            },
            questType: {
              type: 'string',
              enum: ['main', 'side', 'personal', 'mystery', 'fetch', 'escort', 'kill', 'collection'],
              description: 'Type of quest (optional)'
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'medium', 'hard', 'deadly'],
              description: 'Quest difficulty level (optional)'
            },
            location: {
              type: 'string',
              description: 'Where the quest takes place (optional)'
            },
            npcName: {
              type: 'string',
              description: 'Name of quest giver or related NPC (optional)'
            },
            rewards: {
              type: 'string',
              description: 'Quest rewards description (optional)'
            }
          },
          required: ['questTitle', 'questDescription']
        }
      },
      {
        name: 'link-quest-to-npc',
        description: 'Link an existing quest journal to an NPC in the world',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'ID of the quest journal entry'
            },
            npcName: {
              type: 'string',
              description: 'Name of the NPC to link to the quest'
            },
            relationship: {
              type: 'string',
              enum: ['quest_giver', 'target', 'ally', 'enemy', 'contact'],
              description: 'Relationship between NPC and quest'
            }
          },
          required: ['journalId', 'npcName', 'relationship']
        }
      },
      {
        name: 'analyze-campaign-context',
        description: 'Analyze current campaign state to suggest quest ideas based on existing NPCs, locations, and story elements',
        inputSchema: {
          type: 'object',
          properties: {
            focusArea: {
              type: 'string',
              enum: ['npcs', 'locations', 'items', 'factions', 'plot_threads'],
              description: 'What aspect of the campaign to analyze for quest opportunities'
            },
            questCount: {
              type: 'number',
              description: 'Number of quest ideas to generate (default: 3)',
              minimum: 1,
              maximum: 10
            }
          },
          required: ['focusArea']
        }
      },
      {
        name: 'update-quest-journal',
        description: 'Update an existing quest journal with new information or progress. Provide plain text content - this tool will automatically convert it to proper HTML for Foundry VTT v13 ProseMirror editor. Do not use Markdown syntax.',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'ID of the quest journal to update'
            },
            newContent: {
              type: 'string',
              description: 'New content to add to the quest journal. Use plain text only - this tool will automatically convert it to HTML format required by Foundry VTT v13 ProseMirror editor.'
            },
            updateType: {
              type: 'string',
              enum: ['progress', 'completion', 'failure', 'modification'],
              description: 'Type of update being made'
            }
          },
          required: ['journalId', 'newContent', 'updateType']
        }
      },
      {
        name: 'list-journals',
        description: 'List all journal entries in the world, with optional filtering for quest-related journals',
        inputSchema: {
          type: 'object',
          properties: {
            filterQuests: {
              type: 'boolean',
              description: 'Only show journals that appear to be quest-related (default: false)'
            },
            includeContent: {
              type: 'boolean',
              description: 'Include journal content preview (default: false)'
            }
          }
        }
      },
      {
        name: 'search-journals',
        description: 'Search through journal entries for specific content or keywords',
        inputSchema: {
          type: 'object',
          properties: {
            searchQuery: {
              type: 'string',
              description: 'Text to search for in journal entries'
            },
            searchType: {
              type: 'string',
              enum: ['title', 'content', 'both'],
              description: 'Where to search (default: both)'
            }
          },
          required: ['searchQuery']
        }
      }
    ];
  }

  /**
   * Handle create quest journal request
   */
  async handleCreateQuestJournal(args: any): Promise<any> {
    try {
      // Validate arguments
      const requestSchema = z.object({
        questTitle: z.string().min(1, 'Quest title is required'),
        questDescription: z.string().min(1, 'Quest description is required'),
        questType: z.enum(['main', 'side', 'personal', 'mystery', 'fetch', 'escort', 'kill', 'collection']).optional(),
        difficulty: z.enum(['easy', 'medium', 'hard', 'deadly']).optional(),
        location: z.string().optional(),
        npcName: z.string().optional(),
        rewards: z.string().optional()
      });

      const request = requestSchema.parse(args);
      
      // Generate formatted quest content
      const questContent = this.generateQuestContent(request);

      // Create journal entry via Foundry client
      const result = await this.foundryClient.query('foundry-mcp-bridge.createJournalEntry', {
        name: request.questTitle,
        content: questContent
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to create quest journal');
      }

      return {
        success: true,
        journalId: result.id,
        journalName: result.name,
        content: questContent,
        message: `Quest "${request.questTitle}" created successfully`
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'create-quest-journal', 'quest creation');
    }
  }

  /**
   * Handle link quest to NPC request
   */
  async handleLinkQuestToNPC(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        journalId: z.string().min(1, 'Journal ID is required'),
        npcName: z.string().min(1, 'NPC name is required'),
        relationship: z.enum(['quest_giver', 'target', 'ally', 'enemy', 'contact'])
      });

      const request = requestSchema.parse(args);

      // Get journal content first
      const journalResult = await this.foundryClient.query('foundry-mcp-bridge.getJournalContent', {
        journalId: request.journalId
      });

      if (!journalResult || journalResult.error) {
        throw new Error('Journal not found');
      }

      // Add NPC relationship information to journal
      const updatedContent = this.addNPCLinkToJournal(journalResult.content, request.npcName, request.relationship);

      // Update journal with NPC link
      const updateResult = await this.foundryClient.query('foundry-mcp-bridge.updateJournalContent', {
        journalId: request.journalId,
        content: updatedContent
      });

      if (!updateResult || updateResult.error) {
        throw new Error('Failed to update journal with NPC link');
      }

      return {
        success: true,
        message: `Linked ${request.npcName} to quest as ${request.relationship.replace('_', ' ')}`
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'link-quest-to-npc', 'linking quest to NPC');
    }
  }

  /**
   * Handle analyze campaign context request
   */
  async handleAnalyzeCampaignContext(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        focusArea: z.enum(['npcs', 'locations', 'items', 'factions', 'plot_threads']),
        questCount: z.number().min(1).max(10).optional().default(3)
      });

      const request = requestSchema.parse(args);

      // Get world information
      const worldInfo = await this.foundryClient.query('foundry-mcp-bridge.getWorldInfo', {});
      const actors = await this.foundryClient.query('foundry-mcp-bridge.listActors', {});
      const journals = await this.foundryClient.query('foundry-mcp-bridge.listJournals', {});

      if (!worldInfo || !actors || !journals) {
        throw new Error('Failed to retrieve campaign data');
      }

      // Generate quest ideas based on campaign context
      const questIdeas = this.generateQuestIdeas(request.focusArea, request.questCount, {
        worldInfo,
        actors,
        journals
      });

      return {
        success: true,
        focusArea: request.focusArea,
        questIdeas,
        campaignAnalysis: this.analyzeCampaignElements(worldInfo, actors, journals)
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'analyze-campaign-context', 'campaign analysis');
    }
  }

  /**
   * Handle update quest journal request
   */
  async handleUpdateQuestJournal(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        journalId: z.string().min(1, 'Journal ID is required'),
        newContent: z.string().min(1, 'New content is required'),
        updateType: z.enum(['progress', 'completion', 'failure', 'modification'])
      });

      const request = requestSchema.parse(args);

      // Get current journal content
      const currentJournal = await this.foundryClient.query('foundry-mcp-bridge.getJournalContent', {
        journalId: request.journalId
      });

      if (!currentJournal || currentJournal.error) {
        throw new Error('Journal not found');
      }

      // Format the update based on type
      const updatedContent = this.formatQuestUpdate(
        currentJournal.content,
        request.newContent,
        request.updateType
      );

      // Update the journal
      const result = await this.foundryClient.query('foundry-mcp-bridge.updateJournalContent', {
        journalId: request.journalId,
        content: updatedContent
      });

      if (!result || result.error) {
        throw new Error('Failed to update quest journal');
      }

      return {
        success: true,
        updateType: request.updateType,
        message: `Quest journal updated with ${request.updateType}`
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'update-quest-journal', 'journal update');
    }
  }

  /**
   * Handle list journals request
   */
  async handleListJournals(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        filterQuests: z.boolean().optional().default(false),
        includeContent: z.boolean().optional().default(false)
      });

      const request = requestSchema.parse(args);

      // Get all journals
      const journals = await this.foundryClient.query('foundry-mcp-bridge.listJournals', {});

      if (!journals || journals.error) {
        throw new Error('Failed to retrieve journals');
      }

      let filteredJournals = journals;

      // Filter for quest-related journals if requested
      if (request.filterQuests) {
        filteredJournals = journals.filter((journal: any) =>
          this.isQuestRelated(journal.name)
        );
      }

      // Include content if requested
      if (request.includeContent) {
        for (const journal of filteredJournals) {
          try {
            const content = await this.foundryClient.query('foundry-mcp-bridge.getJournalContent', {
              journalId: journal.id
            });
            journal.contentPreview = content?.content?.substring(0, 150) + '...' || '';
          } catch (error) {
            journal.contentPreview = 'Error loading content';
          }
        }
      }

      return {
        success: true,
        journals: filteredJournals,
        total: filteredJournals.length,
        filtered: request.filterQuests
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'list-journals', 'journal listing');
    }
  }

  /**
   * Handle search journals request
   */
  async handleSearchJournals(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        searchQuery: z.string().min(1, 'Search query is required'),
        searchType: z.enum(['title', 'content', 'both']).optional().default('both')
      });

      const request = requestSchema.parse(args);

      // Get all journals
      const journals = await this.foundryClient.query('foundry-mcp-bridge.listJournals', {});

      if (!journals || journals.error) {
        throw new Error('Failed to retrieve journals');
      }

      const searchResults = [];
      const query = request.searchQuery.toLowerCase();

      for (const journal of journals) {
        let matches = false;
        const matchInfo: any = {
          id: journal.id,
          name: journal.name,
          matchType: []
        };

        // Search title
        if (request.searchType === 'title' || request.searchType === 'both') {
          if (journal.name.toLowerCase().includes(query)) {
            matches = true;
            matchInfo.matchType.push('title');
          }
        }

        // Search content
        if (request.searchType === 'content' || request.searchType === 'both') {
          try {
            const content = await this.foundryClient.query('foundry-mcp-bridge.getJournalContent', {
              journalId: journal.id
            });
            
            if (content?.content?.toLowerCase().includes(query)) {
              matches = true;
              matchInfo.matchType.push('content');
              matchInfo.contentSnippet = this.extractSnippet(content.content, request.searchQuery);
            }
          } catch (error) {
            // Skip journals with content errors
          }
        }

        if (matches) {
          searchResults.push(matchInfo);
        }
      }

      return {
        success: true,
        searchQuery: request.searchQuery,
        searchType: request.searchType,
        results: searchResults,
        totalMatches: searchResults.length
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'search-journals', 'journal search');
    }
  }

  /**
   * Generate formatted quest content from request (HTML for Foundry v13 ProseMirror)
   */
  private generateQuestContent(request: QuestJournalRequest): string {
    let content = `<h1>${request.questTitle}</h1>`;
    
    content += `<p><strong>Description</strong>: ${request.questDescription}</p>`;
    
    if (request.questType) {
      content += `<p><strong>Type</strong>: ${request.questType.charAt(0).toUpperCase() + request.questType.slice(1)} Quest</p>`;
    }
    
    if (request.difficulty) {
      content += `<p><strong>Difficulty</strong>: ${request.difficulty.charAt(0).toUpperCase() + request.difficulty.slice(1)}</p>`;
    }
    
    if (request.location) {
      content += `<p><strong>Location</strong>: ${request.location}</p>`;
    }
    
    if (request.npcName) {
      content += `<p><strong>Quest Giver</strong>: ${request.npcName}</p>`;
    }
    
    if (request.rewards) {
      content += `<p><strong>Rewards</strong>: ${request.rewards}</p>`;
    }
    
    content += `<hr><p><strong>Quest Status</strong>: Active</p><p><strong>Notes</strong>:</p><ul><li>Created: ${new Date().toLocaleDateString()}</li></ul>`;
    
    return content;
  }

  /**
   * Add NPC link information to journal content (HTML for Foundry v13 ProseMirror)
   */
  private addNPCLinkToJournal(content: string, npcName: string, relationship: string): string {
    const linkSection = `<p><strong>Related NPCs</strong>:</p><ul><li>${npcName} (${relationship.replace('_', ' ')})</li></ul>`;
    
    // Check if NPC section already exists
    if (content.includes('<strong>Related NPCs</strong>:')) {
      // Add to existing list
      return content.replace('</ul>', `<li>${npcName} (${relationship.replace('_', ' ')})</li></ul>`);
    } else {
      // Add new section before closing
      return content + linkSection;
    }
  }

  /**
   * Generate quest ideas based on campaign context
   */
  private generateQuestIdeas(focusArea: string, count: number, campaignData: any): any[] {
    const ideas = [];
    
    // This is a simplified version - in a real implementation, this would use more sophisticated analysis
    switch (focusArea) {
      case 'npcs':
        for (let i = 0; i < count; i++) {
          ideas.push({
            title: `NPC-focused Quest ${i + 1}`,
            description: 'A quest involving important NPCs in the campaign',
            suggestedType: 'side',
            difficulty: 'medium'
          });
        }
        break;
      case 'locations':
        for (let i = 0; i < count; i++) {
          ideas.push({
            title: `Location Quest ${i + 1}`,
            description: 'A quest centered around campaign locations',
            suggestedType: 'main',
            difficulty: 'medium'
          });
        }
        break;
      default:
        for (let i = 0; i < count; i++) {
          ideas.push({
            title: `Campaign Quest ${i + 1}`,
            description: `A quest based on ${focusArea}`,
            suggestedType: 'side',
            difficulty: 'medium'
          });
        }
    }
    
    return ideas;
  }

  /**
   * Analyze campaign elements for context
   */
  private analyzeCampaignElements(worldInfo: any, actors: any, journals: any): any {
    return {
      totalActors: actors?.length || 0,
      totalJournals: journals?.length || 0,
      worldName: worldInfo?.name || 'Unknown',
      analysisDate: new Date().toISOString()
    };
  }

  /**
   * Format quest update based on type (HTML for Foundry v13 ProseMirror)
   */
  private formatQuestUpdate(currentContent: string, newContent: string, updateType: string): string {
    const timestamp = new Date().toLocaleDateString();
    const formattedContent = this.formatTextForFoundry(newContent);
    let updateSection = '';
    
    switch (updateType) {
      case 'progress':
        updateSection = `<p><strong>Progress Update</strong> (${timestamp}):</p>${formattedContent}`;
        break;
      case 'completion':
        updateSection = `<p><strong>Quest Completed</strong> (${timestamp}):</p>${formattedContent}`;
        // Update status
        currentContent = currentContent.replace('<strong>Quest Status</strong>: Active', '<strong>Quest Status</strong>: Completed');
        break;
      case 'failure':
        updateSection = `<p><strong>Quest Failed</strong> (${timestamp}):</p>${formattedContent}`;
        currentContent = currentContent.replace('<strong>Quest Status</strong>: Active', '<strong>Quest Status</strong>: Failed');
        break;
      case 'modification':
        updateSection = `<p><strong>Quest Modified</strong> (${timestamp}):</p>${formattedContent}`;
        break;
    }
    
    return currentContent + updateSection;
  }

  /**
   * Format text content for Foundry VTT (convert to proper HTML)
   */
  private formatTextForFoundry(text: string): string {
    // Escape HTML to prevent injection
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert line breaks to paragraphs
    const paragraphs = escaped.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length === 0) {
      return '<p></p>';
    }
    
    if (paragraphs.length === 1) {
      // Single paragraph - handle line breaks within it
      return `<p>${paragraphs[0].replace(/\n/g, '<br>')}</p>`;
    }
    
    // Multiple paragraphs
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  /**
   * Check if a journal appears to be quest-related
   */
  private isQuestRelated(journalName: string): boolean {
    const questKeywords = ['quest', 'mission', 'task', 'adventure', 'job', 'contract'];
    const nameLower = journalName.toLowerCase();
    return questKeywords.some(keyword => nameLower.includes(keyword));
  }

  /**
   * Extract content snippet around search term
   */
  private extractSnippet(content: string, searchTerm: string, maxLength: number = 200): string {
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + maxLength);
    
    return '...' + content.substring(start, end) + '...';
  }
}