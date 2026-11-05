import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { StartGoogleConnectionDocument } from '@/features/knowledge/communication/gql/mutation/startGoogleConnection.generated';
import type { UseStartGoogleConnectionResult } from '@/features/knowledge/typedefs/googleConnection.typedefs';

export function useStartGoogleConnection(): UseStartGoogleConnectionResult {
  const [start, { loading }] = useMutation(StartGoogleConnectionDocument);

  const startGoogleConnection = useCallback(async (): Promise<string> => {
    const { data } = await start();
    const authorizationUrl = data?.startGoogleConnection.authorizationUrl;
    if (authorizationUrl === undefined) {
      throw new Error('The Google authorization URL is missing');
    }
    return authorizationUrl;
  }, [start]);

  return { startGoogleConnection, starting: loading };
}
