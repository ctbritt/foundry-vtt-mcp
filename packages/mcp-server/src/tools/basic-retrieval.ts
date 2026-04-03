// Basic Retrieval Tools - Direct access to Foundry entities
// Get journal entries, actors, and scenes by ID

import { z } from 'zod';
import { FoundryClient } from '../foundry-client.js';
import { ErrorHandler } from '../utils/error-handler.js';
import { Logger } from '../logger.js';

export class BasicRetrievalTools {
  private foundryClient: FoundryClient;
  private errorHandler: ErrorHandler;
  private logger: Logger;

  constructor(foundryClient: FoundryClient, logger: Logger) {
    this.foundryClient = foundryClient;
    this.logger = logger;
    this.errorHandler = new ErrorHandler(this.logger);
  }

  getToolDefinitions() {
    return [
      {
        name: 'get-journal-entry',
        description: 'Get complete journal entry content by ID, including all pages and full text',
        inputSchema: {
          type: 'object',
          properties: {
            journalId: {
              type: 'string',
              description: 'The journal entry ID (e.g., "rcQmVi2bakT2Uv6e")'
            }
          },
          required: ['journalId']
        }
      },
      {
        name: 'get-actor',
        description: 'Get actor/NPC details by ID or name, including stats, items, and abilities',
        inputSchema: {
          type: 'object',
          properties: {
            actorId: {
              type: 'string',
              description: 'The actor ID or name to search for'
            }
          },
          required: ['actorId']
        }
      },
      {
        name: 'get-scene',
        description: 'Get scene details by ID, including placed tokens and notes',
        inputSchema: {
          type: 'object',
          properties: {
            sceneName: {
              type: 'string',
              description: 'The scene name or ID'
            }
          },
          required: ['sceneName']
        }
      }
    ];
  }

  /**
   * Handle get journal entry request
   */
  async handleGetJournalEntry(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        journalId: z.string().min(1, 'Journal ID is required')
      });

      const request = requestSchema.parse(args);

      // Query journal content from Foundry
      const content = await this.foundryClient.query('foundry-mcp-bridge.getJournalContent', {
        journalId: request.journalId
      });

      if (!content || content.error) {
        throw new Error(`Journal entry not found: ${request.journalId}`);
      }

      // Also get the journal metadata from the list
      const journals = await this.foundryClient.query('foundry-mcp-bridge.listJournals', {});
      const journal = journals?.find((j: any) => j.id === request.journalId);

      return {
        success: true,
        journal: {
          id: request.journalId,
          name: journal?.name || 'Unknown',
          type: journal?.type || 'JournalEntry',
          content: content.content
        }
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'get-journal-entry', 'journal retrieval');
    }
  }

  /**
   * Handle get actor request
   */
  async handleGetActor(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        actorId: z.string().min(1, 'Actor ID or name is required')
      });

      const request = requestSchema.parse(args);

      // Try to find the actor by ID or name
      const actor = await this.foundryClient.query('foundry-mcp-bridge.findActor', {
        query: request.actorId
      });

      if (!actor || actor.error) {
        throw new Error(`Actor not found: ${request.actorId}`);
      }

      return {
        success: true,
        actor: actor
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'get-actor', 'actor retrieval');
    }
  }

  /**
   * Handle get scene request
   */
  async handleGetScene(args: any): Promise<any> {
    try {
      const requestSchema = z.object({
        sceneName: z.string().min(1, 'Scene name or ID is required')
      });

      const request = requestSchema.parse(args);

      // Get all scenes and find the matching one
      const scenes = await this.foundryClient.query('foundry-mcp-bridge.list-scenes', {});

      if (!scenes || scenes.error) {
        throw new Error('Failed to retrieve scenes');
      }

      // Find scene by name or ID
      const scene = scenes.find((s: any) => 
        s.name === request.sceneName || s.id === request.sceneName
      );

      if (!scene) {
        throw new Error(`Scene not found: ${request.sceneName}`);
      }

      // Get full scene details including tokens
      const activeScene = await this.foundryClient.query('foundry-mcp-bridge.getActiveScene', {});
      
      // If this is the active scene, return more details
      if (activeScene && activeScene.id === scene.id) {
        return {
          success: true,
          scene: activeScene,
          isActive: true
        };
      }

      return {
        success: true,
        scene: scene,
        isActive: false,
        note: 'Scene is not active - limited details available. Switch to this scene for full token/note information.'
      };

    } catch (error) {
      this.errorHandler.handleToolError(error, 'get-scene', 'scene retrieval');
    }
  }
}
