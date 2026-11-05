import { useCallback, useState } from 'react';
import { useCreateGooglePickerSession } from '@/features/knowledge/communication/hooks/useCreateGooglePickerSession';
import { openGooglePicker } from '@/features/knowledge/logic/helpers/googlePicker.helpers';
import type {
  PickGoogleDocumentsInput,
  UseGooglePickerResult,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';

export function useGooglePicker(): UseGooglePickerResult {
  const { createGooglePickerSession } = useCreateGooglePickerSession();
  const [pickingConnectionId, setPickingConnectionId] = useState<string | null>(null);

  const pickDocuments = useCallback(
    async ({ connectionId, onPicked, onError }: PickGoogleDocumentsInput): Promise<void> => {
      setPickingConnectionId(connectionId);
      try {
        const session = await createGooglePickerSession(connectionId);
        await openGooglePicker({
          accessToken: session.accessToken,
          apiKey: session.apiKey,
          appId: session.appId,
          onCancel: () => setPickingConnectionId(null),
          onPicked: (documents) => {
            setPickingConnectionId(null);
            if (documents.length > 0) {
              onPicked(documents);
            }
          },
        });
      } catch (failure) {
        setPickingConnectionId(null);
        onError(failure);
      }
    },
    [createGooglePickerSession],
  );

  return { pickDocuments, pickingConnectionId };
}
