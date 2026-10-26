import type { DocumentSummaryWarningCode } from '@/modules/knowledge/constants/knowledge-summary.constants';
import type { DocumentSection } from '@/modules/knowledge/typedefs/document-section.typedefs';

export interface DocumentSummaryInput {
  readonly workspaceId: string;
  readonly title: string;
  readonly markdown: string;
  readonly sections: readonly DocumentSection[];
  readonly existingSummary: string | null;
}

export interface DocumentSummaryWarning {
  readonly code: DocumentSummaryWarningCode;
  readonly message: string;
}

export interface DocumentSummaryContent {
  readonly content: string;
  readonly warnings: readonly DocumentSummaryWarning[];
}

export interface DocumentSummaryResult {
  readonly summary: string;
  readonly generated: boolean;
  readonly warnings: readonly DocumentSummaryWarning[];
}
