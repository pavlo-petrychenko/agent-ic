import type { KnowledgeDocumentFormat } from '@agent-ic/contracts';
import type { DocumentParseWarningCode } from '@/modules/knowledge/constants/document-parser.constants';

export interface DocumentFormatDefinition {
  readonly format: KnowledgeDocumentFormat;
  readonly extensions: readonly string[];
  readonly mimeTypes: readonly string[];
}

export interface DocumentParseInput {
  readonly bytes: Buffer;
  readonly fileName: string;
  readonly mimeType: string;
  readonly title?: string;
}

export interface DocumentParseWarning {
  readonly code: DocumentParseWarningCode;
  readonly message: string;
}

export interface RawDocumentParseResult {
  readonly markdown: string;
  readonly warnings: readonly DocumentParseWarning[];
}

export interface ParsedDocument {
  readonly title: string;
  readonly markdown: string;
  readonly contentHash: string;
  readonly tokenCount: number;
  readonly warnings: readonly DocumentParseWarning[];
}

export interface DocumentTitleResult {
  readonly title: string;
  readonly warnings: readonly DocumentParseWarning[];
}

export type DocumentParser = (input: DocumentParseInput) => Promise<RawDocumentParseResult>;
