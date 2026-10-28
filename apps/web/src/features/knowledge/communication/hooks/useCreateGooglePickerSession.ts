import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateGooglePickerSessionDocument } from '@/features/knowledge/communication/gql/mutation/createGooglePickerSession.generated';
import { GOOGLE_PICKER_SESSION_MISSING_MESSAGE } from '@/features/knowledge/constants/googlePicker.constants';
import type {
  GooglePickerSession,
  UseCreateGooglePickerSessionResult,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';

export function useCreateGooglePickerSession(): UseCreateGooglePickerSessionResult {
  const [createSession] = useMutation(CreateGooglePickerSessionDocument);

  const createGooglePickerSession = useCallback(
    async (connectionId: string): Promise<GooglePickerSession> => {
      const { data } = await createSession({ variables: { connectionId } });
      const session = data?.createGooglePickerSession;
      if (session === undefined) {
        throw new Error(GOOGLE_PICKER_SESSION_MISSING_MESSAGE);
      }
      return session;
    },
    [createSession],
  );

  return { createGooglePickerSession };
}
