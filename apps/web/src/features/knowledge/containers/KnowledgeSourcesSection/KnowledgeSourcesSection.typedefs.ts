import type { AddSourceType } from '@/features/knowledge/constants/googleConnection.constants';

export interface KnowledgeSourcesSectionProps {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly initialAddSource: AddSourceType | null;
  readonly canAddSource: boolean;
  readonly canManageSources: boolean;
  readonly onCountsChanged: () => void;
}
