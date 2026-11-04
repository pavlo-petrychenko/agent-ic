import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateGoogleDocsSource } from '@/features/knowledge/communication/hooks/useCreateGoogleDocsSource';
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
import { useGooglePicker } from '@/features/knowledge/containers/AddSourceDialog/useGooglePicker';
import {
  redirectToGoogle,
  saveGoogleConnectionReturn,
} from '@/features/knowledge/logic/helpers/googleConnection.helpers';
import { GooglePickerLoadError } from '@/features/knowledge/logic/helpers/googlePicker.helpers';
import {
  formatKnowledgeFileSize,
  knowledgeFileMimeType,
  knowledgeFileTypeLabel,
} from '@/features/knowledge/logic/helpers/knowledgeUpload.helpers';
import type { GoogleConnection } from '@/features/knowledge/typedefs/googleConnection.typedefs';
import type {
  GooglePickerDocument,
  SelectedGoogleDocs,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';
import type {
  SelectedKnowledgeFile,
  SelectedKnowledgeFileView,
} from '@/features/knowledge/typedefs/knowledgeUpload.typedefs';
import { AddSourceModal } from '@/features/knowledge/view/AddSourceModal';
import { GoogleConnectionPanel } from '@/features/knowledge/view/GoogleConnectionPanel';
import { GooglePickerSkipReason } from '@/shared/api/generated/schema.generated';
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
  const { createGoogleDocsSource } = useCreateGoogleDocsSource();
  const [sourceType, setSourceType] = useState<AddSourceType>(initialSourceType);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedGoogleDocs, setSelectedGoogleDocs] = useState<SelectedGoogleDocs | null>(null);
  const [addingGoogleDocs, setAddingGoogleDocs] = useState(false);
  const googleEnabled = sourceType === AddSourceType.GoogleDocs;
  const {
    connections,
    loading: connectionsLoading,
    failed: connectionsFailed,
    retry: retryConnections,
  } = useKnowledgeConnections(googleEnabled);
  const { startGoogleConnection, starting } = useStartGoogleConnection();
  const { disconnectGoogleConnection, disconnectingId } = useDisconnectGoogleConnection();
  const { pickDocuments, pickingConnectionId } = useGooglePicker();
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
      if (selectedGoogleDocs?.connectionId === connection.id) {
        setSelectedGoogleDocs(null);
      }
      showToast({
        message: t('add.googleConnection.disconnectSuccess'),
        tone: ToastTone.Ok,
      });
    } catch (failure) {
      showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
    }
  };

  const addPickedDocuments = (connectionId: string, documents: readonly GooglePickerDocument[]) => {
    if (selectedGoogleDocs !== null && selectedGoogleDocs.connectionId !== connectionId) {
      showToast({
        message: t('add.googleConnection.pickerDifferentAccount'),
        tone: ToastTone.Info,
      });
      return;
    }
    setSelectedGoogleDocs((current) => {
      if (current !== null && current.connectionId !== connectionId) {
        return current;
      }
      const currentDocuments = current?.documents ?? [];
      const existing = new Set(currentDocuments.map((document) => document.id));
      const freshDocuments = documents.filter((document) => {
        if (existing.has(document.id)) {
          return false;
        }
        existing.add(document.id);
        return true;
      });
      if (freshDocuments.length === 0) {
        return current;
      }
      return {
        connectionId,
        documents: [...currentDocuments, ...freshDocuments],
      };
    });
  };

  const removeGoogleDocument = (id: string) => {
    setSelectedGoogleDocs((current) => {
      if (current === null) {
        return null;
      }
      const documents = current.documents.filter((document) => document.id !== id);
      return documents.length === 0 ? null : { ...current, documents };
    });
  };

  const pick = (connection: GoogleConnection) => {
    void pickDocuments({
      connectionId: connection.id,
      onPicked: (documents) => addPickedDocuments(connection.id, documents),
      onError: (failure) => {
        showToast({
          message:
            failure instanceof GooglePickerLoadError
              ? t('add.googleConnection.pickerLoadError')
              : errorMessage(toAppError(failure)),
          tone: ToastTone.Err,
        });
      },
    });
  };

  const addGoogleDocs = async () => {
    if (addingGoogleDocs || selectedGoogleDocs === null) {
      return;
    }
    setAddingGoogleDocs(true);
    try {
      const result = await createGoogleDocsSource({
        connectionId: selectedGoogleDocs.connectionId,
        knowledgeBaseId,
        documents: selectedGoogleDocs.documents,
        syncInterval: null,
        syncTime: null,
        syncWeekday: null,
      });
      showToast({
        message: t('add.googleConnection.pickerSuccess'),
        tone: ToastTone.Ok,
      });
      if (
        result.skipped.some((document) => document.reason === GooglePickerSkipReason.AlreadyAdded)
      ) {
        showToast({
          message: t('add.googleConnection.pickerAlreadyAdded'),
          tone: ToastTone.Info,
        });
      } else if (result.skipped.length > 0) {
        showToast({
          message: t('add.googleConnection.pickerSkipped'),
          tone: ToastTone.Info,
        });
      }
      setSelectedGoogleDocs(null);
      onUploaded();
      onClose();
    } catch (failure) {
      showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
    } finally {
      setAddingGoogleDocs(false);
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
      picking={pickingConnectionId !== null}
      googleDocuments={selectedGoogleDocs?.documents ?? []}
      addingGoogleDocs={addingGoogleDocs}
      googleContent={
        <GoogleConnectionPanel
          connections={connections}
          loading={connectionsLoading}
          failed={connectionsFailed}
          errorMessage={connectionError}
          starting={starting}
          disconnectingId={disconnectingId}
          pickingConnectionId={pickingConnectionId}
          disabled={addingGoogleDocs}
          onConnect={() => void connect()}
          onDisconnect={(connection) => void disconnect(connection)}
          onPick={pick}
          onRetry={() => void retryConnections()}
        />
      }
      onSourceTypeChange={setSourceType}
      onFiles={addFiles}
      onRemoveFile={removeFile}
      onRemoveGoogleDocument={removeGoogleDocument}
      onAddGoogleDocs={() => void addGoogleDocs()}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
