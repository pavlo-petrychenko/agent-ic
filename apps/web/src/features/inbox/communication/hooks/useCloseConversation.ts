import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import { InboxCloseConversationDocument } from '@/features/inbox/communication/gql/mutation/inboxCloseConversation.generated';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';

export function useCloseConversation() {
  const [closeConversationMutation, { loading }] = useMutation(InboxCloseConversationDocument);

  const closeConversation = useCallback(
    async (conversationId: string, message: string | null) => {
      await closeConversationMutation({
        variables: { input: { conversationId, message } },
        refetchQueries: [{ query: InboxNeedsYouCountDocument }, 'InboxConversations'],
        awaitRefetchQueries: true,
      });
    },
    [closeConversationMutation],
  );

  return { closeConversation, closing: loading };
}
