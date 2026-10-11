import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { UpdateTimeZoneDocument } from '@/features/settings/communication/gql/mutation/updateTimeZone.generated';

export function useUpdateTimeZone(): (timeZone: string) => Promise<void> {
  const [updateTimeZone] = useMutation(UpdateTimeZoneDocument);

  return useCallback(
    async (timeZone) => {
      await updateTimeZone({ variables: { input: { timeZone } } });
    },
    [updateTimeZone],
  );
}
