import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxTakeOverDocument } from '@/features/inbox/communication/gql/mutation/inboxTakeOver.generated';

export function useTakeOver() {
  const [takeOverConversation, { loading }] = useMutation(InboxTakeOverDocument);

  const takeOver = useCallback(
    async (conversationId: string) => {
      await takeOverConversation({
        variables: { input: { conversationId } },
        refetchQueries: ['InboxConversations'],
        awaitRefetchQueries: true,
      });
    },
    [takeOverConversation],
  );

  return { takeOver, takingOver: loading };
}
