import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { CreateGoogleDocsSourceDocument } from '@/features/knowledge/communication/gql/mutation/createGoogleDocsSource.generated';
import { GOOGLE_PICKER_SOURCE_MISSING_MESSAGE } from '@/features/knowledge/constants/googlePicker.constants';
import type {
  GooglePickerCreatedSource,
  GooglePickerSourceInput,
  UseCreateGoogleDocsSourceResult,
} from '@/features/knowledge/typedefs/googlePicker.typedefs';

export function useCreateGoogleDocsSource(): UseCreateGoogleDocsSourceResult {
  const [createSource] = useMutation(CreateGoogleDocsSourceDocument);

  const createGoogleDocsSource = useCallback(
    async (input: GooglePickerSourceInput): Promise<GooglePickerCreatedSource> => {
      const { data } = await createSource({ variables: { input } });
      const payload = data?.createGoogleDocsSource;
      if (payload === undefined) {
        throw new Error(GOOGLE_PICKER_SOURCE_MISSING_MESSAGE);
      }
      return payload;
    },
    [createSource],
  );

  return { createGoogleDocsSource };
}
