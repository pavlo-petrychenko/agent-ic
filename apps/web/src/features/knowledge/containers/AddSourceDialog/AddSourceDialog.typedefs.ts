import type { AddSourceType } from '@/features/knowledge/constants/googleConnection.constants';

export interface AddSourceDialogProps {
  readonly workspaceId: string;
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseName: string;
  readonly initialSourceType?: AddSourceType;
  readonly onClose: () => void;
  readonly onUploaded: () => void;
}
