import type { SelectedKnowledgeFileView } from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';

export interface AddSourceModalProps {
  readonly knowledgeBaseName: string;
  readonly files: readonly SelectedKnowledgeFileView[];
  readonly readyCount: number;
  readonly uploadingCount: number;
  readonly uploadedCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly uploading: boolean;
  readonly onFiles: (files: readonly File[]) => void;
  readonly onRemoveFile: (id: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
