import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxTakeOverDocument } from '@/features/inbox/communication/gql/mutation/inboxTakeOver.generated';
import { InboxConversationsDocument } from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { INBOX_CONVERSATIONS_FETCH_LIMIT } from '@/features/inbox/constants/inbox.constants';

export function useTakeOver() {
  const [takeOverConversation, { loading }] = useMutation(InboxTakeOverDocument);

  const takeOver = useCallback(
    async (conversationId: string) => {
      await takeOverConversation({
        variables: { input: { conversationId } },
        refetchQueries: [
          {
            query: InboxConversationsDocument,
            variables: { limit: INBOX_CONVERSATIONS_FETCH_LIMIT },
          },
        ],
        awaitRefetchQueries: true,
      });
    },
    [takeOverConversation],
  );

  return { takeOver, takingOver: loading };
}
