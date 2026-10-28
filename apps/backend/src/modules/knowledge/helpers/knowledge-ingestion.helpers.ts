import { ErrorReason } from '@agent-ic/contracts';
import { KNOWLEDGE_INGESTION_FAILED_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DocumentParseError } from '@/modules/knowledge/errors/document-parse.error';
import type { KnowledgeFailure } from '@/modules/knowledge/typedefs/knowledge-job.typedefs';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';

export const knowledgeFailure = (error: unknown): KnowledgeFailure => {
  if (error instanceof DocumentParseError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof DomainError) {
    return { code: error.reason, message: error.message };
  }
  if (error instanceof UpstreamError) {
    return { code: error.reason, message: error.message };
  }
  return { code: ErrorReason.Internal, message: KNOWLEDGE_INGESTION_FAILED_MESSAGE };
};

export const isDocumentFailure = (error: unknown): boolean =>
  error instanceof DocumentParseError || jobFailureActionFor(error) === JobFailureAction.GiveUp;
