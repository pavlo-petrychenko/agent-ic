import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_UPLOAD_MAX_MEGABYTES,
  KnowledgeFileSkipReason,
} from '@/features/knowledge/constants/knowledgeUpload.constants';
import type { AddSourceDialogProps } from '@/features/knowledge/containers/AddSourceDialog/AddSourceDialog.typedefs';
import { useAddSourceFiles } from '@/features/knowledge/containers/AddSourceDialog/useAddSourceFiles';
import {
  formatKnowledgeFileSize,
  knowledgeFileTypeLabel,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type { SelectedKnowledgeFileView } from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';
import { AddSourceModal } from '@/features/knowledge/view/AddSourceModal';

export function AddSourceDialog({ knowledgeBaseName, onClose, onAddFiles }: AddSourceDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { files, readyCount, skippedCount, addFiles, removeFile, submit } = useAddSourceFiles(
    onAddFiles,
    onClose,
  );

  const skipReasonLabel = (reason: KnowledgeFileSkipReason): string => {
    switch (reason) {
      case KnowledgeFileSkipReason.Unsupported:
        return t('add.skipUnsupported');
      case KnowledgeFileSkipReason.TooLarge:
        return t('add.skipTooLarge', { max: KNOWLEDGE_UPLOAD_MAX_MEGABYTES });
      case KnowledgeFileSkipReason.Empty:
        return t('add.skipEmpty');
    }
  };

  const viewFiles: readonly SelectedKnowledgeFileView[] = files.map((file) => ({
    id: file.id,
    name: file.file.name,
    subtitle:
      file.reason === null
        ? `${formatKnowledgeFileSize(file.file.size)} · ${knowledgeFileTypeLabel(file.file.name)}`
        : skipReasonLabel(file.reason),
    status: file.status,
  }));

  return (
    <AddSourceModal
      knowledgeBaseName={knowledgeBaseName}
      files={viewFiles}
      readyCount={readyCount}
      skippedCount={skippedCount}
      onFiles={addFiles}
      onRemoveFile={removeFile}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
