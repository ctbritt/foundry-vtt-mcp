/**
 * Interface for Foundry client implementations
 * Both FoundryClient (v1) and FoundryClientV2 implement this
 */

export interface IFoundryClient {
  query(method: string, data?: any): Promise<any>;
  isConnected(): boolean;
  isReady(): boolean;
  getConnectionState(): string;
  getConnectionInfo(): any;
}
