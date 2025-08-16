import { z } from 'zod';
/**
 * MCP Query schemas
 */
export declare const MCPQuerySchema: z.ZodObject<{
    method: z.ZodString;
    data: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    method: string;
    data?: unknown;
}, {
    method: string;
    data?: unknown;
}>;
export declare const MCPResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    data?: unknown;
}, {
    success: boolean;
    error?: string | undefined;
    data?: unknown;
}>;
/**
 * Character schemas
 */
export declare const CharacterItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    img: z.ZodOptional<z.ZodString>;
    system: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    name: string;
    system: Record<string, unknown>;
    img?: string | undefined;
}, {
    type: string;
    id: string;
    name: string;
    system: Record<string, unknown>;
    img?: string | undefined;
}>;
export declare const CharacterEffectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    disabled: z.ZodBoolean;
    duration: z.ZodOptional<z.ZodObject<{
        type: z.ZodString;
        duration: z.ZodOptional<z.ZodNumber>;
        remaining: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        duration?: number | undefined;
        remaining?: number | undefined;
    }, {
        type: string;
        duration?: number | undefined;
        remaining?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    disabled: boolean;
    icon?: string | undefined;
    duration?: {
        type: string;
        duration?: number | undefined;
        remaining?: number | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    disabled: boolean;
    icon?: string | undefined;
    duration?: {
        type: string;
        duration?: number | undefined;
        remaining?: number | undefined;
    } | undefined;
}>;
export declare const CharacterInfoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    img: z.ZodOptional<z.ZodString>;
    system: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodString;
        img: z.ZodOptional<z.ZodString>;
        system: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        name: string;
        system: Record<string, unknown>;
        img?: string | undefined;
    }, {
        type: string;
        id: string;
        name: string;
        system: Record<string, unknown>;
        img?: string | undefined;
    }>, "many">;
    effects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
        disabled: z.ZodBoolean;
        duration: z.ZodOptional<z.ZodObject<{
            type: z.ZodString;
            duration: z.ZodOptional<z.ZodNumber>;
            remaining: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        }, {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        disabled: boolean;
        icon?: string | undefined;
        duration?: {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        } | undefined;
    }, {
        id: string;
        name: string;
        disabled: boolean;
        icon?: string | undefined;
        duration?: {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    name: string;
    system: Record<string, unknown>;
    items: {
        type: string;
        id: string;
        name: string;
        system: Record<string, unknown>;
        img?: string | undefined;
    }[];
    effects: {
        id: string;
        name: string;
        disabled: boolean;
        icon?: string | undefined;
        duration?: {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        } | undefined;
    }[];
    img?: string | undefined;
}, {
    type: string;
    id: string;
    name: string;
    system: Record<string, unknown>;
    items: {
        type: string;
        id: string;
        name: string;
        system: Record<string, unknown>;
        img?: string | undefined;
    }[];
    effects: {
        id: string;
        name: string;
        disabled: boolean;
        icon?: string | undefined;
        duration?: {
            type: string;
            duration?: number | undefined;
            remaining?: number | undefined;
        } | undefined;
    }[];
    img?: string | undefined;
}>;
/**
 * Compendium schemas
 */
export declare const CompendiumSearchResultSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    img: z.ZodOptional<z.ZodString>;
    pack: z.ZodString;
    packLabel: z.ZodString;
    system: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    name: string;
    pack: string;
    packLabel: string;
    img?: string | undefined;
    system?: Record<string, unknown> | undefined;
}, {
    type: string;
    id: string;
    name: string;
    pack: string;
    packLabel: string;
    img?: string | undefined;
    system?: Record<string, unknown> | undefined;
}>;
export declare const CompendiumPackSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    type: z.ZodString;
    system: z.ZodString;
    private: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    system: string;
    label: string;
    private: boolean;
}, {
    type: string;
    id: string;
    system: string;
    label: string;
    private: boolean;
}>;
/**
 * Scene schemas
 */
export declare const SceneTokenSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    actorId: z.ZodOptional<z.ZodString>;
    img: z.ZodString;
    hidden: z.ZodBoolean;
    disposition: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    img: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hidden: boolean;
    disposition: number;
    actorId?: string | undefined;
}, {
    id: string;
    name: string;
    img: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hidden: boolean;
    disposition: number;
    actorId?: string | undefined;
}>;
export declare const SceneNoteSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    x: number;
    y: number;
    text: string;
}, {
    id: string;
    x: number;
    y: number;
    text: string;
}>;
export declare const SceneInfoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    img: z.ZodOptional<z.ZodString>;
    background: z.ZodOptional<z.ZodString>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    padding: z.ZodNumber;
    active: z.ZodBoolean;
    navigation: z.ZodBoolean;
    tokens: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        actorId: z.ZodOptional<z.ZodString>;
        img: z.ZodString;
        hidden: z.ZodBoolean;
        disposition: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        img: string;
        x: number;
        y: number;
        width: number;
        height: number;
        hidden: boolean;
        disposition: number;
        actorId?: string | undefined;
    }, {
        id: string;
        name: string;
        img: string;
        x: number;
        y: number;
        width: number;
        height: number;
        hidden: boolean;
        disposition: number;
        actorId?: string | undefined;
    }>, "many">;
    walls: z.ZodNumber;
    lights: z.ZodNumber;
    sounds: z.ZodNumber;
    notes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        x: number;
        y: number;
        text: string;
    }, {
        id: string;
        x: number;
        y: number;
        text: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    width: number;
    height: number;
    padding: number;
    active: boolean;
    navigation: boolean;
    tokens: {
        id: string;
        name: string;
        img: string;
        x: number;
        y: number;
        width: number;
        height: number;
        hidden: boolean;
        disposition: number;
        actorId?: string | undefined;
    }[];
    walls: number;
    lights: number;
    sounds: number;
    notes: {
        id: string;
        x: number;
        y: number;
        text: string;
    }[];
    img?: string | undefined;
    background?: string | undefined;
}, {
    id: string;
    name: string;
    width: number;
    height: number;
    padding: number;
    active: boolean;
    navigation: boolean;
    tokens: {
        id: string;
        name: string;
        img: string;
        x: number;
        y: number;
        width: number;
        height: number;
        hidden: boolean;
        disposition: number;
        actorId?: string | undefined;
    }[];
    walls: number;
    lights: number;
    sounds: number;
    notes: {
        id: string;
        x: number;
        y: number;
        text: string;
    }[];
    img?: string | undefined;
    background?: string | undefined;
}>;
/**
 * Configuration schemas
 */
export declare const FoundryMCPConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    mcpHost: z.ZodString;
    mcpPort: z.ZodNumber;
    connectionTimeout: z.ZodNumber;
    debugLogging: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    mcpHost: string;
    mcpPort: number;
    connectionTimeout: number;
    debugLogging: boolean;
}, {
    enabled: boolean;
    mcpHost: string;
    mcpPort: number;
    connectionTimeout: number;
    debugLogging: boolean;
}>;
export declare const MCPServerConfigSchema: z.ZodObject<{
    logLevel: z.ZodEnum<["error", "warn", "info", "debug"]>;
    foundry: z.ZodObject<{
        host: z.ZodString;
        port: z.ZodNumber;
        namespace: z.ZodString;
        reconnectAttempts: z.ZodNumber;
        reconnectDelay: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
    }, {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
    }>;
}, "strip", z.ZodTypeAny, {
    logLevel: "error" | "warn" | "info" | "debug";
    foundry: {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
    };
}, {
    logLevel: "error" | "warn" | "info" | "debug";
    foundry: {
        host: string;
        port: number;
        namespace: string;
        reconnectAttempts: number;
        reconnectDelay: number;
    };
}>;
/**
 * World info schemas
 */
export declare const WorldUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    active: z.ZodBoolean;
    isGM: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    active: boolean;
    isGM: boolean;
}, {
    id: string;
    name: string;
    active: boolean;
    isGM: boolean;
}>;
export declare const WorldInfoSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    system: z.ZodString;
    systemVersion: z.ZodString;
    foundryVersion: z.ZodString;
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        active: z.ZodBoolean;
        isGM: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        active: boolean;
        isGM: boolean;
    }, {
        id: string;
        name: string;
        active: boolean;
        isGM: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    system: string;
    title: string;
    systemVersion: string;
    foundryVersion: string;
    users: {
        id: string;
        name: string;
        active: boolean;
        isGM: boolean;
    }[];
}, {
    id: string;
    system: string;
    title: string;
    systemVersion: string;
    foundryVersion: string;
    users: {
        id: string;
        name: string;
        active: boolean;
        isGM: boolean;
    }[];
}>;
/**
 * Bridge status schema
 */
export declare const BridgeStatusSchema: z.ZodObject<{
    isRunning: z.ZodBoolean;
    config: z.ZodObject<{
        enabled: z.ZodBoolean;
        mcpHost: z.ZodString;
        mcpPort: z.ZodNumber;
        connectionTimeout: z.ZodNumber;
        debugLogging: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        mcpHost: string;
        mcpPort: number;
        connectionTimeout: number;
        debugLogging: boolean;
    }, {
        enabled: boolean;
        mcpHost: string;
        mcpPort: number;
        connectionTimeout: number;
        debugLogging: boolean;
    }>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    isRunning: boolean;
    config: {
        enabled: boolean;
        mcpHost: string;
        mcpPort: number;
        connectionTimeout: number;
        debugLogging: boolean;
    };
    timestamp: number;
}, {
    isRunning: boolean;
    config: {
        enabled: boolean;
        mcpHost: string;
        mcpPort: number;
        connectionTimeout: number;
        debugLogging: boolean;
    };
    timestamp: number;
}>;
/**
 * Multipart Campaign schemas
 */
export declare const CampaignPartStatusSchema: z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>;
export declare const CampaignPartTypeSchema: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
export declare const LevelRecommendationSchema: z.ZodObject<{
    start: z.ZodNumber;
    end: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    start: number;
    end: number;
}, {
    start: number;
    end: number;
}>;
export declare const NPCReferenceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    actorId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    actorId?: string | undefined;
}, {
    id: string;
    name: string;
    actorId?: string | undefined;
}>;
export declare const ScalingOptionsSchema: z.ZodObject<{
    adjustForPartySize: z.ZodDefault<z.ZodBoolean>;
    adjustForLevel: z.ZodDefault<z.ZodBoolean>;
    difficultyModifier: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    adjustForPartySize: boolean;
    adjustForLevel: boolean;
    difficultyModifier: number;
}, {
    adjustForPartySize?: boolean | undefined;
    adjustForLevel?: boolean | undefined;
    difficultyModifier?: number | undefined;
}>;
export declare const CampaignSubPartSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
    status: z.ZodDefault<z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>>;
    journalId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodNumber>;
    completedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
    status: "not_started" | "in_progress" | "completed" | "skipped";
    id: string;
    title: string;
    description: string;
    journalId?: string | undefined;
    createdAt?: number | undefined;
    completedAt?: number | undefined;
}, {
    type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
    id: string;
    title: string;
    description: string;
    status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
    journalId?: string | undefined;
    createdAt?: number | undefined;
    completedAt?: number | undefined;
}>;
export declare const CampaignPartSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
    status: z.ZodDefault<z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    subParts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
        status: z.ZodDefault<z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>>;
        journalId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodNumber>;
        completedAt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        status: "not_started" | "in_progress" | "completed" | "skipped";
        id: string;
        title: string;
        description: string;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
    }, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        id: string;
        title: string;
        description: string;
        status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
    }>, "many">>;
    questGiver: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        actorId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        actorId?: string | undefined;
    }, {
        id: string;
        name: string;
        actorId?: string | undefined;
    }>>;
    levelRecommendation: z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>;
    gmNotes: z.ZodDefault<z.ZodString>;
    playerContent: z.ZodDefault<z.ZodString>;
    scaling: z.ZodDefault<z.ZodObject<{
        adjustForPartySize: z.ZodDefault<z.ZodBoolean>;
        adjustForLevel: z.ZodDefault<z.ZodBoolean>;
        difficultyModifier: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        adjustForPartySize: boolean;
        adjustForLevel: boolean;
        difficultyModifier: number;
    }, {
        adjustForPartySize?: boolean | undefined;
        adjustForLevel?: boolean | undefined;
        difficultyModifier?: number | undefined;
    }>>;
    journalId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodNumber>;
    completedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
    status: "not_started" | "in_progress" | "completed" | "skipped";
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    levelRecommendation: {
        start: number;
        end: number;
    };
    gmNotes: string;
    playerContent: string;
    scaling: {
        adjustForPartySize: boolean;
        adjustForLevel: boolean;
        difficultyModifier: number;
    };
    journalId?: string | undefined;
    createdAt?: number | undefined;
    completedAt?: number | undefined;
    subParts?: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        status: "not_started" | "in_progress" | "completed" | "skipped";
        id: string;
        title: string;
        description: string;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
    }[] | undefined;
    questGiver?: {
        id: string;
        name: string;
        actorId?: string | undefined;
    } | undefined;
}, {
    type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
    id: string;
    title: string;
    description: string;
    levelRecommendation: {
        start: number;
        end: number;
    };
    status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
    journalId?: string | undefined;
    createdAt?: number | undefined;
    completedAt?: number | undefined;
    dependencies?: string[] | undefined;
    subParts?: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        id: string;
        title: string;
        description: string;
        status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
    }[] | undefined;
    questGiver?: {
        id: string;
        name: string;
        actorId?: string | undefined;
    } | undefined;
    gmNotes?: string | undefined;
    playerContent?: string | undefined;
    scaling?: {
        adjustForPartySize?: boolean | undefined;
        adjustForLevel?: boolean | undefined;
        difficultyModifier?: number | undefined;
    } | undefined;
}>;
export declare const CampaignMetadataSchema: z.ZodObject<{
    defaultQuestGiver: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        actorId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        actorId?: string | undefined;
    }, {
        id: string;
        name: string;
        actorId?: string | undefined;
    }>>;
    defaultLocation: z.ZodOptional<z.ZodString>;
    theme: z.ZodOptional<z.ZodString>;
    estimatedSessions: z.ZodOptional<z.ZodNumber>;
    targetLevelRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tags: string[];
    defaultQuestGiver?: {
        id: string;
        name: string;
        actorId?: string | undefined;
    } | undefined;
    defaultLocation?: string | undefined;
    theme?: string | undefined;
    estimatedSessions?: number | undefined;
    targetLevelRange?: {
        start: number;
        end: number;
    } | undefined;
}, {
    defaultQuestGiver?: {
        id: string;
        name: string;
        actorId?: string | undefined;
    } | undefined;
    defaultLocation?: string | undefined;
    theme?: string | undefined;
    estimatedSessions?: number | undefined;
    targetLevelRange?: {
        start: number;
        end: number;
    } | undefined;
    tags?: string[] | undefined;
}>;
export declare const CampaignStructureSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    parts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
        status: z.ZodDefault<z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>>;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        subParts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
            status: z.ZodDefault<z.ZodEnum<["not_started", "in_progress", "completed", "skipped"]>>;
            journalId: z.ZodOptional<z.ZodString>;
            createdAt: z.ZodOptional<z.ZodNumber>;
            completedAt: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            status: "not_started" | "in_progress" | "completed" | "skipped";
            id: string;
            title: string;
            description: string;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }, {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            id: string;
            title: string;
            description: string;
            status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }>, "many">>;
        questGiver: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            actorId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }>>;
        levelRecommendation: z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>;
        gmNotes: z.ZodDefault<z.ZodString>;
        playerContent: z.ZodDefault<z.ZodString>;
        scaling: z.ZodDefault<z.ZodObject<{
            adjustForPartySize: z.ZodDefault<z.ZodBoolean>;
            adjustForLevel: z.ZodDefault<z.ZodBoolean>;
            difficultyModifier: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            adjustForPartySize: boolean;
            adjustForLevel: boolean;
            difficultyModifier: number;
        }, {
            adjustForPartySize?: boolean | undefined;
            adjustForLevel?: boolean | undefined;
            difficultyModifier?: number | undefined;
        }>>;
        journalId: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodNumber>;
        completedAt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        status: "not_started" | "in_progress" | "completed" | "skipped";
        id: string;
        title: string;
        description: string;
        dependencies: string[];
        levelRecommendation: {
            start: number;
            end: number;
        };
        gmNotes: string;
        playerContent: string;
        scaling: {
            adjustForPartySize: boolean;
            adjustForLevel: boolean;
            difficultyModifier: number;
        };
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            status: "not_started" | "in_progress" | "completed" | "skipped";
            id: string;
            title: string;
            description: string;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }[] | undefined;
        questGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
    }, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        id: string;
        title: string;
        description: string;
        levelRecommendation: {
            start: number;
            end: number;
        };
        status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
        dependencies?: string[] | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            id: string;
            title: string;
            description: string;
            status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }[] | undefined;
        questGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        gmNotes?: string | undefined;
        playerContent?: string | undefined;
        scaling?: {
            adjustForPartySize?: boolean | undefined;
            adjustForLevel?: boolean | undefined;
            difficultyModifier?: number | undefined;
        } | undefined;
    }>, "many">;
    metadata: z.ZodObject<{
        defaultQuestGiver: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            actorId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }>>;
        defaultLocation: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodString>;
        estimatedSessions: z.ZodOptional<z.ZodNumber>;
        targetLevelRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tags: string[];
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
    }, {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    }>;
    dashboardJournalId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    createdAt: number;
    parts: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        status: "not_started" | "in_progress" | "completed" | "skipped";
        id: string;
        title: string;
        description: string;
        dependencies: string[];
        levelRecommendation: {
            start: number;
            end: number;
        };
        gmNotes: string;
        playerContent: string;
        scaling: {
            adjustForPartySize: boolean;
            adjustForLevel: boolean;
            difficultyModifier: number;
        };
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            status: "not_started" | "in_progress" | "completed" | "skipped";
            id: string;
            title: string;
            description: string;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }[] | undefined;
        questGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
    }[];
    metadata: {
        tags: string[];
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
    };
    updatedAt: number;
    dashboardJournalId?: string | undefined;
}, {
    id: string;
    title: string;
    description: string;
    createdAt: number;
    parts: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        id: string;
        title: string;
        description: string;
        levelRecommendation: {
            start: number;
            end: number;
        };
        status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
        journalId?: string | undefined;
        createdAt?: number | undefined;
        completedAt?: number | undefined;
        dependencies?: string[] | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            id: string;
            title: string;
            description: string;
            status?: "not_started" | "in_progress" | "completed" | "skipped" | undefined;
            journalId?: string | undefined;
            createdAt?: number | undefined;
            completedAt?: number | undefined;
        }[] | undefined;
        questGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        gmNotes?: string | undefined;
        playerContent?: string | undefined;
        scaling?: {
            adjustForPartySize?: boolean | undefined;
            adjustForLevel?: boolean | undefined;
            difficultyModifier?: number | undefined;
        } | undefined;
    }[];
    metadata: {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    };
    updatedAt: number;
    dashboardJournalId?: string | undefined;
}>;
export declare const CampaignTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    parts: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
        dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        subParts: z.ZodOptional<z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            type: z.ZodEnum<["main_part", "sub_part", "chapter", "session", "optional"]>;
        }, "strip", z.ZodTypeAny, {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }, {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }>, "many">>;
        levelRecommendation: z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        title: string;
        description: string;
        dependencies: string[];
        levelRecommendation: {
            start: number;
            end: number;
        };
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }[] | undefined;
    }, {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        title: string;
        description: string;
        levelRecommendation: {
            start: number;
            end: number;
        };
        dependencies?: string[] | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }[] | undefined;
    }>, "many">;
    metadata: z.ZodObject<{
        defaultQuestGiver: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            actorId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }, {
            id: string;
            name: string;
            actorId?: string | undefined;
        }>>>;
        defaultLocation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        theme: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        estimatedSessions: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        targetLevelRange: z.ZodOptional<z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    }, {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    parts: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        title: string;
        description: string;
        dependencies: string[];
        levelRecommendation: {
            start: number;
            end: number;
        };
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }[] | undefined;
    }[];
    metadata: {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    };
}, {
    id: string;
    name: string;
    description: string;
    parts: {
        type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
        title: string;
        description: string;
        levelRecommendation: {
            start: number;
            end: number;
        };
        dependencies?: string[] | undefined;
        subParts?: {
            type: "main_part" | "sub_part" | "chapter" | "session" | "optional";
            title: string;
            description: string;
        }[] | undefined;
    }[];
    metadata: {
        defaultQuestGiver?: {
            id: string;
            name: string;
            actorId?: string | undefined;
        } | undefined;
        defaultLocation?: string | undefined;
        theme?: string | undefined;
        estimatedSessions?: number | undefined;
        targetLevelRange?: {
            start: number;
            end: number;
        } | undefined;
        tags?: string[] | undefined;
    };
}>;
//# sourceMappingURL=schemas.d.ts.map