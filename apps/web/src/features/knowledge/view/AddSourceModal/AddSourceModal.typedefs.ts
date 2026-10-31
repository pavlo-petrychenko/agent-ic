import type { ReactNode } from 'react';
import type { AddSourceType } from '@/features/knowledge/constants/googleConnection.constants';
import type { SelectedKnowledgeFileView } from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';

export interface AddSourceModalProps {
  readonly knowledgeBaseName: string;
  readonly sourceType: AddSourceType;
  readonly files: readonly SelectedKnowledgeFileView[];
  readonly readyCount: number;
  readonly uploadingCount: number;
  readonly uploadedCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly uploading: boolean;
  readonly picking: boolean;
  readonly googleContent: ReactNode;
  readonly onSourceTypeChange: (sourceType: AddSourceType) => void;
  readonly onFiles: (files: readonly File[]) => void;
  readonly onRemoveFile: (id: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}
