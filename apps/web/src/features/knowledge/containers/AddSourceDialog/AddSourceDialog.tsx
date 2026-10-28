import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadKnowledgeSource } from '@/features/knowledge/communication/hooks/useUploadKnowledgeSource';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_UPLOAD_MAX_MEGABYTES,
  KnowledgeFileSkipReason,
  KnowledgeFileStatus,
} from '@/features/knowledge/constants/knowledgeUpload.constants';
import type { AddSourceDialogProps } from '@/features/knowledge/containers/AddSourceDialog/AddSourceDialog.typedefs';
import { useAddSourceFiles } from '@/features/knowledge/containers/AddSourceDialog/useAddSourceFiles';
import {
  formatKnowledgeFileSize,
  knowledgeFileMimeType,
  knowledgeFileTypeLabel,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type {
  SelectedKnowledgeFile,
  SelectedKnowledgeFileView,
} from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';
import { AddSourceModal } from '@/features/knowledge/view/AddSourceModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function AddSourceDialog({
  knowledgeBaseId,
  knowledgeBaseName,
  onClose,
  onUploaded,
}: AddSourceDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const errorMessage = useErrorMessage();
  const { uploadKnowledgeSource } = useUploadKnowledgeSource();
  const {
    files,
    readyCount,
    uploadingCount,
    uploadedCount,
    failedCount,
    skippedCount,
    actionCount,
    addFiles,
    removeFile,
    updateFile,
  } = useAddSourceFiles();
  const [uploading, setUploading] = useState(false);

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

  const fileSubtitle = (file: SelectedKnowledgeFile): string => {
    if (file.status === KnowledgeFileStatus.Failed) {
      return file.error ?? t('add.uploadFailed');
    }
    if (file.reason !== null) {
      return skipReasonLabel(file.reason);
    }
    return `${formatKnowledgeFileSize(file.file.size)} · ${knowledgeFileTypeLabel(file.file.name)}`;
  };

  const viewFiles: readonly SelectedKnowledgeFileView[] = files.map((file) => ({
    id: file.id,
    name: file.file.name,
    subtitle: fileSubtitle(file),
    status: file.status,
  }));

  const submit = async () => {
    if (uploading || actionCount === 0) {
      return;
    }
    const queue = files.filter(
      ({ status }) => status === KnowledgeFileStatus.Ready || status === KnowledgeFileStatus.Failed,
    );
    setUploading(true);
    let uploaded = 0;
    let failed = 0;
    for (const file of queue) {
      updateFile(file.id, { status: KnowledgeFileStatus.Uploading, error: null });
      try {
        await uploadKnowledgeSource(
          knowledgeBaseId,
          file.file,
          knowledgeFileMimeType(file.file.name),
        );
        uploaded += 1;
        updateFile(file.id, { status: KnowledgeFileStatus.Uploaded, error: null });
      } catch (cause) {
        const message = errorMessage(toAppError(cause));
        failed += 1;
        updateFile(file.id, { status: KnowledgeFileStatus.Failed, error: message });
      }
    }
    setUploading(false);
    if (uploaded > 0) {
      onUploaded();
    }
    if (failed === 0) {
      onClose();
    }
  };

  return (
    <AddSourceModal
      knowledgeBaseName={knowledgeBaseName}
      files={viewFiles}
      readyCount={readyCount}
      uploadingCount={uploadingCount}
      uploadedCount={uploadedCount}
      failedCount={failedCount}
      skippedCount={skippedCount}
      uploading={uploading}
      onFiles={addFiles}
      onRemoveFile={removeFile}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
