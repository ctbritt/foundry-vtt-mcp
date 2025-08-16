export declare const PERMISSION_LEVELS: {
    readonly LOW_RISK: "low";
    readonly MEDIUM_RISK: "medium";
    readonly HIGH_RISK: "high";
};
export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];
export interface WriteOperation {
    name: string;
    level: PermissionLevel;
    description: string;
    settingKey: string;
    requiresGM?: boolean;
}
export interface PermissionCheck {
    allowed: boolean;
    reason?: string | undefined;
    requiresConfirmation?: boolean | undefined;
    warnings?: string[] | undefined;
}
export declare class PermissionManager {
    private moduleId;
    private writeOperations;
    /**
     * Check if a write operation is allowed (GM-focused safety checks)
     */
    checkWritePermission(operationName: string, context?: {
        quantity?: number;
        targetIds?: string[];
    }): PermissionCheck;
    /**
     * Check operation-specific rules and limits
     */
    private checkOperationSpecifics;
    /**
     * Validate and sanitize operation parameters
     */
    validateOperationParameters(operationName: string, parameters: any): {
        valid: boolean;
        errors: string[];
        sanitized?: any;
    };
    /**
     * Get all available write operations and their current permission status
     */
    getOperationStatus(): Record<string, {
        operation: WriteOperation;
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * Create a permission summary for debugging
     */
    getPermissionSummary(): {
        user: {
            name: string;
            isGM: boolean;
        };
        settings: Record<string, boolean>;
        operations: Record<string, boolean>;
    };
    /**
     * Log permission check for audit purposes
     */
    auditPermissionCheck(operationName: string, result: PermissionCheck, parameters?: any): void;
    /**
     * Sanitize data for logging (remove sensitive information)
     */
    private sanitizeLogData;
}
export declare const permissionManager: PermissionManager;
//# sourceMappingURL=permissions.d.ts.map