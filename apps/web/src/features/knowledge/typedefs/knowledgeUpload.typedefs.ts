import type {
  KnowledgeFileSkipReason,
  KnowledgeFileStatus,
} from '@/features/knowledge/constants/knowledgeUpload.constants';

export interface SelectedKnowledgeFile {
  readonly id: string;
  readonly file: File;
  readonly status: KnowledgeFileStatus;
  readonly reason: KnowledgeFileSkipReason | null;
}

export interface SelectedKnowledgeFileView {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly status: KnowledgeFileStatus;
}
