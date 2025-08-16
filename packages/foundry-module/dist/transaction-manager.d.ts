export interface TransactionAction {
    type: 'create' | 'update' | 'delete';
    entityType: 'Actor' | 'Token' | 'Scene' | 'Item';
    entityId?: string;
    originalData?: any;
    newData?: any;
    rollbackAction?: () => Promise<void>;
}
export interface Transaction {
    id: string;
    timestamp: Date;
    description: string;
    actions: TransactionAction[];
    completed: boolean;
    rolledBack: boolean;
}
export declare class TransactionManager {
    private moduleId;
    private activeTransactions;
    private transactionHistory;
    /**
     * Start a new transaction
     */
    startTransaction(description: string): string;
    /**
     * Add an action to an active transaction
     */
    addAction(transactionId: string, action: TransactionAction): void;
    /**
     * Commit a transaction (mark as completed)
     */
    commitTransaction(transactionId: string): void;
    /**
     * Rollback a transaction (undo all actions)
     */
    rollbackTransaction(transactionId: string): Promise<{
        success: boolean;
        errors: string[];
    }>;
    /**
     * Rollback a specific action
     */
    private rollbackAction;
    /**
     * Rollback a create action (delete the created entity)
     */
    private rollbackCreate;
    /**
     * Rollback an update action (restore original data)
     */
    private rollbackUpdate;
    /**
     * Rollback a delete action (recreate the entity)
     */
    private rollbackDelete;
    /**
     * Get active transactions
     */
    getActiveTransactions(): Transaction[];
    /**
     * Get transaction history
     */
    getTransactionHistory(): Transaction[];
    /**
     * Clear old transactions from history
     */
    clearHistory(): void;
    /**
     * Cancel an active transaction without rollback (use for cleanup)
     */
    cancelTransaction(transactionId: string): void;
    /**
     * Create rollback action for actor creation
     */
    createActorCreationAction(actorId: string): TransactionAction;
    /**
     * Create rollback action for token creation
     */
    createTokenCreationAction(tokenId: string): TransactionAction;
}
export declare const transactionManager: TransactionManager;
//# sourceMappingURL=transaction-manager.d.ts.map