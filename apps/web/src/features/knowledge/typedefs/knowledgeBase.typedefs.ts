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
