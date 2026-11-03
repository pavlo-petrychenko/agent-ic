export interface KnowledgeBase {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly toolName: string;
  readonly toolDescription: string | null;
  readonly documentCount: number;
  readonly chunkCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateKnowledgeBaseValues {
  readonly name: string;
}

export interface UseKnowledgeBasesResult {
  readonly knowledgeBases: readonly KnowledgeBase[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseCreateKnowledgeBaseResult {
  readonly createKnowledgeBase: (values: CreateKnowledgeBaseValues) => Promise<KnowledgeBase>;
  readonly creating: boolean;
}

export interface RenameKnowledgeBaseValues {
  readonly id: string;
  readonly name: string;
}

export interface UpdateKnowledgeBaseToolValues {
  readonly id: string;
  readonly toolName: string;
  readonly toolDescription: string | null;
}

export interface KnowledgeBaseUsage {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly versionKind: 'draft' | 'live';
  readonly versionNumber: number | null;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
}

export interface UseKnowledgeBaseUsagesResult {
  readonly usages: readonly KnowledgeBaseUsage[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}

export interface UseUpdateKnowledgeBaseToolResult {
  readonly updateKnowledgeBaseTool: (
    values: UpdateKnowledgeBaseToolValues,
  ) => Promise<KnowledgeBase>;
  readonly updating: boolean;
}

export interface UseRenameKnowledgeBaseResult {
  readonly renameKnowledgeBase: (values: RenameKnowledgeBaseValues) => Promise<void>;
  readonly renaming: boolean;
}

export interface UseDeleteKnowledgeBaseResult {
  readonly deleteKnowledgeBase: (id: string) => Promise<void>;
  readonly deleting: boolean;
}
