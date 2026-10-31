import type { KnowledgeConnectionStatus } from '@/shared/api/generated/schema.generated';

export interface GoogleConnectionAccountStatusProps {
  readonly status: KnowledgeConnectionStatus;
}
