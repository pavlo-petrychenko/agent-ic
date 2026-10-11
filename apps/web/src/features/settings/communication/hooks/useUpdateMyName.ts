import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateMyNameDocument } from '@/features/settings/communication/gql/mutation/updateMyName.generated';

export function useUpdateMyName(): (name: string) => Promise<void> {
  const [updateMyName] = useMutation(UpdateMyNameDocument);

  return useCallback(
    async (name) => {
      await updateMyName({ variables: { input: { name } } });
    },
    [updateMyName],
  );
}
