import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { MarkNotificationsReadDocument } from '@/features/inbox/communication/gql/mutation/markNotificationsRead.generated';

export function useMarkNotificationsRead(): (conversationId: string) => Promise<void> {
  const [markNotificationsRead] = useMutation(MarkNotificationsReadDocument);

  return useCallback(
    async (conversationId) => {
      await markNotificationsRead({ variables: { input: { conversationId } } });
    },
    [markNotificationsRead],
  );
}
