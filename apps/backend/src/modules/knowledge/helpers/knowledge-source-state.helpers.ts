import {
  KnowledgeDocumentStatus,
  KnowledgeSourceStatus,
} from '@/modules/knowledge/constants/knowledge.constants';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';

export interface KnowledgeSourceState {
  readonly status: KnowledgeSourceStatus;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
}

const FAILED: KnowledgeSourceState = {
  status: KnowledgeSourceStatus.Error,
  lastErrorCode: null,
  lastErrorMessage: null,
};

export const knowledgeSourceStateForDocuments = (
  documents: readonly Document[],
): KnowledgeSourceState => {
  if (documents.length === 0) {
    return {
      status: KnowledgeSourceStatus.Pending,
      lastErrorCode: null,
      lastErrorMessage: null,
    };
  }
  const error = documents.find((document) => document.status === KnowledgeDocumentStatus.Error);
  if (error !== undefined) {
    return {
      ...FAILED,
      lastErrorCode: error.errorCode,
      lastErrorMessage: error.errorMessage,
    };
  }
  if (documents.every((document) => document.status === KnowledgeDocumentStatus.Indexed)) {
    return {
      status: KnowledgeSourceStatus.Ready,
      lastErrorCode: null,
      lastErrorMessage: null,
    };
  }
  if (documents.some((document) => document.status === KnowledgeDocumentStatus.Indexing)) {
    return {
      status: KnowledgeSourceStatus.Indexing,
      lastErrorCode: null,
      lastErrorMessage: null,
    };
  }
  return {
    status: KnowledgeSourceStatus.Pending,
    lastErrorCode: null,
    lastErrorMessage: null,
  };
};
