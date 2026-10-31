import { useCallback, useState } from 'react';
import { useCreateGoogleDocsSource } from '@/features/knowledge/communication/hooks/useCreateGoogleDocsSource';
import { useCreateGooglePickerSession } from '@/features/knowledge/communication/hooks/useCreateGooglePickerSession';
import { openGooglePicker } from '@/features/knowledge/logic/helpers/googlePicker.helpers';
import type {
  PickGoogleDocumentsInput,
  UseGooglePickerResult,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';

export function useGooglePicker(): UseGooglePickerResult {
  const { createGooglePickerSession } = useCreateGooglePickerSession();
  const { createGoogleDocsSource } = useCreateGoogleDocsSource();
  const [pickingConnectionId, setPickingConnectionId] = useState<string | null>(null);

  const pickDocuments = useCallback(
    async ({
      connectionId,
      knowledgeBaseId,
      onCreated,
      onError,
    }: PickGoogleDocumentsInput): Promise<void> => {
      setPickingConnectionId(connectionId);
      try {
        const session = await createGooglePickerSession(connectionId);
        await openGooglePicker({
          accessToken: session.accessToken,
          apiKey: session.apiKey,
          appId: session.appId,
          onCancel: () => setPickingConnectionId(null),
          onPicked: (documents) => {
            if (documents.length === 0) {
              setPickingConnectionId(null);
              return;
            }
            void createGoogleDocsSource({ connectionId, knowledgeBaseId, documents })
              .then(onCreated)
              .catch(onError)
              .finally(() => setPickingConnectionId(null));
          },
        });
      } catch (failure) {
        setPickingConnectionId(null);
        onError(failure);
      }
    },
    [createGoogleDocsSource, createGooglePickerSession],
  );

  return { pickDocuments, pickingConnectionId };
}
