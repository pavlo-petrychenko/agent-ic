import type { KnowledgeToolErrorCode } from '@/modules/knowledge/constants/knowledge-tool.constants';

export interface KnowledgeToolError {
  readonly code: KnowledgeToolErrorCode;
  readonly message: string;
}

export interface KnowledgeToolResult {
  readonly document_id: string;
  readonly document_title: string;
  readonly source_id: string;
  readonly source_title: string;
  readonly path: string;
  readonly text: string;
  readonly score: number;
  readonly url: string | null;
}

export interface KnowledgeToolOutput {
  readonly found: boolean;
  readonly results: readonly KnowledgeToolResult[];
  readonly error?: KnowledgeToolError;
}
