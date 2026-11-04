import type { z } from 'zod';
import type { cleanUpKnowledgeDocumentFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-document-files.job';
import type { cleanUpKnowledgeSourceFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-source-files.job';
import type { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';
import type { reindexKnowledgeDocumentJob } from '@/modules/knowledge/jobs/reindex-knowledge-document.job';
import type { scheduledKnowledgeSourceSyncJob } from '@/modules/knowledge/jobs/scheduled-knowledge-source-sync.job';

export interface KnowledgeFailure {
  readonly code: string;
  readonly message: string;
}

export type IngestKnowledgeSourceJobData = z.infer<typeof ingestKnowledgeSourceJob.schema>;

export type ScheduledKnowledgeSourceSyncJobData = z.infer<
  typeof scheduledKnowledgeSourceSyncJob.schema
>;

export type ReindexKnowledgeDocumentJobData = z.infer<typeof reindexKnowledgeDocumentJob.schema>;

export type CleanUpKnowledgeDocumentFilesJobData = z.infer<
  typeof cleanUpKnowledgeDocumentFilesJob.schema
>;

export type CleanUpKnowledgeSourceFilesJobData = z.infer<
  typeof cleanUpKnowledgeSourceFilesJob.schema
>;
