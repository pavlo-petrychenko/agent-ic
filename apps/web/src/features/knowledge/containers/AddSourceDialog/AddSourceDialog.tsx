import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDisconnectGoogleConnection } from '@/features/knowledge/communication/hooks/useDisconnectGoogleConnection';
import { useKnowledgeConnections } from '@/features/knowledge/communication/hooks/useKnowledgeConnections';
import { useStartGoogleConnection } from '@/features/knowledge/communication/hooks/useStartGoogleConnection';
import { useUploadKnowledgeSource } from '@/features/knowledge/communication/hooks/useUploadKnowledgeSource';
import { AddSourceType } from '@/features/knowledge/constants/googleConnection.constants';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_UPLOAD_MAX_MEGABYTES,
  KnowledgeFileSkipReason,
  KnowledgeFileStatus,
} from '@/features/knowledge/constants/knowledgeUpload.constants';
import type { AddSourceDialogProps } from '@/features/knowledge/containers/AddSourceDialog/AddSourceDialog.typedefs';
import { useAddSourceFiles } from '@/features/knowledge/containers/AddSourceDialog/useAddSourceFiles';
import {
  redirectToGoogle,
  saveGoogleConnectionReturn,
} from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import {
  formatKnowledgeFileSize,
  knowledgeFileMimeType,
  knowledgeFileTypeLabel,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import type {
  SelectedKnowledgeFile,
  SelectedKnowledgeFileView,
} from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';
import { AddSourceModal } from '@/features/knowledge/view/AddSourceModal';
import { GoogleConnectionPanel } from '@/features/knowledge/view/GoogleConnectionPanel';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function AddSourceDialog({
  workspaceId,
  knowledgeBaseId,
  knowledgeBaseName,
  initialSourceType = AddSourceType.Upload,
  onClose,
  onUploaded,
}: AddSourceDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { uploadKnowledgeSource } = useUploadKnowledgeSource();
  const [sourceType, setSourceType] = useState<AddSourceType>(initialSourceType);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const googleEnabled = sourceType === AddSourceType.GoogleDocs;
  const {
    connections,
    loading: connectionsLoading,
    failed: connectionsFailed,
    retry: retryConnections,
  } = useKnowledgeConnections(googleEnabled);
  const { startGoogleConnection, starting } = useStartGoogleConnection();
  const { disconnectGoogleConnection, disconnectingId } = useDisconnectGoogleConnection();
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

  const connect = async () => {
    setConnectionError(null);
    try {
      const authorizationUrl = await startGoogleConnection();
      saveGoogleConnectionReturn({ workspaceId, knowledgeBaseId });
      redirectToGoogle(authorizationUrl);
    } catch (failure) {
      setConnectionError(errorMessage(toAppError(failure)));
    }
  };

  const disconnect = async (connection: GoogleConnection) => {
    setConnectionError(null);
    try {
      await disconnectGoogleConnection(connection.id);
      showToast({
        message: t('add.googleConnection.disconnectSuccess'),
        tone: ToastTone.Ok,
      });
    } catch (failure) {
      showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
    }
  };

  return (
    <AddSourceModal
      knowledgeBaseName={knowledgeBaseName}
      sourceType={sourceType}
      files={viewFiles}
      readyCount={readyCount}
      uploadingCount={uploadingCount}
      uploadedCount={uploadedCount}
      failedCount={failedCount}
      skippedCount={skippedCount}
      uploading={uploading}
      googleContent={
        <GoogleConnectionPanel
          connections={connections}
          loading={connectionsLoading}
          failed={connectionsFailed}
          errorMessage={connectionError}
          starting={starting}
          disconnectingId={disconnectingId}
          onConnect={() => void connect()}
          onDisconnect={(connection) => void disconnect(connection)}
          onRetry={() => void retryConnections()}
        />
      }
      onSourceTypeChange={setSourceType}
      onFiles={addFiles}
      onRemoveFile={removeFile}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
