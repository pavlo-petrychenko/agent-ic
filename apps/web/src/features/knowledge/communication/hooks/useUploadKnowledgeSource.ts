import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { ConfirmUploadDocument } from '@/features/knowledge/communication/gql/mutation/confirmUpload.generated';
import { CreateUploadDocument } from '@/features/knowledge/communication/gql/mutation/createUpload.generated';

export function useUploadKnowledgeSource() {
  const [createUpload] = useMutation(CreateUploadDocument);
  const [confirmUpload] = useMutation(ConfirmUploadDocument);

  const uploadKnowledgeSource = useCallback(
    async (knowledgeBaseId: string, file: File, mimeType: string): Promise<void> => {
      const created = await createUpload({
        variables: {
          input: {
            knowledgeBaseId,
            fileName: file.name,
            mimeType,
            sizeBytes: file.size,
            sourceId: null,
          },
        },
      });
      const ticket = created.data?.createUpload;
      if (ticket === undefined) {
        throw new Error('The upload was not created');
      }
      const response = await fetch(ticket.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: file,
      });
      if (!response.ok) {
        throw new Error('The file was not uploaded');
      }
      const confirmed = await confirmUpload({
        variables: { input: { documentId: ticket.documentId } },
      });
      if (confirmed.data === undefined) {
        throw new Error('The upload was not confirmed');
      }
    },
    [confirmUpload, createUpload],
  );

  return { uploadKnowledgeSource };
}
