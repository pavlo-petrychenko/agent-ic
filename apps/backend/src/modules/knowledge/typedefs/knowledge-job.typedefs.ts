import type { z } from 'zod';
import type { cleanUpKnowledgeSourceFilesJob } from '@/modules/knowledge/jobs/clean-up-knowledge-source-files.job';
import type { ingestKnowledgeSourceJob } from '@/modules/knowledge/jobs/ingest-knowledge-source.job';

export interface KnowledgeFailure {
  readonly code: string;
  readonly message: string;
}

export type IngestKnowledgeSourceJobData = z.infer<typeof ingestKnowledgeSourceJob.schema>;

export type CleanUpKnowledgeSourceFilesJobData = z.infer<
  typeof cleanUpKnowledgeSourceFilesJob.schema
>;
